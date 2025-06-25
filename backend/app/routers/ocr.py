from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from app.auth import get_current_user
from app.services.ocr_service import OCRService
from app.models import OCRRequest, OCRResponse, ApiResponse

router = APIRouter(prefix="/ocr", tags=["ocr"])

# Global OCR service instance (initialized once)
ocr_service = None


def get_ocr_service() -> OCRService:
    """Dependency to get OCR service (singleton pattern)"""
    global ocr_service
    if ocr_service is None:
        print("🚀 Initializing OCR service...")
        ocr_service = OCRService()
        print("✅ OCR service initialized successfully")
    return ocr_service


@router.post("/extract-text", response_model=OCRResponse, status_code=status.HTTP_200_OK)
async def extract_text_from_image(
    request: OCRRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    ocr_service: OCRService = Depends(get_ocr_service)
):
    """
    Extract text from a base64 encoded image using OCR
    
    This endpoint accepts a base64 encoded image and returns the extracted text
    using EasyOCR. The image should be cropped to the text region for best results.
    
    - **image_data**: Base64 encoded image data (with or without data URL prefix)
    
    Returns:
    - **success**: Whether the OCR operation was successful
    - **text**: Extracted text from the image
    - **confidence**: Average confidence score of the OCR results
    - **processing_time**: Time taken to process the image in seconds
    """
    try:
        print(f"🔍 OCR request from user {current_user.get('user_id')}")
        
        if not request.image_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image data is required"
            )
        
        # Validate base64 data
        if len(request.image_data) < 100:  # Minimum reasonable size for base64 image
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or too small image data"
            )
        
        print(f"📊 Processing image data of length: {len(request.image_data)}")
        
        # Process the image with OCR
        result = ocr_service.process_image(request.image_data)
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process image with OCR"
            )
        
        print(f"✅ OCR completed successfully")
        print(f"📝 Extracted text: '{result.text}'")
        print(f"🎯 Confidence: {result.confidence:.2f}")
        print(f"⏱️ Processing time: {result.processing_time:.2f}s")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in extract_text_from_image endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract text from image: {str(e)}"
        )


@router.post("/extract-text-enhanced", response_model=OCRResponse, status_code=status.HTTP_200_OK)
async def extract_text_from_image_enhanced(
    request: OCRRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    ocr_service: OCRService = Depends(get_ocr_service)
):
    """
    Extract text from a base64 encoded image using enhanced OCR with preprocessing
    
    This endpoint uses image preprocessing techniques to improve OCR accuracy.
    It processes both the original and preprocessed images and returns the best results.
    
    - **image_data**: Base64 encoded image data (with or without data URL prefix)
    
    Returns:
    - **success**: Whether the OCR operation was successful
    - **text**: Extracted text from the image
    - **confidence**: Average confidence score of the OCR results
    - **processing_time**: Time taken to process the image in seconds
    """
    try:
        print(f"🔍 Enhanced OCR request from user {current_user.get('user_id')}")
        
        if not request.image_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image data is required"
            )
        
        # Validate base64 data
        if len(request.image_data) < 100:  # Minimum reasonable size for base64 image
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or too small image data"
            )
        
        print(f"📊 Processing image data with enhancement of length: {len(request.image_data)}")
        
        # Process the image with enhanced OCR
        result = ocr_service.process_image_with_preprocessing(request.image_data)
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process image with enhanced OCR"
            )
        
        print(f"✅ Enhanced OCR completed successfully")
        print(f"📝 Extracted text: '{result.text}'")
        print(f"🎯 Confidence: {result.confidence:.2f}")
        print(f"⏱️ Processing time: {result.processing_time:.2f}s")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in extract_text_from_image_enhanced endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract text from image with enhancement: {str(e)}"
        )


@router.get("/health", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def ocr_health_check(
    current_user: Dict[str, Any] = Depends(get_current_user),
    ocr_service: OCRService = Depends(get_ocr_service)
):
    """
    Health check endpoint for OCR service
    
    Returns the status of the OCR service and whether it's ready to process images.
    """
    try:
        # Simple health check - verify OCR service is initialized
        if ocr_service and ocr_service.reader:
            return ApiResponse(
                success=True,
                message="OCR service is healthy and ready",
                data={
                    "service": "EasyOCR",
                    "languages": ["en"],
                    "status": "ready"
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OCR service is not properly initialized"
            )
            
    except Exception as e:
        print(f"❌ Error in OCR health check: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"OCR service health check failed: {str(e)}"
        )
