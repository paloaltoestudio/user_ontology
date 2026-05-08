"""Scope forms, leads, goals, actions to accounts

Revision ID: 1713033610
Revises: 1713033609
Create Date: 2026-05-08 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "1713033610"
down_revision: Union[str, Sequence[str], None] = "1713033609"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _existing_cols(conn, table: str) -> set:
    return {col['name'] for col in inspect(conn).get_columns(table)}


def upgrade() -> None:
    conn = op.get_bind()

    for table in ("forms", "leads", "goals", "actions"):
        if "account_id" not in _existing_cols(conn, table):
            op.add_column(table, sa.Column("account_id", sa.Integer(), nullable=True))
            op.create_index(f"ix_{table}_account_id", table, ["account_id"])


def downgrade() -> None:
    for table in ("forms", "leads", "goals", "actions"):
        op.drop_index(f"ix_{table}_account_id", table_name=table)
        op.drop_column(table, "account_id")
