"""catalog tables for stages, tags, properties, event types

Revision ID: 1713033613
Revises: 1713033612
Create Date: 2026-05-14

"""
from alembic import op
import sqlalchemy as sa

revision = "1713033613"
down_revision = "1713033612"
branch_labels = None
depends_on = None


def upgrade():
    # stage_definitions
    op.create_table(
        "stage_definitions",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(1024), nullable=True),
        sa.Column("color", sa.String(32), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_stage_definitions_account_id", "stage_definitions", ["account_id"])
    op.create_index("uq_stage_def_account_name", "stage_definitions", ["account_id", "name"], unique=True)

    # tag_definitions
    op.create_table(
        "tag_definitions",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(1024), nullable=True),
        sa.Column("color", sa.String(32), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_tag_definitions_account_id", "tag_definitions", ["account_id"])
    op.create_index("uq_tag_def_account_name", "tag_definitions", ["account_id", "name"], unique=True)

    # property_definitions
    op.create_table(
        "property_definitions",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("key", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(255), nullable=True),
        sa.Column("description", sa.String(1024), nullable=True),
        sa.Column("value_type", sa.String(20), nullable=False, server_default="string"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_property_definitions_account_id", "property_definitions", ["account_id"])
    op.create_index("uq_prop_def_account_key", "property_definitions", ["account_id", "key"], unique=True)

    # event_type_definitions
    op.create_table(
        "event_type_definitions",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(1024), nullable=True),
        sa.Column("payload_schema", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_event_type_definitions_account_id", "event_type_definitions", ["account_id"])
    op.create_index("uq_event_type_def_account_name", "event_type_definitions", ["account_id", "name"], unique=True)

    # Backfill catalog from existing lead-level data
    # We use raw SQL so we don't need ORM models available here
    conn = op.get_bind()

    # Backfill stage_definitions from distinct (account_id, stage) on leads
    conn.execute(sa.text("""
        INSERT INTO stage_definitions (account_id, name, sort_order, created_at)
        SELECT DISTINCT account_id, stage, 0, NOW()
        FROM leads
        WHERE stage IS NOT NULL AND account_id IS NOT NULL
        ON CONFLICT DO NOTHING
    """))

    # Backfill tag_definitions from distinct (account_id, name) on lead_tags
    conn.execute(sa.text("""
        INSERT INTO tag_definitions (account_id, name, created_at)
        SELECT DISTINCT account_id, name, NOW()
        FROM lead_tags
        WHERE account_id IS NOT NULL
        ON CONFLICT DO NOTHING
    """))

    # Backfill property_definitions from distinct (account_id, key, value_type) on lead_properties
    conn.execute(sa.text("""
        INSERT INTO property_definitions (account_id, key, value_type, created_at)
        SELECT DISTINCT account_id, key, value_type, NOW()
        FROM lead_properties
        WHERE account_id IS NOT NULL
        ON CONFLICT DO NOTHING
    """))

    # Backfill event_type_definitions from distinct (account_id, event_type) on lead_events
    conn.execute(sa.text("""
        INSERT INTO event_type_definitions (account_id, name, created_at)
        SELECT DISTINCT account_id, event_type, NOW()
        FROM lead_events
        WHERE account_id IS NOT NULL
        ON CONFLICT DO NOTHING
    """))


def downgrade():
    op.drop_table("event_type_definitions")
    op.drop_table("property_definitions")
    op.drop_table("tag_definitions")
    op.drop_table("stage_definitions")
