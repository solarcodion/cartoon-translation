import openai
import time
import uuid
import json
from typing import List, Optional, Dict, Any
from supabase import Client
from app.config import settings
from app.models import PeopleAnalysisRequest, PeopleAnalysisResponse, PersonInfo
from app.services.ai_glossary_service import AIGlossaryService
from app.services.translation_memory_service import TranslationMemoryService


class PeopleAnalysisService:
    """Service for AI-powered people/character analysis using OpenAI GPT"""

    def __init__(self, supabase: Client = None):
        """Initialize people analysis service with OpenAI client and optional Supabase client"""
        self.target_language = settings.translation_target_language
        self.supabase = supabase
        self.ai_glossary_service = AIGlossaryService(supabase) if supabase else None
        self.tm_service = TranslationMemoryService(supabase) if supabase else None

        if not settings.openai_api_key:
            print("⚠️ Warning: OpenAI API key not configured. People analysis service will not work.")
            self.client = None
            return

        # Initialize OpenAI client
        openai.api_key = settings.openai_api_key
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
    
    async def analyze_people_in_series(
        self, 
        series_id: str, 
        chapters_data: List[Dict[str, Any]], 
        force_refresh: bool = False
    ) -> PeopleAnalysisResponse:
        """
        Analyze people/characters across all chapters in a series
        
        Args:
            series_id: ID of the series to analyze
            chapters_data: List of chapter data with pages and contexts
            force_refresh: Whether to force re-analysis
            
        Returns:
            PeopleAnalysisResponse with detected people information
        """
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

            # Get translation memory data for the series
            tm_data = []
            useful_tm_ids = []
            if self.tm_service:
                try:
                    tm_data = await self.tm_service.get_all_tm_entries_for_analysis(series_id)
                    print(f"📚 Retrieved {len(tm_data)} TM entries for series analysis")
                except Exception as tm_error:
                    print(f"⚠️ Warning: Failed to fetch TM data: {str(tm_error)}")

            # Build the analysis prompt with TM data
            system_prompt = self._build_system_prompt_with_tm()
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
                    print(f"✅ Updated usage count for {len(useful_tm_ids)} useful TM entries")
                except Exception as tm_error:
                    print(f"⚠️ Warning: Failed to update TM usage counts: {str(tm_error)}")

            # Save results to database if AI glossary service is available
            if self.ai_glossary_service and people_list:
                try:
                    await self.ai_glossary_service.save_people_analysis_results(
                        series_id=series_id,
                        people=people_list,
                        useful_tm_ids=useful_tm_ids,
                        clear_existing=True
                    )
                except Exception as db_error:
                    print(f"⚠️ Warning: Failed to save to database: {str(db_error)}")
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
            print(f"❌ OpenAI rate limit exceeded: {str(e)}")
            raise Exception("People analysis service is currently busy. Please try again later.")
        except openai.APIError as e:
            print(f"❌ OpenAI API error: {str(e)}")
            raise Exception(f"People analysis failed: {str(e)}")
        except Exception as e:
            print(f"❌ People analysis error: {str(e)}")
            raise Exception(f"People analysis failed: {str(e)}")
    
    def _build_system_prompt(self) -> str:
        """Build system prompt for people analysis"""
        return f"""You are an expert manga/manhwa character analyst specializing in identifying and describing people/characters in visual stories.

Your task is to analyze all chapters of a series and identify the main people/characters that appear throughout the story. For each person/character you identify, provide:

1. A clear, descriptive name (if not explicitly mentioned, create an appropriate descriptive name like "Main Protagonist", "Blonde Girl", "Elderly Mentor", etc.)
2. A detailed description of their appearance, role, and significance in the story
3. Which chapters they appear in
4. Their importance/prominence in the story
5. If possible, identify the best image URL from the provided pages that shows this character clearly

Guidelines:
- Focus on recurring characters and important one-time characters
- If character names are not clear, use descriptive names based on appearance or role
- Provide descriptions in {self.target_language}
- Include both main characters and significant supporting characters
- Ignore very minor background characters unless they seem important
- Be specific about physical appearance, clothing, and distinguishing features
- Mention their role in the story (protagonist, antagonist, mentor, friend, etc.)
- For image_url, select the page image that best shows the character's face/appearance

Format your response as a JSON array with this structure:
[
  {{
    "name": "Character Name or Description",
    "description": "Detailed description of appearance, role, and significance",
    "mentioned_chapters": [1, 2, 3],
    "confidence_score": 0.95,
    "best_image_url": "URL of the page image that best shows this character"
  }}
]

Only return the JSON array, no additional text."""

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
            print(f"⚠️ Warning: Could not parse people analysis result: {str(e)}")
            # Fallback: create generic people
            return self._create_fallback_people(len(chapters_data))
    
    def _create_fallback_people(self, num_chapters: int) -> List[PersonInfo]:
        """Create fallback people when AI analysis fails"""
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

    def _build_system_prompt_with_tm(self) -> str:
        """Build system prompt for people analysis with TM data"""
        return f"""You are an expert manga/manhwa character analyst specializing in identifying and describing people/characters in visual stories. You also have access to translation memory data that can help understand character names and context.

Your task is to analyze all chapters of a series and identify the main people/characters that appear throughout the story. For each person/character you identify, provide:

1. A clear, descriptive name (if not explicitly mentioned, create an appropriate descriptive name like "Main Protagonist", "Blonde Girl", "Elderly Mentor", etc.)
2. A detailed description of their appearance, role, and significance in the story
3. Which chapters they appear in
4. Their importance/prominence in the story
5. If possible, identify the best image URL from the provided pages that shows this character clearly
6. Identify which translation memory entries (if any) were useful for understanding this character

Guidelines:
- Focus on recurring characters and important one-time characters
- If character names are not clear, use descriptive names based on appearance or role
- Provide descriptions in {self.target_language}
- Include both main characters and significant supporting characters
- Ignore very minor background characters unless they seem important
- Be specific about physical appearance, clothing, and distinguishing features
- Mention their role in the story (protagonist, antagonist, mentor, friend, etc.)
- For image_url, select the page image that best shows the character's face/appearance
- Use translation memory data to better understand character names and context
- Identify which TM entries helped you understand the characters

Format your response as a JSON object with this structure:
{{
  "people": [
    {{
      "name": "Character Name or Description",
      "description": "Detailed description of appearance, role, and significance",
      "mentioned_chapters": [1, 2, 3],
      "confidence_score": 0.95,
      "best_image_url": "URL of the page image that best shows this character"
    }}
  ],
  "useful_tm_ids": ["tm_id_1", "tm_id_2"]
}}

Only return the JSON object, no additional text."""

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
        """Parse the AI analysis result into PersonInfo objects and useful TM IDs"""
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

    async def health_check(self) -> dict:
        """Check if people analysis service is working"""
        try:
            if not self.client:
                return {
                    "status": "unhealthy",
                    "service": "OpenAI GPT People Analysis",
                    "error": "OpenAI API key not configured"
                }
            
            return {
                "status": "healthy",
                "service": "OpenAI GPT People Analysis",
                "target_language": self.target_language,
                "model": "gpt-4o-mini"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "service": "OpenAI GPT People Analysis",
                "error": str(e)
            }
