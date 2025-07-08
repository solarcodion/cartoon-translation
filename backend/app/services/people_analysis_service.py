import openai
import time
import uuid
import json
from typing import List, Optional, Dict, Any
from supabase import Client
from app.config import settings
from app.models import PeopleAnalysisRequest, PeopleAnalysisResponse, PersonInfo, TerminologyAnalysisResponse
from app.services.ai_glossary_service import AIGlossaryService
from app.services.translation_memory_service import TranslationMemoryService
from app.services.terminology_analysis_service import TerminologyAnalysisService


class PeopleAnalysisService:
    def __init__(self, supabase: Client = None):
        self.target_language = settings.translation_target_language
        self.supabase = supabase
        self.ai_glossary_service = AIGlossaryService(supabase) if supabase else None
        self.tm_service = TranslationMemoryService(supabase) if supabase else None
        self.terminology_service = TerminologyAnalysisService(supabase) if supabase else None

        if not settings.openai_api_key:
            print("Warning: OpenAI API key not configured. People analysis service will not work.")
            self.client = None
            return

        # Initialize OpenAI client
        self.client = openai.OpenAI(api_key=settings.openai_api_key)

    async def analyze_terminology_in_series(
        self,
        series_id: str,
        chapters_data: List[Dict[str, Any]],
        force_refresh: bool = False
    ) -> TerminologyAnalysisResponse:
        """
        Analyze manhwa-specific terminology across all chapters in a series
        This method delegates to the new TerminologyAnalysisService
        """
        if not self.terminology_service:
            raise Exception("Terminology analysis service is not available")

        return await self.terminology_service.analyze_terminology_in_series(
            series_id=series_id,
            chapters_data=chapters_data,
            force_refresh=force_refresh
        )
    
    async def analyze_people_in_series(
        self,
        series_id: str,
        chapters_data: List[Dict[str, Any]],
        force_refresh: bool = False
    ) -> PeopleAnalysisResponse:
        try:
            start_time = time.time()

            if not chapters_data:
                return PeopleAnalysisResponse(
                    success=True,
                    people=[],
                    total_people_found=0,
                    processing_time=0.0
                )

            if not self.client:
                raise ValueError("People analysis service is not properly configured. Please check OpenAI API key.")

            # Get series language for proper description language
            series_language = "korean"  # Default fallback
            if self.ai_glossary_service:
                try:
                    series_language = await self.ai_glossary_service.get_series_language(series_id)
                except Exception as lang_error:
                    print(f"Warning: Could not fetch series language: {str(lang_error)}")

            # Get translation memory data for the series
            tm_data = []
            useful_tm_ids = []
            if self.tm_service:
                try:
                    tm_data = await self.tm_service.get_all_tm_entries_for_analysis(series_id)
                except Exception as tm_error:
                    print(f"Warning: Failed to fetch TM data: {str(tm_error)}")

            # Build the analysis prompt with TM data and series language
            system_prompt = self._build_system_prompt_with_tm(series_language)
            user_prompt = self._build_user_prompt_with_tm(chapters_data, tm_data)

            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=800,  # Maximum response length set to 800 tokens
                temperature=0.3,
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )

            # Extract and parse the analysis result
            analysis_result = response.choices[0].message.content.strip()
            people_list, useful_tm_ids = self._parse_people_analysis_with_tm(analysis_result, chapters_data, tm_data)
            processing_time = time.time() - start_time

            # Update usage count for useful TM entries
            if self.tm_service and useful_tm_ids:
                try:
                    for tm_id in useful_tm_ids:
                        await self.tm_service.increment_usage_count(tm_id)
                except Exception as tm_error:
                    print(f"Warning: Failed to update TM usage counts: {str(tm_error)}")

            # Save results to database if AI glossary service is available
            if self.ai_glossary_service and people_list:
                try:
                    await self.ai_glossary_service.save_people_analysis_results(
                        series_id=series_id,
                        people=people_list,
                        clear_existing=True
                    )
                except Exception as db_error:
                    print(f"Warning: Failed to save to database: {str(db_error)}")
                    # Continue without failing the analysis

            return PeopleAnalysisResponse(
                success=True,
                people=people_list,
                total_people_found=len(people_list),
                processing_time=processing_time,
                model="gpt-4o-mini",
                tokens_used=response.usage.total_tokens if response.usage else None
            )
            
        except openai.RateLimitError as e:
            print(f"OpenAI rate limit exceeded: {str(e)}")
            raise Exception("People analysis service is currently busy. Please try again later.")
        except openai.APIError as e:
            print(f"OpenAI API error: {str(e)}")
            raise Exception(f"People analysis failed: {str(e)}")
        except Exception as e:
            print(f"People analysis error: {str(e)}")
            raise Exception(f"People analysis failed: {str(e)}")
    
    def _build_system_prompt(self, series_language: str = "korean") -> str:
        # Map language codes to language names for the prompt
        language_names = {
            "korean": "Korean",
            "japanese": "Japanese",
            "chinese": "Chinese",
            "vietnamese": "Vietnamese",
            "english": "English"
        }

        description_language = language_names.get(series_language, "Korean")

        return f"""You are a senior manga/manhwa character analyst and professional localization consultant specializing in comprehensive character identification and development tracking for official comic production.

Your expertise encompasses:
- Advanced character recognition and visual analysis across sequential art
- Professional character development assessment and narrative role identification
- Cultural context analysis for character localization and adaptation
- Character relationship dynamics and story significance evaluation
- Visual storytelling and character design analysis

Primary Objectives:
1. COMPREHENSIVE CHARACTER IDENTIFICATION: Systematically identify all significant characters across the entire series
2. CHARACTER DEVELOPMENT TRACKING: Analyze character growth, relationships, and narrative importance
3. LOCALIZATION CONTEXT: Provide detailed character information for professional translation teams
4. VISUAL ANALYSIS: Assess character design, appearance consistency, and visual storytelling elements
5. NARRATIVE SIGNIFICANCE: Evaluate each character's role in plot development and story progression

Advanced Character Analysis Framework:
- CHARACTER CLASSIFICATION: Protagonist, antagonist, supporting, recurring, significant one-time characters
- VISUAL IDENTIFICATION: Physical appearance, clothing, distinguishing features, design consistency
- NARRATIVE FUNCTION: Story role, character arc, relationship dynamics, plot significance
- CULTURAL ELEMENTS: Character traits requiring localization consideration
- APPEARANCE TRACKING: Visual consistency across chapters and character development

Professional Analysis Requirements:
For each identified character, provide:
1. CLEAR IDENTIFICATION: Official name if available, or descriptive designation based on appearance/role
2. COMPREHENSIVE DESCRIPTION: Detailed appearance, personality traits, narrative significance, and story role
3. CHAPTER TRACKING: Complete list of chapter appearances for continuity reference
4. SIGNIFICANCE ASSESSMENT: Importance level and narrative function evaluation
5. VISUAL REFERENCE: Best representative image for character identification

Character Classification Guidelines:
- MAIN CHARACTERS: Protagonists, primary antagonists, central supporting cast
- RECURRING CHARACTERS: Characters appearing in multiple chapters with story significance
- SIGNIFICANT ONE-TIME: Important characters with major plot impact despite limited appearances
- SUPPORTING CAST: Characters with defined roles and clear narrative purpose
- Exclude: Minor background characters without story significance

Professional Standards:
- Focus on characters essential for story comprehension and translation context
- Use descriptive names for unnamed characters based on appearance or narrative role
- Provide descriptions in {description_language} suitable for professional localization teams
- Include specific physical details, clothing, and distinguishing characteristics
- Assess character relationships and dynamics for translation context
- Select optimal visual references for character identification guides

OUTPUT FORMAT (JSON Array):
[
  {{
    "name": "Character Name or Professional Description",
    "description": "Comprehensive analysis of appearance, personality, narrative role, and story significance",
    "mentioned_chapters": [chapter numbers],
    "confidence_score": 0.0-1.0,
    "best_image_url": "URL of optimal character reference image"
  }}
]

Return only the JSON array without additional commentary."""

    def _build_user_prompt(self, chapters_data: List[Dict[str, Any]]) -> str:
        """Build user prompt with chapter data"""
        prompt_parts = ["Analyze the following manga/manhwa chapters to identify people/characters:\n"]
        
        for chapter in chapters_data:
            chapter_num = chapter.get('number', 'Unknown')
            context = chapter.get('context', '')
            pages = chapter.get('pages', [])
            
            prompt_parts.append(f"\n--- Chapter {chapter_num} ---")
            if context:
                prompt_parts.append(f"Chapter Context: {context}")
            
            if pages:
                prompt_parts.append(f"Pages in this chapter: {len(pages)}")
                for page in pages[:3]:  # Limit to first 3 pages per chapter for token efficiency
                    if page.get('context'):
                        prompt_parts.append(f"Page {page.get('number', '?')}: {page.get('context', '')}")
        
        prompt_parts.append("\nPlease identify and describe all significant people/characters that appear in these chapters.")
        
        return "\n".join(prompt_parts)
    
    def _parse_people_analysis(self, analysis_result: str, chapters_data: List[Dict[str, Any]]) -> List[PersonInfo]:
        """Parse the AI analysis result into PersonInfo objects"""
        try:
            import json
            
            # Try to extract JSON from the response
            json_start = analysis_result.find('[')
            json_end = analysis_result.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = analysis_result[json_start:json_end]
                people_data = json.loads(json_str)
                
                people_list = []
                for i, person_data in enumerate(people_data):
                    person_info = PersonInfo(
                        id=str(uuid.uuid4()),
                        name=person_data.get('name', f'Person {i + 1}'),
                        description=person_data.get('description', 'Character detected in the series'),
                        image_url=person_data.get('best_image_url'),
                        mentioned_chapters=person_data.get('mentioned_chapters', []),
                        confidence_score=person_data.get('confidence_score', 0.8)
                    )
                    people_list.append(person_info)
                
                return people_list
            else:
                # Fallback: create generic people if JSON parsing fails
                return self._create_fallback_people(len(chapters_data))
                
        except Exception as e:
            print(f"Warning: Could not parse people analysis result: {str(e)}")
            # Fallback: create generic people
            return self._create_fallback_people(len(chapters_data))
    
    def _create_fallback_people(self, num_chapters: int) -> List[PersonInfo]:
        fallback_people = []
        
        # Create 2-3 generic people based on common manga/manhwa patterns
        people_templates = [
            {
                "name": "Nhân vật chính",
                "description": "Nhân vật chính của câu chuyện, xuất hiện trong hầu hết các chương.",
                "chapters": list(range(1, min(num_chapters + 1, 6)))
            },
            {
                "name": "Nhân vật phụ quan trọng", 
                "description": "Nhân vật phụ đóng vai trò quan trọng trong cốt truyện.",
                "chapters": list(range(1, min(num_chapters + 1, 4)))
            }
        ]
        
        if num_chapters > 2:
            people_templates.append({
                "name": "Nhân vật hỗ trợ",
                "description": "Nhân vật hỗ trợ xuất hiện trong một số chương.",
                "chapters": list(range(2, min(num_chapters + 1, 4)))
            })
        
        for i, template in enumerate(people_templates):
            person_info = PersonInfo(
                id=str(uuid.uuid4()),
                name=template["name"],
                description=template["description"],
                mentioned_chapters=template["chapters"],
                confidence_score=0.6  # Lower confidence for fallback data
            )
            fallback_people.append(person_info)
        
        return fallback_people

    def _build_system_prompt_with_tm(self, series_language: str = "korean") -> str:
        """Build system prompt for people analysis with TM data"""

        # Map language codes to language names for the prompt
        language_names = {
            "korean": "Korean",
            "japanese": "Japanese",
            "chinese": "Chinese",
            "vietnamese": "Vietnamese",
            "english": "English"
        }

        description_language = language_names.get(series_language, "Korean")

        return f"""You are a senior manga/manhwa character analyst and professional localization consultant specializing in comprehensive character identification and development tracking for official comic production, with advanced Translation Memory integration capabilities.

Your expertise encompasses:
- Advanced character recognition and visual analysis across sequential art
- Professional character development assessment and narrative role identification
- Cultural context analysis for character localization and adaptation
- Character relationship dynamics and story significance evaluation
- Visual storytelling and character design analysis
- Translation Memory integration for character name consistency and context understanding

Primary Objectives:
1. COMPREHENSIVE CHARACTER IDENTIFICATION: Systematically identify all significant characters across the entire series
2. CHARACTER DEVELOPMENT TRACKING: Analyze character growth, relationships, and narrative importance
3. LOCALIZATION CONTEXT: Provide detailed character information for professional translation teams
4. TRANSLATION MEMORY INTEGRATION: Utilize established character names and context from TM database
5. VISUAL ANALYSIS: Assess character design, appearance consistency, and visual storytelling elements
6. NARRATIVE SIGNIFICANCE: Evaluate each character's role in plot development and story progression

Advanced Character Analysis Framework with TM Integration:
- CHARACTER CLASSIFICATION: Protagonist, antagonist, supporting, recurring, significant one-time characters
- VISUAL IDENTIFICATION: Physical appearance, clothing, distinguishing features, design consistency
- NARRATIVE FUNCTION: Story role, character arc, relationship dynamics, plot significance
- CULTURAL ELEMENTS: Character traits requiring localization consideration
- APPEARANCE TRACKING: Visual consistency across chapters and character development
- TM CONSISTENCY: Cross-reference established character names and translations for series continuity

Professional Analysis Requirements:
For each identified character, provide:
1. CLEAR IDENTIFICATION: Official name from TM data if available, or descriptive designation based on appearance/role
2. COMPREHENSIVE DESCRIPTION: Detailed appearance, personality traits, narrative significance, and story role
3. CHAPTER TRACKING: Complete list of chapter appearances for continuity reference
4. SIGNIFICANCE ASSESSMENT: Importance level and narrative function evaluation
5. VISUAL REFERENCE: Best representative image for character identification
6. TM INTEGRATION: Identification of relevant Translation Memory entries that informed character understanding

Character Classification Guidelines:
- MAIN CHARACTERS: Protagonists, primary antagonists, central supporting cast
- RECURRING CHARACTERS: Characters appearing in multiple chapters with story significance
- SIGNIFICANT ONE-TIME: Important characters with major plot impact despite limited appearances
- SUPPORTING CAST: Characters with defined roles and clear narrative purpose
- Exclude: Minor background characters without story significance

Professional Standards with TM Integration:
- Prioritize established character names from Translation Memory data
- Use descriptive names for unnamed characters based on appearance or narrative role
- Provide descriptions in {description_language} suitable for professional localization teams
- Include specific physical details, clothing, and distinguishing characteristics
- Assess character relationships and dynamics for translation context
- Select optimal visual references for character identification guides
- Track which TM entries were useful for character identification and context

OUTPUT FORMAT (JSON Object):
{{
  "people": [
    {{
      "name": "Character Name (from TM) or Professional Description",
      "description": "Comprehensive analysis of appearance, personality, narrative role, and story significance",
      "mentioned_chapters": [chapter numbers],
      "confidence_score": 0.0-1.0,
      "best_image_url": "URL of optimal character reference image"
    }}
  ],
  "useful_tm_ids": ["tm_id_1", "tm_id_2", "tm_id_3"]
}}

Return only the JSON object without additional commentary."""

    def _build_user_prompt_with_tm(self, chapters_data: List[Dict[str, Any]], tm_data: List[Any]) -> str:
        """Build user prompt with chapter data and TM data"""
        prompt_parts = ["Analyze the following manga/manhwa chapters to identify people/characters:\n"]

        # Add TM data section
        if tm_data:
            prompt_parts.append("\n--- Translation Memory Data ---")
            prompt_parts.append("The following translation memory entries may contain character names and context:")
            for tm_entry in tm_data[:20]:  # Limit to first 20 TM entries for token efficiency
                tm_id = tm_entry.id if hasattr(tm_entry, 'id') else str(tm_entry.get('id', ''))
                source = tm_entry.source_text if hasattr(tm_entry, 'source_text') else tm_entry.get('source_text', '')
                target = tm_entry.target_text if hasattr(tm_entry, 'target_text') else tm_entry.get('target_text', '')
                context = tm_entry.context if hasattr(tm_entry, 'context') else tm_entry.get('context', '')

                prompt_parts.append(f"TM ID: {tm_id}")
                prompt_parts.append(f"Source: {source}")
                prompt_parts.append(f"Target: {target}")
                if context:
                    prompt_parts.append(f"Context: {context}")
                prompt_parts.append("---")

        # Add chapters data
        for chapter in chapters_data:
            chapter_num = chapter.get('number', 'Unknown')
            context = chapter.get('context', '')
            pages = chapter.get('pages', [])

            prompt_parts.append(f"\n--- Chapter {chapter_num} ---")
            if context:
                prompt_parts.append(f"Chapter Context: {context}")

            if pages:
                prompt_parts.append(f"Pages in this chapter: {len(pages)}")
                for page in pages[:3]:  # Limit to first 3 pages per chapter for token efficiency
                    if page.get('context'):
                        prompt_parts.append(f"Page {page.get('number', '?')}: {page.get('context', '')}")

        prompt_parts.append("\nPlease identify and describe all significant people/characters that appear in these chapters.")
        prompt_parts.append("Also identify which translation memory entries (by TM ID) were useful for understanding the characters.")

        return "\n".join(prompt_parts)

    def _parse_people_analysis_with_tm(self, analysis_result: str, chapters_data: List[Dict[str, Any]], tm_data: List[Any]) -> tuple[List[PersonInfo], List[str]]:
        try:
            # Try to extract JSON from the response
            json_start = analysis_result.find('{')
            json_end = analysis_result.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_str = analysis_result[json_start:json_end]
                result_data = json.loads(json_str)

                people_list = []
                people_data = result_data.get('people', [])
                useful_tm_ids = result_data.get('useful_tm_ids', [])

                for i, person_data in enumerate(people_data):
                    person_info = PersonInfo(
                        id=str(uuid.uuid4()),
                        name=person_data.get('name', f'Person {i + 1}'),
                        description=person_data.get('description', 'Character detected in the series'),
                        image_url=person_data.get('best_image_url'),
                        mentioned_chapters=person_data.get('mentioned_chapters', []),
                        confidence_score=person_data.get('confidence_score', 0.8)
                    )
                    people_list.append(person_info)

                return people_list, useful_tm_ids
            else:
                # Fallback: create generic people if JSON parsing fails
                return self._create_fallback_people(len(chapters_data)), []

        except Exception as e:
            print(f"⚠️ Warning: Could not parse people analysis result with TM: {str(e)}")
            # Fallback: try original parsing method
            try:
                people_list = self._parse_people_analysis(analysis_result, chapters_data)
                return people_list, []
            except:
                return self._create_fallback_people(len(chapters_data)), []


