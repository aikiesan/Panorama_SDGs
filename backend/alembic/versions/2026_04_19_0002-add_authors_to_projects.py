"""Add authors column to projects table

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-04-19 00:02:00.000000

NOTE: This column already exists in the production Supabase database (added via
supabase_import_2023.sql ALTER TABLE). This migration targets local SQLite dev
environments. The try/except makes it safe to run against either DB.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.exc import OperationalError

revision = 'c4d5e6f7a8b9'
down_revision = 'b3c4d5e6f7a8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    try:
        op.add_column('projects', sa.Column('authors', sa.Text(), nullable=True))
    except OperationalError:
        # Column already exists (production Supabase) — safe to skip
        pass


def downgrade() -> None:
    pass
