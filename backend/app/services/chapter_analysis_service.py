import openai
import time
from typing import Optional, List
from app.config import settings
from app.models import ChapterAnalysisRequest, ChapterAnalysisResponse, PageAnalysisData
from app.services.translation_memory_service import TranslationMemoryService


class ChapterAnalysisService:
    """Service for AI-powered chapter analysis using OpenAI GPT"""

    def __init__(self, supabase_client=None):
        """Initialize chapter analysis service with OpenAI client and TM service"""
        self.target_language = settings.translation_target_language

        # Initialize TM service if supabase client is provided
        self.tm_service = TranslationMemoryService(supabase_client) if supabase_client else None

        if not settings.openai_api_key:
            print("⚠️ Warning: OpenAI API key not configured. Chapter analysis service will not work.")
            self.client = None
            return

        # Initialize OpenAI client
        openai.api_key = settings.openai_api_key
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
    
    async def analyze_chapter(self, request: ChapterAnalysisRequest, series_id: Optional[str] = None) -> ChapterAnalysisResponse:
        """
        Analyze a chapter using OpenAI GPT with sorted page images and OCR contexts
        
        Args:
            request: Chapter analysis request containing pages, translation info, and existing context
            
        Returns:
            ChapterAnalysisResponse with analysis result and metadata
        """
        try:
            start_time = time.time()

            if not request.pages:
                raise ValueError("Pages list cannot be empty")

            if not self.client:
                raise ValueError("Chapter analysis service is not properly configured. Please check OpenAI API key.")

            # Get translation memory data for the series if available
            tm_data = []
            useful_tm_ids = []
            if self.tm_service and series_id:
                try:
                    tm_data = await self.tm_service.get_all_tm_entries_for_analysis(series_id)
                except Exception as tm_error:
                    print(f"⚠️ Warning: Failed to fetch TM data: {str(tm_error)}")

            # Build the analysis prompt with TM data
            system_prompt = self._build_system_prompt_with_tm(request.translation_info, request.existing_context, tm_data)
            user_prompt = self._build_user_prompt_with_tm(request.pages, tm_data)
            
            # Call OpenAI API with gpt-4o-mini model
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=800,  # Maximum response length set to 800 tokens
                temperature=0.3,  # Lower temperature for more consistent analysis
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )
            
            # Extract analysis result
            analysis_result = response.choices[0].message.content.strip()
            processing_time = time.time() - start_time

            # Parse the analysis result to extract context, summary, and useful TM IDs
            chapter_context, analysis_summary, useful_tm_ids = self._parse_analysis_result_with_tm(analysis_result, tm_data)

            # Update usage count for useful TM entries
            if self.tm_service and useful_tm_ids:
                try:
                    for tm_id in useful_tm_ids:
                        await self.tm_service.increment_usage_count(tm_id)
                except Exception as tm_error:
                    print(f"⚠️ Warning: Failed to update TM usage counts: {str(tm_error)}")
            
            return ChapterAnalysisResponse(
                success=True,
                chapter_context=chapter_context,
                analysis_summary=analysis_summary,
                processing_time=processing_time,
                model="gpt-4o-mini",
                tokens_used=response.usage.total_tokens if response.usage else None
            )
            
        except openai.RateLimitError as e:
            print(f"❌ OpenAI rate limit exceeded: {str(e)}")
            raise Exception("Chapter analysis service is currently busy. Please try again later.")
        
        except openai.AuthenticationError as e:
            print(f"❌ OpenAI authentication error: {str(e)}")
            raise Exception("Chapter analysis service authentication failed.")
        
        except openai.APIError as e:
            print(f"❌ OpenAI API error: {str(e)}")
            raise Exception(f"Chapter analysis service error: {str(e)}")
        
        except Exception as e:
            print(f"❌ Chapter analysis error: {str(e)}")
            raise Exception(f"Chapter analysis failed: {str(e)}")
    
    def _build_system_prompt(self, translation_info: List[str], existing_context: Optional[str] = None) -> str:
        """Build system prompt for chapter analysis"""
        base_prompt = f"""You are an expert manga/manhwa analyst and translator specializing in story comprehension and context analysis.

Your task is to analyze a complete chapter by examining all pages in order, along with their OCR-extracted text contexts, and provide:
1. A comprehensive chapter context that explains the story content, character interactions, and plot developments
2. A detailed analysis summary of the chapter's key events and themes

Target language for analysis: {self.target_language}

Translation guidelines to follow:"""
        
        # Add translation info
        if translation_info:
            for i, info in enumerate(translation_info, 1):
                base_prompt += f"\n{i}. {info}"
        else:
            base_prompt += "\n- Maintain natural flow and readability"
            base_prompt += "\n- Preserve character names and proper nouns"
            base_prompt += "\n- Adapt cultural references appropriately"

        # Add existing context if provided
        if existing_context:
            base_prompt += f"""

Existing context to maintain consistency with:
{existing_context}

Please ensure your analysis builds upon and remains consistent with this existing context."""

        base_prompt += """

Instructions:
- Analyze the pages in sequential order (1, 2, 3, ...)
- Consider both visual content and OCR text context
- Reference text box translations to understand dialogue and story content
- Use translated text from text boxes to better understand character interactions and plot
- Explain picture content and preserve story understanding
- Provide comprehensive context for future translation work
- Focus on character development, plot progression, and key story elements
- Maintain consistency with any existing context provided
- When text box translations are available, incorporate them into your analysis for better story comprehension

Format your response as:
CHAPTER_CONTEXT: [Detailed context explaining the chapter's story content, referencing text box translations where relevant]
ANALYSIS_SUMMARY: [Summary of key events, character interactions, and plot developments based on visual content and text box translations]"""

        return base_prompt

    def _build_system_prompt_with_tm(self, translation_info: List[str], existing_context: Optional[str] = None, tm_data: List = None) -> str:
        """Build system prompt for chapter analysis with TM data"""
        base_prompt = f"""You are an expert manga/manhwa analyst and translator specializing in story comprehension and context analysis.

Your task is to analyze a complete chapter by examining all pages in order, along with their OCR-extracted text contexts, and provide:
1. A comprehensive chapter context that explains the story content, character interactions, and plot developments
2. A detailed analysis summary of the chapter's key events and themes

Target language for analysis: {self.target_language}

Translation guidelines to follow:"""

        # Add translation info
        if translation_info:
            for i, info in enumerate(translation_info, 1):
                base_prompt += f"\n{i}. {info}"
        else:
            base_prompt += "\n- Maintain natural flow and readability"
            base_prompt += "\n- Preserve character names and proper nouns"
            base_prompt += "\n- Adapt cultural references appropriately"

        # Add TM data if available
        if tm_data and len(tm_data) > 0:
            base_prompt += f"""

Translation Memory Data Available ({len(tm_data)} entries):
Use this translation memory data to maintain consistency in character names, terminology, and translations:"""
            for i, tm_entry in enumerate(tm_data[:10], 1):  # Limit to first 10 entries
                base_prompt += f"\n{i}. Source: \"{tm_entry.source_text}\" → Target: \"{tm_entry.target_text}\""
                if tm_entry.context:
                    base_prompt += f" (Context: {tm_entry.context})"
                base_prompt += f" [TM_ID: {tm_entry.id}]"

        # Add existing context if provided
        if existing_context:
            base_prompt += f"""

Existing context to maintain consistency with:
{existing_context}

Please ensure your analysis builds upon and remains consistent with this existing context."""

        base_prompt += """

Instructions:
- Analyze the pages in sequential order (1, 2, 3, ...)
- Consider both visual content and OCR text context
- Reference text box translations to understand dialogue and story content
- Use translated text from text boxes to better understand character interactions and plot
- Use the Translation Memory data to maintain consistency in character names and terminology
- Do NOT include TM_ID references or alerts in your context or summary sections
- Explain picture content and preserve story understanding
- Provide comprehensive context for future translation work
- Focus on character development, plot progression, and key story elements
- Maintain consistency with any existing context provided
- When text box translations are available, incorporate them into your analysis for better story comprehension

Format your response as:
CHAPTER_CONTEXT: [Detailed context explaining the chapter's story content, referencing text box translations where relevant. Do not include any TM_ID references here.]
ANALYSIS_SUMMARY: [Summary of key events, character interactions, and plot developments based on visual content and text box translations. Do not include any TM_ID references here.]
USED_TM_IDS: [Comma-separated list of TM_ID values that were useful for this analysis, e.g., "tm_id_1,tm_id_2,tm_id_3" or "none" if no TM data was used]"""

        return base_prompt

    def _build_user_prompt(self, pages: List[PageAnalysisData]) -> str:
        """Build user prompt with page data including text box translations"""
        prompt = f"Please analyze this chapter with {len(pages)} pages:\n\n"

        for page in sorted(pages, key=lambda x: x.page_number):
            prompt += f"Page {page.page_number}:\n"
            prompt += f"- Image URL: {page.image_url}\n"

            if page.ocr_context:
                prompt += f"- OCR Context: {page.ocr_context}\n"
            else:
                prompt += "- OCR Context: [No text detected]\n"

            # Include text box translation data if available
            if page.text_boxes and len(page.text_boxes) > 0:
                prompt += f"- Text Box Translations ({len(page.text_boxes)} boxes):\n"
                for i, text_box in enumerate(page.text_boxes, 1):
                    prompt += f"  Box {i} (x:{text_box.x}, y:{text_box.y}, w:{text_box.w}, h:{text_box.h}):\n"
                    if text_box.ocr_text:
                        prompt += f"    OCR: {text_box.ocr_text}\n"
                    if text_box.translated_text:
                        prompt += f"    Translation: {text_box.translated_text}\n"
                    if text_box.corrected_text:
                        prompt += f"    Corrected: {text_box.corrected_text}\n"
            else:
                prompt += "- Text Box Translations: [No text boxes found]\n"

            prompt += "\n"

        prompt += "Please provide a comprehensive analysis following the format specified in the system prompt. "
        prompt += "When generating the new context, please reference the text box translations to understand the dialogue and story content better."

        return prompt

    def _build_user_prompt_with_tm(self, pages: List[PageAnalysisData], tm_data: List = None) -> str:
        """Build user prompt with page data including text box translations and TM data"""
        prompt = f"Please analyze this chapter with {len(pages)} pages"

        if tm_data and len(tm_data) > 0:
            prompt += f" using the {len(tm_data)} Translation Memory entries provided"

        prompt += ":\n\n"

        for page in sorted(pages, key=lambda x: x.page_number):
            prompt += f"Page {page.page_number}:\n"
            prompt += f"- Image URL: {page.image_url}\n"

            if page.ocr_context:
                prompt += f"- OCR Context: {page.ocr_context}\n"
            else:
                prompt += "- OCR Context: [No text detected]\n"

            # Include text box translation data if available
            if page.text_boxes and len(page.text_boxes) > 0:
                prompt += f"- Text Box Translations ({len(page.text_boxes)} boxes):\n"
                for i, text_box in enumerate(page.text_boxes, 1):
                    prompt += f"  Box {i} (x:{text_box.x}, y:{text_box.y}, w:{text_box.w}, h:{text_box.h}):\n"
                    if text_box.ocr_text:
                        prompt += f"    OCR: {text_box.ocr_text}\n"
                    if text_box.translated_text:
                        prompt += f"    Translation: {text_box.translated_text}\n"
                    if text_box.corrected_text:
                        prompt += f"    Corrected: {text_box.corrected_text}\n"
            else:
                prompt += "- Text Box Translations: [No text boxes found]\n"

            prompt += "\n"

        prompt += "Please provide a comprehensive analysis following the format specified in the system prompt. "
        prompt += "When generating the new context, please reference the text box translations to understand the dialogue and story content better. "

        if tm_data and len(tm_data) > 0:
            prompt += "Use the Translation Memory data to maintain consistency in character names and terminology, and include the TM_ID of any entries you find useful in your USED_TM_IDS section."

        return prompt

    def _parse_analysis_result(self, analysis_result: str) -> tuple[str, str]:
        """Parse the analysis result to extract context and summary"""
        try:
            # Split by the markers
            parts = analysis_result.split("ANALYSIS_SUMMARY:")
            
            if len(parts) >= 2:
                # Extract context (remove CHAPTER_CONTEXT: prefix)
                context_part = parts[0].replace("CHAPTER_CONTEXT:", "").strip()
                # Extract summary
                summary_part = parts[1].strip()
                
                return context_part, summary_part
            else:
                # Fallback: treat entire result as context
                return analysis_result.strip(), "Analysis completed successfully."
                
        except Exception as e:
            print(f"⚠️ Warning: Could not parse analysis result: {str(e)}")
            # Fallback: return the entire result as context
            return analysis_result.strip(), "Analysis completed successfully."

    def _parse_analysis_result_with_tm(self, analysis_result: str, tm_data: List = None) -> tuple[str, str, List[str]]:
        """Parse the analysis result to extract context, summary, and useful TM IDs"""
        try:
            # Split by the markers
            parts = analysis_result.split("ANALYSIS_SUMMARY:")

            if len(parts) >= 2:
                # Extract context (remove CHAPTER_CONTEXT: prefix)
                context_part = parts[0].replace("CHAPTER_CONTEXT:", "").strip()

                # Clean any TM_ID references from context
                context_part = self._clean_tm_references(context_part)

                # Split the second part to get summary and TM IDs
                summary_and_tm = parts[1].split("USED_TM_IDS:")
                summary_part = summary_and_tm[0].strip()

                # Clean any TM_ID references from summary
                summary_part = self._clean_tm_references(summary_part)

                # Extract TM IDs if present
                useful_tm_ids = []
                if len(summary_and_tm) >= 2:
                    tm_ids_text = summary_and_tm[1].strip()
                    if tm_ids_text and tm_ids_text.lower() != "none":
                        # Parse comma-separated TM IDs
                        tm_ids = [tm_id.strip() for tm_id in tm_ids_text.split(",")]
                        # Validate that these TM IDs exist in our TM data
                        if tm_data:
                            valid_tm_ids = [tm_entry.id for tm_entry in tm_data]
                            useful_tm_ids = [tm_id for tm_id in tm_ids if tm_id in valid_tm_ids]

                return context_part, summary_part, useful_tm_ids
            else:
                # Fallback: treat entire result as context and clean it
                cleaned_context = self._clean_tm_references(analysis_result.strip())
                return cleaned_context, "Analysis completed successfully.", []

        except Exception as e:
            print(f"⚠️ Warning: Could not parse analysis result with TM: {str(e)}")
            # Fallback: return the entire result as context and clean it
            cleaned_context = self._clean_tm_references(analysis_result.strip())
            return cleaned_context, "Analysis completed successfully.", []

    def _clean_tm_references(self, text: str) -> str:
        """Remove TM_ID references and alerts from text"""
        import re

        # Remove patterns like "Translation Memory TM_ID: uuid"
        text = re.sub(r'Translation Memory TM_ID:\s*[a-zA-Z0-9\-]+', '', text, flags=re.IGNORECASE)

        # Remove patterns like "[TM_ID: uuid]"
        text = re.sub(r'\[TM_ID:\s*[a-zA-Z0-9\-]+\]', '', text, flags=re.IGNORECASE)

        # Remove patterns like "(TM_ID: uuid)"
        text = re.sub(r'\(TM_ID:\s*[a-zA-Z0-9\-]+\)', '', text, flags=re.IGNORECASE)

        # Remove patterns like "TM_ID: uuid" (this should be last to catch remaining cases)
        text = re.sub(r'TM_ID:\s*[a-zA-Z0-9\-]+', '', text, flags=re.IGNORECASE)

        # Clean up extra whitespace and newlines
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n', text)

        return text.strip()

    async def health_check(self) -> dict:
        """Check if chapter analysis service is working"""
        try:
            if not self.client:
                return {
                    "status": "unhealthy",
                    "service": "OpenAI GPT Chapter Analysis",
                    "error": "OpenAI API key not configured"
                }
            
            return {
                "status": "healthy",
                "service": "OpenAI GPT Chapter Analysis",
                "target_language": self.target_language,
                "model": "gpt-4o-mini"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "service": "OpenAI GPT Chapter Analysis",
                "error": str(e)
            }
