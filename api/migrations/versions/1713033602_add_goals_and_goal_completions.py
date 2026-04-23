"""Add goals, goal_completions, api_keys, and idempotency_keys tables

Revision ID: 1713033602
Revises: 1713033601
Create Date: 2026-04-13 12:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1713033602'
down_revision: Union[str, Sequence[str], None] = '1713033601'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create goals table
    op.create_table(
        'goals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_goals_created_at'), 'goals', ['created_at'], unique=False)
    op.create_index(op.f('ix_goals_id'), 'goals', ['id'], unique=False)
    op.create_index(op.f('ix_goals_is_active'), 'goals', ['is_active'], unique=False)
    op.create_index(op.f('ix_goals_name'), 'goals', ['name'], unique=False)

    # Create goal_completions table
    op.create_table(
        'goal_completions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('goal_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('external_user_id', sa.String(length=255), nullable=True),
        sa.Column('first_completed_at', sa.DateTime(), nullable=False),
        sa.Column('event_metadata', sa.JSON(), nullable=True),
        sa.Column('source_integration', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['goal_id'], ['goals.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['leads.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_goal_completions_created_at'), 'goal_completions', ['created_at'], unique=False)
    op.create_index(op.f('ix_goal_completions_external_user_id'), 'goal_completions', ['external_user_id'], unique=False)
    op.create_index(op.f('ix_goal_completions_goal_id'), 'goal_completions', ['goal_id'], unique=False)
    op.create_index(op.f('ix_goal_completions_id'), 'goal_completions', ['id'], unique=False)
    op.create_index(op.f('ix_goal_completions_user_id'), 'goal_completions', ['user_id'], unique=False)

    # Create api_keys table
    op.create_table(
        'api_keys',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key'),
    )
    op.create_index(op.f('ix_api_keys_created_at'), 'api_keys', ['created_at'], unique=False)
    op.create_index(op.f('ix_api_keys_id'), 'api_keys', ['id'], unique=False)
    op.create_index(op.f('ix_api_keys_is_active'), 'api_keys', ['is_active'], unique=False)
    op.create_index(op.f('ix_api_keys_key'), 'api_keys', ['key'], unique=False)

    # Create idempotency_keys table
    op.create_table(
        'idempotency_keys',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('idempotency_key', sa.String(length=255), nullable=False),
        sa.Column('goal_completion_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['goal_completion_id'], ['goal_completions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('idempotency_key'),
    )
    op.create_index(op.f('ix_idempotency_keys_created_at'), 'idempotency_keys', ['created_at'], unique=False)
    op.create_index(op.f('ix_idempotency_keys_id'), 'idempotency_keys', ['id'], unique=False)
    op.create_index(op.f('ix_idempotency_keys_idempotency_key'), 'idempotency_keys', ['idempotency_key'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_idempotency_keys_idempotency_key'), table_name='idempotency_keys')
    op.drop_index(op.f('ix_idempotency_keys_id'), table_name='idempotency_keys')
    op.drop_index(op.f('ix_idempotency_keys_created_at'), table_name='idempotency_keys')
    op.drop_table('idempotency_keys')

    op.drop_index(op.f('ix_api_keys_key'), table_name='api_keys')
    op.drop_index(op.f('ix_api_keys_is_active'), table_name='api_keys')
    op.drop_index(op.f('ix_api_keys_id'), table_name='api_keys')
    op.drop_index(op.f('ix_api_keys_created_at'), table_name='api_keys')
    op.drop_table('api_keys')

    op.drop_index(op.f('ix_goal_completions_user_id'), table_name='goal_completions')
    op.drop_index(op.f('ix_goal_completions_id'), table_name='goal_completions')
    op.drop_index(op.f('ix_goal_completions_external_user_id'), table_name='goal_completions')
    op.drop_index(op.f('ix_goal_completions_goal_id'), table_name='goal_completions')
    op.drop_index(op.f('ix_goal_completions_created_at'), table_name='goal_completions')
    op.drop_table('goal_completions')

    op.drop_index(op.f('ix_goals_name'), table_name='goals')
    op.drop_index(op.f('ix_goals_is_active'), table_name='goals')
    op.drop_index(op.f('ix_goals_id'), table_name='goals')
    op.drop_index(op.f('ix_goals_created_at'), table_name='goals')
    op.drop_table('goals')
