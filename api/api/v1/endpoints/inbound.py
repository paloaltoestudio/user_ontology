from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, Dict, Any
from datetime import datetime
import logging

from core.database import get_db
from core.security import get_current_admin
from models.user import User
from models.form import Form
from models.lead import Lead
from models.external_submission import ExternalSubmission
from schemas.external_submission import (
    ExternalSubmissionResponse,
    ExternalSubmissionStats,
    ExternalFieldMappingUpdate,
    ProcessResult,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["inbound"])


def _flatten(obj: Any, prefix: str = "") -> Dict[str, Any]:
    """Flatten nested dicts into dot-notation keys. Lists are left as-is."""
    result: Dict[str, Any] = {}
    if isinstance(obj, dict):
        for key, value in obj.items():
            full_key = f"{prefix}.{key}" if prefix else key
            if isinstance(value, dict):
                result.update(_flatten(value, full_key))
            else:
                result[full_key] = value
    else:
        result[prefix] = obj
    return result


def _extract_lead_fields(payload: Dict[str, Any], mapping: Dict[str, str]) -> Dict[str, Any]:
    """Extract lead fields from a flattened payload using the field mapping."""
    flat = _flatten(payload)
    extracted: Dict[str, Any] = {}
    for lead_field, payload_key in mapping.items():
        if payload_key and payload_key in flat:
            extracted[lead_field] = flat[payload_key]
    return extracted


async def _process_submission(
    submission: ExternalSubmission,
    mapping: Dict[str, str],
    form_id: int,
    db: AsyncSession,
) -> bool:
    """
    Try to turn a raw ExternalSubmission into a Lead using the given mapping.
    Returns True if successful, False otherwise.
    """
    extracted = _extract_lead_fields(submission.raw_payload, mapping)
    email = extracted.get("email")

    if not email:
        submission.status = "failed"
        submission.error_message = f"Email field not found. Expected key: '{mapping.get('email', 'email')}'"
        return False

    lead = Lead(
        form_id=form_id,
        name=extracted.get("name", ""),
        last_name=extracted.get("last_name", ""),
        email=str(email),
        phone=extracted.get("phone"),
        company=extracted.get("company"),
        company_url=extracted.get("company_url"),
        form_data=submission.raw_payload,
        status="new",
        entry_source="external_webhook",
    )
    db.add(lead)
    await db.flush()

    submission.status = "processed"
    submission.lead_id = lead.id
    submission.error_message = None
    submission.processed_at = datetime.utcnow()
    return True


async def _run_forward_reprocess(
    form_id: int,
    after_id: int,
    mapping: Dict[str, str],
    db: AsyncSession,
) -> ProcessResult:
    """
    Process all pending/failed submissions with id > after_id in chronological order.
    Stops on the first failure (fail-fast). Submissions after the stop point are left as pending.
    """
    queue_result = await db.execute(
        select(ExternalSubmission)
        .where(ExternalSubmission.form_id == form_id)
        .where(ExternalSubmission.status.in_(["pending", "failed"]))
        .where(ExternalSubmission.id > after_id)
        .order_by(ExternalSubmission.created_at.asc(), ExternalSubmission.id.asc())
    )
    queue = queue_result.scalars().all()

    processed = 0
    stopped_at: Optional[int] = None

    for submission in queue:
        success = await _process_submission(submission, mapping, form_id, db)
        if success:
            processed += 1
        else:
            stopped_at = submission.id
            break  # fail-fast: stop immediately, leave the rest as pending

    # Count remaining pending after potential stop
    remaining_result = await db.execute(
        select(func.count(ExternalSubmission.id))
        .where(ExternalSubmission.form_id == form_id)
        .where(ExternalSubmission.status.in_(["pending", "failed"]))
    )
    remaining_pending = remaining_result.scalar() or 0

    if stopped_at:
        msg = f"Processed {processed}, stopped at submission #{stopped_at} — structure mismatch. {remaining_pending} submissions still pending."
    else:
        msg = f"Processed {processed} submission(s). {remaining_pending} remaining pending."

    return ProcessResult(
        processed=processed,
        stopped_at=stopped_at,
        remaining_pending=remaining_pending,
        message=msg,
    )


# ---------------------------------------------------------------------------
# Public inbound endpoint
# ---------------------------------------------------------------------------

@router.post("/inbound/{token}", status_code=status.HTTP_200_OK)
async def receive_external_submission(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint that receives external form payloads.
    Accepts JSON or form-encoded bodies. Always returns 200 so the external
    form never sees an error — failures are stored and surfaced to the admin.
    """
    result = await db.execute(select(Form).where(Form.webhook_token == token))
    form = result.scalars().first()

    if not form:
        return {"received": True}

    content_type = request.headers.get("content-type", "")
    try:
        if "application/json" in content_type:
            payload = await request.json()
        elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
            form_data = await request.form()
            payload = dict(form_data)
        else:
            try:
                payload = await request.json()
            except Exception:
                form_data = await request.form()
                payload = dict(form_data)
    except Exception as e:
        logger.warning(f"Failed to parse inbound payload for form {form.id}: {e}")
        payload = {}

    submission = ExternalSubmission(
        form_id=form.id,
        raw_payload=payload,
        content_type=content_type[:100] if content_type else None,
        status="pending",
    )
    db.add(submission)

    # If mapping is already configured, try to process immediately
    if form.external_field_mapping:
        await _process_submission(submission, form.external_field_mapping, form.id, db)

    await db.commit()
    return {"received": True}


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------

@router.get("/forms/{form_id}/external-submissions", response_model=list[ExternalSubmissionResponse])
async def list_external_submissions(
    form_id: int,
    submission_status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """List external submissions for a form (admin only)."""
    query = select(ExternalSubmission).where(ExternalSubmission.form_id == form_id)
    if submission_status:
        query = query.where(ExternalSubmission.status == submission_status)
    query = query.order_by(ExternalSubmission.created_at.asc(), ExternalSubmission.id.asc())

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/forms/{form_id}/external-submissions/stats", response_model=ExternalSubmissionStats)
async def get_external_submission_stats(
    form_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Return submission counts grouped by status for a form (admin only)."""
    rows = await db.execute(
        select(ExternalSubmission.status, func.count(ExternalSubmission.id))
        .where(ExternalSubmission.form_id == form_id)
        .group_by(ExternalSubmission.status)
    )
    counts = {s: c for s, c in rows.all()}
    return ExternalSubmissionStats(
        pending=counts.get("pending", 0),
        processed=counts.get("processed", 0),
        failed=counts.get("failed", 0),
        total=sum(counts.values()),
    )


@router.put("/forms/{form_id}/external-mapping")
async def save_external_mapping(
    form_id: int,
    data: ExternalFieldMappingUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Save the external field mapping for a form (admin only). Does not trigger reprocessing."""
    result = await db.execute(select(Form).where(Form.id == form_id))
    form = result.scalars().first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    form.external_field_mapping = data.mapping
    await db.commit()
    return {"message": "Mapping saved"}


@router.post(
    "/forms/{form_id}/external-submissions/{submission_id}/map-and-process",
    response_model=ProcessResult,
)
async def map_and_process(
    form_id: int,
    submission_id: int,
    data: ExternalFieldMappingUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """
    Save a mapping, process the specified submission, then forward-reprocess
    remaining pending/failed submissions with fail-fast (admin only).

    Stops immediately if any subsequent submission fails, leaving the rest as pending.
    """
    form_result = await db.execute(select(Form).where(Form.id == form_id))
    form = form_result.scalars().first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    sub_result = await db.execute(
        select(ExternalSubmission)
        .where(ExternalSubmission.id == submission_id)
        .where(ExternalSubmission.form_id == form_id)
    )
    submission = sub_result.scalars().first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    # Save the new mapping
    form.external_field_mapping = data.mapping
    await db.flush()

    # Process the selected submission first
    success = await _process_submission(submission, data.mapping, form_id, db)

    if not success:
        # The selected submission itself failed — just report, no further processing
        await db.commit()
        remaining_result = await db.execute(
            select(func.count(ExternalSubmission.id))
            .where(ExternalSubmission.form_id == form_id)
            .where(ExternalSubmission.status.in_(["pending", "failed"]))
        )
        remaining = remaining_result.scalar() or 0
        return ProcessResult(
            processed=0,
            stopped_at=submission_id,
            remaining_pending=remaining,
            message=f"Submission #{submission_id} failed with this mapping. {remaining} submissions still pending.",
        )

    # Forward-reprocess all pending/failed with id > submission_id
    result = await _run_forward_reprocess(form_id, submission_id, data.mapping, db)
    result.processed += 1  # include the selected submission itself
    await db.commit()
    return result


@router.post("/forms/{form_id}/external-submissions/reprocess", response_model=ProcessResult)
async def reprocess_external_submissions(
    form_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """
    Retry all pending/failed submissions using the current mapping with fail-fast (admin only).
    Stops on the first failure and leaves remaining submissions as pending.
    """
    form_result = await db.execute(select(Form).where(Form.id == form_id))
    form = form_result.scalars().first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    if not form.external_field_mapping:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No field mapping configured for this form",
        )

    # Get the oldest pending/failed submission to start from
    first_result = await db.execute(
        select(ExternalSubmission)
        .where(ExternalSubmission.form_id == form_id)
        .where(ExternalSubmission.status.in_(["pending", "failed"]))
        .order_by(ExternalSubmission.created_at.asc(), ExternalSubmission.id.asc())
        .limit(1)
    )
    first = first_result.scalars().first()

    if not first:
        return ProcessResult(processed=0, stopped_at=None, remaining_pending=0, message="No pending submissions to reprocess.")

    # Process the first one, then forward-reprocess the rest
    success = await _process_submission(first, form.external_field_mapping, form_id, db)

    if not success:
        await db.commit()
        remaining_result = await db.execute(
            select(func.count(ExternalSubmission.id))
            .where(ExternalSubmission.form_id == form_id)
            .where(ExternalSubmission.status.in_(["pending", "failed"]))
        )
        remaining = remaining_result.scalar() or 0
        return ProcessResult(
            processed=0,
            stopped_at=first.id,
            remaining_pending=remaining,
            message=f"First submission #{first.id} failed — mapping may be broken. {remaining} submissions still pending.",
        )

    result = await _run_forward_reprocess(form_id, first.id, form.external_field_mapping, db)
    result.processed += 1
    await db.commit()
    return result
