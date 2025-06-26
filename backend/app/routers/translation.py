from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from app.auth import get_current_user
from app.services.translation_service import TranslationService
from app.models import (
    TranslationRequest,
    TranslationResponse,
    EnhancedTranslationRequest,
    ApiResponse
)

router = APIRouter(prefix="/translation", tags=["translation"])


def get_translation_service() -> TranslationService:
    """Dependency to get translation service"""
    return TranslationService()


@router.post("/translate", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def translate_text(
    request: TranslationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    translation_service: TranslationService = Depends(get_translation_service)
):
    """
    Translate text using OpenAI GPT
    
    This endpoint translates the provided text to the target language using OpenAI's GPT model.
    If no target language is specified, it uses the default configured language.
    """
    try:
        # Validate input
        if not request.source_text or not request.source_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Source text cannot be empty"
            )
        
        # Perform translation
        result = await translation_service.translate_text(
            source_text=request.source_text,
            target_language=request.target_language,
            context=request.context
        )
        
        if result["success"]:
            return ApiResponse(
                success=True,
                message="Text translated successfully",
                data=TranslationResponse(**result)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Translation failed"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Translation endpoint error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation failed: {str(e)}"
        )


@router.post("/translate-enhanced", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def translate_text_enhanced(
    request: EnhancedTranslationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    translation_service: TranslationService = Depends(get_translation_service)
):
    """
    Translate text with enhanced context (series info, character names)
    
    This endpoint provides enhanced translation with series-specific context
    and character name preservation for better manga/manhwa translations.
    """
    try:
        # Validate input
        if not request.source_text or not request.source_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Source text cannot be empty"
            )
        
        # Perform enhanced translation
        result = await translation_service.translate_with_memory(
            source_text=request.source_text,
            series_context=request.series_context,
            character_names=request.character_names,
            target_language=request.target_language
        )
        
        if result["success"]:
            return ApiResponse(
                success=True,
                message="Enhanced text translation completed successfully",
                data=TranslationResponse(**result)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Enhanced translation failed"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Enhanced translation endpoint error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Enhanced translation failed: {str(e)}"
        )


@router.get("/languages", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def get_supported_languages(
    current_user: Dict[str, Any] = Depends(get_current_user),
    translation_service: TranslationService = Depends(get_translation_service)
):
    """
    Get list of supported target languages
    
    Returns a list of languages that the translation service supports.
    """
    try:
        languages = translation_service.get_supported_languages()
        
        return ApiResponse(
            success=True,
            message="Supported languages retrieved successfully",
            data={
                "languages": languages,
                "default_language": translation_service.target_language
            }
        )
        
    except Exception as e:
        print(f"❌ Get languages endpoint error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get supported languages: {str(e)}"
        )


@router.get("/health", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def translation_health_check(
    current_user: Dict[str, Any] = Depends(get_current_user),
    translation_service: TranslationService = Depends(get_translation_service)
):
    """
    Health check endpoint for translation service
    
    Returns the status of the translation service and whether it's ready to translate text.
    """
    try:
        health_status = await translation_service.health_check()
        
        if health_status["status"] == "healthy":
            return ApiResponse(
                success=True,
                message="Translation service is healthy and ready",
                data=health_status
            )
        else:
            return ApiResponse(
                success=False,
                message="Translation service is not healthy",
                data=health_status
            )
            
    except Exception as e:
        print(f"❌ Translation health check error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Translation service health check failed: {str(e)}"
        )


@router.post("/quick-translate", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def quick_translate(
    request: dict,
    current_user: Dict[str, Any] = Depends(get_current_user),
    translation_service: TranslationService = Depends(get_translation_service)
):
    """
    Quick translation endpoint for simple text translation
    
    Simplified endpoint that accepts just text and returns translation.
    Uses default target language and no additional context.
    """
    try:
        # Extract text from request
        source_text = request.get("text", "").strip()
        
        if not source_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text field is required and cannot be empty"
            )
        
        # Perform quick translation
        result = await translation_service.translate_text(
            source_text=source_text,
            target_language=None,  # Use default
            context=None
        )
        
        if result["success"]:
            return ApiResponse(
                success=True,
                message="Quick translation completed successfully",
                data={
                    "original_text": source_text,
                    "translated_text": result["translated_text"],
                    "target_language": result["target_language"],
                    "processing_time": result["processing_time"]
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Quick translation failed"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Quick translation endpoint error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quick translation failed: {str(e)}"
        )
