"""Add other_typology_text, other_funding_text, other_gov_text to projects

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f6
Create Date: 2026-04-19 00:01:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b3c4d5e6f7a8'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('other_typology_text', sa.Text(), nullable=True))
    op.add_column('projects', sa.Column('other_funding_text', sa.Text(), nullable=True))
    op.add_column('projects', sa.Column('other_gov_text', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('projects', 'other_gov_text')
    op.drop_column('projects', 'other_funding_text')
    op.drop_column('projects', 'other_typology_text')
