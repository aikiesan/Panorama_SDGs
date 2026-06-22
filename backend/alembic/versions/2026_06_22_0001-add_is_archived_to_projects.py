"""Add is_archived flag to projects table

Revision ID: f7a8b9c0d1e2
Revises: e6f7a8b9c0d1
Create Date: 2026-06-22 00:01:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.exc import OperationalError

revision = 'f7a8b9c0d1e2'
down_revision = 'e6f7a8b9c0d1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    try:
        op.add_column(
            'projects',
            sa.Column('is_archived', sa.Boolean(), nullable=False, server_default=sa.text('false'))
        )
        op.create_index('ix_projects_is_archived', 'projects', ['is_archived'])
    except OperationalError:
        pass


def downgrade() -> None:
    try:
        op.drop_index('ix_projects_is_archived', table_name='projects')
        op.drop_column('projects', 'is_archived')
    except OperationalError:
        pass
