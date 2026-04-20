"""Add edit_token to projects table

Revision ID: b0778460db8a
Revises: 6f3fe0d49cf8
Create Date: 2025-12-10 11:14:00.742683

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b0778460db8a'
down_revision = '6f3fe0d49cf8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('edit_token', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_projects_edit_token'), 'projects', ['edit_token'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_projects_edit_token'), table_name='projects')
    op.drop_column('projects', 'edit_token')
