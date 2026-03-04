from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── Auth Schemas ───────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class LoginRequest(BaseModel):
    username: str
    password: str


# ─── Task Schemas ────────────────────────────────────────────────────────────
class TaskCreate(BaseModel):
    title: str
    description: str

class TaskOut(BaseModel):
    id: int
    title: str
    description: str
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


# ─── Similarity Schemas ──────────────────────────────────────────────────────
class SimilarityMatch(BaseModel):
    task_id: int
    title: str
    description: str
    similarity_score: float
    common_keywords: List[str]
    level: str  # "doublon", "forte", "modérée"

class SimilarityResult(BaseModel):
    submitted_title: str
    submitted_description: str
    matches: List[SimilarityMatch]
    total_analyzed: int
    duplicates_found: int

class BulkSimilarityItem(BaseModel):
    title: str
    description: str
    matches: List[SimilarityMatch]

class BulkSimilarityResult(BaseModel):
    total_submitted: int
    total_analyzed: int
    results: List[BulkSimilarityItem]
