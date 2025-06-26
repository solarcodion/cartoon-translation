from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, UploadFile, File, Form, BackgroundTasks
from typing import List, Dict, Any
from supabase import Client
import json

from app.database import get_supabase
from app.auth import get_current_user
from app.services.page_service import PageService
from app.services.chapter_analysis_service import ChapterAnalysisService
from app.models import (
    PageResponse,
    PageCreate,
    PageUpdate,
    ChapterAnalysisRequest,
    PageAnalysisData,
    ApiResponse
)

router = APIRouter(prefix="/pages", tags=["pages"])


def get_page_service(supabase: Client = Depends(get_supabase)) -> PageService:
    """Dependency to get page service"""
    return PageService(supabase)


def get_chapter_analysis_service() -> ChapterAnalysisService:
    """Dependency to get chapter analysis service"""
    return ChapterAnalysisService()


async def update_chapter_status_and_count(chapter_id: str):
    """Update chapter status and page count"""
    try:
        from app.services.chapter_service import ChapterService
        from app.database import get_supabase
        from app.models import ChapterUpdate, ChapterStatus

        supabase = get_supabase()
        chapter_service = ChapterService(supabase)
        page_service = PageService(supabase)

        # Get current page count
        pages = await page_service.get_pages_by_chapter(chapter_id)
        page_count = len(pages)

        # Determine status based on page count
        if page_count == 0:
            status = ChapterStatus.DRAFT
        else:
            status = ChapterStatus.IN_PROGRESS  # Will be updated to TRANSLATED after analysis

        # Update chapter
        chapter_update = ChapterUpdate(
            page_count=page_count,
            status=status
        )
        await chapter_service.update_chapter(chapter_id, chapter_update)

        print(f"✅ Updated chapter {chapter_id}: page_count={page_count}, status={status.value}")

    except Exception as e:
        print(f"❌ Error updating chapter status and count for {chapter_id}: {str(e)}")


async def trigger_chapter_analysis_sync(
    chapter_id: str,
    page_service: PageService,
    analysis_service: ChapterAnalysisService
):
    """Synchronous task to analyze chapter after page changes - allows other API calls during analysis"""
    try:
        print(f"🔄 Starting synchronous chapter analysis for chapter {chapter_id}")

        # First update chapter status and page count
        await update_chapter_status_and_count(chapter_id)

        # Get all pages for the chapter
        pages = await page_service.get_pages_by_chapter(chapter_id)

        if not pages:
            print(f"⚠️ No pages found for chapter {chapter_id}, skipping analysis")
            return

        # Set status to IN_PROGRESS before analysis
        from app.services.chapter_service import ChapterService
        from app.database import get_supabase
        from app.models import ChapterUpdate, ChapterStatus

        supabase = get_supabase()
        chapter_service = ChapterService(supabase)

        print(f"📊 Setting chapter {chapter_id} status to IN_PROGRESS")
        await chapter_service.update_chapter(
            chapter_id,
            ChapterUpdate(status=ChapterStatus.IN_PROGRESS)
        )

        # Prepare analysis request
        analysis_request = ChapterAnalysisRequest(
            pages=[
                PageAnalysisData(
                    page_number=page.page_number,
                    image_url=page.file_path,
                    ocr_context=page.context
                )
                for page in sorted(pages, key=lambda x: x.page_number)
            ],
            translation_info=[
                "Maintain natural Vietnamese flow and readability",
                "Preserve character names and proper nouns",
                "Adapt cultural references appropriately",
                "Use appropriate Vietnamese honorifics and speech patterns"
            ],
            existing_context=None  # Will be fetched from chapter if needed
        )

        # Perform analysis
        result = await analysis_service.analyze_chapter(analysis_request)

        if result.success:
            # Update chapter context and set status to TRANSLATED
            chapter_update = ChapterUpdate(
                context=result.chapter_context,
                status=ChapterStatus.TRANSLATED
            )
            await chapter_service.update_chapter(chapter_id, chapter_update)

            print(f"✅ Synchronous chapter analysis completed for chapter {chapter_id}")
            print(f"📊 Generated context: {len(result.chapter_context)} characters")
            print(f"⏱️ Processing time: {result.processing_time:.2f}s")
            print(f"🎯 Chapter status set to TRANSLATED")
        else:
            print(f"❌ Synchronous chapter analysis failed for chapter {chapter_id}")
            # Set status back to IN_PROGRESS on failure
            await chapter_service.update_chapter(
                chapter_id,
                ChapterUpdate(status=ChapterStatus.IN_PROGRESS)
            )

    except Exception as e:
        print(f"❌ Error in synchronous chapter analysis for chapter {chapter_id}: {str(e)}")
        # Set status back to IN_PROGRESS on error
        try:
            from app.services.chapter_service import ChapterService
            from app.database import get_supabase
            from app.models import ChapterUpdate, ChapterStatus

            supabase = get_supabase()
            chapter_service = ChapterService(supabase)
            await chapter_service.update_chapter(
                chapter_id,
                ChapterUpdate(status=ChapterStatus.IN_PROGRESS)
            )
        except:
            pass  # Don't raise exception in sync task


# Keep the background version for compatibility
async def trigger_chapter_analysis_background(
    chapter_id: str,
    page_service: PageService,
    analysis_service: ChapterAnalysisService
):
    """Background task wrapper for synchronous analysis"""
    await trigger_chapter_analysis_sync(chapter_id, page_service, analysis_service)


@router.post("/", response_model=PageResponse, status_code=status.HTTP_201_CREATED)
async def create_page(
    chapter_id: str = Form(...),
    page_number: int = Form(...),
    file: UploadFile = File(...),
    width: int = Form(None),
    height: int = Form(None),
    context: str = Form(None),
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
    - **context**: Optional OCR text context extracted from the image
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
            height=height,
            context=context
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
    chapter_id: str = Path(..., description="Chapter ID"),
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
    page_id: str = Path(..., description="Page ID"),
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
    page_id: str = Path(..., description="Page ID"),
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
    page_id: str = Path(..., description="Page ID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service)
):
    """
    Delete a page
    
    - **page_id**: ID of the page to delete
    """
    try:
        # Delete the page
        success = await page_service.delete_page(page_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete page"
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
