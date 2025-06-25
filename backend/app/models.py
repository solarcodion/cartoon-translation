from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration"""
    ADMIN = "admin"
    EDITOR = "editor"
    TRANSLATOR = "translator"


class SeriesStatus(str, Enum):
    """Series status enumeration"""
    ACTIVE = "active"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    DROPPED = "dropped"


class UserBase(BaseModel):
    """Base user model with common fields"""
    email: EmailStr
    name: str
    role: UserRole


class UserCreate(UserBase):
    """User creation model"""
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = None
    role: Optional[UserRole] = None
    avatar_url: Optional[str] = None


class UserProfileUpdate(BaseModel):
    """User profile update model (for users updating their own profile)"""
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserRoleUpdate(BaseModel):
    """User role update model"""
    role: UserRole


class UserResponse(UserBase):
    """User response model"""
    id: str
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    """User model as stored in database"""
    pass


class CreateUserRequest(BaseModel):
    """Request model for creating a user after Supabase auth signup"""
    user_id: str
    email: EmailStr
    name: str
    role: UserRole = UserRole.TRANSLATOR
    avatar_url: Optional[str] = None


class ApiResponse(BaseModel):
    """Generic API response model"""
    success: bool
    message: str
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    message: str
    error_code: Optional[str] = None


# Series Models
class SeriesBase(BaseModel):
    """Base series model"""
    title: str
    total_chapters: int = 0


class SeriesCreate(BaseModel):
    """Series creation model - only requires title"""
    title: str

    class Config:
        # Ensure proper JSON parsing
        str_strip_whitespace = True
        validate_assignment = True


class SeriesUpdate(BaseModel):
    """Series update model"""
    title: Optional[str] = None
    total_chapters: Optional[int] = None


class SeriesResponse(SeriesBase):
    """Series response model"""
    id: int
    user_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SeriesInDB(SeriesResponse):
    """Series model as stored in database"""
    pass


# Chapter Models
class ChapterStatus(str, Enum):
    """Chapter status enumeration"""
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    TRANSLATED = "translated"


class ChapterBase(BaseModel):
    """Base chapter model"""
    chapter_number: int
    status: ChapterStatus = ChapterStatus.DRAFT
    page_count: int = 0


class ChapterCreate(BaseModel):
    """Chapter creation model - only requires chapter_number"""
    chapter_number: int

    class Config:
        str_strip_whitespace = True
        validate_assignment = True
        # Ensure proper JSON parsing
        json_encoders = {}
        # Allow population by field name (Pydantic v2)
        populate_by_name = True


class ChapterUpdate(BaseModel):
    """Chapter update model"""
    chapter_number: Optional[int] = None
    status: Optional[ChapterStatus] = None
    page_count: Optional[int] = None


class ChapterResponse(ChapterBase):
    """Chapter response model"""
    id: int
    series_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChapterInDB(ChapterResponse):
    """Chapter model as stored in database"""
    pass


# Translation Memory Models
class TranslationMemoryBase(BaseModel):
    """Base translation memory model"""
    series_id: int
    source_text: str
    target_text: str
    context: Optional[str] = None
    usage_count: int = 0


class TranslationMemoryCreate(BaseModel):
    """Translation memory creation model"""
    series_id: int
    source_text: str
    target_text: str
    context: Optional[str] = None

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class TranslationMemoryUpdate(BaseModel):
    """Translation memory update model"""
    source_text: Optional[str] = None
    target_text: Optional[str] = None
    context: Optional[str] = None
    usage_count: Optional[int] = None


class TranslationMemoryResponse(TranslationMemoryBase):
    """Translation memory response model"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TranslationMemoryInDB(TranslationMemoryResponse):
    """Translation memory model as stored in database"""
    pass
