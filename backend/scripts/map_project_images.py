"""
Script to map project images from the project_images folder.
This script shows which projects have images and helps you assign the correct images.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.project import Project, ProjectImage


def list_projects_and_images():
    """List all projects and their current image URLs"""
    db: Session = SessionLocal()

    try:
        # Get all approved projects
        projects = db.query(Project).all()

        print(f"[INFO] Found {len(projects)} projects in database\n")
        print("=" * 80)

        for project in projects:
            print(f"\nProject ID: {project.id}")
            print(f"Name: {project.project_name}")
            print(f"City: {project.city}, {project.country}")
            print(f"Status: {project.workflow_status.value}")

            # Get images for this project
            images = db.query(ProjectImage).filter(
                ProjectImage.project_id == project.id
            ).order_by(ProjectImage.display_order).all()

            if images:
                print(f"Images ({len(images)}):")
                for idx, img in enumerate(images):
                    print(f"  [{idx}] {img.image_url}")
            else:
                print("Images: None")

            print("-" * 80)

    except Exception as e:
        print(f"[ERROR] Error listing projects: {e}")
    finally:
        db.close()


def show_available_images():
    """Show available images in the project_images folder"""
    # Get the path to frontend/public/project_images
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    project_root = os.path.dirname(backend_dir)
    images_dir = os.path.join(project_root, 'frontend', 'public', 'project_images')

    print("\n" + "=" * 80)
    print("AVAILABLE IMAGES IN /project_images/")
    print("=" * 80 + "\n")

    if os.path.exists(images_dir):
        image_files = [f for f in os.listdir(images_dir)
                      if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))]

        print(f"Found {len(image_files)} images:\n")
        for idx, filename in enumerate(sorted(image_files), 1):
            print(f"  {idx:2d}. {filename}")
    else:
        print(f"[ERROR] Directory not found: {images_dir}")

    print("\n" + "=" * 80)


if __name__ == "__main__":
    print("\n[INFO] Listing all projects and their images...\n")
    list_projects_and_images()
    show_available_images()

    print("\n[INFO] To update a project's images, you can:")
    print("  1. Use the admin panel when it's ready")
    print("  2. Manually update the database")
    print("  3. Use SQL commands to update specific projects\n")
