"""Add external webhooks: webhook_token and external_field_mapping to forms, external_submissions table

Revision ID: 1713033608
Revises: 1713033606, 3c8d2e9f4a51
Create Date: 2026-05-03 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import secrets


# revision identifiers, used by Alembic.
revision: str = '1713033608'
down_revision: Union[str, Sequence[str], None] = ('1713033606', '3c8d2e9f4a51')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Check existing columns to make the migration idempotent
    existing_cols = {row[1] for row in conn.execute(sa.text("PRAGMA table_info(forms)")).fetchall()}
    existing_tables = {row[0] for row in conn.execute(sa.text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()}

    if 'webhook_token' not in existing_cols:
        op.add_column('forms', sa.Column('webhook_token', sa.String(64), nullable=True))

    if 'external_field_mapping' not in existing_cols:
        op.add_column('forms', sa.Column('external_field_mapping', sa.JSON(), nullable=True))

    # Create index only if it doesn't exist
    existing_indexes = {row[1] for row in conn.execute(sa.text("PRAGMA index_list(forms)")).fetchall()}
    if 'ix_forms_webhook_token' not in existing_indexes:
        op.create_index('ix_forms_webhook_token', 'forms', ['webhook_token'], unique=True)

    # Generate unique tokens for forms that don't have one yet
    forms = conn.execute(sa.text("SELECT id FROM forms WHERE webhook_token IS NULL")).fetchall()
    for (form_id,) in forms:
        token = secrets.token_urlsafe(32)
        conn.execute(
            sa.text("UPDATE forms SET webhook_token = :token WHERE id = :id"),
            {"token": token, "id": form_id}
        )

    # Create external_submissions table if it doesn't exist
    if 'external_submissions' not in existing_tables:
        op.create_table(
            'external_submissions',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('form_id', sa.Integer(), sa.ForeignKey('forms.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('raw_payload', sa.JSON(), nullable=False),
            sa.Column('content_type', sa.String(100), nullable=True),
            sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
            sa.Column('lead_id', sa.Integer(), sa.ForeignKey('leads.id', ondelete='SET NULL'), nullable=True, index=True),
            sa.Column('error_message', sa.String(500), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('processed_at', sa.DateTime(), nullable=True),
        )
        op.create_index('ix_external_submissions_status', 'external_submissions', ['status'])


def downgrade() -> None:
    op.drop_table('external_submissions')
    op.drop_index('ix_forms_webhook_token', table_name='forms')
    op.drop_column('forms', 'external_field_mapping')
    op.drop_column('forms', 'webhook_token')
