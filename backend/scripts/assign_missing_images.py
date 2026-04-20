"""
Script to assign images to projects that are missing them.
This assigns the available unused images to their corresponding projects.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.project import Project, ProjectImage


def assign_missing_images():
    """Assign available images to projects that need them"""
    db: Session = SessionLocal()

    try:
        # Mapping of project names (partial match) to image filenames
        image_assignments = {
            "Freiburg": "Freiburg-green-city-Sonnenschiff-scaled.jpg",
            "Cape Town Day Zero": "capetown_dayzero.jpg",
            "Seoul": "Seoul_digital_South-Korea-capital.png",
            "Portland": "portland_green_streets.jpg",
        }

        print("[INFO] Assigning missing images to projects...\n")
        updated_count = 0

        for project_keyword, image_filename in image_assignments.items():
            # Find project by name (case-insensitive partial match)
            projects = db.query(Project).filter(
                Project.project_name.ilike(f"%{project_keyword}%")
            ).all()

            for project in projects:
                # Check if project already has images
                existing_images = db.query(ProjectImage).filter(
                    ProjectImage.project_id == project.id
                ).count()

                if existing_images == 0:
                    # Add the image
                    new_image = ProjectImage(
                        project_id=project.id,
                        image_url=f"/project_images/{image_filename}",
                        display_order=0
                    )
                    db.add(new_image)
                    print(f"[+] Assigned '{image_filename}' to:")
                    print(f"    Project: {project.project_name}")
                    print(f"    City: {project.city}, {project.country}\n")
                    updated_count += 1
                else:
                    print(f"[SKIP] {project.project_name} already has {existing_images} image(s)\n")

        # Commit changes
        db.commit()
        print(f"\n[SUCCESS] Assigned {updated_count} new images to projects")

        # Show summary of projects still without images
        projects_without_images = db.query(Project).filter(
            ~Project.images.any()
        ).all()

        if projects_without_images:
            print(f"\n[INFO] {len(projects_without_images)} projects still without images:")
            for project in projects_without_images:
                print(f"  - {project.project_name} ({project.city})")
        else:
            print("\n[SUCCESS] All projects now have images!")

    except Exception as e:
        print(f"[ERROR] Error assigning images: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    assign_missing_images()
