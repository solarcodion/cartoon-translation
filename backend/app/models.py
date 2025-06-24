from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration"""
    ADMIN = "admin"
    EDITOR = "editor"
    TRANSLATOR = "translator"


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
