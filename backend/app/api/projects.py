from fastapi import APIRouter, Depends, HTTPException, Request, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID, uuid4
import httpx
from ..core.database import get_db
from ..core.limiter import limiter
from ..core.storage import upload_file as storage_upload_file
from ..models.project import (
    Project, ProjectSDG, ProjectTypology,
    ProjectRequirement, ProjectImage, WorkflowStatus
)
from ..schemas.project import ProjectCreate, ProjectResponse
from ..services.email import send_submission_notification
from ..core.config import settings

import logging
import os

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/upload", response_model=dict)
@limiter.limit("10/minute")
async def upload_project_image(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a project image to Supabase Storage"""
    
    # 1. Basic Validation
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # 2. Check file size (FastAPI doesn't do this automatically for SpoofFile)
    # We read a bit to check or use content-length header
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
    
    # 3. Generate unique filename
    unique_filename = f"{uuid4()}{file_ext}"
    file_path = f"submissions/{unique_filename}"
    
    # 4. Upload to storage (MinIO if configured, otherwise Supabase)
    try:
        public_url = storage_upload_file(content, file_path, file.content_type)
        return {"url": public_url, "filename": unique_filename}
    except Exception as e:
        logger.error(f"Storage upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    finally:
        await file.close()


@router.post("/submit", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def submit_project(request: Request, project_data: ProjectCreate, db: Session = Depends(get_db)):
    """Submit a new project (public endpoint)"""

    # Verify reCAPTCHA (only if enabled)
    if settings.ENABLE_RECAPTCHA:
        if not project_data.captcha_token:
            raise HTTPException(status_code=400, detail="reCAPTCHA verification required")
            
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://www.google.com/recaptcha/api/siteverify",
                    data={
                        "secret": settings.RECAPTCHA_SECRET_KEY,
                        "response": project_data.captcha_token
                    }
                )
                result = response.json()
                if not result.get("success"):
                    logger.warning(f"reCAPTCHA failed: {result}")
                    raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")
            except httpx.RequestError:
                raise HTTPException(status_code=503, detail="Unable to verify reCAPTCHA service")
    else:
        logger.info("reCAPTCHA verification skipped (disabled in settings)")

    # Create main project
    new_project = Project(
        organization_name=project_data.organization_name,
        contact_person=project_data.contact_person,
        contact_email=project_data.contact_email,
        project_name=project_data.project_name,
        project_status=project_data.project_status,
        workflow_status=WorkflowStatus.SUBMITTED,
        uia_region=project_data.uia_region,
        city=project_data.city,
        country=project_data.country,
        latitude=project_data.latitude,
        longitude=project_data.longitude,
        brief_description=project_data.brief_description,
        detailed_description=project_data.detailed_description,
        success_factors=project_data.success_factors,
        other_requirement_text=project_data.other_requirement_text,
        other_typology_text=project_data.other_typology_text,
        other_funding_text=project_data.other_funding_text,
        other_gov_text=project_data.other_gov_text,
        gdpr_consent=project_data.gdpr_consent,
    )

    # Coordinates are stored as latitude/longitude floats
    # (PostGIS Geography column removed for SQLite compatibility)

    db.add(new_project)
    db.flush()  # Get the project ID

    # Add SDGs
    for sdg_number in project_data.sdgs:
        sdg = ProjectSDG(project_id=new_project.id, sdg_number=sdg_number)
        db.add(sdg)

    # Add typologies
    for typology in project_data.typologies:
        typ = ProjectTypology(project_id=new_project.id, typology=typology)
        db.add(typ)

    # Add funding requirements
    for req in project_data.funding_requirements:
        requirement = ProjectRequirement(
            project_id=new_project.id,
            requirement_type='funding',
            requirement=req
        )
        db.add(requirement)

    # Add government requirements
    for req in project_data.government_requirements:
        requirement = ProjectRequirement(
            project_id=new_project.id,
            requirement_type='government',
            requirement=req
        )
        db.add(requirement)

    # Add other requirements
    for req in project_data.other_requirements:
        requirement = ProjectRequirement(
            project_id=new_project.id,
            requirement_type='other',
            requirement=req
        )
        db.add(requirement)

    # Add images
    for idx, image_url in enumerate(project_data.image_urls):
        image = ProjectImage(
            project_id=new_project.id,
            image_url=image_url,
            display_order=idx
        )
        db.add(image)

    db.commit()
    db.refresh(new_project)

    # Send email notification to admin (non-blocking failure)
    try:
        review_link = f"{settings.FRONTEND_URL}/admin"
        await send_submission_notification(settings.ADMIN_EMAIL, new_project.project_name, review_link)
    except Exception as email_err:
        logger.error(f"Email notification failed (Project created anyway): {str(email_err)}")

    return _format_project_response(new_project)


@router.get("/edit/{token}", response_model=ProjectResponse)
async def get_project_by_token(token: str, db: Session = Depends(get_db)):
    """Get project by edit token"""
    project = db.query(Project).filter(Project.edit_token == token).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired edit token"
        )
    return _format_project_response(project)


@router.put("/edit/{token}", response_model=ProjectResponse)
async def update_project_by_token(
    token: str,
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    """Update project using edit token"""
    project = db.query(Project).filter(Project.edit_token == token).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired edit token"
        )

    # Update main fields
    project.organization_name = project_data.organization_name
    project.contact_person = project_data.contact_person
    project.contact_email = project_data.contact_email
    project.project_name = project_data.project_name
    project.project_status = project_data.project_status
    project.uia_region = project_data.uia_region
    project.city = project_data.city
    project.country = project_data.country
    project.latitude = project_data.latitude
    project.longitude = project_data.longitude
    project.brief_description = project_data.brief_description
    project.detailed_description = project_data.detailed_description
    project.success_factors = project_data.success_factors
    project.other_requirement_text = project_data.other_requirement_text
    project.other_typology_text = project_data.other_typology_text
    project.other_funding_text = project_data.other_funding_text
    project.other_gov_text = project_data.other_gov_text
    project.gdpr_consent = project_data.gdpr_consent
    
    # Reset status to SUBMITTED for re-review
    project.workflow_status = WorkflowStatus.SUBMITTED

    # Clear existing relationships
    db.query(ProjectSDG).filter(ProjectSDG.project_id == project.id).delete()
    db.query(ProjectTypology).filter(ProjectTypology.project_id == project.id).delete()
    db.query(ProjectRequirement).filter(ProjectRequirement.project_id == project.id).delete()
    db.query(ProjectImage).filter(ProjectImage.project_id == project.id).delete()

    # Re-add relationships
    # Add SDGs
    for sdg_number in project_data.sdgs:
        sdg = ProjectSDG(project_id=project.id, sdg_number=sdg_number)
        db.add(sdg)

    # Add typologies
    for typology in project_data.typologies:
        typ = ProjectTypology(project_id=project.id, typology=typology)
        db.add(typ)

    # Add funding requirements
    for req in project_data.funding_requirements:
        requirement = ProjectRequirement(
            project_id=project.id,
            requirement_type='funding',
            requirement=req
        )
        db.add(requirement)

    # Add government requirements
    for req in project_data.government_requirements:
        requirement = ProjectRequirement(
            project_id=project.id,
            requirement_type='government',
            requirement=req
        )
        db.add(requirement)

    # Add other requirements
    for req in project_data.other_requirements:
        requirement = ProjectRequirement(
            project_id=project.id,
            requirement_type='other',
            requirement=req
        )
        db.add(requirement)

    # Add images
    for idx, image_url in enumerate(project_data.image_urls):
        image = ProjectImage(
            project_id=project.id,
            image_url=image_url,
            display_order=idx
        )
        db.add(image)

    db.commit()
    db.refresh(project)

    # Notify Admin of re-submission
    review_link = f"{settings.FRONTEND_URL}/admin"
    await send_submission_notification(settings.ADMIN_EMAIL, f"{project.project_name} (Resubmitted)", review_link)

    return _format_project_response(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: UUID, db: Session = Depends(get_db)):
    """Get a single project by ID (public if approved)"""
    try:
        logger.info(f"Fetching project with ID: {project_id}")
        project = db.query(Project).filter(Project.id == project_id).first()

        if not project:
            logger.warning(f"Project {project_id} not found in database")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        logger.info(f"Found project: {project.project_name}, Status: {project.workflow_status}")

        # Only return approved projects to public
        if project.workflow_status != WorkflowStatus.APPROVED:
            logger.warning(f"Project {project_id} is not APPROVED (status: {project.workflow_status})")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        response = _format_project_response(project)
        logger.info(f"Successfully formatted response for project {project_id}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project {project_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


def _format_project_response(project: Project) -> dict:
    """Helper to format project with related data"""
    # Map region codes to readable labels
    region_labels = {
        "SECTION_I": "Section I - Western Europe",
        "SECTION_II": "Section II - Eastern Europe & Central Asia",
        "SECTION_III": "Section III - Middle East & Africa",
        "SECTION_IV": "Section IV - Asia & Pacific",
        "SECTION_V": "Section V - Americas"
    }
    
    region_value = project.uia_region.value if project.uia_region else None
    if region_value in region_labels:
        region_value = region_labels[region_value]

    # Map status codes to readable labels
    status_labels = {
        "PLANNED": "Planned",
        "IN_PROGRESS": "In Progress",
        "IMPLEMENTED": "Implemented",
        "NEEDED_BUT_CONSTRAINED": "Needed but Constrained",
    }
    
    status_value = project.project_status.value if project.project_status else None
    if status_value in status_labels:
        status_value = status_labels[status_value]

    return {
        "id": project.id,
        "project_name": project.project_name,
        "organization_name": project.organization_name,
        "contact_person": project.contact_person,
        "contact_email": project.contact_email,
        "project_status": status_value,
        "workflow_status": project.workflow_status.value.lower() if project.workflow_status else None,
        "uia_region": region_value,
        "city": project.city,
        "country": project.country,
        "latitude": project.latitude,
        "longitude": project.longitude,
        "brief_description": project.brief_description,
        "detailed_description": project.detailed_description,
        "success_factors": project.success_factors,
        "typologies": [t.typology for t in project.typologies] if project.typologies else [],
        "funding_requirements": [
            r.requirement for r in project.requirements if r.requirement_type == 'funding'
        ] if project.requirements else [],
        "government_requirements": [
            r.requirement for r in project.requirements if r.requirement_type == 'government'
        ] if project.requirements else [],
        "other_requirements": [
            r.requirement for r in project.requirements if r.requirement_type == 'other'
        ] if project.requirements else [],
        "other_requirement_text": project.other_requirement_text,
        "other_typology_text": project.other_typology_text,
        "other_funding_text": project.other_funding_text,
        "other_gov_text": project.other_gov_text,
        "authors": project.authors,
        "gdpr_consent": project.gdpr_consent,
        "sdgs": [s.sdg_number for s in project.sdgs] if project.sdgs else [],
        "image_urls": [img.image_url for img in sorted(project.images, key=lambda x: x.display_order)] if project.images else [],
        "rejection_reason": project.rejection_reason,
        "reviewer_notes": project.reviewer_notes,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }
