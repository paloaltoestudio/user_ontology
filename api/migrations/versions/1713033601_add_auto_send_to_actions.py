"""Add auto_send field to actions

Revision ID: 1713033601
Revises: 1713033600
Create Date: 2026-04-13 12:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1713033601'
down_revision: Union[str, Sequence[str], None] = '1713033600'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('actions', sa.Column('auto_send', sa.Boolean(), nullable=False, server_default='0'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('actions', 'auto_send')
