from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from typing import List, Dict, Any
from supabase import Client

from app.database import get_supabase
from app.auth import get_current_user
from app.services.ai_glossary_service import AIGlossaryService
from app.models import (
    AIGlossaryResponse,
    AIGlossaryCreate,
    AIGlossaryUpdate,
    ApiResponse
)

router = APIRouter(prefix="/ai-glossary", tags=["ai-glossary"])


def get_ai_glossary_service(supabase: Client = Depends(get_supabase)) -> AIGlossaryService:
    """Dependency to get AI glossary service"""
    return AIGlossaryService(supabase)


@router.get("/series/{series_id}", response_model=List[AIGlossaryResponse])
async def get_glossary_by_series(
    series_id: str = Path(..., description="ID of the series to get glossary for"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    ai_glossary_service: AIGlossaryService = Depends(get_ai_glossary_service)
):
    """
    Get all AI glossary entries for a specific series
    
    - **series_id**: The ID of the series to get glossary entries for
    """
    try:
        print(f"🔍 Fetching AI glossary for series {series_id} by user {current_user.get('user_id')}")
        
        entries = await ai_glossary_service.get_glossary_by_series_id(series_id)
        
        print(f"✅ Found {len(entries)} AI glossary entries for series {series_id}")
        return entries
        
    except Exception as e:
        print(f"❌ Error fetching AI glossary for series {series_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch AI glossary: {str(e)}"
        )


@router.get("/{entry_id}", response_model=AIGlossaryResponse)
async def get_glossary_entry_by_id(
    entry_id: str = Path(..., description="ID of the glossary entry to retrieve"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    ai_glossary_service: AIGlossaryService = Depends(get_ai_glossary_service)
):
    """
    Get a specific AI glossary entry by its ID
    
    - **entry_id**: The ID of the glossary entry to retrieve
    """
    try:
        print(f"🔍 Fetching AI glossary entry {entry_id} by user {current_user.get('user_id')}")
        
        entry = await ai_glossary_service.get_glossary_entry_by_id(entry_id)
        
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"AI glossary entry with ID {entry_id} not found"
            )
        
        print(f"✅ AI glossary entry {entry_id} retrieved successfully")
        return entry
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching AI glossary entry {entry_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch AI glossary entry: {str(e)}"
        )


@router.post("/", response_model=AIGlossaryResponse, status_code=status.HTTP_201_CREATED)
async def create_glossary_entry(
    glossary_data: AIGlossaryCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    ai_glossary_service: AIGlossaryService = Depends(get_ai_glossary_service)
):
    """
    Create a new AI glossary entry
    
    - **series_id**: ID of the series this glossary entry belongs to
    - **name**: Name of the character/term
    - **description**: Description of the character/term
    """
    try:
        created_by = current_user.get("user_id")
        if not created_by:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not found in authentication token"
            )
        
        print(f"📝 Creating AI glossary entry by user {created_by}")
        
        entry = await ai_glossary_service.create_glossary_entry(glossary_data, created_by)
        
        print(f"✅ AI glossary entry created successfully: {entry.id}")
        return entry
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating AI glossary entry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create AI glossary entry: {str(e)}"
        )


@router.put("/{entry_id}", response_model=AIGlossaryResponse)
async def update_glossary_entry(
    entry_id: str = Path(..., description="ID of the glossary entry to update"),
    glossary_data: AIGlossaryUpdate = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    ai_glossary_service: AIGlossaryService = Depends(get_ai_glossary_service)
):
    """
    Update an existing AI glossary entry
    
    - **entry_id**: The ID of the glossary entry to update
    - **name**: New name (optional)
    - **description**: New description (optional)
    """
    try:
        updated_by = current_user.get("user_id")
        if not updated_by:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not found in authentication token"
            )
        
        print(f"📝 Updating AI glossary entry {entry_id} by user {updated_by}")
        
        entry = await ai_glossary_service.update_glossary_entry(entry_id, glossary_data, updated_by)
        
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"AI glossary entry with ID {entry_id} not found"
            )
        
        print(f"✅ AI glossary entry {entry_id} updated successfully")
        return entry
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating AI glossary entry {entry_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update AI glossary entry: {str(e)}"
        )


@router.delete("/{entry_id}", response_model=ApiResponse)
async def delete_glossary_entry(
    entry_id: str = Path(..., description="ID of the glossary entry to delete"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    ai_glossary_service: AIGlossaryService = Depends(get_ai_glossary_service)
):
    """
    Delete an AI glossary entry
    
    - **entry_id**: The ID of the glossary entry to delete
    """
    try:
        deleted_by = current_user.get("user_id")
        if not deleted_by:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not found in authentication token"
            )
        
        print(f"🗑️ Deleting AI glossary entry {entry_id} by user {deleted_by}")
        
        success = await ai_glossary_service.delete_glossary_entry(entry_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"AI glossary entry with ID {entry_id} not found"
            )
        
        print(f"✅ AI glossary entry {entry_id} deleted successfully")
        return ApiResponse(
            success=True,
            message=f"AI glossary entry with ID {entry_id} deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting AI glossary entry {entry_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete AI glossary entry: {str(e)}"
        )


@router.delete("/series/{series_id}/clear", response_model=ApiResponse)
async def clear_series_glossary(
    series_id: str = Path(..., description="ID of the series to clear glossary for"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    ai_glossary_service: AIGlossaryService = Depends(get_ai_glossary_service)
):
    """
    Clear all AI glossary entries for a specific series
    
    - **series_id**: The ID of the series to clear glossary entries for
    """
    try:
        cleared_by = current_user.get("user_id")
        if not cleared_by:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not found in authentication token"
            )
        
        print(f"🧹 Clearing AI glossary for series {series_id} by user {cleared_by}")
        
        deleted_count = await ai_glossary_service.clear_series_glossary(series_id)
        
        print(f"✅ Cleared {deleted_count} AI glossary entries for series {series_id}")
        return ApiResponse(
            success=True,
            message=f"Cleared {deleted_count} AI glossary entries for series {series_id}",
            data={"deleted_count": deleted_count}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error clearing AI glossary for series {series_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear AI glossary: {str(e)}"
        )


@router.get("/stats/overview", response_model=Dict[str, Any])
async def get_glossary_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    ai_glossary_service: AIGlossaryService = Depends(get_ai_glossary_service)
):
    """Get AI glossary statistics"""
    try:
        print(f"📊 Fetching AI glossary statistics by user {current_user.get('user_id')}")
        
        stats = await ai_glossary_service.get_glossary_stats()
        
        print(f"✅ AI glossary statistics retrieved successfully")
        return stats
        
    except Exception as e:
        print(f"❌ Error fetching AI glossary statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch AI glossary statistics: {str(e)}"
        )
