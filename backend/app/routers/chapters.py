from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body, Request
from typing import List, Dict, Any
from supabase import Client
import json

from app.database import get_supabase
from app.auth import get_current_user
from app.services.chapter_service import ChapterService
from app.services.chapter_analysis_service import ChapterAnalysisService
from app.services.dashboard_service import DashboardService
from app.models import (
    ChapterResponse,
    ChapterCreate,
    ChapterUpdate,
    ChapterStatus,
    ChapterAnalysisRequest,
    ApiResponse
)

router = APIRouter(prefix="/chapters", tags=["chapters"])


def get_chapter_service(supabase: Client = Depends(get_supabase)) -> ChapterService:
    """Dependency to get chapter service"""
    return ChapterService(supabase)


def get_chapter_analysis_service(supabase: Client = Depends(get_supabase)) -> ChapterAnalysisService:
    """Dependency to get chapter analysis service with TM support"""
    return ChapterAnalysisService(supabase)


def get_dashboard_service(supabase: Client = Depends(get_supabase)) -> DashboardService:
    """Dependency to get dashboard service"""
    return DashboardService(supabase)



@router.post("/series/{series_id}", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
async def create_chapter(
    request: Request,
    series_id: str = Path(..., description="ID of the series to add chapter to"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    chapter_service: ChapterService = Depends(get_chapter_service)
):
    """
    Create a new chapter for a specific series.
    
    - **series_id**: The ID of the series to add the chapter to
    - **chapter_number**: The chapter number (required)
    - Status will default to 'draft'
    - Page counts will default to 0
    """
    try:
        # Manually parse the request body to avoid FastAPI validation issues
        body = await request.body()

        # Parse JSON manually
        body_str = body.decode('utf-8')
        body_json = json.loads(body_str)

        # Create ChapterCreate object manually
        chapter_data = ChapterCreate(**body_json)

        # Create the chapter
        chapter = await chapter_service.create_chapter(chapter_data, series_id)

        return chapter
        
    except Exception as e:
        print(f"❌ Error in create_chapter endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chapter: {str(e)}"
        )


@router.get("/series/{series_id}", response_model=List[ChapterResponse])
async def get_chapters_by_series(
    series_id: str = Path(..., description="ID of the series to get chapters for"),
    skip: int = Query(0, ge=0, description="Number of chapters to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of chapters to return"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    chapter_service: ChapterService = Depends(get_chapter_service)
):
    """
    Get all chapters for a specific series with pagination.
    
    - **series_id**: The ID of the series to get chapters for
    - **skip**: Number of chapters to skip (for pagination)
    - **limit**: Maximum number of chapters to return
    """
    try:
        chapters = await chapter_service.get_chapters_by_series(series_id, skip, limit)
        
        return chapters
        
    except Exception as e:
        print(f"❌ Error in get_chapters_by_series endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chapters: {str(e)}"
        )


@router.get("/{chapter_id}", response_model=ChapterResponse)
async def get_chapter_by_id(
    chapter_id: str = Path(..., description="ID of the chapter to retrieve"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    chapter_service: ChapterService = Depends(get_chapter_service)
):
    """
    Get a specific chapter by its ID.
    
    - **chapter_id**: The ID of the chapter to retrieve
    """
    try:
        chapter = await chapter_service.get_chapter_by_id(chapter_id)
        
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chapter with ID {chapter_id} not found"
            )
        
        return chapter
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_chapter_by_id endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chapter: {str(e)}"
        )


@router.put("/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(
    request: Request,
    chapter_id: str = Path(..., description="ID of the chapter to update"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    chapter_service: ChapterService = Depends(get_chapter_service),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Update a specific chapter.
    
    - **chapter_id**: The ID of the chapter to update
    - **chapter_number**: New chapter number (optional)
    - **status**: New status (optional) - can be 'draft', 'in_progress', or 'translated'
    - **page_count**: Total number of pages (optional)
    """
    try:
        # Manually parse the request body
        body = await request.body()
        body_str = body.decode('utf-8')
        body_json = json.loads(body_str)

        # Create ChapterUpdate object manually
        chapter_data = ChapterUpdate(**body_json)

        chapter = await chapter_service.update_chapter(chapter_id, chapter_data)

        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chapter with ID {chapter_id} not found"
            )

        # Update dashboard statistics if status was changed
        if hasattr(chapter_data, 'status') and chapter_data.status is not None:
            try:
                await dashboard_service.update_progress_chapters_count()
                await dashboard_service.add_recent_activity(f"Chapter {chapter.chapter_number} status updated to {chapter.status}")
            except Exception as dashboard_error:
                print(f"⚠️ Failed to update dashboard after chapter status change: {dashboard_error}")
                # Don't fail the request if dashboard update fails

        return chapter
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in update_chapter endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update chapter: {str(e)}"
        )


@router.delete("/{chapter_id}", response_model=ApiResponse)
async def delete_chapter(
    chapter_id: str = Path(..., description="ID of the chapter to delete"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    chapter_service: ChapterService = Depends(get_chapter_service)
):
    """
    Delete a specific chapter.
    
    - **chapter_id**: The ID of the chapter to delete
    """
    try:
        success = await chapter_service.delete_chapter(chapter_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chapter with ID {chapter_id} not found"
            )
        
        return ApiResponse(
            success=True,
            message=f"Chapter {chapter_id} deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in delete_chapter endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete chapter: {str(e)}"
        )


@router.get("/series/{series_id}/count", response_model=Dict[str, int])
async def get_chapter_count(
    series_id: str = Path(..., description="ID of the series to get chapter count for"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    chapter_service: ChapterService = Depends(get_chapter_service)
):
    """
    Get the total count of chapters for a specific series.
    
    - **series_id**: The ID of the series to get chapter count for
    """
    try:
        count = await chapter_service.get_chapter_count_by_series(series_id)
        
        return {"count": count}

    except Exception as e:
        print(f"❌ Error in get_chapter_count endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chapter count: {str(e)}"
        )


@router.post("/{chapter_id}/analyze", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def analyze_chapter(
    chapter_id: str = Path(..., description="ID of the chapter to analyze"),
    request: ChapterAnalysisRequest = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
    chapter_service: ChapterService = Depends(get_chapter_service),
    analysis_service: ChapterAnalysisService = Depends(get_chapter_analysis_service)
):
    """
    Analyze a chapter using AI to generate comprehensive context and analysis.

    This endpoint analyzes all pages of a chapter in order, considering both visual content
    and OCR-extracted text contexts, to provide detailed story analysis and context.

    - **chapter_id**: The ID of the chapter to analyze
    - **pages**: Array of page data sorted by page number (1, 2, 3, ...)
    - **translation_info**: Array of translation guidelines to follow
    - **existing_context**: Existing context to maintain consistency with
    """
    try:
        # Validate that the chapter exists
        chapter = await chapter_service.get_chapter_by_id(chapter_id)
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chapter with ID {chapter_id} not found"
            )

        # Validate pages data
        if not request.pages:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pages array cannot be empty"
            )

        # Perform chapter analysis with series_id for TM integration
        analysis_result = await analysis_service.analyze_chapter(request, chapter.series_id)

        if not analysis_result.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Chapter analysis failed"
            )

        # Update chapter context and status with the analysis result
        chapter_update = ChapterUpdate(
            context=analysis_result.chapter_context,
            status=ChapterStatus.TRANSLATED  # Set status to translated after analysis
        )
        updated_chapter = await chapter_service.update_chapter(chapter_id, chapter_update)

        if not updated_chapter:
            print(f"⚠️ Warning: Failed to update chapter context for {chapter_id}")

        return ApiResponse(
            success=True,
            message="Chapter analysis completed successfully",
            data=analysis_result.model_dump()
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in analyze_chapter endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze chapter: {str(e)}"
        )
