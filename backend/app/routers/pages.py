from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, UploadFile, File, Form
from typing import List, Dict, Any
from supabase import Client
import json

from app.database import get_supabase
from app.auth import get_current_user
from app.services.page_service import PageService
from app.models import (
    PageResponse,
    PageCreate,
    PageUpdate,
    ApiResponse
)

router = APIRouter(prefix="/pages", tags=["pages"])


def get_page_service(supabase: Client = Depends(get_supabase)) -> PageService:
    """Dependency to get page service"""
    return PageService(supabase)


@router.post("/", response_model=PageResponse, status_code=status.HTTP_201_CREATED)
async def create_page(
    chapter_id: int = Form(...),
    page_number: int = Form(...),
    file: UploadFile = File(...),
    width: int = Form(None),
    height: int = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service)
):
    """
    Create a new page with file upload
    
    - **chapter_id**: ID of the chapter this page belongs to
    - **page_number**: Page number within the chapter
    - **file**: Image file to upload
    - **width**: Optional image width (will be detected if not provided)
    - **height**: Optional image height (will be detected if not provided)
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Get file extension
        file_extension = file.filename.split('.')[-1].lower() if file.filename else 'jpg'
        if file_extension not in ['jpg', 'jpeg', 'png', 'webp']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file format. Use JPG, PNG, or WebP"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Create page data
        page_data = PageCreate(
            chapter_id=chapter_id,
            page_number=page_number,
            file_name=file.filename or f"page_{page_number}.{file_extension}",
            width=width,
            height=height
        )
        
        # Create page
        page = await page_service.create_page(page_data, file_content, file_extension)
        
        return page
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in create_page endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create page: {str(e)}"
        )


@router.get("/chapter/{chapter_id}", response_model=List[PageResponse])
async def get_pages_by_chapter(
    chapter_id: int = Path(..., description="Chapter ID"),
    skip: int = Query(0, ge=0, description="Number of pages to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of pages to return"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service)
):
    """
    Get all pages for a specific chapter
    
    - **chapter_id**: ID of the chapter
    - **skip**: Number of pages to skip (for pagination)
    - **limit**: Maximum number of pages to return
    """
    try:
        pages = await page_service.get_pages_by_chapter(chapter_id, skip, limit)
        
        # Add public URLs to pages
        for page in pages:
            page.file_path = page_service.get_page_url(page.file_path)
        
        return pages
        
    except Exception as e:
        print(f"❌ Error in get_pages_by_chapter endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pages: {str(e)}"
        )


@router.get("/{page_id}", response_model=PageResponse)
async def get_page(
    page_id: int = Path(..., description="Page ID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service)
):
    """
    Get a specific page by ID
    
    - **page_id**: ID of the page
    """
    try:
        page = await page_service.get_page_by_id(page_id)
        
        if not page:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Page not found"
            )
        
        # Add public URL
        page.file_path = page_service.get_page_url(page.file_path)
        
        return page
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_page endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch page: {str(e)}"
        )


@router.put("/{page_id}", response_model=PageResponse)
async def update_page(
    page_id: int = Path(..., description="Page ID"),
    page_data: PageUpdate = ...,
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service)
):
    """
    Update a page
    
    - **page_id**: ID of the page to update
    - **page_data**: Updated page data
    """
    try:
        page = await page_service.update_page(page_id, page_data)
        
        if not page:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Page not found"
            )
        
        # Add public URL
        page.file_path = page_service.get_page_url(page.file_path)
        
        return page
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in update_page endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update page: {str(e)}"
        )


@router.delete("/{page_id}", response_model=ApiResponse)
async def delete_page(
    page_id: int = Path(..., description="Page ID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service)
):
    """
    Delete a page
    
    - **page_id**: ID of the page to delete
    """
    try:
        success = await page_service.delete_page(page_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Page not found"
            )
        
        return ApiResponse(
            success=True,
            message="Page deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in delete_page endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete page: {str(e)}"
        )


@router.get("/{page_id}/url", response_model=Dict[str, str])
async def get_page_url(
    page_id: int = Path(..., description="Page ID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service)
):
    """
    Get public URL for a page file
    
    - **page_id**: ID of the page
    """
    try:
        page = await page_service.get_page_by_id(page_id)
        
        if not page:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Page not found"
            )
        
        url = page_service.get_page_url(page.file_path)
        
        return {"url": url}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_page_url endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get page URL: {str(e)}"
        )
