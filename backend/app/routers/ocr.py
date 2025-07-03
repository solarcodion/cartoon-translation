from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from app.auth import get_current_user
from app.services.ocr_service import OCRService
from app.models import OCRRequest, OCRResponse, OCRWithTranslationResponse, ApiResponse

router = APIRouter(prefix="/ocr", tags=["ocr"])

# Global OCR service instance (initialized once)
ocr_service = None


def get_ocr_service() -> OCRService:
    """Dependency to get OCR service (singleton pattern)"""
    global ocr_service
    if ocr_service is None:
        try:
            ocr_service = OCRService()
        except Exception as e:
            print(f"❌ Failed to initialize OCR service: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"OCR service initialization failed: {str(e)}"
            )
    return ocr_service


@router.post("/extract-text", response_model=OCRResponse, status_code=status.HTTP_200_OK)
async def extract_text_from_image(
    request: OCRRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    ocr_service: OCRService = Depends(get_ocr_service)
):
    """
    Extract text from a base64 encoded image using multi-language OCR

    This endpoint accepts a base64 encoded image and returns the extracted text
    using EasyOCR with support for English and Korean (with fallback support for other languages).
    The image should be cropped to the text region for best results.

    - **image_data**: Base64 encoded image data (with or without data URL prefix)

    Returns:
    - **success**: Whether the OCR operation was successful
    - **text**: Extracted text from the image
    - **confidence**: Average confidence score of the OCR results
    - **processing_time**: Time taken to process the image in seconds
    - **detected_language**: Language code detected by OCR (ko, ja, ch_sim, vi, en)
    - **language_confidence**: Confidence score of language detection
    """
    try:
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
        
        # Process the image with OCR
        result = ocr_service.process_image(request.image_data)
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process image with OCR"
            )
        
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
    Extract text from a base64 encoded image using enhanced multi-language OCR with preprocessing

    This endpoint uses image preprocessing techniques to improve OCR accuracy.
    It processes both the original and preprocessed images and returns the best results.
    Supports English and Korean (with fallback support for other languages).

    - **image_data**: Base64 encoded image data (with or without data URL prefix)
    
    Returns:
    - **success**: Whether the OCR operation was successful
    - **text**: Extracted text from the image
    - **confidence**: Average confidence score of the OCR results
    - **processing_time**: Time taken to process the image in seconds
    """
    try:
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
        
        # Process the image with enhanced OCR
        result = ocr_service.process_image_with_preprocessing(request.image_data)
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process image with enhanced OCR"
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in extract_text_from_image_enhanced endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract text from image with enhancement: {str(e)}"
        )


@router.post("/extract-text-with-translation", response_model=OCRWithTranslationResponse, status_code=status.HTTP_200_OK)
async def extract_text_with_translation(
    request: OCRRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    ocr_service: OCRService = Depends(get_ocr_service)
):
    """
    Extract text from image (multi-language) and translate to English

    This endpoint performs OCR on the image to extract text in any supported language
    (English, Korean, and other supported languages), then translates it to English using OpenAI GPT.

    - **image_data**: Base64 encoded image data (with or without data URL prefix)

    Returns both the original text and English translation, along with detected language information.
    """
    try:
        # Validate input
        if not request.image_data or not request.image_data.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image data is required and cannot be empty"
            )

        # Process the image with OCR and translation
        result = await ocr_service.process_image_with_translation(request.image_data)

        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process image with OCR and translation"
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in extract_text_with_translation endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract and translate text from image: {str(e)}"
        )


@router.post("/extract-text-enhanced-with-translation", response_model=OCRWithTranslationResponse, status_code=status.HTTP_200_OK)
async def extract_text_enhanced_with_translation(
    request: OCRRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    ocr_service: OCRService = Depends(get_ocr_service)
):
    """
    Extract text from image using enhanced multi-language OCR and translate to English

    This endpoint uses image preprocessing techniques to improve OCR accuracy,
    extracts text in any supported language (English, Korean, and other supported languages),
    then translates it to English using OpenAI GPT.

    - **image_data**: Base64 encoded image data (with or without data URL prefix)

    Returns both the original text and English translation, along with detected language information.
    """
    try:
        # Validate input
        if not request.image_data or not request.image_data.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image data is required and cannot be empty"
            )

        # Process the image with enhanced OCR and translation
        result = await ocr_service.process_image_with_preprocessing_and_translation(request.image_data)

        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process image with enhanced OCR and translation"
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in extract_text_enhanced_with_translation endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract and translate text from image with enhanced OCR: {str(e)}"
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
                message="Multi-language OCR service is healthy and ready",
                data={
                    "service": "EasyOCR",
                    "languages": ocr_service.ocr_languages,
                    "auto_detect_language": ocr_service.auto_detect_language,
                    "supported_languages": {
                        "ko": "Korean",
                        "ja": "Japanese",
                        "ch_sim": "Chinese (Simplified)",
                        "vi": "Vietnamese"
                    },
                    "translation_service": "OpenAI GPT",
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
