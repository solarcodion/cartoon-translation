from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, UploadFile, File, Form
from typing import List, Dict, Any
from supabase import Client

from app.database import get_supabase
from app.auth import get_current_user
from app.services.page_service import PageService
from app.services.ocr_service import OCRService
from app.services.dashboard_service import DashboardService
from app.services.text_box_service import TextBoxService
from app.models import (
    PageResponse,
    PageCreate,
    PageUpdate,
    ApiResponse,
    BatchPageUploadResponse
)

router = APIRouter(prefix="/pages", tags=["pages"])


def get_ocr_service() -> OCRService:
    """Dependency to get OCR service"""
    return OCRService()

def get_page_service(
    supabase: Client = Depends(get_supabase),
    ocr_service: OCRService = Depends(get_ocr_service)
) -> PageService:
    """Dependency to get page service with OCR support"""
    return PageService(supabase, ocr_service)


def get_dashboard_service(supabase: Client = Depends(get_supabase)) -> DashboardService:
    """Dependency to get dashboard service"""
    return DashboardService(supabase)


def get_text_box_service(supabase: Client = Depends(get_supabase)) -> TextBoxService:
    """Dependency to get text box service"""
    return TextBoxService(supabase)





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
            status = ChapterStatus.IN_PROGRESS  # Set to in_progress when pages exist

        # Update chapter
        chapter_update = ChapterUpdate(
            page_count=page_count,
            status=status
        )
        await chapter_service.update_chapter(chapter_id, chapter_update)

    except Exception as e:
        print(f"❌ Error updating chapter status and count for {chapter_id}: {str(e)}")





@router.post("/", response_model=PageResponse, status_code=status.HTTP_201_CREATED)
async def create_page(
    chapter_id: str = Form(...),
    page_number: int = Form(...),
    file: UploadFile = File(...),
    width: int = Form(None),
    height: int = Form(None),
    context: str = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
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

        # Update chapter status and page count (but don't analyze)
        await update_chapter_status_and_count(chapter_id)

        # Update dashboard statistics
        try:
            await dashboard_service.increment_pages_count()
            await dashboard_service.add_recent_activity(f"New page {page.page_number} added to chapter")
        except Exception as dashboard_error:
            print(f"⚠️ Failed to update dashboard after page creation: {dashboard_error}")
            # Don't fail the request if dashboard update fails

        return page
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in create_page endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create page: {str(e)}"
        )


@router.post("/batch", response_model=BatchPageUploadResponse, status_code=status.HTTP_201_CREATED)
async def create_pages_batch(
    chapter_id: str = Form(...),
    start_page_number: int = Form(...),
    files: List[UploadFile] = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Create multiple pages with batch file upload

    - **chapter_id**: ID of the chapter these pages belong to
    - **start_page_number**: Starting page number for the batch
    - **files**: List of image files to upload (one page per image)

    Page numbers will be assigned sequentially starting from the specified start page number.
    """
    try:
        if not files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one file must be provided"
            )

        # Validate and prepare file data
        files_data = []
        for file in files:
            # Validate file type
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File {file.filename} must be an image"
                )

            # Get file extension
            file_extension = file.filename.split('.')[-1].lower() if file.filename else 'jpg'
            if file_extension not in ['jpg', 'jpeg', 'png', 'webp']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported file format for {file.filename}. Use JPG, PNG, or WebP"
                )

            # Read file content
            file_content = await file.read()
            files_data.append((file_content, file_extension, file.filename))

        # Create pages in batch
        result = await page_service.create_pages_batch(chapter_id, files_data, start_page_number)

        # Update chapter status and page count
        await update_chapter_status_and_count(chapter_id)

        # Update dashboard statistics for batch upload
        try:
            pages_created = len(result.created_pages)
            # Increment pages count by the number of successfully created pages
            for _ in range(pages_created):
                await dashboard_service.increment_pages_count()
            await dashboard_service.add_recent_activity(f"Batch upload: {pages_created} pages added to chapter")
        except Exception as dashboard_error:
            print(f"⚠️ Failed to update dashboard after batch page creation: {dashboard_error}")
            # Don't fail the request if dashboard update fails

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in batch upload endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to batch upload pages: {str(e)}"
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

        # Update chapter status and page count (but don't analyze)
        await update_chapter_status_and_count(page.chapter_id)

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
    page_service: PageService = Depends(get_page_service),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Delete a page
    
    - **page_id**: ID of the page to delete
    """
    try:
        # Get page info before deletion to get chapter_id
        page = await page_service.get_page_by_id(page_id)
        if not page:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Page not found"
            )

        chapter_id = page.chapter_id

        # Delete the page
        success = await page_service.delete_page(page_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete page"
            )

        # Update chapter status and page count after deletion
        await update_chapter_status_and_count(chapter_id)

        # Update dashboard statistics
        try:
            await dashboard_service.decrement_pages_count()
            await dashboard_service.add_recent_activity(f"Page {page.page_number} deleted from chapter")
        except Exception as dashboard_error:
            print(f"⚠️ Failed to update dashboard after page deletion: {dashboard_error}")
            # Don't fail the request if dashboard update fails

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


@router.post("/batch-upload-with-auto-textboxes", response_model=BatchPageUploadResponse, status_code=status.HTTP_201_CREATED)
async def batch_upload_pages_with_auto_textboxes(
    chapter_id: str = Form(...),
    start_page_number: int = Form(...),
    files: List[UploadFile] = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service),
    text_box_service: TextBoxService = Depends(get_text_box_service),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Upload multiple pages with automatic text box creation

    This endpoint uploads multiple image files as pages and automatically
    detects text regions to create text boxes for each detected region.

    - **chapter_id**: ID of the chapter these pages belong to
    - **start_page_number**: Starting page number for the batch
    - **files**: List of image files to upload

    Returns information about successfully uploaded pages and any failures,
    along with the number of automatically created text boxes.
    """
    try:
        # Validate files
        if not files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one file is required"
            )

        # Validate file types and prepare file data
        files_data = []
        for file in files:
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File {file.filename} must be an image"
                )

            # Get file extension
            file_extension = file.filename.split('.')[-1].lower() if file.filename else 'jpg'
            if file_extension not in ['jpg', 'jpeg', 'png', 'webp']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported file format for {file.filename}. Use JPG, PNG, or WebP"
                )

            # Read file content
            file_content = await file.read()
            files_data.append((file_content, file_extension, file.filename))

        # Upload pages with auto text box creation
        result = await page_service.create_pages_batch_with_auto_textboxes(
            chapter_id, files_data, start_page_number, text_box_service
        )

        # Update chapter status and count
        await update_chapter_status_and_count(chapter_id)

        # Update dashboard statistics
        try:
            if result.pages:
                # Increment page count for each successfully uploaded page
                for _ in result.pages:
                    await dashboard_service.increment_page_count()

                await dashboard_service.add_recent_activity(
                    f"Batch uploaded {len(result.pages)} pages with auto text detection"
                )
        except Exception as dashboard_error:
            print(f"⚠️ Failed to update dashboard after batch upload: {dashboard_error}")
            # Don't fail the request if dashboard update fails

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in batch_upload_pages_with_auto_textboxes endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload pages with auto text boxes: {str(e)}"
        )



