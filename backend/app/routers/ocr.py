from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from pydantic import BaseModel

from app.auth import get_current_user
from app.services.ocr_service import OCRService
from app.services.openai_ocr_service import OpenAIOCRService
from app.models import OCRRequest, OCRResponse, OCRWithTranslationResponse, ApiResponse, TextRegionDetectionResponse

router = APIRouter(prefix="/ocr", tags=["ocr"])

# Global OCR service instances (initialized once)
ocr_service = None
openai_ocr_service = None


class TextGroupingConfigRequest(BaseModel):
    """Request model for updating text grouping configuration with enhanced parameters"""
    max_horizontal_gap_pixels: int = None
    max_vertical_gap_pixels: int = None
    max_horizontal_gap_multiplier: float = None
    max_vertical_gap_multiplier: float = None
    same_line_vertical_threshold: float = None
    same_line_horizontal_gap_multiplier: float = None
    vertical_stack_horizontal_threshold: float = None
    vertical_stack_gap_multiplier: float = None
    nearby_vertical_threshold: float = None
    nearby_horizontal_threshold: float = None
    nearby_gap_multiplier: float = None
    # New enhanced parameters for improved accuracy
    min_text_box_area: int = None
    min_text_length: int = None
    confidence_boost_threshold: float = None

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


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


def get_openai_ocr_service() -> OpenAIOCRService:
    """Dependency to get OpenAI OCR service (singleton pattern)"""
    global openai_ocr_service
    if openai_ocr_service is None:
        try:
            openai_ocr_service = OpenAIOCRService()
        except Exception as e:
            print(f"❌ Failed to initialize OpenAI OCR service: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"OpenAI OCR service initialization failed: {str(e)}"
            )
    return openai_ocr_service


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


@router.post("/detect-text-regions", response_model=TextRegionDetectionResponse, status_code=status.HTTP_200_OK)
async def detect_text_regions(
    request: OCRRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    ocr_service: OCRService = Depends(get_ocr_service)
):
    """
    Detect text regions in an image and return bounding boxes with extracted text

    This endpoint analyzes an image to detect all text regions and returns
    their bounding boxes along with the extracted text for each region.
    This is useful for automatically creating text boxes for translation.

    - **image_data**: Base64 encoded image data (with or without data URL prefix)

    Returns a list of text regions with their coordinates and extracted text.
    """
    try:
        # Validate input
        if not request.image_data or not request.image_data.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image data is required and cannot be empty"
            )

        # Detect text regions
        result = ocr_service.detect_text_regions(request.image_data)

        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to detect text regions in image"
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in detect_text_regions endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text region detection failed: {str(e)}"
        )


@router.get("/text-grouping-config", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def get_text_grouping_config(
    current_user: Dict[str, Any] = Depends(get_current_user),
    ocr_service: OCRService = Depends(get_ocr_service)
):
    """
    Get current text grouping configuration for distance-based separation

    Returns the current configuration parameters that control how OCR text
    regions are grouped together based on spatial proximity.
    """
    try:
        config = ocr_service.get_text_grouping_config()

        return ApiResponse(
            success=True,
            message="Text grouping configuration retrieved successfully",
            data={
                "config": config,
                "description": {
                    "max_horizontal_gap_pixels": "Minimum pixel distance for horizontal separation",
                    "max_vertical_gap_pixels": "Minimum pixel distance for vertical separation",
                    "max_horizontal_gap_multiplier": "Multiplier for horizontal gap relative to text width",
                    "max_vertical_gap_multiplier": "Multiplier for vertical gap relative to text height",
                    "same_line_vertical_threshold": "Threshold for detecting same-line text",
                    "same_line_horizontal_gap_multiplier": "Horizontal gap multiplier for same-line text",
                    "vertical_stack_horizontal_threshold": "Threshold for detecting vertically stacked text",
                    "vertical_stack_gap_multiplier": "Gap multiplier for vertically stacked text",
                    "nearby_vertical_threshold": "Threshold for nearby text detection",
                    "nearby_horizontal_threshold": "Threshold for nearby text detection",
                    "nearby_gap_multiplier": "Gap multiplier for nearby text"
                }
            }
        )

    except Exception as e:
        print(f"❌ Error getting text grouping config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get text grouping configuration: {str(e)}"
        )


@router.post("/text-grouping-config", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def update_text_grouping_config(
    request: TextGroupingConfigRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    ocr_service: OCRService = Depends(get_ocr_service)
):
    """
    Update text grouping configuration for improved distance-based separation

    This endpoint allows you to configure how OCR text regions are grouped together.
    Lower values result in more aggressive separation (more individual text boxes),
    while higher values result in more grouping (fewer, larger text boxes).

    Use this to fine-tune text separation based on your specific manga/comic layout needs.
    """
    try:
        # Convert request to dict, excluding None values
        config_updates = {k: v for k, v in request.model_dump().items() if v is not None}

        if not config_updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one configuration parameter must be provided"
            )

        # Update the configuration
        ocr_service.configure_text_grouping(**config_updates)

        # Get the updated configuration
        updated_config = ocr_service.get_text_grouping_config()

        return ApiResponse(
            success=True,
            message=f"Text grouping configuration updated successfully. {len(config_updates)} parameters changed.",
            data={
                "updated_parameters": config_updates,
                "current_config": updated_config
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating text grouping config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update text grouping configuration: {str(e)}"
        )


@router.post("/text-grouping-config/reset", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def reset_text_grouping_config(
    current_user: Dict[str, Any] = Depends(get_current_user),
    ocr_service: OCRService = Depends(get_ocr_service)
):
    """
    Reset text grouping configuration to optimized defaults for improved accuracy

    This endpoint resets all text grouping parameters to the enhanced default values
    that provide better context separation and accuracy for manga/comic text detection.
    """
    try:
        # Reset to optimized defaults
        ocr_service.reset_grouping_config()

        # Get the reset configuration
        reset_config = ocr_service.get_text_grouping_config()

        return ApiResponse(
            success=True,
            message="Text grouping configuration reset to optimized defaults successfully.",
            data={
                "reset_config": reset_config,
                "improvements": [
                    "Reduced distance thresholds for better context separation",
                    "Enhanced filtering to capture more relevant content",
                    "More restrictive grouping for improved accuracy",
                    "Optimized for manga/comic text patterns"
                ]
            }
        )

    except Exception as e:
        print(f"❌ Error resetting text grouping config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset text grouping configuration: {str(e)}"
        )


@router.get("/text-grouping-config", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def get_text_grouping_config(
    current_user: Dict[str, Any] = Depends(get_current_user),
    ocr_service: OCRService = Depends(get_ocr_service)
):
    """
    Get current text grouping configuration

    Returns the current text grouping parameters used for OCR context separation.
    """
    try:
        current_config = ocr_service.get_text_grouping_config()

        return ApiResponse(
            success=True,
            message="Text grouping configuration retrieved successfully.",
            data={
                "current_config": current_config,
                "description": {
                    "max_horizontal_gap_pixels": "Maximum horizontal gap in pixels before separating text",
                    "max_vertical_gap_pixels": "Maximum vertical gap in pixels before separating text",
                    "max_horizontal_gap_multiplier": "Horizontal gap multiplier relative to text width",
                    "max_vertical_gap_multiplier": "Vertical gap multiplier relative to text height",
                    "same_line_vertical_threshold": "Threshold for detecting same-line text",
                    "nearby_vertical_threshold": "Threshold for nearby text detection",
                    "min_text_box_area": "Minimum text box area to consider",
                    "confidence_boost_threshold": "Confidence threshold for boosting inclusion"
                }
            }
        )

    except Exception as e:
        print(f"❌ Error getting text grouping config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get text grouping configuration: {str(e)}"
        )


# OpenAI OCR Endpoints

@router.post("/openai/extract-text", response_model=OCRResponse, status_code=status.HTTP_200_OK)
async def extract_text_with_openai(
    request: OCRRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    openai_ocr_service: OpenAIOCRService = Depends(get_openai_ocr_service)
):
    """
    Extract text from a base64 encoded image using OpenAI Vision API

    This endpoint uses OpenAI's latest vision model (GPT-4o) for high-accuracy text extraction
    from manhwa panels. It's optimized for professional comic localization workflows.

    - **image_data**: Base64 encoded image data (with or without data URL prefix)

    Returns extracted text with confidence scores and processing metadata.
    """
    try:
        print(f"🔍 OpenAI OCR request from user: {current_user.get('email', 'unknown')}")

        if not request.image_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image data is required"
            )

        # Extract text using OpenAI Vision
        result = await openai_ocr_service.extract_text_from_image(request.image_data)

        if result.success:
            print(f"✅ OpenAI OCR successful - extracted {len(result.text)} characters in {result.processing_time:.2f}s")
        else:
            print(f"❌ OpenAI OCR failed")

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in OpenAI OCR endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OpenAI OCR processing failed: {str(e)}"
        )


@router.post("/openai/detect-text-regions", response_model=TextRegionDetectionResponse, status_code=status.HTTP_200_OK)
async def detect_text_regions_with_openai(
    request: OCRRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    openai_ocr_service: OpenAIOCRService = Depends(get_openai_ocr_service)
):
    """
    Detect text regions in an image using OpenAI Vision API

    This endpoint analyzes a manhwa panel to detect all text regions and returns
    their bounding boxes along with the extracted text for each region.
    Uses OpenAI's vision model for superior accuracy in text region detection.

    - **image_data**: Base64 encoded image data (with or without data URL prefix)

    Returns detected text regions with bounding boxes and extracted text.
    """
    try:
        print(f"🔍 OpenAI text region detection request from user: {current_user.get('email', 'unknown')}")

        if not request.image_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image data is required"
            )

        # Detect text regions using OpenAI Vision
        result = await openai_ocr_service.detect_text_regions(request.image_data)

        if result.success:
            print(f"✅ OpenAI text region detection successful - found {len(result.text_regions)} regions in {result.processing_time:.2f}s")
        else:
            print(f"❌ OpenAI text region detection failed")

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in OpenAI text region detection endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OpenAI text region detection failed: {str(e)}"
        )
