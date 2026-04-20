from pydantic import BaseModel, EmailStr, HttpUrl, field_validator
from typing import List, Optional
from datetime import datetime
from uuid import UUID

_STATUS_MAP = {
    "planned": "PLANNED",
    "in_progress": "IN_PROGRESS",
    "implemented": "IMPLEMENTED",
    "needed_but_constrained": "NEEDED_BUT_CONSTRAINED",
    "Planned": "PLANNED",
    "In Progress": "IN_PROGRESS",
    "Implemented": "IMPLEMENTED",
    "Needed but Constrained": "NEEDED_BUT_CONSTRAINED",
    "PLANNED": "PLANNED",
    "IN_PROGRESS": "IN_PROGRESS",
    "IMPLEMENTED": "IMPLEMENTED",
    "NEEDED_BUT_CONSTRAINED": "NEEDED_BUT_CONSTRAINED",
}

_REGION_MAP = {
    "SECTION_I": "SECTION_I",
    "SECTION_II": "SECTION_II",
    "SECTION_III": "SECTION_III",
    "SECTION_IV": "SECTION_IV",
    "SECTION_V": "SECTION_V",
    "Section I - Western Europe": "SECTION_I",
    "Section II - Eastern Europe & Central Asia": "SECTION_II",
    "Section III - Middle East & Africa": "SECTION_III",
    "Section IV - Asia & Pacific": "SECTION_IV",
    "Section V - Americas": "SECTION_V",
}


class ProjectBase(BaseModel):
    """Base project schema with common fields"""
    project_name: str
    organization_name: str
    contact_person: str
    contact_email: EmailStr
    project_status: str
    uia_region: str
    city: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    brief_description: str
    detailed_description: str
    success_factors: str
    typologies: List[str]
    funding_requirements: List[str]
    government_requirements: List[str]
    other_requirements: List[str]
    other_requirement_text: Optional[str] = None
    other_typology_text: Optional[str] = None
    other_funding_text: Optional[str] = None
    other_gov_text: Optional[str] = None
    authors: Optional[str] = None
    sdgs: List[int]  # 1-17
    image_urls: List[str]
    gdpr_consent: bool

    @field_validator('project_status')
    @classmethod
    def normalize_status(cls, v):
        normalized = _STATUS_MAP.get(v)
        if normalized is None:
            raise ValueError(f"Invalid project_status: '{v}'. Must be one of: Planned, In Progress, Implemented, Needed but Constrained")
        return normalized

    @field_validator('uia_region')
    @classmethod
    def normalize_region(cls, v):
        normalized = _REGION_MAP.get(v)
        if normalized is None:
            raise ValueError(f"Invalid uia_region: '{v}'")
        return normalized

    @field_validator('latitude')
    @classmethod
    def validate_latitude(cls, v):
        if v is not None and (v < -90 or v > 90):
            raise ValueError('Latitude must be between -90 and 90')
        return v

    @field_validator('longitude')
    @classmethod
    def validate_longitude(cls, v):
        if v is not None and (v < -180 or v > 180):
            raise ValueError('Longitude must be between -180 and 180')
        return v

    @field_validator('sdgs')
    @classmethod
    def validate_sdgs(cls, v):
        for sdg in v:
            if sdg < 1 or sdg > 17:
                raise ValueError('SDG numbers must be between 1 and 17')
        return v


class ProjectCreate(ProjectBase):
    """Schema for creating a project"""
    captcha_token: str

    @field_validator('gdpr_consent')
    @classmethod
    def validate_gdpr(cls, v):
        if not v:
            raise ValueError('GDPR consent is required to submit a project')
        return v


class ProjectUpdate(BaseModel):
    """Schema for updating a project (admin)"""
    project_name: Optional[str] = None
    organization_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    project_status: Optional[str] = None
    workflow_status: Optional[str] = None
    uia_region: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    brief_description: Optional[str] = None
    detailed_description: Optional[str] = None
    success_factors: Optional[str] = None
    typologies: Optional[List[str]] = None
    funding_requirements: Optional[List[str]] = None
    government_requirements: Optional[List[str]] = None
    other_requirements: Optional[List[str]] = None
    other_requirement_text: Optional[str] = None
    other_typology_text: Optional[str] = None
    other_funding_text: Optional[str] = None
    other_gov_text: Optional[str] = None
    authors: Optional[str] = None
    sdgs: Optional[List[int]] = None
    image_urls: Optional[List[str]] = None
    rejection_reason: Optional[str] = None
    reviewer_notes: Optional[str] = None

    @field_validator('project_status')
    @classmethod
    def normalize_status(cls, v):
        if v is None:
            return v
        normalized = _STATUS_MAP.get(v)
        if normalized is None:
            raise ValueError(f"Invalid project_status: '{v}'")
        return normalized

    @field_validator('uia_region')
    @classmethod
    def normalize_region(cls, v):
        if v is None:
            return v
        normalized = _REGION_MAP.get(v)
        if normalized is None:
            raise ValueError(f"Invalid uia_region: '{v}'")
        return normalized


class ProjectResponse(ProjectBase):
    """Schema for project response"""
    id: UUID
    workflow_status: str
    rejection_reason: Optional[str] = None
    reviewer_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    """Schema for paginated project list"""
    total: int
    page: int
    page_size: int
    projects: List[ProjectResponse]


class DashboardKPIs(BaseModel):
    """Schema for dashboard KPI metrics"""
    total_projects: int
    cities_engaged: int
    countries_represented: int


class FilterOptions(BaseModel):
    """Schema for dashboard filter options"""
    region: Optional[str] = None
    sdg: Optional[int] = None
    city: Optional[str] = None
    funded_by: Optional[str] = None
