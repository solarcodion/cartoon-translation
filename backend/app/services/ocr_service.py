import base64
import io
import time
from typing import Optional
import easyocr
import cv2
import numpy as np
from PIL import Image

from app.models import OCRResponse, OCRWithTranslationResponse
from app.services.translation_service import TranslationService

# Handle PIL compatibility for different versions
try:
    # For newer versions of Pillow (10.0.0+)
    from PIL import Image
    ANTIALIAS = Image.Resampling.LANCZOS
except AttributeError:
    # For older versions of Pillow
    ANTIALIAS = Image.ANTIALIAS


class OCRService:
    """Service for OCR operations using EasyOCR"""

    def __init__(self):
        """Initialize OCR service with EasyOCR reader"""
        # Initialize EasyOCR reader for Vietnamese
        # Using GPU if available, fallback to CPU
        try:
            # Fix PIL compatibility issue
            self._fix_pil_compatibility()
            self.reader = easyocr.Reader(['vi'], gpu=True)
        except Exception as e:
            print(f"⚠️ GPU not available, falling back to CPU: {str(e)}")
            try:
                self.reader = easyocr.Reader(['vi'], gpu=False)
            except Exception as cpu_error:
                print(f"❌ Failed to initialize EasyOCR: {str(cpu_error)}")
                raise Exception(f"OCR initialization failed: {str(cpu_error)}")

        # Initialize translation service for Vietnamese to English translation
        self.translation_service = TranslationService()

    def _fix_pil_compatibility(self):
        """Fix PIL compatibility issues with newer versions"""
        try:
            # Check if ANTIALIAS exists, if not, add it for backward compatibility
            if not hasattr(Image, 'ANTIALIAS'):
                Image.ANTIALIAS = Image.Resampling.LANCZOS
        except Exception as e:
            print(f"⚠️ PIL compatibility fix failed: {str(e)}")
            # Continue anyway, might not be needed
    
    def process_image(self, image_data: str) -> OCRResponse:
        """
        Process base64 image data and extract text using OCR
        
        Args:
            image_data: Base64 encoded image data (with or without data URL prefix)
            
        Returns:
            OCRResponse with extracted text and metadata
        """
        try:
            start_time = time.time()
            
            # Clean base64 data (remove data URL prefix if present)
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            
            # Convert to PIL Image
            try:
                pil_image = Image.open(io.BytesIO(image_bytes))
                # Convert PIL image to OpenCV format (numpy array)
                opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            except Exception as img_error:
                print(f"❌ Error processing image: {str(img_error)}")
                raise Exception(f"Image processing failed: {str(img_error)}")
            
            # Perform OCR using EasyOCR
            results = self.reader.readtext(opencv_image)
            
            # Extract text and calculate average confidence
            extracted_texts = []
            confidences = []
            
            for (bbox, text, confidence) in results:
                if confidence > 0.3:  # Filter out low-confidence results
                    extracted_texts.append(text.strip())
                    confidences.append(confidence)
            
            # Combine all extracted text
            combined_text = ' '.join(extracted_texts)
            
            # Calculate average confidence
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            processing_time = time.time() - start_time
            
            return OCRResponse(
                success=True,
                text=combined_text,
                confidence=avg_confidence,
                processing_time=processing_time
            )
            
        except Exception as e:
            print(f"❌ Error in OCR processing: {str(e)}")
            return OCRResponse(
                success=False,
                text="",
                confidence=0.0,
                processing_time=0.0
            )
    
    def preprocess_image(self, opencv_image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for better OCR results
        
        Args:
            opencv_image: OpenCV image array
            
        Returns:
            Preprocessed image array
        """
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (3, 3), 0)
            
            # Apply adaptive thresholding for better text contrast
            thresh = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            
            # Apply morphological operations to clean up the image
            kernel = np.ones((1, 1), np.uint8)
            processed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            
            return processed
            
        except Exception as e:
            print(f"⚠️ Error in image preprocessing: {str(e)}")
            return opencv_image
    
    def process_image_with_preprocessing(self, image_data: str) -> OCRResponse:
        """
        Process image with preprocessing for better OCR results
        
        Args:
            image_data: Base64 encoded image data
            
        Returns:
            OCRResponse with extracted text and metadata
        """
        try:
            start_time = time.time()
            
            # Clean base64 data
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            
            # Convert to PIL Image
            pil_image = Image.open(io.BytesIO(image_bytes))
            
            # Convert PIL image to OpenCV format
            opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            # Preprocess image
            processed_image = self.preprocess_image(opencv_image)
            
            # Perform OCR on both original and preprocessed images
            original_results = self.reader.readtext(opencv_image)
            processed_results = self.reader.readtext(processed_image)
            
            # Choose the best results based on confidence
            best_results = self._choose_best_results(original_results, processed_results)
            
            # Extract text and calculate average confidence
            extracted_texts = []
            confidences = []
            
            for (bbox, text, confidence) in best_results:
                if confidence > 0.3:  # Filter out low-confidence results
                    extracted_texts.append(text.strip())
                    confidences.append(confidence)
            
            # Combine all extracted text
            combined_text = ' '.join(extracted_texts)
            
            # Calculate average confidence
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            processing_time = time.time() - start_time
            
            return OCRResponse(
                success=True,
                text=combined_text,
                confidence=avg_confidence,
                processing_time=processing_time
            )
            
        except Exception as e:
            print(f"❌ Error in OCR processing with preprocessing: {str(e)}")
            return OCRResponse(
                success=False,
                text="",
                confidence=0.0,
                processing_time=0.0
            )
    
    def _choose_best_results(self, original_results, processed_results):
        """
        Choose the best OCR results between original and preprocessed images
        
        Args:
            original_results: OCR results from original image
            processed_results: OCR results from preprocessed image
            
        Returns:
            Best OCR results
        """
        # Calculate average confidence for both results
        orig_confidence = sum([conf for _, _, conf in original_results]) / len(original_results) if original_results else 0
        proc_confidence = sum([conf for _, _, conf in processed_results]) / len(processed_results) if processed_results else 0
        
        # Return results with higher average confidence
        if orig_confidence >= proc_confidence:
            return original_results
        else:
            return processed_results

    async def process_image_with_translation(self, image_data: str) -> OCRWithTranslationResponse:
        """
        Process image with OCR (Vietnamese) and translate to English

        Args:
            image_data: Base64 encoded image data

        Returns:
            OCRWithTranslationResponse with Vietnamese text and English translation
        """
        try:
            start_time = time.time()

            # First, perform OCR to extract Vietnamese text
            ocr_result = self.process_image(image_data)

            if not ocr_result.success or not ocr_result.text.strip():
                return OCRWithTranslationResponse(
                    success=False,
                    original_text="",
                    translated_text="",
                    confidence=0.0,
                    processing_time=ocr_result.processing_time,
                    translation_time=0.0,
                    total_time=time.time() - start_time
                )

            # Translate Vietnamese text to English
            translation_start = time.time()
            translation_result = await self.translation_service.translate_text(
                source_text=ocr_result.text,
                target_language="English",
                context="This is text extracted from a Vietnamese comic/manhwa image."
            )
            translation_time = time.time() - translation_start

            total_time = time.time() - start_time

            if translation_result["success"]:
                return OCRWithTranslationResponse(
                    success=True,
                    original_text=ocr_result.text,
                    translated_text=translation_result["translated_text"],
                    confidence=ocr_result.confidence,
                    processing_time=ocr_result.processing_time,
                    translation_time=translation_time,
                    total_time=total_time
                )
            else:
                # If translation fails, return OCR result with empty translation
                return OCRWithTranslationResponse(
                    success=True,
                    original_text=ocr_result.text,
                    translated_text="[Translation failed]",
                    confidence=ocr_result.confidence,
                    processing_time=ocr_result.processing_time,
                    translation_time=translation_time,
                    total_time=total_time
                )

        except Exception as e:
            print(f"❌ Error in OCR with translation: {str(e)}")
            return OCRWithTranslationResponse(
                success=False,
                original_text="",
                translated_text="",
                confidence=0.0,
                processing_time=0.0,
                translation_time=0.0,
                total_time=time.time() - start_time
            )

    async def process_image_with_preprocessing_and_translation(self, image_data: str) -> OCRWithTranslationResponse:
        """
        Process image with enhanced OCR (preprocessing + Vietnamese) and translate to English

        Args:
            image_data: Base64 encoded image data

        Returns:
            OCRWithTranslationResponse with Vietnamese text and English translation
        """
        try:
            start_time = time.time()

            # First, perform enhanced OCR to extract Vietnamese text
            ocr_result = self.process_image_with_preprocessing(image_data)

            if not ocr_result.success or not ocr_result.text.strip():
                return OCRWithTranslationResponse(
                    success=False,
                    original_text="",
                    translated_text="",
                    confidence=0.0,
                    processing_time=ocr_result.processing_time,
                    translation_time=0.0,
                    total_time=time.time() - start_time
                )

            # Translate Vietnamese text to English
            translation_start = time.time()
            translation_result = await self.translation_service.translate_text(
                source_text=ocr_result.text,
                target_language="English",
                context="This is text extracted from a Vietnamese comic/manhwa image using enhanced OCR preprocessing."
            )
            translation_time = time.time() - translation_start

            total_time = time.time() - start_time

            if translation_result["success"]:
                return OCRWithTranslationResponse(
                    success=True,
                    original_text=ocr_result.text,
                    translated_text=translation_result["translated_text"],
                    confidence=ocr_result.confidence,
                    processing_time=ocr_result.processing_time,
                    translation_time=translation_time,
                    total_time=total_time
                )
            else:
                # If translation fails, return OCR result with empty translation
                return OCRWithTranslationResponse(
                    success=True,
                    original_text=ocr_result.text,
                    translated_text="[Translation failed]",
                    confidence=ocr_result.confidence,
                    processing_time=ocr_result.processing_time,
                    translation_time=translation_time,
                    total_time=total_time
                )

        except Exception as e:
            print(f"❌ Error in enhanced OCR with translation: {str(e)}")
            return OCRWithTranslationResponse(
                success=False,
                original_text="",
                translated_text="",
                confidence=0.0,
                processing_time=0.0,
                translation_time=0.0,
                total_time=time.time() - start_time
            )
