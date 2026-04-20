"""Add performance indexes for hot query columns

Revision ID: a1b2c3d4e5f6
Revises: 8c7435fe262e
Create Date: 2026-03-09 00:01:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '8c7435fe262e'
branch_labels = None
depends_on = None


def upgrade():
    op.create_index("ix_projects_workflow_status", "projects", ["workflow_status"])
    op.create_index("ix_projects_uia_region", "projects", ["uia_region"])
    op.create_index("ix_projects_city", "projects", ["city"])
    op.create_index("ix_projects_latlon", "projects", ["latitude", "longitude"])
    op.create_index("ix_project_sdgs_project_id", "project_sdgs", ["project_id"])
    op.create_index("ix_project_sdgs_sdg_number", "project_sdgs", ["sdg_number"])
    op.create_index("ix_project_images_project_display", "project_images", ["project_id", "display_order"])


def downgrade():
    op.drop_index("ix_project_images_project_display", table_name="project_images")
    op.drop_index("ix_project_sdgs_sdg_number", table_name="project_sdgs")
    op.drop_index("ix_project_sdgs_project_id", table_name="project_sdgs")
    op.drop_index("ix_projects_latlon", table_name="projects")
    op.drop_index("ix_projects_city", table_name="projects")
    op.drop_index("ix_projects_uia_region", table_name="projects")
    op.drop_index("ix_projects_workflow_status", table_name="projects")
