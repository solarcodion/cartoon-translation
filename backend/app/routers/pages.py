from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, UploadFile, File, Form
from typing import List, Dict, Any, Optional
import base64
import asyncio
import httpx
from supabase import Client

from app.database import get_supabase
from app.auth import get_current_user
from app.services.page_service import PageService
# Optional imports for text box and OCR functionality
try:
    from app.services.text_box_service import TextBoxService
    TEXT_BOX_SERVICE_AVAILABLE = True
except ImportError:
    TEXT_BOX_SERVICE_AVAILABLE = False
    print("Warning: TextBoxService not available")

try:
    from app.services.ocr_service import OCRService
    OCR_SERVICE_AVAILABLE = True
except ImportError:
    OCR_SERVICE_AVAILABLE = False
    print("Warning: OCRService not available")
from app.models import (
    PageResponse,
    PageCreate,
    PageUpdate,
    BatchPageUploadResponse,
    ApiResponse,
    OCRRequest
)

router = APIRouter(prefix="/pages", tags=["pages"])


def get_page_service(supabase: Client = Depends(get_supabase)) -> PageService:
    """Dependency to get page service"""
    return PageService(supabase)


def get_text_box_service(supabase: Client = Depends(get_supabase)):
    """Dependency to get text box service"""
    if not TEXT_BOX_SERVICE_AVAILABLE:
        return None
    return TextBoxService(supabase)


# Global OCR service instance (initialized once)
ocr_service = None


def get_ocr_service():
    """Dependency to get OCR service (singleton pattern)"""
    if not OCR_SERVICE_AVAILABLE:
        return None
    global ocr_service
    if ocr_service is None:
        ocr_service = OCRService()
    return ocr_service


@router.post("/chapter/{chapter_id}", response_model=PageResponse, status_code=status.HTTP_201_CREATED)
async def create_page(
    chapter_id: str = Path(..., description="Chapter ID"),
    file: UploadFile = File(..., description="Image file to upload"),
    page_number: int = Form(..., description="Page number"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service)
):
    """
    Create a new page for a specific chapter
    
    - **chapter_id**: ID of the chapter to add the page to
    - **file**: Image file to upload
    - **page_number**: Page number for the new page
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed"
            )

        # Read file data
        file_data = await file.read()
        file_extension = page_service._get_file_extension(file.filename or "image.jpg")
        
        # Get image dimensions
        width, height = page_service._get_image_dimensions(file_data)

        # Create page data
        page_data = PageCreate(
            chapter_id=chapter_id,
            page_number=page_number,
            file_name=file.filename or f"page_{page_number}.{file_extension}",
            width=width,
            height=height
        )

        # Create the page
        page = await page_service.create_page(page_data, file_data, file_extension)
        return page

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in create_page endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create page: {str(e)}"
        )


@router.post("/chapter/{chapter_id}/batch", response_model=BatchPageUploadResponse, status_code=status.HTTP_201_CREATED)
async def batch_create_pages(
    chapter_id: str = Path(..., description="Chapter ID"),
    files: List[UploadFile] = File(..., description="Image files to upload"),
    start_page_number: int = Form(..., description="Starting page number"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service)
):
    """
    Create multiple pages for a specific chapter in batch
    
    - **chapter_id**: ID of the chapter to add pages to
    - **files**: List of image files to upload
    - **start_page_number**: Starting page number for the batch
    """
    try:
        if not files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one file is required"
            )

        # Process all files
        files_data = []
        for file in files:
            # Validate file type
            if not file.content_type or not file.content_type.startswith("image/"):
                print(f"⚠️ Skipping non-image file: {file.filename}")
                continue

            # Read file data
            file_data = await file.read()
            file_extension = page_service._get_file_extension(file.filename or "image.jpg")
            
            # Get image dimensions
            width, height = page_service._get_image_dimensions(file_data)

            files_data.append({
                "data": file_data,
                "extension": file_extension,
                "original_name": file.filename or f"page.{file_extension}",
                "width": width,
                "height": height
            })

        if not files_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid image files found"
            )

        # Create pages in batch
        result = await page_service.batch_create_pages(chapter_id, files_data, start_page_number)
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in batch_create_pages endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create pages: {str(e)}"
        )


@router.post("/chapter/{chapter_id}/batch-with-auto-textboxes", response_model=BatchPageUploadResponse, status_code=status.HTTP_201_CREATED)
async def batch_create_pages_with_auto_textboxes(
    chapter_id: str = Path(..., description="Chapter ID"),
    files: List[UploadFile] = File(..., description="Image files to upload"),
    start_page_number: int = Form(..., description="Starting page number"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service),
    text_box_service = Depends(get_text_box_service),
    ocr_service = Depends(get_ocr_service)
):
    """
    Create multiple pages for a specific chapter in batch with automatic text box creation
    
    - **chapter_id**: ID of the chapter to add pages to
    - **files**: List of image files to upload
    - **start_page_number**: Starting page number for the batch
    
    This endpoint creates pages and automatically detects text regions to create text boxes.
    """
    try:
        if not files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one file is required"
            )

        # First, create pages normally
        result = await batch_create_pages(chapter_id, files, start_page_number, current_user, page_service)

        if not result.success or not result.pages:
            return result

        # Check if OCR and text box services are available
        if not OCR_SERVICE_AVAILABLE or not TEXT_BOX_SERVICE_AVAILABLE:
            print("⚠️ Warning: OCR or TextBox services not available. Skipping automatic text detection.")
            return result

        # Process each created page for text detection in background
        async def process_page_text_detection(page: PageResponse):
            try:
                print(f"🔍 Processing text detection for page {page.id} (page number {page.page_number})")

                # 1. Fetch image from storage
                async with httpx.AsyncClient() as client:
                    response = await client.get(page.file_path)
                    if response.status_code != 200:
                        raise Exception(f"Failed to fetch image: HTTP {response.status_code}")

                    image_data = response.content

                # 2. Convert to base64
                image_base64 = base64.b64encode(image_data).decode('utf-8')

                # 3. Call OCR service to detect text regions
                ocr_request = OCRRequest(image_data=image_base64)
                detection_result = ocr_service.detect_text_regions(ocr_request.image_data)

                if not detection_result.success:
                    print(f"⚠️ OCR detection failed for page {page.id}")
                    return

                print(f"✅ Detected {len(detection_result.text_regions)} text regions for page {page.id}")

                # 4. Create text boxes from detected regions
                if text_box_service and len(detection_result.text_regions) > 0:
                    created_text_boxes = await text_box_service.create_text_boxes_from_detection(
                        page.id, detection_result, page.file_path
                    )
                    print(f"✅ Created {len(created_text_boxes)} text boxes for page {page.id}")

            except Exception as e:
                print(f"❌ Error processing text detection for page {page.id}: {str(e)}")

        # Start background tasks for text detection
        if ocr_service and text_box_service:
            for page in result.pages:
                asyncio.create_task(process_page_text_detection(page))

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in batch_create_pages_with_auto_textboxes endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create pages with auto text boxes: {str(e)}"
        )


@router.get("/chapter/{chapter_id}", response_model=List[PageResponse])
async def get_pages_by_chapter(
    chapter_id: str = Path(..., description="Chapter ID"),
    skip: int = Query(0, ge=0, description="Number of pages to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of pages to return"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service)
):
    """
    Get all pages for a specific chapter with pagination
    
    - **chapter_id**: ID of the chapter
    - **skip**: Number of pages to skip (for pagination)
    - **limit**: Maximum number of pages to return
    """
    try:
        pages = await page_service.get_pages_by_chapter(chapter_id, skip, limit)
        return pages

    except Exception as e:
        print(f"❌ Error in get_pages_by_chapter endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pages: {str(e)}"
        )


@router.get("/chapter/{chapter_id}/count", response_model=Dict[str, int])
async def get_page_count_by_chapter(
    chapter_id: str = Path(..., description="Chapter ID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    page_service: PageService = Depends(get_page_service)
):
    """
    Get total count of pages for a specific chapter
    
    - **chapter_id**: ID of the chapter
    """
    try:
        count = await page_service.get_page_count_by_chapter(chapter_id)
        return {"count": count}

    except Exception as e:
        print(f"❌ Error in get_page_count_by_chapter endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get page count: {str(e)}"
        )


@router.get("/{page_id}", response_model=PageResponse)
async def get_page_by_id(
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
        return page

    except Exception as e:
        print(f"❌ Error in get_page_by_id endpoint: {str(e)}")
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
    Update an existing page
    
    - **page_id**: ID of the page to update
    - **page_data**: Updated page data
    """
    try:
        page = await page_service.update_page(page_id, page_data)
        return page

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
    Delete a page and its associated file
    
    - **page_id**: ID of the page to delete
    """
    try:
        await page_service.delete_page(page_id)
        return ApiResponse(
            success=True,
            message="Page deleted successfully"
        )

    except Exception as e:
        print(f"❌ Error in delete_page endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete page: {str(e)}"
        )
