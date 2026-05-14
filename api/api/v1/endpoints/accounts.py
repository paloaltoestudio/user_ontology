from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.account import Account, Membership, MembershipRole
from schemas.account import (
    AccountCreate,
    AccountResponse,
    MembershipResponse,
    AddMemberRequest,
    SwitchAccountRequest,
    SlugValidationResponse,
    generate_slug,
)

router = APIRouter(prefix="/accounts", tags=["accounts"])


async def _require_account_admin(
    account_id: int,
    current_user: User,
    db: AsyncSession,
) -> Account:
    """Return account if user is its ADMIN or superadmin; raise 403 otherwise."""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalars().first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    if current_user.is_superadmin:
        return account

    result = await db.execute(
        select(Membership).where(
            Membership.user_id == current_user.id,
            Membership.account_id == account_id,
            Membership.role == MembershipRole.ADMIN,
        )
    )
    if not result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account admin access required",
        )
    return account


async def _require_account_member(
    account_id: int,
    current_user: User,
    db: AsyncSession,
) -> Account:
    """Return account if user is a member (any role) or superadmin; raise 403 otherwise."""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalars().first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    if current_user.is_superadmin:
        return account

    result = await db.execute(
        select(Membership).where(
            Membership.user_id == current_user.id,
            Membership.account_id == account_id,
        )
    )
    if not result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this account",
        )
    return account


@router.get("/validate-slug", response_model=SlugValidationResponse)
async def validate_slug(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Check whether a slug is available."""
    slug = generate_slug(q)
    result = await db.execute(select(Account).where(Account.slug == slug))
    available = result.scalars().first() is None
    return SlugValidationResponse(slug=slug, available=available)


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    data: AccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new account and add the creator as ADMIN."""
    slug = generate_slug(data.slug or data.name)

    result = await db.execute(select(Account).where(Account.slug == slug))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slug '{slug}' is already taken",
        )

    account = Account(name=data.name, slug=slug)
    db.add(account)
    await db.flush()

    membership = Membership(
        user_id=current_user.id,
        account_id=account.id,
        role=MembershipRole.ADMIN,
    )
    db.add(membership)

    # Always switch to the newly created account
    current_user.last_active_account_id = account.id

    await db.commit()
    await db.refresh(account)
    return account


@router.get("", response_model=list[MembershipResponse])
async def list_my_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all accounts the current user belongs to."""
    result = await db.execute(
        select(Membership)
        .options(selectinload(Membership.account))
        .where(Membership.user_id == current_user.id)
        .order_by(Membership.created_at)
    )
    return result.scalars().all()


@router.put("/switch", response_model=dict)
async def switch_account(
    data: SwitchAccountRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Switch the user's active account (persists last_active_account_id)."""
    await _require_account_member(data.account_id, current_user, db)

    current_user.last_active_account_id = data.account_id
    await db.commit()
    return {"account_id": data.account_id}


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get account details (must be member or superadmin)."""
    account = await _require_account_member(account_id, current_user, db)
    return account


@router.post("/{account_id}/members", status_code=status.HTTP_201_CREATED)
async def add_member(
    account_id: int,
    data: AddMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a user to an account by email (account ADMIN only)."""
    await _require_account_admin(account_id, current_user, db)

    result = await db.execute(select(User).where(User.email == data.email))
    target_user = result.scalars().first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    result = await db.execute(
        select(Membership).where(
            Membership.user_id == target_user.id,
            Membership.account_id == account_id,
        )
    )
    if result.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member")

    membership = Membership(user_id=target_user.id, account_id=account_id, role=data.role)
    db.add(membership)

    if target_user.last_active_account_id is None:
        target_user.last_active_account_id = account_id

    await db.commit()
    return {"user_id": target_user.id, "account_id": account_id, "role": data.role}


@router.delete("/{account_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    account_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a user from an account (account ADMIN only; cannot remove self if last admin)."""
    await _require_account_admin(account_id, current_user, db)

    result = await db.execute(
        select(Membership).where(
            Membership.user_id == user_id,
            Membership.account_id == account_id,
        )
    )
    membership = result.scalars().first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")

    # Prevent removing the last admin
    if membership.role == MembershipRole.ADMIN:
        admin_count_result = await db.execute(
            select(Membership).where(
                Membership.account_id == account_id,
                Membership.role == MembershipRole.ADMIN,
            )
        )
        if len(admin_count_result.scalars().all()) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last admin of an account",
            )

    await db.delete(membership)
    await db.commit()
