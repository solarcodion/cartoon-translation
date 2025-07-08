import openai
import time
from typing import Optional, List, Dict, Any
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
                    print(f"Warning: Failed to fetch TM data: {str(tm_error)}")

            # Build the analysis prompt with TM data
            system_prompt = self._build_system_prompt_with_tm(request.translation_info, request.existing_context, tm_data)
            user_prompt = self._build_user_prompt_with_tm(request.pages, tm_data)
            
            # Build enhanced user prompt with image analysis
            enhanced_user_prompt = await self._build_enhanced_user_prompt_with_images(request.pages, tm_data)

            # Call OpenAI API with gpt-4o model for vision capabilities
            response = self.client.chat.completions.create(
                model="gpt-4o",  # Use gpt-4o for vision capabilities
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": enhanced_user_prompt}
                ],
                max_tokens=1200,  # Increased for more detailed analysis
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
                    print(f"Warning: Failed to update TM usage counts: {str(tm_error)}")
            
            return ChapterAnalysisResponse(
                success=True,
                chapter_context=chapter_context,
                analysis_summary=analysis_summary,
                processing_time=processing_time,
                model="gpt-4o-mini",
                tokens_used=response.usage.total_tokens if response.usage else None
            )
            
        except openai.RateLimitError as e:
            print(f"OpenAI rate limit exceeded: {str(e)}")
            raise Exception("Chapter analysis service is currently busy. Please try again later.")

        except openai.AuthenticationError as e:
            print(f"OpenAI authentication error: {str(e)}")
            raise Exception("Chapter analysis service authentication failed.")

        except openai.APIError as e:
            print(f"OpenAI API error: {str(e)}")
            raise Exception(f"Chapter analysis service error: {str(e)}")
        
        except Exception as e:
            print(f"❌ Chapter analysis error: {str(e)}")
            raise Exception(f"Chapter analysis failed: {str(e)}")
    
    def _build_system_prompt(self, translation_info: List[str], existing_context: Optional[str] = None) -> str:
        """Build system prompt for chapter analysis"""
        base_prompt = f"""You are a senior manga/manhwa analyst and professional localization expert specializing in comprehensive story analysis and translation context development for official comic production.

Your expertise encompasses:
- Deep understanding of manhwa/manga narrative structures and storytelling conventions
- Professional comic localization and adaptation principles
- Cultural context analysis for cross-cultural adaptation
- Character development and relationship dynamics assessment
- Visual storytelling and panel composition analysis

Primary Objectives:
1. COMPREHENSIVE STORY ANALYSIS: Examine visual narrative flow, character interactions, and plot development across all chapter pages
2. TRANSLATION CONTEXT DEVELOPMENT: Provide detailed context that enables accurate, culturally-appropriate translation decisions
3. CHARACTER VOICE ANALYSIS: Identify speaking patterns, personality traits, and relationship dynamics through dialogue
4. CULTURAL LOCALIZATION GUIDANCE: Note cultural references, idioms, and context requiring adaptation for target audience
5. NARRATIVE CONSISTENCY: Ensure analysis maintains continuity with established story elements and character development

Advanced Analysis Framework:
- VISUAL STORYTELLING: Panel composition, artistic choices, visual metaphors, and symbolic elements
- DIALOGUE ANALYSIS: Character voice, emotional subtext, formal/informal speech patterns, and relationship dynamics
- NARRATIVE PACING: Story beats, emotional crescendos, tension building, and dramatic timing
- CULTURAL ELEMENTS: References requiring localization, cultural context, and audience adaptation needs
- GENRE CONVENTIONS: Adherence to or subversion of manhwa/manga storytelling tropes and expectations

Target language for analysis: {self.target_language}

Professional Translation Context Guidelines:"""

        # Add translation info
        if translation_info:
            for i, info in enumerate(translation_info, 1):
                base_prompt += f"\n{i}. {info}"
        else:
            base_prompt += "\n- Maintain natural dialogue flow and character voice consistency"
            base_prompt += "\n- Preserve cultural authenticity while ensuring accessibility"
            base_prompt += "\n- Adapt honorifics and formal speech appropriately for target language"
            base_prompt += "\n- Handle sound effects and onomatopoeia with cultural sensitivity"

        # Add existing context if provided
        if existing_context:
            base_prompt += f"""

ESTABLISHED STORY CONTEXT (maintain consistency):
{existing_context}

CRITICAL: Your analysis must build upon and remain consistent with this established context while adding new insights and developments."""

        base_prompt += """

COMPREHENSIVE ANALYSIS PROTOCOL WITH VISUAL INTELLIGENCE:
- Analyze pages in sequential order (1, 2, 3, ...) for narrative flow
- VISUAL ANALYSIS: Examine panel composition, character expressions, body language, and environmental details
- TEXT INTEGRATION: Cross-reference text box data with visual context to understand dialogue intent and emotional subtext
- TRANSLATION GUIDANCE: Identify specific visual cues that inform translation choices (character emotions, scene atmosphere, cultural elements)
- CONTEXTUAL MAPPING: Map text boxes to visual elements to understand speaker identity, emotional state, and situational context
- CULTURAL VISUAL CUES: Identify visual elements that require cultural adaptation (clothing, settings, gestures, symbols)
- CHARACTER DYNAMICS: Analyze visual character interactions, power dynamics, and relationship status through body language and positioning
- SCENE ATMOSPHERE: Assess mood, tension, and emotional tone through visual composition and artistic choices
- TRANSLATION CONTEXT: Provide specific guidance on how visual context should influence translation choices for each text element

ENHANCED DELIVERABLE REQUIREMENTS:
- Professional-grade analysis suitable for official localization teams with visual context integration
- Specific mapping of text boxes to visual elements and translation implications
- Cultural context notes for cross-cultural adaptation with visual reference points
- Character voice and relationship dynamic insights supported by visual evidence
- Translation guidance that considers both textual content and visual context
- Identification of visual storytelling elements that impact translation decisions

OUTPUT FORMAT:
CHAPTER_CONTEXT: [Comprehensive narrative context explaining story developments, character dynamics, emotional themes, and cultural elements. Reference specific text box translations and visual storytelling elements. Include detailed visual-to-text mapping that shows how visual context informs translation decisions. Provide context that enables informed translation decisions for professional localization.]
ANALYSIS_SUMMARY: [Professional summary of key plot developments, character interactions, emotional beats, and narrative significance. Include specific insights on how visual elements enhance translation understanding, cultural visual cues requiring adaptation, and character relationship dynamics visible in the artwork. Include guidance on translation tone based on visual atmosphere and mood.]
TRANSLATION_GUIDANCE: [Specific recommendations for translating text elements based on visual context analysis. For each significant text box or dialogue, explain how the visual context (character expressions, scene atmosphere, cultural elements) should influence translation choices, tone, and cultural adaptation.]"""

        return base_prompt

    def _build_system_prompt_with_tm(self, translation_info: List[str], existing_context: Optional[str] = None, tm_data: List = None) -> str:
        """Build system prompt for chapter analysis with TM data"""
        base_prompt = f"""You are a senior manga/manhwa analyst and professional localization expert specializing in comprehensive story analysis and translation context development for official comic production.

Your expertise encompasses:
- Deep understanding of manhwa/manga narrative structures and storytelling conventions
- Professional comic localization and adaptation principles with Translation Memory integration
- Cultural context analysis for cross-cultural adaptation
- Character development and relationship dynamics assessment
- Visual storytelling and panel composition analysis
- Translation consistency management using established terminology databases

Primary Objectives:
1. COMPREHENSIVE STORY ANALYSIS: Examine visual narrative flow, character interactions, and plot development across all chapter pages
2. TRANSLATION CONTEXT DEVELOPMENT: Provide detailed context that enables accurate, culturally-appropriate translation decisions
3. CHARACTER VOICE ANALYSIS: Identify speaking patterns, personality traits, and relationship dynamics through dialogue
4. CULTURAL LOCALIZATION GUIDANCE: Note cultural references, idioms, and context requiring adaptation for target audience
5. TRANSLATION MEMORY INTEGRATION: Utilize established translations to maintain consistency across the series
6. NARRATIVE CONSISTENCY: Ensure analysis maintains continuity with established story elements and character development

Advanced Analysis Framework:
- VISUAL STORYTELLING: Panel composition, artistic choices, visual metaphors, and symbolic elements
- DIALOGUE ANALYSIS: Character voice, emotional subtext, formal/informal speech patterns, and relationship dynamics
- NARRATIVE PACING: Story beats, emotional crescendos, tension building, and dramatic timing
- CULTURAL ELEMENTS: References requiring localization, cultural context, and audience adaptation needs
- GENRE CONVENTIONS: Adherence to or subversion of manhwa/manga storytelling tropes and expectations
- TERMINOLOGY CONSISTENCY: Integration of established character names, terms, and translations

Target language for analysis: {self.target_language}

Professional Translation Context Guidelines:"""

        # Add translation info
        if translation_info:
            for i, info in enumerate(translation_info, 1):
                base_prompt += f"\n{i}. {info}"
        else:
            base_prompt += "\n- Maintain natural dialogue flow and character voice consistency"
            base_prompt += "\n- Preserve cultural authenticity while ensuring accessibility"
            base_prompt += "\n- Adapt honorifics and formal speech appropriately for target language"
            base_prompt += "\n- Handle sound effects and onomatopoeia with cultural sensitivity"

        # Add TM data if available
        if tm_data and len(tm_data) > 0:
            base_prompt += f"""

TRANSLATION MEMORY DATABASE ({len(tm_data)} entries available):
Use this established translation data to maintain consistency in character names, terminology, and translations throughout the series:"""
            for i, tm_entry in enumerate(tm_data[:10], 1):  # Limit to first 10 entries
                base_prompt += f"\n{i}. Source: \"{tm_entry.source_text}\" → Target: \"{tm_entry.target_text}\""
                if tm_entry.context:
                    base_prompt += f" (Context: {tm_entry.context})"
                base_prompt += f" [TM_ID: {tm_entry.id}]"

        # Add existing context if provided
        if existing_context:
            base_prompt += f"""

ESTABLISHED STORY CONTEXT (maintain consistency):
{existing_context}

CRITICAL: Your analysis must build upon and remain consistent with this established context while adding new insights and developments."""

        base_prompt += """

COMPREHENSIVE ANALYSIS PROTOCOL WITH TM INTEGRATION AND VISUAL INTELLIGENCE:
- Analyze pages in sequential order (1, 2, 3, ...) for narrative flow
- VISUAL ANALYSIS: Examine panel composition, character expressions, body language, and environmental details
- TEXT INTEGRATION: Cross-reference text box data with visual context to understand dialogue intent and emotional subtext
- TM CONSISTENCY: Cross-reference Translation Memory data to ensure terminology consistency while considering visual context
- TRANSLATION GUIDANCE: Identify specific visual cues that inform translation choices (character emotions, scene atmosphere, cultural elements)
- CONTEXTUAL MAPPING: Map text boxes to visual elements to understand speaker identity, emotional state, and situational context
- CULTURAL VISUAL CUES: Identify visual elements that require cultural adaptation (clothing, settings, gestures, symbols)
- CHARACTER DYNAMICS: Analyze visual character interactions, power dynamics, and relationship status through body language and positioning
- SCENE ATMOSPHERE: Assess mood, tension, and emotional tone through visual composition and artistic choices
- TRANSLATION CONTEXT: Provide specific guidance on how visual context should influence translation choices for each text element
- Track which TM entries are relevant for maintaining series consistency while considering visual context

CRITICAL TM USAGE REQUIREMENTS:
- Use Translation Memory data to maintain consistency in character names and terminology
- Do NOT include TM_ID references or alerts in your context or summary sections
- Track which TM entries were useful for your analysis for reporting purposes
- Ensure established translations are respected while allowing for natural dialogue flow

DELIVERABLE REQUIREMENTS:
- Professional-grade analysis suitable for official localization teams
- Specific references to visual and textual elements that inform translation decisions
- Cultural context notes for cross-cultural adaptation
- Character voice and relationship dynamic insights
- Narrative pacing and emotional beat analysis
- Translation consistency tracking for series continuity

OUTPUT FORMAT:
CHAPTER_CONTEXT: [Comprehensive narrative context explaining story developments, character dynamics, emotional themes, and cultural elements. Reference specific text box translations and visual storytelling elements. Include detailed visual-to-text mapping that shows how visual context informs translation decisions. Provide context that enables informed translation decisions. Do not include any TM_ID references here.]
ANALYSIS_SUMMARY: [Professional summary of key plot developments, character interactions, emotional beats, and narrative significance. Include specific insights on how visual elements enhance translation understanding, cultural visual cues requiring adaptation, and character relationship dynamics visible in the artwork. Include guidance on translation tone based on visual atmosphere and mood. Do not include any TM_ID references here.]
TRANSLATION_GUIDANCE: [Specific recommendations for translating text elements based on visual context analysis. For each significant text box or dialogue, explain how the visual context (character expressions, scene atmosphere, cultural elements) should influence translation choices, tone, and cultural adaptation.]
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

    async def _build_enhanced_user_prompt_with_images(self, pages: List[PageAnalysisData], tm_data: List = None) -> List[Dict]:
        """Build enhanced user prompt with image analysis capabilities"""
        messages = []

        # Add introductory text
        intro_text = f"Please analyze this manhwa chapter with {len(pages)} pages using both visual analysis and text box data"

        if tm_data and len(tm_data) > 0:
            intro_text += f" along with {len(tm_data)} Translation Memory entries provided"

        intro_text += ":\n\n"

        # Add each page with image and text box data
        for page in sorted(pages, key=lambda x: x.page_number):
            page_text = f"=== PAGE {page.page_number} ===\n"

            # Add image for visual analysis
            messages.append({
                "type": "text",
                "text": page_text
            })

            messages.append({
                "type": "image_url",
                "image_url": {
                    "url": page.image_url,
                    "detail": "high"
                }
            })

            # Add OCR context if available
            if page.ocr_context:
                messages.append({
                    "type": "text",
                    "text": f"OCR Context: {page.ocr_context}\n"
                })
            else:
                messages.append({
                    "type": "text",
                    "text": "OCR Context: [No text detected]\n"
                })

            # Add detailed text box analysis data
            if page.text_boxes and len(page.text_boxes) > 0:
                text_box_analysis = f"Text Box Analysis ({len(page.text_boxes)} boxes):\n"
                for i, text_box in enumerate(page.text_boxes, 1):
                    text_box_analysis += f"  Box {i} (Position: x:{text_box.x}, y:{text_box.y}, size: {text_box.w}x{text_box.h}):\n"
                    if text_box.ocr_text:
                        text_box_analysis += f"    Original Text: {text_box.ocr_text}\n"
                    if text_box.translated_text:
                        text_box_analysis += f"    Translation: {text_box.translated_text}\n"
                    if text_box.corrected_text:
                        text_box_analysis += f"    Corrected: {text_box.corrected_text}\n"
                    text_box_analysis += f"    → ANALYZE: How does the visual context at this position inform the translation choice?\n"

                messages.append({
                    "type": "text",
                    "text": text_box_analysis + "\n"
                })
            else:
                messages.append({
                    "type": "text",
                    "text": "Text Boxes: [No text boxes available]\n\n"
                })

        # Add analysis instructions
        analysis_instructions = """
COMPREHENSIVE VISUAL + TEXT ANALYSIS REQUIRED:

1. VISUAL STORYTELLING ANALYSIS:
   - Examine each page's visual composition, character expressions, and scene atmosphere
   - Identify emotional beats, character dynamics, and narrative progression through visual cues
   - Note artistic choices that convey mood, tension, or cultural context

2. TEXT-TO-VISUAL MAPPING:
   - For each text box, analyze how the visual context at that position informs translation choices
   - Identify speaker identity through visual cues (character positioning, speech bubble style)
   - Assess emotional context through character expressions and body language
   - Consider scene atmosphere and how it should influence tone and word choice

3. TRANSLATION CONTEXT DEVELOPMENT:
   - Provide specific guidance on how visual elements should influence translation decisions
   - Identify cultural visual cues that require localization consideration
   - Note character relationship dynamics visible in the artwork that inform dialogue translation
   - Suggest how visual mood and atmosphere should guide translation tone

4. CULTURAL LOCALIZATION INSIGHTS:
   - Identify visual elements that carry cultural significance
   - Note gestures, clothing, settings, or symbols that may need cultural adaptation
   - Provide context for visual metaphors or cultural references

Please provide comprehensive analysis following the format specified in the system prompt, with special attention to how visual context enhances translation understanding.
"""

        messages.append({
            "type": "text",
            "text": analysis_instructions
        })

        return messages

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
            # Split by the markers to extract all sections
            parts = analysis_result.split("ANALYSIS_SUMMARY:")

            if len(parts) >= 2:
                # Extract context (remove CHAPTER_CONTEXT: prefix)
                context_part = parts[0].replace("CHAPTER_CONTEXT:", "").strip()

                # Check if there's translation guidance section
                summary_and_guidance = parts[1].split("TRANSLATION_GUIDANCE:")
                summary_part = summary_and_guidance[0].strip()

                # If there's translation guidance, append it to the summary
                if len(summary_and_guidance) > 1:
                    guidance_part = summary_and_guidance[1].strip()
                    summary_part += f"\n\nTranslation Guidance:\n{guidance_part}"

                return context_part, summary_part
            else:
                # Fallback: treat entire result as context
                return analysis_result.strip(), "Analysis completed successfully."

        except Exception as e:
            print(f"Warning: Could not parse analysis result: {str(e)}")
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

                # Split the second part to get summary, guidance, and TM IDs
                remaining_content = parts[1]

                # Check for translation guidance section
                if "TRANSLATION_GUIDANCE:" in remaining_content:
                    summary_and_guidance = remaining_content.split("TRANSLATION_GUIDANCE:")
                    summary_part = summary_and_guidance[0].strip()

                    # Extract guidance and TM IDs
                    guidance_and_tm = summary_and_guidance[1].split("USED_TM_IDS:")
                    guidance_part = guidance_and_tm[0].strip()

                    # Combine summary and guidance
                    summary_part += f"\n\nTranslation Guidance:\n{guidance_part}"

                    # Extract TM IDs
                    if len(guidance_and_tm) > 1:
                        tm_ids_part = guidance_and_tm[1].strip()
                    else:
                        tm_ids_part = ""
                else:
                    # No guidance section, split directly for TM IDs
                    summary_and_tm = remaining_content.split("USED_TM_IDS:")
                    summary_part = summary_and_tm[0].strip()
                    tm_ids_part = summary_and_tm[1].strip() if len(summary_and_tm) > 1 else ""

                # Clean any TM_ID references from summary
                summary_part = self._clean_tm_references(summary_part)

                # Extract TM IDs if present
                useful_tm_ids = []
                if tm_ids_part and tm_ids_part.lower() != "none":
                    # Parse comma-separated TM IDs
                    tm_ids = [tm_id.strip() for tm_id in tm_ids_part.split(",")]
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


