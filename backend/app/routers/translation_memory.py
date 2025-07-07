from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Request
from typing import List, Dict, Any
from supabase import Client
import json

from app.database import get_supabase
from app.auth import get_current_user
from app.services.translation_memory_service import TranslationMemoryService
from app.models import (
    TranslationMemoryResponse,
    TranslationMemoryCreate,
    TranslationMemoryUpdate,
    ApiResponse
)

router = APIRouter(prefix="/translation-memory", tags=["translation-memory"])


def get_tm_service(supabase: Client = Depends(get_supabase)) -> TranslationMemoryService:
    """Dependency to get translation memory service"""
    return TranslationMemoryService(supabase)


@router.post("/series/{series_id}", response_model=TranslationMemoryResponse)
async def create_tm_entry(
    series_id: str = Path(..., description="The ID of the series"),
    request: Request = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    tm_service: TranslationMemoryService = Depends(get_tm_service)
):
    """
    Create a new translation memory entry for a series.
    
    - **series_id**: The ID of the series to add the TM entry to
    - **source_text**: The original text (required)
    - **target_text**: The translated text (required)
    - **context**: Optional context or notes about the translation
    """
    try:
        # Manually parse the request body to avoid FastAPI validation issues
        body = await request.body()

        # Parse JSON manually
        body_str = body.decode('utf-8')
        body_json = json.loads(body_str)

        # Add series_id to the data
        body_json["series_id"] = series_id

        # Create TranslationMemoryCreate object manually
        tm_data = TranslationMemoryCreate(**body_json)

        # Create the TM entry
        tm_entry = await tm_service.create_tm_entry(tm_data)
        
        return tm_entry

    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON format: {str(e)}"
        )
    except ValueError as e:
        print(f"❌ Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation error: {str(e)}"
        )
    except Exception as e:
        print(f"❌ Error creating TM entry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create TM entry: {str(e)}"
        )


@router.get("/series/{series_id}", response_model=List[TranslationMemoryResponse])
async def get_tm_entries_by_series(
    series_id: str = Path(..., description="The ID of the series"),
    skip: int = Query(0, ge=0, description="Number of entries to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of entries to return"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    tm_service: TranslationMemoryService = Depends(get_tm_service)
):
    """
    Get all translation memory entries for a specific series.

    - **series_id**: The ID of the series
    - **skip**: Number of entries to skip (for pagination)
    - **limit**: Maximum number of entries to return
    """
    try:
        tm_entries = await tm_service.get_tm_entries_by_series(series_id, skip, limit)

        return tm_entries

    except Exception as e:
        print(f"❌ Error getting TM entries for series {series_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get TM entries: {str(e)}"
        )


@router.get("/series/{series_id}/count", response_model=Dict[str, int])
async def get_tm_entries_count_by_series(
    series_id: str = Path(..., description="The ID of the series"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    tm_service: TranslationMemoryService = Depends(get_tm_service)
):
    """
    Get the total count of translation memory entries for a specific series.

    - **series_id**: The ID of the series
    """
    try:
        count = await tm_service.get_tm_entries_count_by_series(series_id)

        return {"count": count}

    except Exception as e:
        print(f"❌ Error getting TM entries count for series {series_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get TM entries count: {str(e)}"
        )


@router.get("/{tm_id}", response_model=TranslationMemoryResponse)
async def get_tm_entry(
    tm_id: str = Path(..., description="The ID of the translation memory entry"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    tm_service: TranslationMemoryService = Depends(get_tm_service)
):
    """
    Get a specific translation memory entry by ID.
    
    - **tm_id**: The ID of the translation memory entry
    """
    try:
        tm_entry = await tm_service.get_tm_entry_by_id(tm_id)
        
        if not tm_entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Translation memory entry with ID {tm_id} not found"
            )
        
        return tm_entry

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting TM entry {tm_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get TM entry: {str(e)}"
        )


@router.put("/{tm_id}", response_model=TranslationMemoryResponse)
async def update_tm_entry(
    tm_id: str = Path(..., description="The ID of the translation memory entry"),
    request: Request = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    tm_service: TranslationMemoryService = Depends(get_tm_service)
):
    """
    Update a translation memory entry.

    - **tm_id**: The ID of the translation memory entry to update
    - **source_text**: Updated source text (optional)
    - **target_text**: Updated target text (optional)
    - **context**: Updated context (optional)
    - **usage_count**: Updated usage count (optional)
    """
    try:
        # Manually parse the request body to avoid FastAPI validation issues
        body = await request.body()

        # Parse JSON manually
        body_str = body.decode('utf-8')
        body_json = json.loads(body_str)

        # Create TranslationMemoryUpdate object manually
        tm_data = TranslationMemoryUpdate(**body_json)

        updated_tm_entry = await tm_service.update_tm_entry(tm_id, tm_data)

        if not updated_tm_entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Translation memory entry with ID {tm_id} not found"
            )

        return updated_tm_entry

    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON format: {str(e)}"
        )
    except ValueError as e:
        print(f"❌ Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating TM entry {tm_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update TM entry: {str(e)}"
        )


@router.delete("/{tm_id}", response_model=ApiResponse)
async def delete_tm_entry(
    tm_id: str = Path(..., description="The ID of the translation memory entry"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    tm_service: TranslationMemoryService = Depends(get_tm_service)
):
    """
    Delete a translation memory entry.
    
    - **tm_id**: The ID of the translation memory entry to delete
    """
    try:
        success = await tm_service.delete_tm_entry(tm_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Translation memory entry with ID {tm_id} not found"
            )
        
        return ApiResponse(
            success=True,
            message=f"Translation memory entry {tm_id} deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting TM entry {tm_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete TM entry: {str(e)}"
        )


@router.post("/{tm_id}/increment-usage", response_model=TranslationMemoryResponse)
async def increment_tm_usage(
    tm_id: str = Path(..., description="The ID of the translation memory entry"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    tm_service: TranslationMemoryService = Depends(get_tm_service)
):
    """
    Increment the usage count for a translation memory entry.
    
    - **tm_id**: The ID of the translation memory entry
    """
    try:
        updated_tm_entry = await tm_service.increment_usage_count(tm_id)
        
        if not updated_tm_entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Translation memory entry with ID {tm_id} not found"
            )
        
        return updated_tm_entry

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error incrementing usage for TM entry {tm_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to increment usage: {str(e)}"
        )


@router.get("/series/{series_id}/search", response_model=List[TranslationMemoryResponse])
async def search_tm_entries(
    series_id: int = Path(..., description="The ID of the series"),
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    tm_service: TranslationMemoryService = Depends(get_tm_service)
):
    """
    Search translation memory entries by source or target text.
    
    - **series_id**: The ID of the series
    - **q**: Search query (searches in both source and target text)
    - **limit**: Maximum number of results to return
    """
    try:
        tm_entries = await tm_service.search_tm_entries(series_id, q, limit)
        
        return tm_entries

    except Exception as e:
        print(f"❌ Error searching TM entries: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search TM entries: {str(e)}"
        )
