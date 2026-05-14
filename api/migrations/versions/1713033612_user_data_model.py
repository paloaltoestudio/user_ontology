"""Add lead events, properties, tags; rename status→stage, lead_status_history→lead_stage_history

Revision ID: 1713033612
Revises: 1713033611
Create Date: 2026-05-14
"""
from alembic import op
import sqlalchemy as sa

revision = "1713033612"
down_revision = "1713033611"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. leads table: rename status → stage, widen to VARCHAR(255) nullable
    # ------------------------------------------------------------------
    with op.batch_alter_table("leads") as batch_op:
        batch_op.alter_column(
            "status",
            new_column_name="stage",
            existing_type=sa.String(50),
            type_=sa.String(255),
            existing_nullable=False,
            nullable=True,
        )

    # ------------------------------------------------------------------
    # 2. lead_status_history → lead_stage_history
    #    Rename table, then rename from_status/to_status columns
    # ------------------------------------------------------------------
    op.rename_table("lead_status_history", "lead_stage_history")

    with op.batch_alter_table("lead_stage_history") as batch_op:
        batch_op.alter_column(
            "from_status",
            new_column_name="from_stage",
            existing_type=sa.String(50),
            type_=sa.String(255),
            existing_nullable=True,
            nullable=True,
        )
        batch_op.alter_column(
            "to_status",
            new_column_name="to_stage",
            existing_type=sa.String(50),
            type_=sa.String(255),
            existing_nullable=False,
            nullable=False,
        )

    # ------------------------------------------------------------------
    # 3. New table: lead_events (append-only)
    # ------------------------------------------------------------------
    op.create_table(
        "lead_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("lead_id", sa.Integer(), sa.ForeignKey("leads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("event_type", sa.String(255), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("source", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lead_events_lead_id", "lead_events", ["lead_id"])
    op.create_index("ix_lead_events_account_id", "lead_events", ["account_id"])
    op.create_index("ix_lead_events_event_type", "lead_events", ["event_type"])
    op.create_index("ix_lead_events_created_at", "lead_events", ["created_at"])

    # ------------------------------------------------------------------
    # 4. New table: lead_properties
    # ------------------------------------------------------------------
    op.create_table(
        "lead_properties",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("lead_id", sa.Integer(), sa.ForeignKey("leads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("key", sa.String(255), nullable=False),
        sa.Column("value", sa.String(4096), nullable=False),
        sa.Column("value_type", sa.String(20), nullable=False, server_default="string"),
        sa.Column("source", sa.String(255), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lead_properties_lead_id", "lead_properties", ["lead_id"])
    op.create_index("ix_lead_properties_account_id", "lead_properties", ["account_id"])
    op.create_index("ix_lead_properties_key", "lead_properties", ["key"])
    # Uniqueness: (lead_id, key) — use create_index for SQLite compatibility
    op.create_index("uq_lead_property_lead_key", "lead_properties", ["lead_id", "key"], unique=True)

    # ------------------------------------------------------------------
    # 5. New table: lead_tags
    # ------------------------------------------------------------------
    op.create_table(
        "lead_tags",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("lead_id", sa.Integer(), sa.ForeignKey("leads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("source", sa.String(255), nullable=False),
        sa.Column("applied_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("applied_by", sa.String(255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lead_tags_lead_id", "lead_tags", ["lead_id"])
    op.create_index("ix_lead_tags_account_id", "lead_tags", ["account_id"])
    op.create_index("ix_lead_tags_name", "lead_tags", ["name"])
    # Uniqueness: (lead_id, name)
    op.create_index("uq_lead_tag_lead_name", "lead_tags", ["lead_id", "name"], unique=True)


def downgrade() -> None:
    # Drop new tables
    op.drop_index("uq_lead_tag_lead_name", "lead_tags")
    op.drop_index("ix_lead_tags_name", "lead_tags")
    op.drop_index("ix_lead_tags_account_id", "lead_tags")
    op.drop_index("ix_lead_tags_lead_id", "lead_tags")
    op.drop_table("lead_tags")

    op.drop_index("uq_lead_property_lead_key", "lead_properties")
    op.drop_index("ix_lead_properties_key", "lead_properties")
    op.drop_index("ix_lead_properties_account_id", "lead_properties")
    op.drop_index("ix_lead_properties_lead_id", "lead_properties")
    op.drop_table("lead_properties")

    op.drop_index("ix_lead_events_created_at", "lead_events")
    op.drop_index("ix_lead_events_event_type", "lead_events")
    op.drop_index("ix_lead_events_account_id", "lead_events")
    op.drop_index("ix_lead_events_lead_id", "lead_events")
    op.drop_table("lead_events")

    # Restore lead_stage_history → lead_status_history column names
    with op.batch_alter_table("lead_stage_history") as batch_op:
        batch_op.alter_column(
            "from_stage",
            new_column_name="from_status",
            existing_type=sa.String(255),
            type_=sa.String(50),
            existing_nullable=True,
            nullable=True,
        )
        batch_op.alter_column(
            "to_stage",
            new_column_name="to_status",
            existing_type=sa.String(255),
            type_=sa.String(50),
            existing_nullable=False,
            nullable=False,
        )

    op.rename_table("lead_stage_history", "lead_status_history")

    # Restore leads.stage → status
    with op.batch_alter_table("leads") as batch_op:
        batch_op.alter_column(
            "stage",
            new_column_name="status",
            existing_type=sa.String(255),
            type_=sa.String(50),
            existing_nullable=True,
            nullable=False,
            server_default="new",
        )
