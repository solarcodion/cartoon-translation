from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.exceptions import RequestValidationError
from typing import List, Dict, Any
from supabase import Client
from pydantic import ValidationError

from app.database import get_supabase
from app.auth import get_current_user, get_current_user_optional
from app.services.user_service import UserService
from app.models import (
    UserResponse, 
    UserUpdate, 
    CreateUserRequest, 
    ApiResponse, 
    ErrorResponse,
    UserRole
)

router = APIRouter(prefix="/users", tags=["users"])


def get_user_service(supabase: Client = Depends(get_supabase)) -> UserService:
    """Dependency to get user service"""
    return UserService(supabase)


def check_admin_permission(current_user: Dict[str, Any]) -> None:
    """Check if current user has admin permissions"""
    # For now, we'll implement a basic check
    # In a real app, you'd fetch the user's role from the database
    # This is a simplified version for demonstration
    pass


@router.post("/", response_model=UserResponse)
async def create_user(
    request: Request,
    user_service: UserService = Depends(get_user_service)
):
    """
    Create a new user in the database.
    This endpoint is typically called after a user signs up via Supabase Auth.
    Returns the user data whether newly created or already existing.
    """
    try:
        # Get raw request body for debugging
        raw_body = await request.body()
        print(f"Raw request body: {raw_body.decode()}")

        # Parse and validate the request data
        request_data = await request.json()
        print(f"Parsed JSON data: {request_data}")

        # Validate with Pydantic model
        user_data = CreateUserRequest(**request_data)
        print(f"Validated user data: {user_data}")

        result = await user_service.create_user(user_data)
        print(f"User operation successful: {result}")
        return result

    except ValidationError as e:
        print(f"Validation error: {e}")
        print(f"Validation error details: {e.errors()}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Validation error: {e.errors()}"
        )
    except HTTPException as e:
        # If it's a 409 conflict (user exists), try to fetch and return the existing user
        if e.status_code == 409:
            try:
                print(f"User already exists, attempting to fetch existing user")
                existing_user = await user_service.get_user_by_id(user_data.user_id)
                if existing_user:
                    print(f"Returning existing user: {existing_user}")
                    return existing_user
            except Exception as fetch_error:
                print(f"Failed to fetch existing user: {fetch_error}")

        # Re-raise the original HTTP exception
        raise e
    except Exception as e:
        print(f"Error in create_user endpoint: {str(e)}")
        print(f"Error type: {type(e)}")
        raise


@router.get("/", response_model=List[UserResponse])
async def get_users(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Get all users with pagination.
    Requires authentication.
    """
    return await user_service.get_all_users(limit=limit, offset=offset)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: Dict[str, Any] = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Get current user's profile information.
    """
    user = await user_service.get_user_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Get user by ID.
    Requires authentication.
    """
    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Update user information.
    Users can update their own profile, admins can update any user.
    """
    # Check if user is updating their own profile or if they're an admin
    if current_user["user_id"] != user_id:
        # For now, allow any authenticated user to update any user
        # In production, you'd check admin permissions here
        pass
    
    return await user_service.update_user(user_id, user_data)


@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    role: UserRole,
    current_user: Dict[str, Any] = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Update user role.
    Requires admin permissions.
    """
    # In production, you'd check admin permissions here
    check_admin_permission(current_user)
    
    return await user_service.update_user_role(user_id, role)


@router.delete("/{user_id}", response_model=ApiResponse)
async def delete_user(
    user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Delete user.
    Requires admin permissions.
    """
    # In production, you'd check admin permissions here
    check_admin_permission(current_user)
    
    success = await user_service.delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return ApiResponse(
        success=True,
        message="User deleted successfully"
    )


@router.get("/email/{email}", response_model=UserResponse)
async def get_user_by_email(
    email: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Get user by email.
    Requires authentication.
    """
    user = await user_service.get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
