"""Add entry_source to leads

Revision ID: 1713033606
Revises: 1713033605
Create Date: 2026-05-02 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '1713033606'
down_revision: Union[str, Sequence[str], None] = '1713033605'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'leads',
        sa.Column('entry_source', sa.String(50), nullable=False, server_default='form')
    )


def downgrade() -> None:
    op.drop_column('leads', 'entry_source')
