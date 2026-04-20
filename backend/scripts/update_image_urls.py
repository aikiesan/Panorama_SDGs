"""
Script to update project image URLs to use the correct path format.
This script updates image URLs in the database to point to /project_images/filename.jpg
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.project import ProjectImage
import re


def update_image_urls():
    """Update all image URLs to use /project_images/ prefix"""
    db: Session = SessionLocal()

    try:
        # Get all project images
        images = db.query(ProjectImage).all()

        updated_count = 0

        for image in images:
            # Extract just the filename from the current URL
            # Handle various formats: full URLs, relative paths, or just filenames
            current_url = image.image_url

            # Extract filename from various possible formats
            if '/' in current_url:
                filename = current_url.split('/')[-1]
            else:
                filename = current_url

            # Create the correct URL format
            new_url = f"/project_images/{filename}"

            # Only update if different
            if image.image_url != new_url:
                print(f"Updating: {image.image_url} -> {new_url}")
                image.image_url = new_url
                updated_count += 1

        # Commit all changes
        db.commit()
        print(f"\n[SUCCESS] Successfully updated {updated_count} image URLs")

        # Show sample of updated URLs
        if updated_count > 0:
            sample_images = db.query(ProjectImage).limit(5).all()
            print("\nSample of updated image URLs:")
            for img in sample_images:
                print(f"  - {img.image_url}")

    except Exception as e:
        print(f"[ERROR] Error updating image URLs: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("[INFO] Updating project image URLs...")
    update_image_urls()
