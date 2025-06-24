from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from typing import List, Dict, Any
from supabase import Client
from pydantic import ValidationError

from app.database import get_supabase
from app.auth import get_current_user
from app.services.user_service import UserService
from app.models import (
    UserResponse,
    UserUpdate,
    UserProfileUpdate,
    UserRoleUpdate,
    CreateUserRequest,
    ApiResponse,
    UserRole
)

router = APIRouter(prefix="/users", tags=["users"])


def get_user_service(supabase: Client = Depends(get_supabase)) -> UserService:
    """Dependency to get user service"""
    return UserService(supabase)


async def check_admin_permission(current_user: Dict[str, Any], user_service: UserService) -> None:
    """Check if current user has admin permissions"""
    try:
        # Get the current user's full profile to check their role
        user_profile = await user_service.get_user_by_id(current_user["user_id"])

        if not user_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )

        if user_profile.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin permissions required for this operation"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify admin permissions: {str(e)}"
        )


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


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Update current user's own profile information.
    Users can only update their name and avatar_url, not their role.
    """
    try:
        # Get raw request body for debugging
        raw_body = await request.body()
        print(f"Raw request body: {raw_body.decode()}")

        # Parse and validate the request data
        request_data = await request.json()
        print(f"Parsed JSON data: {request_data}")

        # Validate with Pydantic model
        profile_data = UserProfileUpdate(**request_data)
        print(f"Validated profile data: {profile_data}")

        # Convert profile data to user update format
        user_data = UserUpdate(
            name=profile_data.name,
            avatar_url=profile_data.avatar_url,
            role=None  # Explicitly set role to None to prevent updates
        )

        return await user_service.update_user(current_user["user_id"], user_data)

    except ValidationError as e:
        print(f"Validation error: {e}")
        print(f"Validation error details: {e.errors()}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Validation error: {e.errors()}"
        )
    except Exception as e:
        print(f"Error in update_my_profile endpoint: {str(e)}")
        print(f"Error type: {type(e)}")
        raise


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Update user information.
    Users can update their own profile (except role), admins can update any user.
    """
    # Check if user is updating their own profile
    if current_user["user_id"] == user_id:
        # Users can update their own profile but not their role
        if user_data.role is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Users cannot update their own role. Contact an administrator."
            )
    else:
        # If updating another user, must be admin
        await check_admin_permission(current_user, user_service)

    return await user_service.update_user(user_id, user_data)


@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Update user role.
    Requires admin permissions.
    """
    try:
        # Check admin permissions
        await check_admin_permission(current_user, user_service)

        # Prevent users from updating their own role
        if current_user["user_id"] == user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Users cannot update their own role. Another admin must perform this action."
            )

        # Get raw request body for debugging
        raw_body = await request.body()
        print(f"Raw request body: {raw_body.decode()}")

        # Parse and validate the request data
        request_data = await request.json()
        print(f"Parsed JSON data: {request_data}")

        # Validate with Pydantic model
        role_data = UserRoleUpdate(**request_data)
        print(f"Validated role data: {role_data}")

        return await user_service.update_user_role(user_id, role_data.role)

    except ValidationError as e:
        print(f"Validation error: {e}")
        print(f"Validation error details: {e.errors()}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Validation error: {e.errors()}"
        )
    except Exception as e:
        print(f"Error in update_user_role endpoint: {str(e)}")
        print(f"Error type: {type(e)}")
        raise


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
    # Check admin permissions
    await check_admin_permission(current_user, user_service)

    # Prevent users from deleting their own account
    if current_user["user_id"] == user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Users cannot delete their own account. Contact another administrator."
        )

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
