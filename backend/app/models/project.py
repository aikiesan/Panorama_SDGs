from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, Enum, Boolean, Uuid
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from ..core.database import Base


class ProjectStatus(str, enum.Enum):
    """Project implementation status"""
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    IMPLEMENTED = "IMPLEMENTED"
    NEEDED_BUT_CONSTRAINED = "NEEDED_BUT_CONSTRAINED"


class WorkflowStatus(str, enum.Enum):
    """Project workflow/review status"""
    SUBMITTED = "SUBMITTED"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"


class UIARegion(str, enum.Enum):
    """UIA Regional sections"""
    SECTION_I = "SECTION_I"
    SECTION_II = "SECTION_II"
    SECTION_III = "SECTION_III"
    SECTION_IV = "SECTION_IV"
    SECTION_V = "SECTION_V"


class Project(Base):
    """Main project model"""

    __tablename__ = "projects"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Submitter information
    organization_name = Column(String(255), nullable=False)
    contact_person = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False, index=True)

    # Project basic info
    project_name = Column(String(500), nullable=False, index=True)
    project_status = Column(Enum(ProjectStatus), nullable=False)
    workflow_status = Column(
        Enum(WorkflowStatus),
        default=WorkflowStatus.SUBMITTED,
        nullable=False,
        index=True
    )

    # Financial


    # Location
    uia_region = Column(Enum(UIARegion), nullable=False, index=True)
    city = Column(String(255), nullable=False, index=True)
    country = Column(String(255), nullable=False, index=True)

    # Coordinates
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    # Note: PostGIS Geography column removed for SQLite compatibility
    # For production with PostgreSQL, uncomment:
    # location = Column(Geography(geometry_type='POINT', srid=4326), nullable=True)

    # Descriptions
    brief_description = Column(Text, nullable=False)
    detailed_description = Column(Text, nullable=False)
    success_factors = Column(Text, nullable=False)

    # Other requirement text (for custom "Other" option)
    other_requirement_text = Column(Text, nullable=True)
    other_typology_text    = Column(Text, nullable=True)
    other_funding_text     = Column(Text, nullable=True)
    other_gov_text         = Column(Text, nullable=True)

    # External reference (UIA Guidebook project code, e.g. IFF1, LDP6)
    external_code = Column(String(16), nullable=True, index=True)
    # Architect(s) / authors (populated from UIA Guidebook data)
    authors = Column(Text, nullable=True)

    # Review/moderation
    rejection_reason = Column(Text, nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    edit_token = Column(String(255), nullable=True, index=True)
    
    # Compliance
    gdpr_consent = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    sdgs = relationship("ProjectSDG", back_populates="project", cascade="all, delete-orphan")
    typologies = relationship("ProjectTypology", back_populates="project", cascade="all, delete-orphan")
    requirements = relationship("ProjectRequirement", back_populates="project", cascade="all, delete-orphan")
    images = relationship("ProjectImage", back_populates="project", cascade="all, delete-orphan")

    @property
    def image_urls(self):
        """Return list of image URLs sorted by display order"""
        return [img.image_url for img in sorted(self.images, key=lambda x: x.display_order)]

    def __repr__(self):
        return f"<Project {self.project_name}>"


class ProjectSDG(Base):
    """Many-to-many relationship for SDGs (1-17)"""

    __tablename__ = "project_sdgs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    sdg_number = Column(Integer, nullable=False, index=True)  # 1-17

    project = relationship("Project", back_populates="sdgs")


class ProjectTypology(Base):
    """Many-to-many relationship for project typologies"""

    __tablename__ = "project_typologies"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    typology = Column(String(255), nullable=False, index=True)

    project = relationship("Project", back_populates="typologies")


class ProjectRequirement(Base):
    """Many-to-many relationship for key requirements"""

    __tablename__ = "project_requirements"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    requirement_type = Column(String(50), nullable=False, index=True)  # 'funding', 'government', 'other'
    requirement = Column(String(500), nullable=False, index=True)

    project = relationship("Project", back_populates="requirements")


class ProjectImage(Base):
    """Project image URLs"""

    __tablename__ = "project_images"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(1000), nullable=False)
    display_order = Column(Integer, default=0)

    project = relationship("Project", back_populates="images")
