import base64
import io
import time
import easyocr
import cv2
import numpy as np
from PIL import Image
from typing import List

from app.models import OCRResponse, OCRWithTranslationResponse, TextRegion, TextRegionDetectionResponse
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

        # Text grouping configuration for improved distance-based separation
        # Reduced thresholds for better context separation accuracy
        self.grouping_config = {
            # Hard distance limits (minimum pixel distances) - significantly reduced
            'max_horizontal_gap_pixels': 25,  # Reduced from 50
            'max_vertical_gap_pixels': 15,    # Reduced from 30

            # Relative distance multipliers - more restrictive
            'max_horizontal_gap_multiplier': 0.8,  # Reduced from 1.5
            'max_vertical_gap_multiplier': 0.6,    # Reduced from 1.2

            # Same line detection - more restrictive
            'same_line_vertical_threshold': 0.2,           # Reduced from 0.3
            'same_line_horizontal_gap_multiplier': 0.8,    # Reduced from 1.5

            # Vertical stacking detection - more restrictive
            'vertical_stack_horizontal_threshold': 0.3,    # Reduced from 0.5
            'vertical_stack_gap_multiplier': 0.5,          # Reduced from 1.0

            # Nearby text detection - much more restrictive
            'nearby_vertical_threshold': 0.4,      # Reduced from 0.8
            'nearby_horizontal_threshold': 0.6,    # Reduced from 1.2
            'nearby_gap_multiplier': 0.4,          # Reduced from 0.8

            # Additional fine-tuning parameters
            'min_text_box_area': 20,               # Minimum area to consider (width * height)
            'min_text_length': 1,                  # Minimum text length to consider
            'confidence_boost_threshold': 0.8      # Boost grouping for high-confidence text
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

    def _group_text_regions(self, ocr_results) -> List['TextRegion']:
        """
        Group OCR results into logical text regions based on spatial proximity and context

        Args:
            ocr_results: List of (bbox, text, confidence) tuples from EasyOCR

        Returns:
            List of grouped TextRegion objects
        """
        if not ocr_results:
            return []

        # First, convert all results to a standardized format
        text_boxes = []
        for (bbox, text, confidence) in ocr_results:
            # Use adaptive confidence threshold
            min_confidence = self._get_adaptive_confidence_threshold(text)
            if confidence > min_confidence and text.strip():
                # Convert bbox coordinates to our format
                x_coords = [point[0] for point in bbox]
                y_coords = [point[1] for point in bbox]

                x = int(min(x_coords))
                y = int(min(y_coords))
                width = int(max(x_coords) - min(x_coords))
                height = int(max(y_coords) - min(y_coords))

                text_boxes.append({
                    'x': x,
                    'y': y,
                    'width': width,
                    'height': height,
                    'text': text.strip(),
                    'confidence': confidence,
                    'center_x': x + width // 2,
                    'center_y': y + height // 2
                })

        if not text_boxes:
            return []

        # Sort by vertical position (top to bottom), then horizontal (left to right)
        text_boxes.sort(key=lambda box: (box['y'], box['x']))

        # Enhanced filtering to capture more relevant content while removing noise
        filtered_boxes = []
        for box in text_boxes:
            # Calculate text box area
            area = box['width'] * box['height']
            text_length = len(box['text'].strip())

            # More inclusive filtering criteria
            if (area >= self.grouping_config['min_text_box_area'] and
                text_length >= self.grouping_config['min_text_length'] and
                box['width'] >= 3 and box['height'] >= 3):  # Very minimal size requirements

                # Boost inclusion for high-confidence text even if small
                if (box['confidence'] >= self.grouping_config['confidence_boost_threshold'] and
                    text_length > 0):
                    filtered_boxes.append(box)
                # Standard inclusion criteria
                elif area >= 15 and text_length > 0:  # Reduced from previous implicit 25 (5x5)
                    filtered_boxes.append(box)

        text_boxes = filtered_boxes

        # Group text boxes using improved algorithm for manga/comic text
        grouped_regions = self._group_by_proximity_and_context(text_boxes)

        # Debug logging for improved context separation
        print(f"📊 OCR Context Separation Results:")
        print(f"   • Input text boxes: {len(text_boxes)}")
        print(f"   • Output grouped regions: {len(grouped_regions)}")
        print(f"   • Average texts per region: {len(text_boxes) / max(1, len(grouped_regions)):.1f}")

        return grouped_regions

    def _group_by_proximity_and_context(self, text_boxes) -> List['TextRegion']:
        """
        Advanced grouping algorithm that considers both spatial proximity and text context
        """
        if not text_boxes:
            return []

        if len(text_boxes) == 1:
            return [self._merge_text_boxes([text_boxes[0]])]

        # Create a graph of text boxes and their relationships
        groups = []
        used_indices = set()

        for i, box in enumerate(text_boxes):
            if i in used_indices:
                continue

            # Start a new group with this box
            current_group = [box]
            used_indices.add(i)

            # Find all boxes that should be grouped with this one
            self._expand_group(text_boxes, current_group, used_indices)

            # Create merged region from the group
            if current_group:
                merged_region = self._merge_text_boxes(current_group)
                if merged_region:
                    groups.append(merged_region)

        return groups

    def _expand_group(self, text_boxes, current_group, used_indices):
        """
        Recursively expand a group by finding nearby text boxes
        """
        for i, candidate_box in enumerate(text_boxes):
            if i in used_indices:
                continue

            # Check if this box should be grouped with any box in the current group
            should_add = False

            for group_box in current_group:
                if self._should_group_boxes(group_box, candidate_box):
                    should_add = True
                    break

            if should_add:
                current_group.append(candidate_box)
                used_indices.add(i)
                # Recursively check for more boxes to add
                self._expand_group(text_boxes, current_group, used_indices)

    def _should_group_boxes(self, box1, box2) -> bool:
        """
        Determine if two text boxes should be grouped together based on manga/comic patterns
        with enhanced distance-based separation for improved accuracy
        """
        # Calculate center-to-center distances and dimensions
        vertical_distance = abs(box1['center_y'] - box2['center_y'])
        horizontal_distance = abs(box1['center_x'] - box2['center_x'])
        avg_height = (box1['height'] + box2['height']) / 2
        avg_width = (box1['width'] + box2['width']) / 2
        min_height = min(box1['height'], box2['height'])
        min_width = min(box1['width'], box2['width'])

        # Calculate edge-to-edge distances for more accurate separation
        box1_right = box1['x'] + box1['width']
        box1_bottom = box1['y'] + box1['height']
        box2_right = box2['x'] + box2['width']
        box2_bottom = box2['y'] + box2['height']

        # Edge-to-edge distances (negative means overlap)
        horizontal_gap = max(0, max(box1['x'] - box2_right, box2['x'] - box1_right))
        vertical_gap = max(0, max(box1['y'] - box2_bottom, box2['y'] - box1_bottom))

        # Enhanced hard distance limits - much more restrictive
        max_absolute_horizontal_gap = min(
            avg_width * self.grouping_config['max_horizontal_gap_multiplier'],
            self.grouping_config['max_horizontal_gap_pixels']
        )
        max_absolute_vertical_gap = min(
            avg_height * self.grouping_config['max_vertical_gap_multiplier'],
            self.grouping_config['max_vertical_gap_pixels']
        )

        # Immediate rejection for large gaps
        if horizontal_gap > max_absolute_horizontal_gap or vertical_gap > max_absolute_vertical_gap:
            return False

        # Check for actual overlap first (highest priority)
        horizontal_overlap = not (box1_right <= box2['x'] or box2_right <= box1['x'])
        vertical_overlap = not (box1_bottom <= box2['y'] or box2_bottom <= box1['y'])

        if horizontal_overlap and vertical_overlap:
            return True

        # Enhanced restrictive grouping conditions

        # 1. Same line text (horizontal alignment) - much more restrictive
        if vertical_distance <= min_height * self.grouping_config['same_line_vertical_threshold']:
            # Very tight horizontal gap allowance
            max_horizontal_gap = min_width * self.grouping_config['same_line_horizontal_gap_multiplier']
            return horizontal_gap <= max_horizontal_gap

        # 2. Vertically stacked text (common in manga) - more restrictive
        if horizontal_distance <= min_width * self.grouping_config['vertical_stack_horizontal_threshold']:
            # Very tight vertical gap allowance
            max_vertical_gap = min_height * self.grouping_config['vertical_stack_gap_multiplier']
            return vertical_gap <= max_vertical_gap

        # 3. Nearby text within speech bubble range - much more restrictive
        if (vertical_distance <= min_height * self.grouping_config['nearby_vertical_threshold'] and
            horizontal_distance <= min_width * self.grouping_config['nearby_horizontal_threshold']):
            # Very strict gap requirements
            gap_multiplier = self.grouping_config['nearby_gap_multiplier']
            max_h_gap = min_width * gap_multiplier
            max_v_gap = min_height * gap_multiplier
            return horizontal_gap <= max_h_gap and vertical_gap <= max_v_gap

        # 4. No grouping for distant text - be very conservative
        return False

    def configure_text_grouping(self, **kwargs):
        """
        Configure text grouping parameters for distance-based separation

        Args:
            **kwargs: Configuration parameters to update
                - max_horizontal_gap_pixels: Minimum pixel distance for horizontal separation
                - max_vertical_gap_pixels: Minimum pixel distance for vertical separation
                - max_horizontal_gap_multiplier: Multiplier for horizontal gap relative to text width
                - max_vertical_gap_multiplier: Multiplier for vertical gap relative to text height
                - same_line_vertical_threshold: Threshold for detecting same-line text
                - same_line_horizontal_gap_multiplier: Horizontal gap multiplier for same-line text
                - vertical_stack_horizontal_threshold: Threshold for detecting vertically stacked text
                - vertical_stack_gap_multiplier: Gap multiplier for vertically stacked text
                - nearby_vertical_threshold: Threshold for nearby text detection
                - nearby_horizontal_threshold: Threshold for nearby text detection
                - nearby_gap_multiplier: Gap multiplier for nearby text
                - min_text_box_area: Minimum text box area to consider
                - min_text_length: Minimum text length to consider
                - confidence_boost_threshold: Confidence threshold for boosting inclusion
        """
        for key, value in kwargs.items():
            if key in self.grouping_config:
                old_value = self.grouping_config[key]
                self.grouping_config[key] = value
                print(f"📝 Updated {key}: {old_value} → {value}")
            else:
                print(f"⚠️ Unknown grouping config parameter: {key}")

        print("✅ Text grouping configuration updated")

    def get_text_grouping_config(self):
        """
        Get current text grouping configuration

        Returns:
            Dictionary of current configuration parameters
        """
        return self.grouping_config.copy()

    def reset_grouping_config(self):
        """
        Reset text grouping configuration to optimized defaults for improved accuracy
        """
        self.grouping_config = {
            'max_horizontal_gap_pixels': 25,
            'max_vertical_gap_pixels': 15,
            'max_horizontal_gap_multiplier': 0.8,
            'max_vertical_gap_multiplier': 0.6,
            'same_line_vertical_threshold': 0.2,
            'same_line_horizontal_gap_multiplier': 0.8,
            'vertical_stack_horizontal_threshold': 0.3,
            'vertical_stack_gap_multiplier': 0.5,
            'nearby_vertical_threshold': 0.4,
            'nearby_horizontal_threshold': 0.6,
            'nearby_gap_multiplier': 0.4,
            'min_text_box_area': 20,
            'min_text_length': 1,
            'confidence_boost_threshold': 0.8
        }
        print("🔄 Text grouping configuration reset to optimized defaults")

    def _merge_text_boxes(self, text_boxes) -> 'TextRegion':
        """
        Merge multiple text boxes into a single TextRegion

        Args:
            text_boxes: List of text box dictionaries

        Returns:
            TextRegion object with merged bounding box and combined text
        """
        if not text_boxes:
            return None

        if len(text_boxes) == 1:
            box = text_boxes[0]
            return TextRegion(
                x=box['x'],
                y=box['y'],
                width=box['width'],
                height=box['height'],
                text=box['text'],
                confidence=box['confidence']
            )

        # Calculate bounding box that encompasses all text boxes
        min_x = min(box['x'] for box in text_boxes)
        min_y = min(box['y'] for box in text_boxes)
        max_x = max(box['x'] + box['width'] for box in text_boxes)
        max_y = max(box['y'] + box['height'] for box in text_boxes)

        # Sort text boxes by reading order (top to bottom, left to right)
        sorted_boxes = sorted(text_boxes, key=lambda box: (box['y'], box['x']))

        # Combine text with improved spacing logic for better separation
        combined_text = []
        prev_box = None

        for box in sorted_boxes:
            if prev_box is not None:
                # Calculate gaps more precisely
                vertical_gap = box['y'] - (prev_box['y'] + prev_box['height'])
                horizontal_gap = box['x'] - (prev_box['x'] + prev_box['width'])
                avg_height = (box['height'] + prev_box['height']) / 2
                avg_width = (box['width'] + prev_box['width']) / 2

                # Enhanced conservative spacing logic for better context separation
                # 1. Significant vertical gap - always new line (more restrictive)
                if vertical_gap > avg_height * 0.3:  # Further reduced from 0.5
                    combined_text.append('\n')
                # 2. Same line text (very close vertically) - more restrictive
                elif abs(box['center_y'] - prev_box['center_y']) <= avg_height * 0.15:  # Reduced from 0.3
                    # Add space only if there's meaningful horizontal separation
                    if horizontal_gap > avg_width * 0.15:  # More conservative spacing
                        combined_text.append(' ')
                # 3. Small vertical gap but still separate - more restrictive
                elif vertical_gap > avg_height * 0.05:  # Reduced from 0.1
                    # Add space for small separations, but be more conservative
                    if horizontal_gap > avg_width * 0.1:  # Only add space if there's horizontal gap too
                        combined_text.append(' ')
                    else:
                        combined_text.append('\n')  # New line for vertical separation without horizontal gap

            combined_text.append(box['text'])
            prev_box = box

        # Calculate average confidence
        avg_confidence = sum(box['confidence'] for box in text_boxes) / len(text_boxes)

        return TextRegion(
            x=min_x,
            y=min_y,
            width=max_x - min_x,
            height=max_y - min_y,
            text=''.join(combined_text),
            confidence=avg_confidence
        )

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

    def _get_series_language_config(self, series_language: str) -> list:
        """
        Get language configuration for series language optimization

        Args:
            series_language: Series language (korean, japanese, chinese, vietnamese, english)

        Returns:
            List of language codes for EasyOCR
        """
        language_mapping = {
            'korean': settings.ocr_language_korean,
            'japanese': settings.ocr_language_japanese,
            'chinese': settings.ocr_language_chinese,
            'vietnamese': settings.ocr_language_vietnamese,
            'english': settings.ocr_language_english
        }

        return language_mapping.get(series_language, settings.ocr_languages)

    def process_image_with_series_language(self, image_data: str, series_language: str = None) -> OCRResponse:
        """
        Process image with series language optimization for faster and more accurate OCR

        Args:
            image_data: Base64 encoded image data
            series_language: Series language for optimization (korean, japanese, chinese, vietnamese, english)

        Returns:
            OCRResponse with extracted text and metadata
        """
        try:
            start_time = time.time()

            if series_language:
                print(f"🎯 Using series language optimization: {series_language}")
                # Get optimized language configuration for the series
                language_config = self._get_series_language_config(series_language)
                specialized_reader = self._get_specialized_reader(language_config)

                # Process with optimized reader
                return self.process_image_with_specific_reader(image_data, specialized_reader, series_language)
            else:
                # Fall back to standard processing
                print("🔍 No series language provided, using standard OCR processing")
                return self.process_image(image_data)

        except Exception as e:
            print(f"❌ Error in series language optimized OCR: {str(e)}")
            # Fall back to standard processing on error
            return self.process_image(image_data)

    def process_image_with_specific_reader(self, image_data: str, reader: 'easyocr.Reader', language: str) -> OCRResponse:
        """
        Process image with a specific OCR reader for targeted language detection

        Args:
            image_data: Base64 encoded image data
            reader: Specific EasyOCR reader to use
            language: Target language for processing

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
            image = Image.open(io.BytesIO(image_bytes))

            # Convert PIL image to OpenCV format
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

            # Perform OCR using the specific reader
            try:
                results = reader.readtext(opencv_image)
                print(f"🔍 Language-specific OCR ({language}) found {len(results)} text regions")
            except Exception as ocr_error:
                print(f"❌ Error in language-specific OCR processing: {str(ocr_error)}")
                return OCRResponse(
                    success=False,
                    text="",
                    confidence=0.0,
                    processing_time=time.time() - start_time,
                    detected_language=None,
                    language_confidence=None
                )

            # Process results
            extracted_texts = []
            confidences = []

            for (bbox, text, confidence) in results:
                if confidence >= self._get_confidence_threshold(language):
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
            print(f"❌ Error in language-specific OCR processing: {str(e)}")
            return OCRResponse(
                success=False,
                text="",
                confidence=0.0,
                processing_time=0.0,
                detected_language=None,
                language_confidence=None
            )

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

    def detect_text_regions_with_series_language(self, image_data: str, series_language: str = None) -> TextRegionDetectionResponse:
        """
        Detect text regions with series language optimization for faster and more accurate detection

        Args:
            image_data: Base64 encoded image data
            series_language: Series language for optimization (korean, japanese, chinese, vietnamese, english)

        Returns:
            TextRegionDetectionResponse with detected text regions and metadata
        """
        try:
            start_time = time.time()

            if series_language:
                print(f"🎯 Using series language optimization for text detection: {series_language}")
                # Get optimized language configuration for the series
                language_config = self._get_series_language_config(series_language)
                specialized_reader = self._get_specialized_reader(language_config)

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

                # Perform OCR using specialized reader
                try:
                    results = specialized_reader.readtext(opencv_image)
                    print(f"🔍 Series language optimized OCR ({series_language}) found {len(results)} text regions")
                except Exception as ocr_error:
                    print(f"❌ Error in series language optimized OCR processing: {str(ocr_error)}")
                    # Fall back to standard processing
                    return self.detect_text_regions(image_data)

                # Process results and create grouped text regions
                text_regions = self._group_text_regions(results)
                all_texts = [region.text for region in text_regions]

                # Use series language as detected language since we know it
                detected_language = series_language
                language_confidence = 1.0  # High confidence since we know the series language

                processing_time = time.time() - start_time

                return TextRegionDetectionResponse(
                    success=True,
                    text_regions=text_regions,
                    processing_time=processing_time,
                    detected_language=detected_language,
                    language_confidence=language_confidence
                )
            else:
                # Fall back to standard processing
                print("🔍 No series language provided, using standard text region detection")
                return self.detect_text_regions(image_data)

        except Exception as e:
            print(f"❌ Error in series language optimized text detection: {str(e)}")
            # Fall back to standard processing on error
            return self.detect_text_regions(image_data)

    def detect_text_regions(self, image_data: str) -> 'TextRegionDetectionResponse':
        """
        Detect text regions in an image and return bounding boxes with extracted text

        Args:
            image_data: Base64 encoded image data (with or without data URL prefix)

        Returns:
            TextRegionDetectionResponse with detected text regions and their bounding boxes
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
                return TextRegionDetectionResponse(
                    success=False,
                    text_regions=[],
                    processing_time=time.time() - start_time,
                    detected_language=None,
                    language_confidence=None
                )

            # Process results and create grouped text regions
            text_regions = self._group_text_regions(results)
            all_texts = [region.text for region in text_regions]

            # Detect language from all extracted text
            combined_text = ' '.join(all_texts)
            detected_language, language_confidence = self._detect_language_from_text(combined_text)

            processing_time = time.time() - start_time

            return TextRegionDetectionResponse(
                success=True,
                text_regions=text_regions,
                processing_time=processing_time,
                detected_language=detected_language,
                language_confidence=language_confidence
            )

        except Exception as e:
            print(f"❌ Error in text region detection: {str(e)}")
            return TextRegionDetectionResponse(
                success=False,
                text_regions=[],
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
