"""backfill account_id on orphaned resources

Revision ID: 1713033611
Revises: 1713033610
Create Date: 2026-05-08
"""
from alembic import op
import sqlalchemy as sa

revision = "1713033611"
down_revision = "1713033610"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # Find the first (oldest) account — all pre-account data belongs to it
    row = conn.execute(sa.text("SELECT id FROM accounts ORDER BY id ASC LIMIT 1")).fetchone()
    if not row:
        # No accounts yet — nothing to backfill
        return

    first_account_id = row[0]

    for table in ("forms", "leads", "goals", "actions"):
        conn.execute(
            sa.text(f"UPDATE {table} SET account_id = :aid WHERE account_id IS NULL"),
            {"aid": first_account_id},
        )


def downgrade() -> None:
    conn = op.get_bind()
    # Undo: set account_id back to NULL for records that were assigned by this migration.
    # This is a best-effort reversal — we can't distinguish original NULLs from backfilled ones
    # after data has been mutated post-migration, so we leave it as a no-op.
    pass
