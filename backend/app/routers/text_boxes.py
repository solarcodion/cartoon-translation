from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from typing import List, Dict, Any
from supabase import Client

from app.database import get_supabase
from app.auth import get_current_user
from app.services.text_box_service import TextBoxService
from app.models import (
    TextBoxResponse,
    TextBoxCreate,
    TextBoxUpdate,
    ApiResponse
)

router = APIRouter(prefix="/text-boxes", tags=["text-boxes"])


def get_text_box_service(supabase: Client = Depends(get_supabase)) -> TextBoxService:
    """Dependency to get text box service"""
    return TextBoxService(supabase)


@router.post("/", response_model=TextBoxResponse, status_code=status.HTTP_201_CREATED)
async def create_text_box(
    text_box_data: TextBoxCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    text_box_service: TextBoxService = Depends(get_text_box_service)
):
    """
    Create a new text box
    
    - **page_id**: ID of the page this text box belongs to
    - **image**: Base64 encoded cropped image (optional)
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
    limit: int = Query(1000, ge=1, le=10000, description="Number of text boxes to return"),
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
    - **image**: Base64 encoded cropped image (optional)
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
    text_box_service: TextBoxService = Depends(get_text_box_service)
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
