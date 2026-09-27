import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field

VALID_THEMES = {
    "indigo_dark", "indigo_light",
    "cool_dark", "cool_light",
    "warm_dark", "warm_light",
}

# ---------- Auth / User ----------


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserOut(BaseModel):
    id: str
    username: str
    email: EmailStr
    theme_preference: str
    created_at: datetime.datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ThemeUpdate(BaseModel):
    theme_preference: str


# ---------- Genres ----------


class GenreCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    color: Optional[str] = Field(default=None, max_length=20)


class GenreUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    color: Optional[str] = Field(default=None, max_length=20)


class GenreOut(BaseModel):
    id: str
    name: str
    color: Optional[str] = None
    usage_count: int = 0
    created_at: datetime.datetime


# ---------- Sources ----------


class SourceSchema(BaseModel):
    platform_name: Optional[str] = Field(default=None, max_length=100)
    url: str = Field(min_length=1, max_length=1000)
    is_primary: bool = False
    date_added: Optional[datetime.datetime] = None


# ---------- Series ----------


class SeriesBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    series_type: str = "other"
    status: str = "planning"
    current_progress: int = Field(default=0, ge=0)
    total_progress: Optional[int] = Field(default=None, ge=0)
    rating: Optional[float] = Field(default=None, ge=0, le=10)
    notes: Optional[str] = None
    cover_url: Optional[str] = None
    genre_ids: List[str] = []
    sources: List[SourceSchema] = []


class SeriesCreate(SeriesBase):
    pass


class SeriesUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    series_type: Optional[str] = None
    status: Optional[str] = None
    current_progress: Optional[int] = Field(default=None, ge=0)
    total_progress: Optional[int] = Field(default=None, ge=0)
    rating: Optional[float] = Field(default=None, ge=0, le=10)
    notes: Optional[str] = None
    cover_url: Optional[str] = None
    genre_ids: Optional[List[str]] = None
    sources: Optional[List[SourceSchema]] = None


class SeriesOut(BaseModel):
    id: str
    title: str
    series_type: str
    status: str
    current_progress: int
    total_progress: Optional[int] = None
    rating: Optional[float] = None
    notes: Optional[str] = None
    cover_url: Optional[str] = None
    genre_ids: List[str] = []
    sources: List[SourceSchema] = []
    created_at: datetime.datetime
    updated_at: datetime.datetime


class SeriesStats(BaseModel):
    total: int
    by_status: dict
    by_type: dict


# ---------- Export / Import ----------


class ExportSeries(BaseModel):
    title: str
    series_type: str
    status: str
    current_progress: int = 0
    total_progress: Optional[int] = None
    rating: Optional[float] = None
    notes: Optional[str] = None
    cover_url: Optional[str] = None
    genres: List[str] = []  # genre NAMES, not ids — for portability
    sources: List[SourceSchema] = []
    created_at: Optional[datetime.datetime] = None


class ExportData(BaseModel):
    version: str = "2.0"
    exported_at: datetime.datetime
    user: dict
    genres: List[str] = []
    series: List[ExportSeries]


class ImportResult(BaseModel):
    imported: int
    skipped: int
    genres_created: int
