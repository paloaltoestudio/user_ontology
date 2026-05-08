"""Add multi-account: accounts table, memberships table, user fields

Revision ID: 1713033609
Revises: 1713033608
Create Date: 2026-05-08 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "1713033609"
down_revision: Union[str, Sequence[str], None] = "1713033608"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    existing_tables = {
        row[0]
        for row in conn.execute(
            sa.text("SELECT name FROM sqlite_master WHERE type='table'")
        ).fetchall()
    }

    # Create accounts table
    if "accounts" not in existing_tables:
        op.create_table(
            "accounts",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("slug", sa.String(100), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_accounts_slug", "accounts", ["slug"], unique=True)

    # Create memberships table
    if "memberships" not in existing_tables:
        op.create_table(
            "memberships",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "user_id",
                sa.Integer(),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "account_id",
                sa.Integer(),
                sa.ForeignKey("accounts.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("role", sa.String(20), nullable=False, server_default="admin"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.UniqueConstraint("user_id", "account_id", name="uq_membership_user_account"),
        )
        op.create_index("ix_memberships_user_id", "memberships", ["user_id"])
        op.create_index("ix_memberships_account_id", "memberships", ["account_id"])

    # Add new columns to users (idempotent)
    user_cols = {
        row[1]
        for row in conn.execute(sa.text("PRAGMA table_info(users)")).fetchall()
    }

    if "is_superadmin" not in user_cols:
        op.add_column("users", sa.Column("is_superadmin", sa.Boolean(), nullable=False, server_default="0"))

    if "last_active_account_id" not in user_cols:
        op.add_column(
            "users",
            sa.Column("last_active_account_id", sa.Integer(), nullable=True),
        )


def downgrade() -> None:
    op.drop_table("memberships")
    op.drop_table("accounts")
    op.drop_column("users", "last_active_account_id")
    op.drop_column("users", "is_superadmin")
