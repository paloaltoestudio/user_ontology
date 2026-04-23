"""Add scopes and description to api_keys table

Revision ID: 1713033603
Revises: 1713033602
Create Date: 2026-04-13 12:02:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1713033603'
down_revision: Union[str, Sequence[str], None] = '1713033602'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('api_keys', sa.Column('description', sa.String(length=1000), nullable=True))
    op.add_column('api_keys', sa.Column('scopes', sa.JSON(), nullable=False, server_default='[]'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('api_keys', 'scopes')
    op.drop_column('api_keys', 'description')
