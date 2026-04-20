"""
Script to seed production database with correct image URLs.
Maps projects to their corresponding images in /project_images/ folder.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.project import Project, ProjectImage


# Mapping of project names (partial match) to image filenames
PROJECT_IMAGE_MAPPING = {
    "Barcelona": ["barcelona_super_blocks.jpg"],
    "Medellín": ["medelin_urban_aculpunture.jpg"],
    "Medellin": ["medelin_urban_aculpunture.jpg"],
    "Kigali": ["city_of_kigali.jpg"],
    "Curitiba": ["curitiba_brazil_BRT.jpg"],
    "Portland Urban Growth": ["portland_urban_growth_smart.jpg"],
    "Portland Green": ["portland_green_streets.jpg"],
    "Bogotá": ["Ciclovia_bogota.jpg"],
    "Bogota": ["Ciclovia_bogota.jpg"],
    "Tokyo": ["Tokyo_resilience_project.jpg"],
    "Vancouver": ["Vancouver_Olympic_village.jpg"],
    "Seoul": ["Seoul_digital_South-Korea-capital.png"],
    "Cape Town Water": ["capetown_system.jpg"],
    "Cape Town Day Zero": ["capetown_dayzero.jpg"],
    "Malmö": ["200616_0022_malmo_drone-Vastra-hamnen-Foto-Apeloga-min-scaled.jpg"],
    "Malmo": ["200616_0022_malmo_drone-Vastra-hamnen-Foto-Apeloga-min-scaled.jpg"],
    "Addis Ababa": ["addis_ababa.jpg"],
    "Masdar": ["masdar-city_1big.jpg"],
    "Mexico City": ["mexico_women_water_harvest.png"],
    "Freiburg": ["Freiburg-green-city-Sonnenschiff-scaled.jpg"],
}


def seed_images():
    """Seed production database with image URLs"""
    db: Session = SessionLocal()

    try:
        # Get all projects
        projects = db.query(Project).all()

        print(f"[INFO] Found {len(projects)} projects in database\n")

        updated_count = 0
        added_count = 0

        for project in projects:
            # Check if project already has images
            existing_images = db.query(ProjectImage).filter(
                ProjectImage.project_id == project.id
            ).all()

            # Find matching image for this project
            matched_image = None
            for keyword, image_files in PROJECT_IMAGE_MAPPING.items():
                if keyword.lower() in project.project_name.lower():
                    matched_image = image_files[0]
                    break

            if matched_image:
                if existing_images:
                    # Update existing images
                    for img in existing_images:
                        old_url = img.image_url
                        new_url = f"/project_images/{matched_image}"
                        if old_url != new_url:
                            print(f"[UPDATE] {project.project_name}")
                            print(f"  Old: {old_url}")
                            print(f"  New: {new_url}")
                            img.image_url = new_url
                            updated_count += 1
                else:
                    # Add new image
                    print(f"[ADD] {project.project_name} -> {matched_image}")
                    new_image = ProjectImage(
                        project_id=project.id,
                        image_url=f"/project_images/{matched_image}",
                        display_order=0
                    )
                    db.add(new_image)
                    added_count += 1
            else:
                if not existing_images:
                    print(f"[SKIP] No image found for: {project.project_name}")

        # Commit all changes
        db.commit()

        print(f"\n[SUCCESS] Completed!")
        print(f"  - Updated: {updated_count} existing images")
        print(f"  - Added: {added_count} new images")

        # Show summary
        total_with_images = db.query(Project).join(ProjectImage).distinct().count()
        total_projects = db.query(Project).count()
        print(f"  - Projects with images: {total_with_images}/{total_projects}")

    except Exception as e:
        print(f"[ERROR] Error seeding images: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 80)
    print("PRODUCTION IMAGE SEEDING SCRIPT")
    print("=" * 80)
    print()

    # Safety check
    from app.core.config import settings
    db_url = settings.DATABASE_URL

    print(f"Database: {db_url[:50]}...")
    print()

    response = input("This will modify the production database. Continue? (yes/no): ")

    if response.lower() == 'yes':
        print()
        seed_images()
    else:
        print("\n[CANCELLED] No changes made.")
