"""Add lead status history table

Revision ID: 1713033605
Revises: 1713033604
Create Date: 2026-05-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '1713033605'
down_revision: Union[str, Sequence[str], None] = '1713033604'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'lead_status_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lead_id', sa.Integer(), sa.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False),
        sa.Column('from_status', sa.String(50), nullable=True),
        sa.Column('to_status', sa.String(50), nullable=False),
        sa.Column('changed_by', sa.String(255), nullable=True),  # admin email or "system"
        sa.Column('note', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_lead_status_history_lead_id', 'lead_status_history', ['lead_id'])
    op.create_index('ix_lead_status_history_created_at', 'lead_status_history', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_lead_status_history_created_at', 'lead_status_history')
    op.drop_index('ix_lead_status_history_lead_id', 'lead_status_history')
    op.drop_table('lead_status_history')
