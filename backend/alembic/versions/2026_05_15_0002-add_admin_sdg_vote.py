"""Add admin SDG vote columns to projects table

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-05-15 00:02:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.exc import OperationalError

revision = 'e6f7a8b9c0d1'
down_revision = 'd5e6f7a8b9c0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    try:
        op.add_column('projects', sa.Column('admin_vote_sdg_1', sa.Integer(), nullable=True))
        op.add_column('projects', sa.Column('admin_vote_sdg_2', sa.Integer(), nullable=True))
        op.add_column('projects', sa.Column('admin_vote_sdg_3', sa.Integer(), nullable=True))
        op.add_column('projects', sa.Column('admin_voted_at', sa.DateTime(), nullable=True))
        op.add_column('projects', sa.Column('admin_voted_by', sa.String(255), nullable=True))
    except OperationalError:
        pass


def downgrade() -> None:
    try:
        op.drop_column('projects', 'admin_voted_by')
        op.drop_column('projects', 'admin_voted_at')
        op.drop_column('projects', 'admin_vote_sdg_3')
        op.drop_column('projects', 'admin_vote_sdg_2')
        op.drop_column('projects', 'admin_vote_sdg_1')
    except OperationalError:
        pass
