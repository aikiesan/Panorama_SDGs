"""Add gdpr_consent to projects table

Revision ID: 8c7435fe262e
Revises: b0778460db8a
Create Date: 2025-12-10 11:23:02.898662

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8c7435fe262e'
down_revision = 'b0778460db8a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('gdpr_consent', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('projects', 'gdpr_consent')
