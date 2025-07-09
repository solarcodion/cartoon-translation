import openai
import time
import base64
from typing import Optional, List, Dict, Any
from app.config import settings
from app.models import OCRResponse, TextRegionDetectionResponse, TextRegion


class OpenAIOCRService:
    """OpenAI Vision-based OCR service for manhwa panel text extraction"""
    
    def __init__(self):
        self.target_language = settings.translation_target_language
        
        if not settings.openai_api_key:
            print("Warning: OpenAI API key not configured. OpenAI OCR service will not work.")
            self.client = None
            return
            
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
    
    async def extract_text_from_image_with_series_language(self, image_data: str, series_language: str = None) -> OCRResponse:
        """
        Extract text from image using OpenAI Vision API with series language optimization

        Args:
            image_data: Base64 encoded image data
            series_language: Series language for optimization (korean, japanese, chinese, vietnamese, english)

        Returns:
            OCRResponse with extracted text and metadata
        """
        try:
            start_time = time.time()

            if not self.client:
                raise ValueError("OpenAI OCR service is not properly configured. Please check OpenAI API key.")

            # Clean base64 data
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]

            # Build the OCR prompt with series language optimization
            system_prompt = self._build_ocr_system_prompt_with_language(series_language)
            user_prompt = self._build_user_prompt_with_language(series_language)

            # Call OpenAI Vision API
            response = self.client.chat.completions.create(
                model="gpt-4o",  # Use latest vision model
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": user_prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000,
                temperature=0.1,  # Low temperature for consistent text extraction
                top_p=1.0
            )

            # Extract text from response
            extracted_text = response.choices[0].message.content.strip()
            processing_time = time.time() - start_time

            return OCRResponse(
                success=True,
                text=extracted_text,
                confidence=0.95,  # OpenAI Vision typically has high confidence
                processing_time=processing_time,
                detected_language=series_language or "auto",  # Use series language if provided
                language_confidence=0.95 if series_language else 0.9
            )

        except openai.RateLimitError as e:
            print(f"OpenAI rate limit exceeded: {str(e)}")
            raise Exception("OCR service is currently busy. Please try again later.")

        except openai.AuthenticationError as e:
            print(f"OpenAI authentication error: {str(e)}")
            raise Exception("OCR service authentication failed.")

        except openai.APIError as e:
            print(f"OpenAI API error: {str(e)}")
            raise Exception(f"OCR service error: {str(e)}")

        except Exception as e:
            print(f"OpenAI OCR error: {str(e)}")
            raise Exception(f"Text extraction failed: {str(e)}")

    async def extract_text_from_image(self, image_data: str) -> OCRResponse:
        """
        Extract text from image using OpenAI Vision API
        
        Args:
            image_data: Base64 encoded image data
            
        Returns:
            OCRResponse with extracted text and metadata
        """
        try:
            start_time = time.time()
            
            if not self.client:
                raise ValueError("OpenAI OCR service is not properly configured. Please check OpenAI API key.")
            
            # Clean base64 data
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            # Build the OCR prompt
            system_prompt = self._build_ocr_system_prompt()
            
            # Call OpenAI Vision API
            response = self.client.chat.completions.create(
                model="gpt-4o",  # Use latest vision model
                messages=[
                    {
                        "role": "system", 
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Please extract all text from this manhwa panel image following the guidelines provided."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000,
                temperature=0.1,  # Low temperature for consistent text extraction
                top_p=1.0
            )
            
            # Extract text from response
            extracted_text = response.choices[0].message.content.strip()
            processing_time = time.time() - start_time
            
            return OCRResponse(
                success=True,
                text=extracted_text,
                confidence=0.95,  # OpenAI Vision typically has high confidence
                processing_time=processing_time,
                detected_language="auto",  # OpenAI auto-detects language
                language_confidence=0.9
            )
            
        except openai.RateLimitError as e:
            print(f"OpenAI rate limit exceeded: {str(e)}")
            raise Exception("OCR service is currently busy. Please try again later.")
            
        except openai.AuthenticationError as e:
            print(f"OpenAI authentication error: {str(e)}")
            raise Exception("OCR service authentication failed.")
            
        except openai.APIError as e:
            print(f"OpenAI API error: {str(e)}")
            raise Exception(f"OCR service error: {str(e)}")
            
        except Exception as e:
            print(f"OpenAI OCR error: {str(e)}")
            raise Exception(f"Text extraction failed: {str(e)}")
    
    async def detect_text_regions_with_series_language(self, image_data: str, series_language: str = None) -> TextRegionDetectionResponse:
        """
        Detect text regions in image using OpenAI Vision API with series language optimization

        Args:
            image_data: Base64 encoded image data
            series_language: Series language for optimization (korean, japanese, chinese, vietnamese, english)

        Returns:
            TextRegionDetectionResponse with detected text regions and bounding boxes
        """
        try:
            start_time = time.time()

            if not self.client:
                raise ValueError("OpenAI OCR service is not properly configured. Please check OpenAI API key.")

            # Clean base64 data
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]

            # Build the text region detection prompt with series language optimization
            system_prompt = self._build_text_region_system_prompt_with_language(series_language)
            user_prompt = self._build_text_region_user_prompt_with_language(series_language)

            # Call OpenAI Vision API
            response = self.client.chat.completions.create(
                model="gpt-4o",  # Use latest vision model
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": user_prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1500,
                temperature=0.1,
                top_p=1.0
            )

            # Parse response to extract text regions
            response_text = response.choices[0].message.content.strip()
            text_regions = self._parse_text_regions_response(response_text)
            processing_time = time.time() - start_time

            return TextRegionDetectionResponse(
                success=True,
                text_regions=text_regions,
                processing_time=processing_time,
                detected_language=series_language or "auto",
                language_confidence=0.95 if series_language else 0.9
            )

        except Exception as e:
            print(f"OpenAI text region detection error: {str(e)}")
            return TextRegionDetectionResponse(
                success=False,
                text_regions=[],
                processing_time=time.time() - start_time,
                detected_language=None,
                language_confidence=None
            )

    async def detect_text_regions(self, image_data: str) -> TextRegionDetectionResponse:
        """
        Detect text regions in image using OpenAI Vision API
        
        Args:
            image_data: Base64 encoded image data
            
        Returns:
            TextRegionDetectionResponse with detected text regions and bounding boxes
        """
        try:
            start_time = time.time()
            
            if not self.client:
                raise ValueError("OpenAI OCR service is not properly configured. Please check OpenAI API key.")
            
            # Clean base64 data
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            # Build the text region detection prompt
            system_prompt = self._build_text_region_system_prompt()
            
            # Call OpenAI Vision API
            response = self.client.chat.completions.create(
                model="gpt-4o",  # Use latest vision model
                messages=[
                    {
                        "role": "system", 
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Please detect all text regions in this manhwa panel and provide their locations and content."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1500,
                temperature=0.1,
                top_p=1.0
            )
            
            # Parse response to extract text regions
            response_text = response.choices[0].message.content.strip()
            text_regions = self._parse_text_regions_response(response_text)
            processing_time = time.time() - start_time
            
            return TextRegionDetectionResponse(
                success=True,
                text_regions=text_regions,
                processing_time=processing_time,
                detected_language="auto",
                language_confidence=0.9
            )
            
        except Exception as e:
            print(f"OpenAI text region detection error: {str(e)}")
            return TextRegionDetectionResponse(
                success=False,
                text_regions=[],
                processing_time=time.time() - start_time,
                detected_language=None,
                language_confidence=None
            )
    
    def _build_ocr_system_prompt_with_language(self, series_language: str = None) -> str:
        """Build system prompt for OCR text extraction with series language optimization"""
        language_context = ""
        if series_language:
            language_names = {
                'korean': 'Korean',
                'japanese': 'Japanese',
                'chinese': 'Chinese',
                'vietnamese': 'Vietnamese',
                'english': 'English'
            }
            language_name = language_names.get(series_language, series_language)
            language_context = f"\n\nLanguage Context: This is a {language_name} manhwa/comic. Focus on {language_name} text detection and extraction for optimal accuracy."

        return f"""You are assisting in the translation and localization of manhwa panels for professional comic production.

Your task is to detect and transcribe all text in the image, including:
- Dialogue (character speech)
- Narration (story text)
- Sound effects (SFX)
- Overlayed or stylized text
- Signs and background text

Professional Text Extraction Guidelines:
1. Extract ALL visible text from the image, clearly identifying beginning and end of each sentence
2. Accurately segment different types of text (dialogue, narration, thoughts, SFX)
3. Preserve the original text exactly as it appears, including any formatting or stylization
4. Identify complete sentences and text blocks, even when bounding boxes don't contain the whole text section
5. Maintain the spatial relationship and reading order of text elements
6. Handle overlapping or stylized text with care to preserve meaning
7. For sound effects, preserve the original onomatopoeia accurately

Text Classification:
- DIALOGUE: Character speech - typically in speech bubbles
- NARRATION: Story text - usually in rectangular boxes or captions
- THOUGHTS: Internal monologue - often in thought bubbles or special formatting
- SFX: Sound effects - stylized text representing sounds
- SIGNS/TEXT: Background text, signs, or environmental text

Output Requirements:
- Return clean extracted text in the original language
- Separate different text elements with clear line breaks
- Maintain reading order (top to bottom, left to right for most languages)
- Preserve any special formatting or emphasis
- Do not translate or interpret - only extract the original text exactly as written

Return only the extracted text without explanations, formatting markers, or additional comments.{language_context}"""

    def _build_user_prompt_with_language(self, series_language: str = None) -> str:
        """Build user prompt with series language optimization"""
        if series_language:
            language_names = {
                'korean': 'Korean',
                'japanese': 'Japanese',
                'chinese': 'Chinese',
                'vietnamese': 'Vietnamese',
                'english': 'English'
            }
            language_name = language_names.get(series_language, series_language)
            return f"Please extract all {language_name} text from this manhwa panel image following the guidelines provided. Focus on accurate {language_name} text detection."
        else:
            return "Please extract all text from this manhwa panel image following the guidelines provided."

    def _build_ocr_system_prompt(self) -> str:
        """Build system prompt for OCR text extraction"""
        return """You are assisting in the translation and localization of manhwa panels for professional comic production.

Your task is to detect and transcribe all text in the image, including:
- Dialogue (character speech)
- Narration (story text)
- Sound effects (SFX)
- Overlayed or stylized text
- Signs and background text

Professional Text Extraction Guidelines:
1. Extract ALL visible text from the image, clearly identifying beginning and end of each sentence
2. Accurately segment different types of text (dialogue, narration, thoughts, SFX)
3. Preserve the original text exactly as it appears, including any formatting or stylization
4. Identify complete sentences and text blocks, even when bounding boxes don't contain the whole text section
5. Maintain the spatial relationship and reading order of text elements
6. Handle overlapping or stylized text with care to preserve meaning
7. For sound effects, preserve the original onomatopoeia accurately

Text Classification:
- DIALOGUE: Character speech - typically in speech bubbles
- NARRATION: Story text - usually in rectangular boxes or captions
- THOUGHTS: Internal monologue - often in thought bubbles or special formatting
- SFX: Sound effects - stylized text representing sounds
- SIGNS/TEXT: Background text, signs, or environmental text

Output Requirements:
- Return clean extracted text in the original language
- Separate different text elements with clear line breaks
- Maintain reading order (top to bottom, left to right for most languages)
- Preserve any special formatting or emphasis
- Do not translate or interpret - only extract the original text exactly as written

Return only the extracted text without explanations, formatting markers, or additional comments."""
    
    def _build_text_region_system_prompt_with_language(self, series_language: str = None) -> str:
        """Build system prompt for text region detection with series language optimization"""
        language_context = ""
        if series_language:
            language_names = {
                'korean': 'Korean',
                'japanese': 'Japanese',
                'chinese': 'Chinese',
                'vietnamese': 'Vietnamese',
                'english': 'English'
            }
            language_name = language_names.get(series_language, series_language)
            language_context = f"\n\nLanguage Context: This is a {language_name} manhwa/comic. Focus on {language_name} text detection for optimal accuracy and speed."

        return f"""You are a professional manhwa panel analyzer specializing in text region detection for comic localization.

Your task is to identify and locate all text regions in the image with precise bounding box coordinates.

For each text region you detect, provide:
1. Bounding box coordinates (x, y, width, height) as percentages of image dimensions
2. The extracted text content
3. Text type classification (dialogue, narration, thoughts, SFX, signs)
4. Confidence score for the detection

Text Region Detection Guidelines:
- Identify ALL text areas including dialogue bubbles, narration boxes, sound effects, and background text
- Provide accurate bounding box coordinates as percentages (0.0 to 1.0)
- Extract the complete text content for each region
- Classify each text region by type
- Ensure bounding boxes encompass the complete text area
- Handle overlapping or complex layouts carefully
- Maintain spatial accuracy for proper text box placement

Output Format (JSON):
{{
  "text_regions": [
    {{
      "x": 0.1,
      "y": 0.2,
      "width": 0.3,
      "height": 0.1,
      "text": "Extracted text content",
      "type": "dialogue|narration|thoughts|sfx|signs",
      "confidence": 0.95
    }}
  ]
}}

Return only the JSON object without additional commentary.{language_context}"""

    def _build_text_region_user_prompt_with_language(self, series_language: str = None) -> str:
        """Build user prompt for text region detection with series language optimization"""
        if series_language:
            language_names = {
                'korean': 'Korean',
                'japanese': 'Japanese',
                'chinese': 'Chinese',
                'vietnamese': 'Vietnamese',
                'english': 'English'
            }
            language_name = language_names.get(series_language, series_language)
            return f"Please detect all {language_name} text regions in this manhwa panel and provide their locations and content. Focus on accurate {language_name} text detection."
        else:
            return "Please detect all text regions in this manhwa panel and provide their locations and content."

    def _build_text_region_system_prompt(self) -> str:
        """Build system prompt for text region detection"""
        return """You are a professional manhwa panel analyzer specializing in text region detection for comic localization.

Your task is to identify and locate all text regions in the image with precise bounding box coordinates.

For each text region you detect, provide:
1. Bounding box coordinates (x, y, width, height) as percentages of image dimensions
2. The extracted text content
3. Text type classification (dialogue, narration, thoughts, SFX, signs)
4. Confidence score for the detection

Text Region Detection Guidelines:
- Identify ALL text areas including dialogue bubbles, narration boxes, sound effects, and background text
- Provide accurate bounding box coordinates as percentages (0.0 to 1.0)
- Extract the complete text content for each region
- Classify each text region by type
- Ensure bounding boxes encompass the complete text area
- Handle overlapping or complex layouts carefully
- Maintain spatial accuracy for proper text box placement

Output Format (JSON):
{
  "text_regions": [
    {
      "x": 0.1,
      "y": 0.2,
      "width": 0.3,
      "height": 0.1,
      "text": "Extracted text content",
      "type": "dialogue|narration|thoughts|sfx|signs",
      "confidence": 0.95
    }
  ]
}

Return only the JSON object without additional commentary."""
    
    def _parse_text_regions_response(self, response_text: str) -> List[TextRegion]:
        """Parse OpenAI response to extract text regions"""
        text_regions = []
        
        try:
            import json
            
            # Try to parse as JSON
            if response_text.startswith('{'):
                data = json.loads(response_text)
                regions_data = data.get('text_regions', [])
                
                for region_data in regions_data:
                    text_region = TextRegion(
                        x=region_data.get('x', 0.0),
                        y=region_data.get('y', 0.0),
                        width=region_data.get('width', 0.1),
                        height=region_data.get('height', 0.1),
                        text=region_data.get('text', ''),
                        confidence=region_data.get('confidence', 0.8)
                    )
                    text_regions.append(text_region)
            
        except Exception as e:
            print(f"Error parsing text regions response: {str(e)}")
            # Fallback: create a single text region with the entire response
            text_regions.append(TextRegion(
                x=0.1, y=0.1, width=0.8, height=0.8,
                text=response_text, confidence=0.7
            ))
        
        return text_regions
