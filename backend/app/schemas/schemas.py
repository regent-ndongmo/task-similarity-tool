from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime


# ─── Auth ────────────────────────────────────────────────────────────────────
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


# ─── Tasks ───────────────────────────────────────────────────────────────────
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


# ─── File Preview ─────────────────────────────────────────────────────────────
class FilePreviewResponse(BaseModel):
    filename: str
    total_rows: int
    columns: List[str]
    auto_detected: Dict[str, Optional[str]]
    sample_rows: List[Dict[str, Any]]
    needs_manual_mapping: bool


# ─── Similarity ───────────────────────────────────────────────────────────────
class SimilarityMatch(BaseModel):
    task_id: int
    title: str
    description: str
    similarity_score: float
    common_keywords: List[str]
    level: str

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
    column_mapping: Optional[Dict[str, Any]] = None
    results: List[BulkSimilarityItem]
    stats_summary: Optional[Dict[str, Any]] = None


# ─── Logs ─────────────────────────────────────────────────────────────────────
class AnalysisLogOut(BaseModel):
    id: int
    analysis_type: str
    source_filename: Optional[str]
    total_submitted: int
    total_analyzed: int
    duplicates_found: int
    strong_matches: int
    moderate_matches: int
    clean_tasks: int
    column_mapping: Optional[Dict[str, Any]]
    status: str
    error_message: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class LogsResponse(BaseModel):
    logs: List[AnalysisLogOut]
    total: int
    offset: int
    limit: int


# ─── Statistics ───────────────────────────────────────────────────────────────
class GlobalStats(BaseModel):
    total_analyses: int
    total_tasks_submitted: int
    total_duplicates_found: int
    total_strong_matches: int
    total_moderate_matches: int
    total_clean: int
    duplicate_rate: float
    single_analyses: int
    bulk_analyses: int
    last_analysis_at: Optional[str]

class TrendPoint(BaseModel):
    date: str
    analyses: int
    tasks: int
    duplicates: int

class StatsResponse(BaseModel):
    global_stats: GlobalStats
    trend: List[TrendPoint]
