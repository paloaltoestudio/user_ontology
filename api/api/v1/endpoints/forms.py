from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from core.database import get_db
from core.security import get_current_admin, get_current_account
from models.user import User
from models.account import Account
from models.form import Form, FormStep, FormField
from schemas.form import FormCreate, FormResponse, FormUpdate

router = APIRouter(prefix="/forms", tags=["forms"])


async def _get_owned_form(form_id: int, account: Account, db: AsyncSession) -> Form:
    """Fetch a form and verify it belongs to the current account."""
    result = await db.execute(select(Form).where(Form.id == form_id))
    form = result.scalars().first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
    if form.account_id is not None and form.account_id != account.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return form


@router.get("", response_model=list[FormResponse])
async def list_forms(
    db: AsyncSession = Depends(get_db),
    account: Account = Depends(get_current_account),
):
    """List forms for the active account (admin only)"""
    result = await db.execute(
        select(Form)
        .options(selectinload(Form.steps).selectinload(FormStep.fields))
        .where(Form.account_id == account.id)
        .order_by(Form.id)
    )
    return result.scalars().unique().all()


@router.get("/{form_id}", response_model=FormResponse)
async def get_form(
    form_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific form by ID (public — used by PublicFormPage)"""
    result = await db.execute(
        select(Form)
        .options(selectinload(Form.steps).selectinload(FormStep.fields))
        .where(Form.id == form_id)
    )
    form = result.scalars().unique().first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
    return form


@router.post("", response_model=FormResponse, status_code=status.HTTP_201_CREATED)
async def create_form(
    form_data: FormCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Create a new form (admin only)"""
    form = Form(
        name=form_data.name,
        description=form_data.description,
        is_active=form_data.is_active,
        display_as_steps=form_data.display_as_steps,
        webhooks=form_data.webhooks or [],
        account_id=account.id,
    )
    db.add(form)
    await db.flush()

    if form_data.steps:
        for step_data in form_data.steps:
            step = FormStep(
                form_id=form.id,
                step_number=step_data.step_number,
                title=step_data.title,
                description=step_data.description,
            )
            db.add(step)
            await db.flush()

            if step_data.fields:
                for field_data in step_data.fields:
                    field = FormField(
                        step_id=step.id,
                        field_name=field_data.field_name,
                        field_type=field_data.field_type,
                        required=field_data.required,
                        help_text=field_data.help_text,
                        user_field_mapping=field_data.user_field_mapping,
                        field_options=field_data.field_options,
                        display_order=field_data.display_order,
                    )
                    db.add(field)

    await db.commit()
    await db.refresh(form)

    result = await db.execute(
        select(Form)
        .options(selectinload(Form.steps).selectinload(FormStep.fields))
        .where(Form.id == form.id)
    )
    return result.scalars().unique().first()


@router.put("/{form_id}", response_model=FormResponse)
async def update_form(
    form_id: int,
    form_data: FormUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Update a form (admin only)"""
    form = await _get_owned_form(form_id, account, db)

    update_data = form_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(form, field, value)

    await db.commit()
    await db.refresh(form)

    result = await db.execute(
        select(Form)
        .options(selectinload(Form.steps).selectinload(FormStep.fields))
        .where(Form.id == form.id)
    )
    return result.scalars().unique().first()


@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form(
    form_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Delete a form (admin only)"""
    form = await _get_owned_form(form_id, account, db)
    await db.delete(form)
    await db.commit()


@router.post("/{form_id}/steps", response_model=FormResponse)
async def add_step_to_form(
    form_id: int,
    step_data: dict,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Add a step to an existing form"""
    form = await _get_owned_form(form_id, account, db)

    step = FormStep(
        form_id=form.id,
        step_number=step_data.get("step_number"),
        title=step_data.get("title"),
        description=step_data.get("description"),
    )
    db.add(step)
    await db.commit()
    await db.refresh(form)

    result = await db.execute(
        select(Form)
        .options(selectinload(Form.steps).selectinload(FormStep.fields))
        .where(Form.id == form.id)
    )
    return result.scalars().unique().first()


@router.delete("/{form_id}/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_step(
    form_id: int,
    step_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Delete a step from a form"""
    await _get_owned_form(form_id, account, db)

    result = await db.execute(
        select(FormStep).where(
            (FormStep.id == step_id) & (FormStep.form_id == form_id)
        )
    )
    step = result.scalars().first()
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")

    await db.delete(step)
    await db.commit()


@router.post("/{form_id}/steps/{step_id}/fields", response_model=FormResponse)
async def add_field_to_step(
    form_id: int,
    step_id: int,
    field_data: dict,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Add a field to a form step"""
    await _get_owned_form(form_id, account, db)

    result = await db.execute(
        select(FormStep).where(
            (FormStep.id == step_id) & (FormStep.form_id == form_id)
        )
    )
    step = result.scalars().first()
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")

    field = FormField(
        step_id=step.id,
        field_name=field_data.get("field_name"),
        field_type=field_data.get("field_type"),
        required=field_data.get("required", False),
        help_text=field_data.get("help_text"),
        user_field_mapping=field_data.get("user_field_mapping"),
        field_options=field_data.get("field_options"),
        display_order=field_data.get("display_order"),
    )
    db.add(field)
    await db.commit()

    result = await db.execute(
        select(Form)
        .options(selectinload(Form.steps).selectinload(FormStep.fields))
        .where(Form.id == form_id)
    )
    return result.scalars().unique().first()


@router.delete("/{form_id}/steps/{step_id}/fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_field(
    form_id: int,
    step_id: int,
    field_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Delete a field from a form step"""
    await _get_owned_form(form_id, account, db)

    result = await db.execute(
        select(FormField).join(FormStep).where(
            (FormField.id == field_id)
            & (FormStep.id == step_id)
            & (FormStep.form_id == form_id)
        )
    )
    field = result.scalars().first()
    if not field:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field not found")

    await db.delete(field)
    await db.commit()


@router.put("/{form_id}/steps/{step_id}/fields/{field_id}", response_model=FormResponse)
async def update_field(
    form_id: int,
    step_id: int,
    field_id: int,
    field_data: dict,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    account: Account = Depends(get_current_account),
):
    """Update a field in a form step"""
    await _get_owned_form(form_id, account, db)

    result = await db.execute(
        select(FormField).join(FormStep).where(
            (FormField.id == field_id)
            & (FormStep.id == step_id)
            & (FormStep.form_id == form_id)
        )
    )
    field = result.scalars().first()
    if not field:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field not found")

    for key, value in field_data.items():
        if value is not None and hasattr(field, key):
            setattr(field, key, value)

    await db.commit()

    result = await db.execute(
        select(Form)
        .options(selectinload(Form.steps).selectinload(FormStep.fields))
        .where(Form.id == form_id)
    )
    return result.scalars().unique().first()
