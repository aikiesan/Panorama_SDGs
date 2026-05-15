from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
from uuid import UUID
from ..core.database import get_db
from ..core.deps import get_current_admin
from ..core.config import settings
from ..models.project import Project, ProjectSDG, WorkflowStatus
from ..models.user import User
from ..schemas.project import ProjectResponse, ProjectUpdate, ProjectListResponse, AdminVotePayload
from .projects import _format_project_response
from ..services.email import send_changes_requested_email, send_approval_email, send_rejection_email


class RejectBody(BaseModel):
    reason: str


class RequestChangesBody(BaseModel):
    message: str

router = APIRouter()


@router.get("/pending-projects", response_model=ProjectListResponse)
async def get_pending_projects(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all pending project submissions for review"""

    query = db.query(Project).filter(
        Project.workflow_status.in_([
            WorkflowStatus.SUBMITTED,
            WorkflowStatus.IN_REVIEW
        ])
    ).order_by(Project.created_at.desc())

    total = query.count()
    offset = (page - 1) * page_size
    projects = query.offset(offset).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "projects": [_format_project_response(p) for p in projects]
    }


@router.get("/all-projects", response_model=ProjectListResponse)
async def get_all_projects(
    page: int = 1,
    page_size: int = 20,
    workflow_status: str = None,
    voted: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all projects (any status) - admin only"""

    query = db.query(Project)

    if workflow_status:
        query = query.filter(Project.workflow_status == workflow_status)

    if voted is True:
        query = query.filter(Project.admin_vote_sdg_1 != None)
    elif voted is False:
        query = query.filter(Project.admin_vote_sdg_1 == None)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Project.project_name.ilike(search_term) |
            Project.organization_name.ilike(search_term)
        )

    query = query.order_by(Project.created_at.desc())

    total = query.count()
    offset = (page - 1) * page_size
    projects = query.offset(offset).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "projects": [_format_project_response(p) for p in projects]
    }


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project_admin(
    project_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get any project by ID (admin - any workflow status)"""

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return _format_project_response(project)


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    update_data: ProjectUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a project (admin only)"""

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)

    # Handle SDGs separately (relationship, not a plain column)
    if 'sdgs' in update_dict:
        sdg_entries = update_dict.pop('sdgs')
        db.query(ProjectSDG).filter(ProjectSDG.project_id == project.id).delete()
        for entry in (sdg_entries or []):
            db.add(ProjectSDG(
                project_id=project.id,
                sdg_number=entry['sdg_number'],
                justification=entry.get('justification'),
            ))

    for field, value in update_dict.items():
        if hasattr(project, field):
            setattr(project, field, value)

    db.commit()
    db.refresh(project)

    return _format_project_response(project)


@router.post("/projects/{project_id}/approve", response_model=ProjectResponse)
async def approve_project(
    project_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve and publish a project"""

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    project.workflow_status = WorkflowStatus.APPROVED
    db.commit()
    db.refresh(project)

    # Send email notification to submitter
    public_link = f"{settings.FRONTEND_URL}/?project={str(project.id)}"
    await send_approval_email(project.contact_email, project.project_name, public_link)

    return _format_project_response(project)


@router.post("/projects/{project_id}/reject")
async def reject_project(
    project_id: UUID,
    body: RejectBody,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Reject a project with reason"""

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    project.workflow_status = WorkflowStatus.REJECTED
    project.rejection_reason = body.reason
    db.commit()

    # Send email notification to submitter
    await send_rejection_email(project.contact_email, project.project_name, body.reason)

    return {"message": "Project rejected", "project_id": str(project_id)}


@router.post("/projects/{project_id}/request-changes")
async def request_changes(
    project_id: UUID,
    body: RequestChangesBody,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Request changes to a project"""

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    project.workflow_status = WorkflowStatus.CHANGES_REQUESTED
    project.reviewer_notes = body.message
    
    # Generate edit token if not exists
    if not project.edit_token:
        project.edit_token = str(uuid.uuid4())
        
    db.commit()

    # Send email with edit link to submitter
    edit_link = f"{settings.FRONTEND_URL}/submit?edit_token={project.edit_token}"
    await send_changes_requested_email(project.contact_email, project.project_name, edit_link, body.message)

    return {"message": "Changes requested", "project_id": str(project_id)}


@router.post("/projects/{project_id}/vote", response_model=ProjectResponse)
async def vote_sdgs(
    project_id: UUID,
    body: AdminVotePayload,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Record admin's SDG vote for a project (exactly 3 SDGs)"""

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    project.admin_vote_sdg_1 = body.sdg_numbers[0]
    project.admin_vote_sdg_2 = body.sdg_numbers[1]
    project.admin_vote_sdg_3 = body.sdg_numbers[2]
    project.admin_voted_at = datetime.utcnow()
    project.admin_voted_by = current_user.email
    db.commit()
    db.refresh(project)

    return _format_project_response(project)


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a project (admin only)"""

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    db.delete(project)
    db.commit()

    return {"message": "Project deleted", "project_id": str(project_id)}
