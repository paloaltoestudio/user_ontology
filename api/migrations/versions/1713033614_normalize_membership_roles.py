"""Normalize membership role values to lowercase

Revision ID: 1713033614
Revises: 1713033613
Create Date: 2026-05-14

Legacy memberships may have been inserted with role='ADMIN' or role='MEMBER'
(uppercase). The MembershipRole enum uses lowercase values, so Pydantic
validation fails when serializing those rows, causing list_my_accounts to
return a 500 and the AccountSwitcher to silently hide.
"""
from alembic import op
import sqlalchemy as sa

revision = "1713033614"
down_revision = "1713033613"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(sa.text("UPDATE memberships SET role = LOWER(role) WHERE role != LOWER(role)"))


def downgrade():
    pass  # lowercase values are still valid — no need to reverse
