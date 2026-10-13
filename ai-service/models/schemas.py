from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class FieldSignal(BaseModel):
    element_id: Optional[str] = None
    name: Optional[str] = None
    html_id: Optional[str] = None
    placeholder: Optional[str] = None
    label_text: Optional[str] = None
    aria_label: Optional[str] = None
    input_type: Optional[str] = None
    autocomplete: Optional[str] = None
    surrounding_text: Optional[str] = None
    options: Optional[List[str]] = None

class BatchMatchRequest(BaseModel):
    fields: List[FieldSignal]

class FieldMatchResult(BaseModel):
    element_id: Optional[str] = None
    detected_concept: str
    confidence_score: float
    action: str  # SAFE_AUTOFILL (>85%), REQUIRES_CONFIRMATION (60-85%), UNCERTAIN (<60%)
    mapped_profile_field: str
    rationale: str

class BatchMatchResponse(BaseModel):
    results: List[FieldMatchResult]

class EducationItem(BaseModel):
    college: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[str] = None
    graduation_year: Optional[str] = None

class ProjectItem(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: Optional[str] = None
    github_url: Optional[str] = None

class ExperienceItem(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

class ParsedResumeResponse(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    summary: Optional[str] = None
    job_title: Optional[str] = None
    current_role: Optional[str] = None
    desired_role: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    education: List[EducationItem] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    raw_text_length: int

