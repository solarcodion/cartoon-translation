from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from typing import List, Dict, Any
from supabase import Client

from app.database import get_supabase
from app.auth import get_current_user
from app.services.text_box_service import TextBoxService
from app.services.dashboard_service import DashboardService
from app.services.ocr_service import OCRService
from app.services.tm_calculation_service import TMCalculationService
from app.models import (
    TextBoxResponse,
    TextBoxCreate,
    TextBoxUpdate,
    ApiResponse,
    OCRRequest
)
from pydantic import BaseModel

# Paginated response model
class PaginatedTextBoxResponse(BaseModel):
    text_boxes: List[TextBoxResponse]
    total_count: int
    has_next_page: bool

router = APIRouter(prefix="/text-boxes", tags=["text-boxes"])


def get_text_box_service(supabase: Client = Depends(get_supabase)) -> TextBoxService:
    """Dependency to get text box service"""
    return TextBoxService(supabase)


def get_dashboard_service(supabase: Client = Depends(get_supabase)) -> DashboardService:
    """Dependency to get dashboard service"""
    return DashboardService(supabase)


def get_tm_calculation_service(supabase: Client = Depends(get_supabase)) -> TMCalculationService:
    """Dependency to get TM calculation service"""
    return TMCalculationService(supabase)


# Global OCR service instance (initialized once)
ocr_service = None


def get_ocr_service() -> OCRService:
    """Dependency to get OCR service (singleton pattern)"""
    global ocr_service
    if ocr_service is None:
        ocr_service = OCRService()
    return ocr_service


@router.post("/", response_model=TextBoxResponse, status_code=status.HTTP_201_CREATED)
async def create_text_box(
    text_box_data: TextBoxCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    text_box_service: TextBoxService = Depends(get_text_box_service),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Create a new text box

    - **page_id**: ID of the page this text box belongs to
    - **image**: URL of the original page image (optional)
    - **x**: X coordinate of the bounding box
    - **y**: Y coordinate of the bounding box
    - **w**: Width of the bounding box
    - **h**: Height of the bounding box
    - **ocr**: OCR extracted text (optional)
    - **corrected**: Manually corrected text (optional)
    - **tm**: Translation memory score (optional)
    - **reason**: Reason for correction (optional)
    """
    try:
        text_box = await text_box_service.create_text_box(text_box_data)

        # Update dashboard statistics
        try:
            await dashboard_service.increment_textbox_count()
            await dashboard_service.add_recent_activity(f"New text box created on page")
        except Exception as dashboard_error:
            print(f"⚠️ Failed to update dashboard after text box creation: {dashboard_error}")
            # Don't fail the request if dashboard update fails

        return text_box

    except Exception as e:
        print(f"❌ Error in create_text_box endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create text box: {str(e)}"
        )


@router.get("/page/{page_id}", response_model=List[TextBoxResponse])
async def get_text_boxes_by_page(
    page_id: str = Path(..., description="Page ID"),
    skip: int = Query(0, ge=0, description="Number of text boxes to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of text boxes to return"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    text_box_service: TextBoxService = Depends(get_text_box_service)
):
    """
    Get all text boxes for a specific page
    
    - **page_id**: ID of the page
    - **skip**: Number of text boxes to skip (for pagination)
    - **limit**: Maximum number of text boxes to return
    """
    try:
        text_boxes = await text_box_service.get_text_boxes_by_page(page_id, skip, limit)
        return text_boxes
        
    except Exception as e:
        print(f"❌ Error in get_text_boxes_by_page endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch text boxes: {str(e)}"
        )


@router.get("/chapter/{chapter_id}", response_model=List[TextBoxResponse])
async def get_text_boxes_by_chapter(
    chapter_id: str = Path(..., description="Chapter ID"),
    skip: int = Query(0, ge=0, description="Number of text boxes to skip"),
    limit: int = Query(10000, ge=1, le=10000, description="Number of text boxes to return"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    text_box_service: TextBoxService = Depends(get_text_box_service)
):
    """
    Get all text boxes for a specific chapter (across all pages)
    
    - **chapter_id**: ID of the chapter
    - **skip**: Number of text boxes to skip (for pagination)
    - **limit**: Maximum number of text boxes to return
    """
    try:
        text_boxes = await text_box_service.get_text_boxes_by_chapter(chapter_id, skip, limit)
        return text_boxes
        
    except Exception as e:
        print(f"❌ Error in get_text_boxes_by_chapter endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch text boxes: {str(e)}"
        )


@router.get("/chapter/{chapter_id}/paginated", response_model=PaginatedTextBoxResponse)
async def get_text_boxes_by_chapter_paginated(
    chapter_id: str = Path(..., description="Chapter ID"),
    skip: int = Query(0, ge=0, description="Number of text boxes to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of text boxes to return"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    text_box_service: TextBoxService = Depends(get_text_box_service)
):
    """
    Get text boxes for a specific chapter with pagination metadata

    - **chapter_id**: ID of the chapter
    - **skip**: Number of text boxes to skip (for pagination)
    - **limit**: Maximum number of text boxes to return

    Returns paginated text boxes with total count and pagination metadata.
    """
    try:
        # Get text boxes for the current page
        text_boxes = await text_box_service.get_text_boxes_by_chapter(chapter_id, skip, limit)

        # Get total count for pagination
        total_count = await text_box_service.get_text_boxes_count_by_chapter(chapter_id)

        # Calculate if there's a next page
        has_next_page = (skip + limit) < total_count

        return PaginatedTextBoxResponse(
            text_boxes=text_boxes,
            total_count=total_count,
            has_next_page=has_next_page
        )

    except Exception as e:
        print(f"❌ Error in get_text_boxes_by_chapter_paginated endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch paginated text boxes: {str(e)}"
        )


@router.get("/{text_box_id}", response_model=TextBoxResponse)
async def get_text_box(
    text_box_id: str = Path(..., description="Text box ID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    text_box_service: TextBoxService = Depends(get_text_box_service)
):
    """
    Get a specific text box by ID
    
    - **text_box_id**: ID of the text box
    """
    try:
        text_box = await text_box_service.get_text_box_by_id(text_box_id)
        
        if not text_box:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Text box not found"
            )
        
        return text_box
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_text_box endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch text box: {str(e)}"
        )


@router.put("/{text_box_id}", response_model=TextBoxResponse)
async def update_text_box(
    text_box_id: str = Path(..., description="Text box ID"),
    text_box_data: TextBoxUpdate = ...,
    current_user: Dict[str, Any] = Depends(get_current_user),
    text_box_service: TextBoxService = Depends(get_text_box_service)
):
    """
    Update a text box

    - **text_box_id**: ID of the text box to update
    - **image**: URL of the original page image (optional)
    - **x**: X coordinate of the bounding box (optional)
    - **y**: Y coordinate of the bounding box (optional)
    - **w**: Width of the bounding box (optional)
    - **h**: Height of the bounding box (optional)
    - **ocr**: OCR extracted text (optional)
    - **corrected**: Manually corrected text (optional)
    - **tm**: Translation memory score (optional)
    - **reason**: Reason for correction (optional)
    """
    try:
        text_box = await text_box_service.update_text_box(text_box_id, text_box_data)
        
        if not text_box:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Text box not found"
            )
        
        return text_box
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in update_text_box endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update text box: {str(e)}"
        )


@router.delete("/{text_box_id}", response_model=ApiResponse)
async def delete_text_box(
    text_box_id: str = Path(..., description="Text box ID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    text_box_service: TextBoxService = Depends(get_text_box_service),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Delete a text box
    
    - **text_box_id**: ID of the text box to delete
    """
    try:
        success = await text_box_service.delete_text_box(text_box_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Text box not found"
            )

        # Update dashboard statistics
        try:
            await dashboard_service.decrement_textbox_count()
            await dashboard_service.add_recent_activity(f"Text box deleted from page")
        except Exception as dashboard_error:
            print(f"⚠️ Failed to update dashboard after text box deletion: {dashboard_error}")
            # Don't fail the request if dashboard update fails

        return ApiResponse(
            success=True,
            message="Text box deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in delete_text_box endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete text box: {str(e)}"
        )


@router.post("/auto-create/{page_id}", response_model=List[TextBoxResponse], status_code=status.HTTP_201_CREATED)
async def auto_create_text_boxes(
    page_id: str = Path(..., description="Page ID"),
    request: OCRRequest = ...,
    current_user: Dict[str, Any] = Depends(get_current_user),
    text_box_service: TextBoxService = Depends(get_text_box_service),
    ocr_service: OCRService = Depends(get_ocr_service),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Automatically create text boxes for a page by detecting text regions

    This endpoint analyzes the page image to detect text regions and automatically
    creates text boxes for each detected region with the extracted text.

    - **page_id**: ID of the page to create text boxes for
    - **image_data**: Base64 encoded image data (with or without data URL prefix)

    Returns a list of created text boxes with their bounding boxes and extracted text.
    """
    try:
        # Validate input
        if not request.image_data or not request.image_data.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image data is required and cannot be empty"
            )

        # Detect text regions in the image
        detection_result = ocr_service.detect_text_regions(request.image_data)

        if not detection_result.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to detect text regions in image"
            )

        # Create text boxes from detected regions
        created_text_boxes = await text_box_service.create_text_boxes_from_detection(
            page_id, detection_result
        )

        # Update dashboard statistics
        try:
            if created_text_boxes:
                # Increment textbox count for each created text box
                for _ in created_text_boxes:
                    await dashboard_service.increment_textbox_count()

                await dashboard_service.add_recent_activity(
                    f"Auto-created {len(created_text_boxes)} text boxes on page"
                )
        except Exception as dashboard_error:
            print(f"⚠️ Failed to update dashboard after auto text box creation: {dashboard_error}")
            # Don't fail the request if dashboard update fails

        return created_text_boxes

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in auto_create_text_boxes endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to auto-create text boxes: {str(e)}"
        )


@router.post("/calculate-tm")
async def calculate_tm_score(
    request: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user),
    tm_service: TMCalculationService = Depends(get_tm_calculation_service)
):
    """
    Calculate TM (Translation Memory) score for given OCR text.

    Request body should contain:
    - ocr_text: The OCR text to calculate TM score for
    - series_id: The series ID to search TM entries in
    - max_suggestions: Optional, maximum number of suggestions to return (default: 3)
    """
    try:
        ocr_text = request.get("ocr_text", "").strip()
        series_id = request.get("series_id", "").strip()
        max_suggestions = request.get("max_suggestions", 3)

        if not ocr_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OCR text is required"
            )

        if not series_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Series ID is required"
            )

        # Calculate TM score with suggestions
        best_score, suggestions = await tm_service.calculate_tm_score_with_suggestions(
            ocr_text, series_id, max_suggestions
        )

        # Format suggestions for response
        formatted_suggestions = []
        for tm_entry, score in suggestions:
            formatted_suggestions.append({
                "tm_entry": {
                    "id": tm_entry.id,
                    "source_text": tm_entry.source_text,
                    "target_text": tm_entry.target_text,
                    "context": tm_entry.context,
                    "usage_count": tm_entry.usage_count
                },
                "similarity_score": score,
                "quality_label": tm_service.get_tm_quality_label(score),
                "quality_color": tm_service.get_tm_quality_color(score)
            })

        return {
            "success": True,
            "ocr_text": ocr_text,
            "series_id": series_id,
            "best_score": best_score,
            "quality_label": tm_service.get_tm_quality_label(best_score),
            "quality_color": tm_service.get_tm_quality_color(best_score),
            "suggestions": formatted_suggestions,
            "total_suggestions": len(formatted_suggestions)
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error calculating TM score: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate TM score: {str(e)}"
        )
