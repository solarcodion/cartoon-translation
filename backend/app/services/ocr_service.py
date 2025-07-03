import base64
import io
import time
import easyocr
import cv2
import numpy as np
from PIL import Image

from app.models import OCRResponse, OCRWithTranslationResponse
from app.services.translation_service import TranslationService
from app.config import settings

# Handle PIL compatibility for different versions
try:
    # For newer versions of Pillow (10.0.0+)
    from PIL import Image
    ANTIALIAS = Image.Resampling.LANCZOS
except AttributeError:
    # For older versions of Pillow
    ANTIALIAS = Image.ANTIALIAS


class OCRService:
    def __init__(self):
        self._fix_pil_compatibility()

        self.ocr_languages = settings.ocr_languages
        self.auto_detect_language = settings.ocr_auto_detect_language

        self.reader = None
        self.specialized_readers = {}
        self._initialize_reader()

        self.translation_service = TranslationService()

        self.language_names = {
            'ko': 'Korean',
            'ja': 'Japanese',
            'ch_sim': 'Chinese (Simplified)',
            'ch_tra': 'Chinese (Traditional)',
            'zh': 'Chinese',
            'vi': 'Vietnamese',
            'en': 'English'
        }

    def _initialize_reader(self):
        compatible_combinations = [
            self.ocr_languages,
            settings.ocr_language_korean,
            settings.ocr_language_japanese,
            settings.ocr_language_chinese,
            settings.ocr_language_vietnamese,
            settings.ocr_language_english
        ]

        for i, lang_combo in enumerate(compatible_combinations):
            try:
                self.reader = easyocr.Reader(lang_combo, gpu=False, verbose=False)
                self.ocr_languages = lang_combo
                return

            except Exception as e:
                print(f"Failed with {', '.join(lang_combo)}: {str(e)}")
                continue

        raise Exception("OCR initialization failed: Unable to initialize EasyOCR with any language combination")

    def _get_specialized_reader(self, target_languages: list) -> 'easyocr.Reader':
        cache_key = ','.join(sorted(target_languages))

        if cache_key in self.specialized_readers:
            return self.specialized_readers[cache_key]

        try:
            if 'en' not in target_languages:
                target_languages = target_languages + ['en']

            reader = easyocr.Reader(target_languages, gpu=False, verbose=False)
            self.specialized_readers[cache_key] = reader

            return reader
        except Exception as e:
            print(f"Failed to create specialized reader for {target_languages}: {str(e)}")
            return self.reader

    def _fix_pil_compatibility(self):
        try:
            if not hasattr(Image, 'ANTIALIAS'):
                Image.ANTIALIAS = Image.Resampling.LANCZOS
        except Exception as e:
            print(f"PIL compatibility fix failed: {str(e)}")

    def _detect_language_from_text(self, text: str) -> tuple[str, float]:
        if not text or not text.strip():
            return 'unknown', 0.0

        korean_chars = sum(1 for char in text if (
            '\uAC00' <= char <= '\uD7AF' or
            '\u1100' <= char <= '\u11FF' or
            '\u3130' <= char <= '\u318F'
        ))

        japanese_hiragana = sum(1 for char in text if '\u3040' <= char <= '\u309F')
        japanese_katakana = sum(1 for char in text if '\u30A0' <= char <= '\u30FF')
        japanese_kanji = sum(1 for char in text if '\u4E00' <= char <= '\u9FFF')

        chinese_chars = sum(1 for char in text if '\u4E00' <= char <= '\u9FFF')

        japanese_punctuation = sum(1 for char in text if char in '。、！？')

        chinese_punctuation = sum(1 for char in text if char in '。，！？；：')

        vietnamese_chars = sum(1 for char in text if any(c in char for c in 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ'))

        english_chars = sum(1 for char in text if (
            char.isalpha() and
            ord(char) < 256 and
            char not in 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ'
        ))

        total_chars = len(text.replace(' ', ''))

        if total_chars == 0:
            return 'unknown', 0.0

        # Calculate percentages with improved logic
        korean_pct = korean_chars / total_chars
        vietnamese_pct = vietnamese_chars / total_chars
        english_pct = english_chars / total_chars

        # Improved Japanese detection: prioritize kana presence
        japanese_kana_pct = (japanese_hiragana + japanese_katakana) / total_chars
        japanese_total_pct = (japanese_hiragana + japanese_katakana + japanese_kanji + japanese_punctuation) / total_chars

        # Improved Chinese detection: CJK chars but penalize if Japanese kana present
        chinese_base_pct = chinese_chars / total_chars
        chinese_total_pct = (chinese_chars + chinese_punctuation) / total_chars

        # If Japanese kana is present, it's likely Japanese, not Chinese
        if japanese_kana_pct > 0.1:  # If more than 10% kana
            japanese_pct = max(japanese_kana_pct, japanese_total_pct)
            chinese_pct = chinese_base_pct * 0.3  # Heavily penalize Chinese if kana present
        else:
            # No kana, so CJK chars are more likely Chinese
            japanese_pct = japanese_kana_pct
            chinese_pct = chinese_total_pct

        # Determine language based on highest percentage
        language_scores = {
            'ko': korean_pct,
            'ja': japanese_pct,
            'ch_sim': chinese_pct,
            'vi': vietnamese_pct,
            'en': english_pct
        }

        # Find the language with highest score
        detected_lang = max(language_scores, key=language_scores.get)
        confidence = language_scores[detected_lang]

        # If confidence is too low, return unknown
        if confidence < 0.1:
            return 'unknown', 0.0

        return detected_lang, confidence

    def _get_adaptive_confidence_threshold(self, text: str) -> float:
        """
        Get adaptive confidence threshold based on text characteristics

        Args:
            text: Text to analyze

        Returns:
            Minimum confidence threshold for this text
        """
        if not text or not text.strip():
            return 0.5

        # Check for Asian characters (typically have lower OCR confidence)
        has_korean = any('\uAC00' <= char <= '\uD7AF' or '\u1100' <= char <= '\u11FF' or '\u3130' <= char <= '\u318F' for char in text)
        has_japanese = any('\u3040' <= char <= '\u309F' or '\u30A0' <= char <= '\u30FF' for char in text)
        has_chinese = any('\u4E00' <= char <= '\u9FFF' for char in text)

        # Lower threshold for Asian languages
        if has_korean or has_japanese or has_chinese:
            return 0.2  # More lenient for Asian languages

        # Standard threshold for Latin scripts
        return 0.3

    def _process_with_multiple_readers(self, opencv_image) -> list:
        """
        Process image with multiple specialized readers for better accuracy

        Args:
            opencv_image: OpenCV image array

        Returns:
            List of OCR results from the best performing reader
        """
        # Define specialized language combinations using environment configurations
        specialized_combinations = [
            settings.ocr_language_korean,     # Korean + English
            settings.ocr_language_japanese,   # Japanese + English
            settings.ocr_language_chinese,    # Chinese + English
            settings.ocr_language_vietnamese, # Vietnamese + English
        ]

        best_results = []
        best_confidence = 0.0

        # Try main reader first
        try:
            main_results = self.reader.readtext(opencv_image)
            if main_results:
                main_avg_confidence = sum(conf for _, _, conf in main_results) / len(main_results)
                if main_avg_confidence > best_confidence:
                    best_results = main_results
                    best_confidence = main_avg_confidence
        except Exception as e:
            print(f"⚠️ Main reader failed: {str(e)}")

        # Try specialized readers
        for lang_combo in specialized_combinations:
            try:
                specialized_reader = self._get_specialized_reader(lang_combo)
                results = specialized_reader.readtext(opencv_image)

                if results:
                    avg_confidence = sum(conf for _, _, conf in results) / len(results)
                    if avg_confidence > best_confidence:
                        best_results = results
                        best_confidence = avg_confidence

            except Exception as e:
                print(f"⚠️ Specialized reader {lang_combo} failed: {str(e)}")
                continue

        return best_results

    def get_language_specific_reader(self, language: str) -> 'easyocr.Reader':
        """
        Get a reader optimized for a specific language using environment configurations

        Args:
            language: Language code (ko, ja, ch_sim, vi, en) or language name

        Returns:
            EasyOCR reader optimized for the specified language
        """
        language_config = settings.get_language_config(language)
        return self._get_specialized_reader(language_config)

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
            
            # Perform OCR using multiple specialized readers for better accuracy
            try:
                if self.reader is None:
                    raise Exception("OCR reader not initialized")
                results = self._process_with_multiple_readers(opencv_image)
            except Exception as ocr_error:
                print(f"❌ Error in OCR processing: {str(ocr_error)}")
                return OCRResponse(
                    success=False,
                    text="",
                    confidence=0.0,
                    processing_time=time.time() - start_time,
                    detected_language=None,
                    language_confidence=None
                )
            
            # Extract text and calculate average confidence
            extracted_texts = []
            confidences = []
            
            for (bbox, text, confidence) in results:
                # Use adaptive confidence threshold based on text characteristics
                min_confidence = self._get_adaptive_confidence_threshold(text)
                if confidence > min_confidence:
                    extracted_texts.append(text.strip())
                    confidences.append(confidence)
            
            # Combine all extracted text
            combined_text = ' '.join(extracted_texts)

            # Calculate average confidence
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

            # Detect language from extracted text
            detected_language, language_confidence = self._detect_language_from_text(combined_text)

            processing_time = time.time() - start_time

            return OCRResponse(
                success=True,
                text=combined_text,
                confidence=avg_confidence,
                processing_time=processing_time,
                detected_language=detected_language,
                language_confidence=language_confidence
            )
            
        except Exception as e:
            print(f"❌ Error in OCR processing: {str(e)}")
            return OCRResponse(
                success=False,
                text="",
                confidence=0.0,
                processing_time=0.0,
                detected_language=None,
                language_confidence=None
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
            
            # Perform OCR on both original and preprocessed images using multiple readers
            try:
                if self.reader is None:
                    raise Exception("OCR reader not initialized")
                original_results = self._process_with_multiple_readers(opencv_image)
                processed_results = self._process_with_multiple_readers(processed_image)
            except Exception as ocr_error:
                print(f"❌ Error in OCR processing with preprocessing: {str(ocr_error)}")
                return OCRResponse(
                    success=False,
                    text="",
                    confidence=0.0,
                    processing_time=time.time() - start_time,
                    detected_language=None,
                    language_confidence=None
                )
            
            # Choose the best results based on confidence
            best_results = self._choose_best_results(original_results, processed_results)
            
            # Extract text and calculate average confidence
            extracted_texts = []
            confidences = []
            
            for (bbox, text, confidence) in best_results:
                # Use adaptive confidence threshold based on text characteristics
                min_confidence = self._get_adaptive_confidence_threshold(text)
                if confidence > min_confidence:
                    extracted_texts.append(text.strip())
                    confidences.append(confidence)
            
            # Combine all extracted text
            combined_text = ' '.join(extracted_texts)

            # Calculate average confidence
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

            # Detect language from extracted text
            detected_language, language_confidence = self._detect_language_from_text(combined_text)

            processing_time = time.time() - start_time

            return OCRResponse(
                success=True,
                text=combined_text,
                confidence=avg_confidence,
                processing_time=processing_time,
                detected_language=detected_language,
                language_confidence=language_confidence
            )
            
        except Exception as e:
            print(f"❌ Error in OCR processing with preprocessing: {str(e)}")
            return OCRResponse(
                success=False,
                text="",
                confidence=0.0,
                processing_time=0.0,
                detected_language=None,
                language_confidence=None
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
        Process image with OCR (multi-language) and translate to English

        Args:
            image_data: Base64 encoded image data

        Returns:
            OCRWithTranslationResponse with original text and English translation
        """
        try:
            start_time = time.time()

            # First, perform OCR to extract text in any supported language
            ocr_result = self.process_image(image_data)

            if not ocr_result.success or not ocr_result.text.strip():
                return OCRWithTranslationResponse(
                    success=False,
                    original_text="",
                    translated_text="",
                    confidence=0.0,
                    processing_time=ocr_result.processing_time,
                    translation_time=0.0,
                    total_time=time.time() - start_time,
                    detected_language=ocr_result.detected_language,
                    language_confidence=ocr_result.language_confidence
                )

            # Translate extracted text to English
            translation_start = time.time()

            # Create context based on detected language
            detected_lang_name = self.language_names.get(ocr_result.detected_language, 'unknown')
            context = f"This is text extracted from a {detected_lang_name} comic/manhwa image."

            translation_result = await self.translation_service.translate_text(
                source_text=ocr_result.text,
                target_language="English",
                context=context
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
                    total_time=total_time,
                    detected_language=ocr_result.detected_language,
                    language_confidence=ocr_result.language_confidence
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
                    total_time=total_time,
                    detected_language=ocr_result.detected_language,
                    language_confidence=ocr_result.language_confidence
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
                total_time=time.time() - start_time,
                detected_language=None,
                language_confidence=None
            )

    async def process_image_with_preprocessing_and_translation(self, image_data: str) -> OCRWithTranslationResponse:
        """
        Process image with enhanced OCR (preprocessing + multi-language) and translate to English

        Args:
            image_data: Base64 encoded image data

        Returns:
            OCRWithTranslationResponse with original text and English translation
        """
        try:
            start_time = time.time()

            # First, perform enhanced OCR to extract text in any supported language
            ocr_result = self.process_image_with_preprocessing(image_data)

            if not ocr_result.success or not ocr_result.text.strip():
                return OCRWithTranslationResponse(
                    success=False,
                    original_text="",
                    translated_text="",
                    confidence=0.0,
                    processing_time=ocr_result.processing_time,
                    translation_time=0.0,
                    total_time=time.time() - start_time,
                    detected_language=ocr_result.detected_language,
                    language_confidence=ocr_result.language_confidence
                )

            # Translate extracted text to English
            translation_start = time.time()

            # Create context based on detected language
            detected_lang_name = self.language_names.get(ocr_result.detected_language, 'unknown')
            context = f"This is text extracted from a {detected_lang_name} comic/manhwa image using enhanced OCR preprocessing."

            translation_result = await self.translation_service.translate_text(
                source_text=ocr_result.text,
                target_language="English",
                context=context
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
                    total_time=total_time,
                    detected_language=ocr_result.detected_language,
                    language_confidence=ocr_result.language_confidence
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
                    total_time=total_time,
                    detected_language=ocr_result.detected_language,
                    language_confidence=ocr_result.language_confidence
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
                total_time=time.time() - start_time,
                detected_language=None,
                language_confidence=None
            )
