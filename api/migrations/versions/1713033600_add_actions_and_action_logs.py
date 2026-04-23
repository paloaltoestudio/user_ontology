"""Add actions and action_logs tables

Revision ID: 1713033600
Revises: 3c8d2e9f4a51
Create Date: 2026-04-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1713033600'
down_revision: Union[str, Sequence[str], None] = '3c8d2e9f4a51'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create actions table
    op.create_table(
        'actions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('webhook_url', sa.String(length=2000), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_actions_created_at'), 'actions', ['created_at'], unique=False)
    op.create_index(op.f('ix_actions_id'), 'actions', ['id'], unique=False)
    op.create_index(op.f('ix_actions_name'), 'actions', ['name'], unique=False)

    # Create action_logs table
    op.create_table(
        'action_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('action_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('form_id', sa.Integer(), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=True),
        sa.Column('response_status', sa.Integer(), nullable=True),
        sa.Column('response_body', sa.String(length=2000), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('error_message', sa.String(length=1000), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['action_id'], ['actions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['form_id'], ['forms.id']),
        sa.ForeignKeyConstraint(['user_id'], ['leads.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_action_logs_action_id'), 'action_logs', ['action_id'], unique=False)
    op.create_index(op.f('ix_action_logs_created_at'), 'action_logs', ['created_at'], unique=False)
    op.create_index(op.f('ix_action_logs_id'), 'action_logs', ['id'], unique=False)
    op.create_index(op.f('ix_action_logs_success'), 'action_logs', ['success'], unique=False)
    op.create_index(op.f('ix_action_logs_user_id'), 'action_logs', ['user_id'], unique=False)

    # Create form_actions association table
    op.create_table(
        'form_actions',
        sa.Column('form_id', sa.Integer(), nullable=False),
        sa.Column('action_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['action_id'], ['actions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['form_id'], ['forms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('form_id', 'action_id'),
    )

    # Create user_actions association table
    op.create_table(
        'user_actions',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['action_id'], ['actions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['leads.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'action_id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop tables in reverse order of creation
    op.drop_table('user_actions')
    op.drop_table('form_actions')
    op.drop_index(op.f('ix_action_logs_user_id'), table_name='action_logs')
    op.drop_index(op.f('ix_action_logs_success'), table_name='action_logs')
    op.drop_index(op.f('ix_action_logs_id'), table_name='action_logs')
    op.drop_index(op.f('ix_action_logs_created_at'), table_name='action_logs')
    op.drop_index(op.f('ix_action_logs_action_id'), table_name='action_logs')
    op.drop_table('action_logs')
    op.drop_index(op.f('ix_actions_name'), table_name='actions')
    op.drop_index(op.f('ix_actions_id'), table_name='actions')
    op.drop_index(op.f('ix_actions_created_at'), table_name='actions')
    op.drop_table('actions')
