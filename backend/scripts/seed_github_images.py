"""
Script to seed production database with GitHub image URLs.
This allows images to be served directly from the GitHub repository.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.project import Project, ProjectImage


# GitHub raw content base URL
GITHUB_BASE = "https://raw.githubusercontent.com/aikiesan/atlas_33/main/frontend/public/project_images"

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
    """Seed database with GitHub image URLs"""
    db: Session = SessionLocal()

    try:
        projects = db.query(Project).all()
        print(f"[INFO] Found {len(projects)} projects\n")

        added_count = 0

        for project in projects:
            # Find matching image
            matched_image = None
            for keyword, image_files in PROJECT_IMAGE_MAPPING.items():
                if keyword.lower() in project.project_name.lower():
                    matched_image = image_files[0]
                    break

            if matched_image:
                # Check if image already exists
                existing = db.query(ProjectImage).filter(
                    ProjectImage.project_id == project.id
                ).first()

                image_url = f"{GITHUB_BASE}/{matched_image}"

                if existing:
                    print(f"[UPDATE] {project.project_name}")
                    print(f"  URL: {image_url}")
                    existing.image_url = image_url
                else:
                    print(f"[ADD] {project.project_name}")
                    print(f"  URL: {image_url}")
                    new_image = ProjectImage(
                        project_id=project.id,
                        image_url=image_url,
                        display_order=0
                    )
                    db.add(new_image)
                    added_count += 1

        db.commit()

        print(f"\n[SUCCESS] Added {added_count} images")

        # Summary
        total_with_images = db.query(Project).join(ProjectImage).distinct().count()
        total_projects = db.query(Project).count()
        print(f"Projects with images: {total_with_images}/{total_projects}")

    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 80)
    print("GITHUB IMAGE SEEDING SCRIPT")
    print("=" * 80)
    print()
    print("This will use images from GitHub repository.")
    print()

    from app.core.config import settings
    print(f"Database: {settings.DATABASE_URL[:50]}...")
    print()

    response = input("Continue? (yes/no): ")
    if response.lower() == 'yes':
        print()
        seed_images()
    else:
        print("\n[CANCELLED]")
