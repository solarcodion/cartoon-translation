from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from typing import List, Dict, Any
from supabase import Client
import json

from app.database import get_supabase
from app.auth import get_current_user
from app.services.series_service import SeriesService
from app.models import (
    SeriesResponse,
    SeriesCreate,
    SeriesUpdate,
    ApiResponse
)

router = APIRouter(prefix="/series", tags=["series"])


def get_series_service(supabase: Client = Depends(get_supabase)) -> SeriesService:
    """Dependency to get series service"""
    return SeriesService(supabase)


@router.get("/", response_model=List[SeriesResponse])
async def get_series_list(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    series_service: SeriesService = Depends(get_series_service)
):
    """Get list of all series with pagination"""
    try:
        series_list = await series_service.get_series_list(skip=skip, limit=limit)
        return series_list
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch series list: {str(e)}"
        )


@router.get("/stats", response_model=Dict[str, Any])
async def get_series_stats(
    series_service: SeriesService = Depends(get_series_service)
):
    """Get series statistics"""
    try:
        stats = await series_service.get_series_stats()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch series statistics: {str(e)}"
        )


@router.get("/{series_id}", response_model=SeriesResponse)
async def get_series_by_id(
    series_id: str,
    series_service: SeriesService = Depends(get_series_service)
):
    """Get a specific series by ID"""
    try:
        series = await series_service.get_series_by_id(series_id)
        if not series:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Series with ID {series_id} not found"
            )
        return series
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch series: {str(e)}"
        )


@router.post("/", response_model=SeriesResponse, status_code=status.HTTP_201_CREATED)
async def create_series(
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user),
    series_service: SeriesService = Depends(get_series_service)
):
    """Create a new series"""
    try:
        created_by = current_user.get("user_id")
        if not created_by:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not found in authentication token"
            )

        # Get the raw request body
        body = await request.body()
        print(f"🔍 Raw body: {body}")
        print(f"🔍 Body type: {type(body)}")

        # Parse the JSON manually
        try:
            if isinstance(body, bytes):
                body_str = body.decode('utf-8')
            else:
                body_str = str(body)

            print(f"🔍 Body string: {body_str}")
            json_data = json.loads(body_str)
            print(f"🔍 Parsed JSON: {json_data}")

            # Validate required fields
            if 'title' not in json_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Title is required"
                )

            # Create SeriesCreate object
            series_data = SeriesCreate(title=json_data['title'])
            print(f"🔍 Created SeriesCreate: {series_data}")

        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid JSON: {str(e)}"
            )
        except Exception as e:
            print(f"❌ Error parsing request: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error parsing request: {str(e)}"
            )

        series = await series_service.create_series(series_data, created_by)
        return series
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error in create_series: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create series: {str(e)}"
        )


@router.put("/{series_id}", response_model=SeriesResponse)
async def update_series(
    series_id: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user),
    series_service: SeriesService = Depends(get_series_service)
):
    """Update an existing series"""
    try:
        updated_by = current_user.get("user_id")
        if not updated_by:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not found in authentication token"
            )

        # Get the raw request body
        body = await request.body()
        print(f"🔍 UPDATE - Raw body: {body}")
        print(f"🔍 UPDATE - Body type: {type(body)}")

        # Parse the JSON manually
        try:
            if isinstance(body, bytes):
                body_str = body.decode('utf-8')
            else:
                body_str = str(body)

            print(f"🔍 UPDATE - Body string: {body_str}")
            json_data = json.loads(body_str)
            print(f"🔍 UPDATE - Parsed JSON: {json_data}")

            # Create SeriesUpdate object with only provided fields
            update_fields = {}
            if 'title' in json_data:
                update_fields['title'] = json_data['title']
            if 'total_chapters' in json_data:
                update_fields['total_chapters'] = json_data['total_chapters']

            series_data = SeriesUpdate(**update_fields)
            print(f"🔍 UPDATE - Created SeriesUpdate: {series_data}")

        except json.JSONDecodeError as e:
            print(f"❌ UPDATE - JSON decode error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid JSON: {str(e)}"
            )
        except Exception as e:
            print(f"❌ UPDATE - Error parsing request: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error parsing request: {str(e)}"
            )

        series = await series_service.update_series(series_id, series_data, updated_by)
        if not series:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Series with ID {series_id} not found"
            )
        return series
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ UPDATE - Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update series: {str(e)}"
        )


@router.delete("/{series_id}", response_model=ApiResponse)
async def delete_series(
    series_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    series_service: SeriesService = Depends(get_series_service)
):
    """Delete a series"""
    try:
        deleted_by = current_user.get("user_id")
        if not deleted_by:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not found in authentication token"
            )
        
        success = await series_service.delete_series(series_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Series with ID {series_id} not found"
            )
        
        return ApiResponse(
            success=True,
            message=f"Series with ID {series_id} deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete series: {str(e)}"
        )
