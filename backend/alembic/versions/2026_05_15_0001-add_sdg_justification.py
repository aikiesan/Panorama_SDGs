"""Add justification column to project_sdgs table

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-05-15 00:01:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.exc import OperationalError

revision = 'd5e6f7a8b9c0'
down_revision = 'c4d5e6f7a8b9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    try:
        op.add_column('project_sdgs', sa.Column('justification', sa.Text(), nullable=True))
    except OperationalError:
        pass


def downgrade() -> None:
    try:
        op.drop_column('project_sdgs', 'justification')
    except OperationalError:
        pass
