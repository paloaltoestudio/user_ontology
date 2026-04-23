"""Add goal_assignments table

Revision ID: 1713033604
Revises: 1713033603
Create Date: 2026-04-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1713033604'
down_revision: Union[str, Sequence[str], None] = '1713033603'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'goal_assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('goal_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('assigned_at', sa.DateTime(), nullable=False),
        sa.Column('assigned_by', sa.Integer(), nullable=True),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['assigned_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['goal_id'], ['goals.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['leads.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_goal_assignments_assigned_at'), 'goal_assignments', ['assigned_at'], unique=False)
    op.create_index(op.f('ix_goal_assignments_goal_id'), 'goal_assignments', ['goal_id'], unique=False)
    op.create_index(op.f('ix_goal_assignments_id'), 'goal_assignments', ['id'], unique=False)
    op.create_index(op.f('ix_goal_assignments_user_id'), 'goal_assignments', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_goal_assignments_user_id'), table_name='goal_assignments')
    op.drop_index(op.f('ix_goal_assignments_id'), table_name='goal_assignments')
    op.drop_index(op.f('ix_goal_assignments_goal_id'), table_name='goal_assignments')
    op.drop_index(op.f('ix_goal_assignments_assigned_at'), table_name='goal_assignments')
    op.drop_table('goal_assignments')
