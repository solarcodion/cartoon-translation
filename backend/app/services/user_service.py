from datetime import datetime
from typing import List, Optional, Dict, Any
from supabase import Client
from app.models import UserCreate, UserUpdate, UserResponse, UserRole, CreateUserRequest
from fastapi import HTTPException, status


class UserService:
    """Service for user-related operations"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table_name = "users"
    
    async def create_user(self, user_data: CreateUserRequest) -> UserResponse:
        """Create a new user in the database or return existing user"""
        try:
            # First, check if user already exists
            existing_user = await self.get_user_by_id(user_data.user_id)
            if existing_user:
                return existing_user

            # Prepare user data for insertion
            user_dict = {
                "id": user_data.user_id,
                "email": user_data.email,
                "name": user_data.name,
                "role": user_data.role.value,
                "avatar_url": user_data.avatar_url,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            # Insert user into database
            response = self.supabase.table(self.table_name).insert(user_dict).execute()

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create user - no data returned from database"
                )

            return UserResponse(**response.data[0])

        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            print(f"Error type: {type(e)}")

            if "duplicate key value" in str(e).lower() or "already exists" in str(e).lower():
                # User already exists, fetch and return the existing user
                try:
                    existing_user = await self.get_user_by_id(user_data.user_id)
                    if existing_user:
                        return existing_user
                except Exception as fetch_error:
                    print(f"Failed to fetch existing user: {fetch_error}")

                # If we can't fetch the existing user, still return a conflict error
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="User already exists"
                )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user: {str(e)}"
            )
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Get user by ID"""
        try:
            response = self.supabase.table(self.table_name).select("*").eq("id", user_id).execute()
            
            if not response.data:
                return None
            
            return UserResponse(**response.data[0])
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get user: {str(e)}"
            )
    
    async def get_user_by_email(self, email: str) -> Optional[UserResponse]:
        """Get user by email"""
        try:
            response = self.supabase.table(self.table_name).select("*").eq("email", email).execute()
            
            if not response.data:
                return None
            
            return UserResponse(**response.data[0])
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get user: {str(e)}"
            )
    
    async def get_all_users(self, limit: int = 100, offset: int = 0) -> List[UserResponse]:
        """Get all users with pagination"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            
            return [UserResponse(**user) for user in response.data]
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get users: {str(e)}"
            )
    
    async def update_user(self, user_id: str, user_data: UserUpdate) -> UserResponse:
        """Update user information"""
        try:
            # First check if user exists
            existing_user = await self.get_user_by_id(user_id)
            if not existing_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )

            # Prepare update data - only include fields that are not None
            update_dict = {}
            if user_data.name is not None:
                update_dict["name"] = user_data.name.strip()  # Strip whitespace
            if user_data.role is not None:
                update_dict["role"] = user_data.role.value
            if user_data.avatar_url is not None:
                update_dict["avatar_url"] = user_data.avatar_url

            # If no fields to update, return existing user
            if not update_dict:
                return existing_user

            update_dict["updated_at"] = datetime.utcnow().isoformat()

            # Update user in database
            response = (
                self.supabase.table(self.table_name)
                .update(update_dict)
                .eq("id", user_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found or update failed"
                )

            return UserResponse(**response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            print(f"Error updating user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update user: {str(e)}"
            )
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete user from database"""
        try:
            response = self.supabase.table(self.table_name).delete().eq("id", user_id).execute()
            
            return len(response.data) > 0
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete user: {str(e)}"
            )
    
    async def update_user_role(self, user_id: str, new_role: UserRole) -> UserResponse:
        """Update user role specifically"""
        try:
            update_dict = {
                "role": new_role.value,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            response = (
                self.supabase.table(self.table_name)
                .update(update_dict)
                .eq("id", user_id)
                .execute()
            )
            
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            return UserResponse(**response.data[0])
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update user role: {str(e)}"
            )
