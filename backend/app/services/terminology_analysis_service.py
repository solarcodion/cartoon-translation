from typing import List, Optional, Dict, Any, Tuple
import openai
import time
import uuid
import json
from supabase import Client

from app.config import settings
from app.models import TerminologyInfo, TerminologyAnalysisResponse, GlossaryCategory
from app.services.ai_glossary_service import AIGlossaryService
from app.services.translation_memory_service import TranslationMemoryService


class TerminologyAnalysisService:
    def __init__(self, supabase: Client = None):
        self.target_language = settings.translation_target_language
        self.supabase = supabase
        self.ai_glossary_service = AIGlossaryService(supabase) if supabase else None
        self.tm_service = TranslationMemoryService(supabase) if supabase else None

        if not settings.openai_api_key:
            print("Warning: OpenAI API key not configured. Terminology analysis service will not work.")
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
        try:
            start_time = time.time()

            if not self.client:
                raise ValueError("Terminology analysis service is not properly configured. Please check OpenAI API key.")

            if not chapters_data:
                raise ValueError("No chapter data provided for analysis")

            # Get TM data for better context
            tm_data = []
            if self.tm_service:
                try:
                    tm_data = await self.tm_service.get_all_tm_entries_for_analysis(series_id)
                except Exception as tm_error:
                    print(f"Warning: Could not fetch TM data: {str(tm_error)}")

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
                max_tokens=1500,  # Increased token limit for comprehensive terminology analysis
                temperature=0.3,
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )

            # Extract and parse the analysis result
            analysis_result = response.choices[0].message.content.strip()
            terminology_list, useful_tm_ids = self._parse_terminology_analysis_with_tm(analysis_result, chapters_data, tm_data)
            processing_time = time.time() - start_time

            # Update usage count for useful TM entries
            if self.tm_service and useful_tm_ids:
                try:
                    for tm_id in useful_tm_ids:
                        result = await self.tm_service.increment_usage_count(tm_id)
                        if not result:
                            print(f"Failed to increment usage count for TM ID: {tm_id}")
                except Exception as tm_error:
                    print(f"Warning: Failed to update TM usage counts: {str(tm_error)}")

            # Save results to database if AI glossary service is available
            if self.ai_glossary_service and terminology_list:
                try:
                    await self.ai_glossary_service.save_terminology_analysis_results(
                        series_id=series_id,
                        terminology=terminology_list,
                        clear_existing=True
                    )
                except Exception as db_error:
                    print(f"Warning: Failed to save to database: {str(db_error)}")
                    # Continue without failing the analysis

            return TerminologyAnalysisResponse(
                success=True,
                terminology=terminology_list,
                total_terms_found=len(terminology_list),
                processing_time=processing_time,
                model="gpt-4o-mini",
                tokens_used=response.usage.total_tokens if response.usage else None
            )
            
        except openai.RateLimitError as e:
            print(f"❌ OpenAI rate limit exceeded: {str(e)}")
            raise Exception("Terminology analysis service is currently busy. Please try again later.")
        except openai.APIError as e:
            print(f"❌ OpenAI API error: {str(e)}")
            raise Exception(f"Terminology analysis failed: {str(e)}")
        except Exception as e:
            print(f"❌ Terminology analysis error: {str(e)}")
            raise Exception(f"Terminology analysis failed: {str(e)}")
    
    def _build_system_prompt_with_tm(self) -> str:
        """Build system prompt for terminology analysis with TM data"""
        return f"""You are an expert manhwa/manga terminology analyst specializing in identifying and categorizing manhwa-specific terms. You have access to translation memory data that can help understand term translations and context.

Your task is to identify and extract ALL types of manhwa-specific terminology. You MUST find terms from MULTIPLE categories, not just characters:

REQUIRED CATEGORIES (find at least 1-2 terms from each if they exist):
- CHARACTER: Named people (protagonists, antagonists, side characters, NPCs)
- ITEM: Objects (weapons, artifacts, potions, equipment, tools, food)
- PLACE: Locations (cities, kingdoms, dungeons, schools, buildings, areas)
- TERM: Skills, abilities, techniques, magic spells, special powers, fighting styles
- OTHER: Organizations, groups, guilds, clans, concepts, systems, rules, anything else

Guidelines:
- Focus on terms that are specific to this manhwa and would benefit from consistent translation
- Extract ALL manhwa-specific terminology regardless of whether TM data helps or not
- Categorize each term appropriately (character, place, item, skill, organization, title, concept)
- For name: provide the term name as it appears in the manhwa
- For description: provide detailed Vietnamese descriptions that explain the term's significance, role, or function in the story
- For characters: describe their role, personality, abilities, and importance to the story in Vietnamese
- For places: describe the location's purpose, significance, and characteristics in Vietnamese
- For items: describe the item's function, power, rarity, and importance in Vietnamese
- For skills/techniques: describe what the skill does, how it's used, and its effects in Vietnamese
- For translated_text: provide the English translation of the Vietnamese description
- Use translation memory data to ensure consistent translations when available
- IMPORTANT: When you use any TM entry to understand or translate a term, you MUST include its TM ID in the useful_tm_ids array
- If a TM entry helps you understand character names, places, or terminology, include its TM ID
- Save ALL detected terminology, not just the ones that use TM data
- Ignore common words and focus on proper nouns and specialized terminology

Format your response as a JSON object with this structure:
{{
  "terminology": [
    {{
      "name": "Term Name",
      "translated_text": "English translation of the Vietnamese description",
      "category": "character|place|item|skill|organization|title|concept",
      "description": "Detailed Vietnamese description explaining the term's significance and role",
      "mentioned_chapters": [1, 2, 3],
      "confidence_score": 0.95
    }}
  ],
  "useful_tm_ids": ["tm_id_1", "tm_id_2"]
}}

Example (MUST include diverse categories):
{{
  "terminology": [
    {{
      "name": "Tao Léo",
      "translated_text": "A main character in the story with unique abilities.",
      "category": "character",
      "description": "Nhân vật chính trong câu chuyện với khả năng đặc biệt.",
      "mentioned_chapters": [1],
      "confidence_score": 0.90
    }},
    {{
      "name": "Kiếm lửa",
      "translated_text": "A magical sword that can create fire attacks.",
      "category": "item",
      "description": "Thanh kiếm ma thuật có thể tạo ra các đòn tấn công lửa.",
      "mentioned_chapters": [1],
      "confidence_score": 0.85
    }},
    {{
      "name": "Học viện Thần thánh",
      "translated_text": "The sacred academy where students learn magic.",
      "category": "place",
      "description": "Học viện thiêng liêng nơi học sinh học phép thuật.",
      "mentioned_chapters": [1],
      "confidence_score": 0.80
    }},
    {{
      "name": "Phép thuật gió",
      "translated_text": "Wind magic ability used for movement and attacks.",
      "category": "term",
      "description": "Khả năng phép thuật gió dùng để di chuyển và tấn công.",
      "mentioned_chapters": [1],
      "confidence_score": 0.75
    }},
    {{
      "name": "Hội Kiếm sĩ",
      "translated_text": "The swordsman guild that trains warriors.",
      "category": "other",
      "description": "Hội những kiếm sĩ huấn luyện các chiến binh.",
      "mentioned_chapters": [1],
      "confidence_score": 0.70
    }}
  ],
  "useful_tm_ids": ["tm_id_123"]
}}

CRITICAL: Your response MUST include terms from at least 3 different categories. Do not focus only on characters!

Only return the JSON object, no additional text."""

    def _build_user_prompt_with_tm(self, chapters_data: List[Dict[str, Any]], tm_data: List[Any]) -> str:
        """Build user prompt with chapter data and TM data"""
        prompt_parts = ["Analyze the following manhwa chapters to identify and extract manhwa-specific terminology:\n"]
        
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
        
        # Add TM data for context
        if tm_data:
            prompt_parts.append(f"\n--- Translation Memory Data (for reference) ---")
            prompt_parts.append(f"Available TM entries: {len(tm_data)}")
            for i, tm_entry in enumerate(tm_data[:10]):  # Limit to first 10 TM entries for token efficiency
                # Handle both dict and object formats
                if hasattr(tm_entry, 'id'):
                    tm_id = tm_entry.id
                    source = tm_entry.source_text
                    target = tm_entry.target_text
                    context = getattr(tm_entry, 'context', None)
                else:
                    tm_id = tm_entry.get('id', 'unknown')
                    source = tm_entry.get('source_text', '')
                    target = tm_entry.get('target_text', '')
                    context = tm_entry.get('context', None)

                if source and target:
                    entry_text = f"TM ID {tm_id}: '{source}' -> '{target}'"
                    if context:
                        entry_text += f" (Context: {context})"
                    prompt_parts.append(entry_text)

            if len(tm_data) > 10:
                prompt_parts.append(f"... and {len(tm_data) - 10} more TM entries available")
        else:
            prompt_parts.append(f"\n--- No Translation Memory Data Available ---")

        prompt_parts.append("\nCRITICAL INSTRUCTION: You MUST find terminology from MULTIPLE categories, not just characters!")
        prompt_parts.append("\nAnalyze the text carefully and extract ALL manhwa-specific terminology from these 5 categories:")
        prompt_parts.append("CHARACTER: Any named people or characters")
        prompt_parts.append("ITEM: Any objects mentioned (weapons, tools, food, equipment, artifacts)")
        prompt_parts.append("PLACE: Any location names (cities, buildings, areas, regions, schools)")
        prompt_parts.append("TERM: Any skills, abilities, techniques, magic spells, powers, fighting styles")
        prompt_parts.append("OTHER: Organizations, groups, guilds, concepts, systems, rules, anything else")
        prompt_parts.append("\nIMPORTANT: Use EXACTLY these 5 categories: character, item, place, term, other")
        prompt_parts.append("If something doesn't fit character/item/place/term, put it in 'other' category.")

        if tm_data:
            prompt_parts.append("\nTranslation Memory Usage:")
            prompt_parts.append("- When you use any of the Translation Memory entries above to understand character names, places, or terminology, you MUST include their TM ID in the 'useful_tm_ids' array.")
            prompt_parts.append("- For example, if TM ID 'abc123' helped you understand a character name, include 'abc123' in the useful_tm_ids array.")
            prompt_parts.append("- If no TM entries were useful, set useful_tm_ids to an empty array []")
        else:
            prompt_parts.append("\nNo translation memory data is available for this analysis. Set useful_tm_ids to an empty array [].")

        return "\n".join(prompt_parts)

    def _parse_terminology_analysis_with_tm(self, analysis_result: str, chapters_data: List[Dict[str, Any]], tm_data: List[Any]) -> Tuple[List[TerminologyInfo], List[str]]:
        """Parse the AI analysis result into TerminologyInfo objects and useful TM IDs"""
        try:
            # Try to extract JSON from the response
            json_start = analysis_result.find('{')
            json_end = analysis_result.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = analysis_result[json_start:json_end]
                result_data = json.loads(json_str)
                
                terminology_list = []
                for term_data in result_data.get('terminology', []):
                    # Map AI-generated categories to valid database categories
                    raw_category = term_data.get('category', 'concept')
                    valid_category = self._map_to_valid_category(raw_category)

                    term_info = TerminologyInfo(
                        id=str(uuid.uuid4()),
                        name=term_data.get('name', 'Unknown Term'),
                        translated_text=term_data.get('translated_text', ''),
                        category=valid_category,
                        description=term_data.get('description', 'Terminology detected in the series'),
                        mentioned_chapters=term_data.get('mentioned_chapters', []),
                        confidence_score=term_data.get('confidence_score', 0.8)
                    )
                    terminology_list.append(term_info)
                
                # Extract and validate TM IDs
                useful_tm_ids = result_data.get('useful_tm_ids', [])

                # Validate that these TM IDs exist in our TM data
                if tm_data and useful_tm_ids:
                    # Handle both dict and object formats for TM data
                    if hasattr(tm_data[0], 'id'):
                        valid_tm_ids = [tm_entry.id for tm_entry in tm_data]
                    else:
                        valid_tm_ids = [tm_entry.get('id') for tm_entry in tm_data]

                    # Filter to only include valid TM IDs
                    useful_tm_ids = [tm_id for tm_id in useful_tm_ids if tm_id in valid_tm_ids]

                return terminology_list, useful_tm_ids
            else:
                # Fallback: create generic terminology if JSON parsing fails
                return self._create_fallback_terminology(len(chapters_data)), []

        except Exception as e:
            print(f"Warning: Could not parse terminology analysis result with TM: {str(e)}")
            # Fallback: create generic terminology
            return self._create_fallback_terminology(len(chapters_data)), []
    
    def _create_fallback_terminology(self, num_chapters: int) -> List[TerminologyInfo]:
        fallback_terms = []
        
        # Create generic terms based on common manhwa patterns using the 5 categories
        term_templates = [
            {
                "name": "Nhân vật chính",
                "translated_text": "The protagonist of the story who leads the plot and plays the most important role in developing events.",
                "category": GlossaryCategory.CHARACTER,
                "description": "Nhân vật chính của câu chuyện, người dẫn dắt cốt truyện và có vai trò quan trọng nhất trong việc phát triển các sự kiện.",
                "chapters": list(range(1, min(num_chapters + 1, 3)))
            },
            {
                "name": "Vũ khí ma thuật",
                "translated_text": "A magical weapon with special powers used by characters in the story.",
                "category": GlossaryCategory.ITEM,
                "description": "Vũ khí ma thuật có sức mạnh đặc biệt được các nhân vật sử dụng trong truyện.",
                "chapters": list(range(1, min(num_chapters + 1, 3)))
            },
            {
                "name": "Học viện",
                "translated_text": "The academy or school where characters learn and train their abilities.",
                "category": GlossaryCategory.PLACE,
                "description": "Học viện hoặc trường học nơi các nhân vật học hỏi và rèn luyện khả năng của mình.",
                "chapters": list(range(1, min(num_chapters + 1, 3)))
            },
            {
                "name": "Kỹ năng đặc biệt",
                "translated_text": "A special technique or ability that characters use in battles or difficult situations.",
                "category": GlossaryCategory.TERM,
                "description": "Kỹ năng hoặc kỹ thuật đặc biệt mà các nhân vật sử dụng trong các trận chiến hoặc tình huống khó khăn.",
                "chapters": list(range(1, min(num_chapters + 1, 3)))
            },
            {
                "name": "Hệ thống tu luyện",
                "translated_text": "The cultivation or training system used in the story world.",
                "category": GlossaryCategory.OTHER,
                "description": "Hệ thống tu luyện hoặc rèn luyện được sử dụng trong thế giới truyện.",
                "chapters": list(range(1, min(num_chapters + 1, 3)))
            }
        ]
        
        for template in term_templates:
            term_info = TerminologyInfo(
                id=str(uuid.uuid4()),
                name=template["name"],
                translated_text=template["translated_text"],
                category=template["category"],
                description=template["description"],
                mentioned_chapters=template["chapters"],
                confidence_score=0.6  # Lower confidence for fallback data
            )
            fallback_terms.append(term_info)
        
        return fallback_terms

    def _map_to_valid_category(self, raw_category: str) -> GlossaryCategory:
        """
        Map AI-generated categories to valid database categories

        Args:
            raw_category: The category generated by AI

        Returns:
            A valid GlossaryCategory enum value
        """
        # Convert to lowercase for case-insensitive matching
        category_lower = raw_category.lower().strip()

        # Define category mappings to the 5 allowed categories
        category_mappings = {
            # Character-related
            'character': GlossaryCategory.CHARACTER,
            'person': GlossaryCategory.CHARACTER,
            'protagonist': GlossaryCategory.CHARACTER,
            'antagonist': GlossaryCategory.CHARACTER,
            'hero': GlossaryCategory.CHARACTER,
            'villain': GlossaryCategory.CHARACTER,
            'people': GlossaryCategory.CHARACTER,

            # Item-related
            'item': GlossaryCategory.ITEM,
            'weapon': GlossaryCategory.ITEM,
            'tool': GlossaryCategory.ITEM,
            'artifact': GlossaryCategory.ITEM,
            'equipment': GlossaryCategory.ITEM,
            'object': GlossaryCategory.ITEM,
            'food': GlossaryCategory.ITEM,
            'potion': GlossaryCategory.ITEM,

            # Place-related
            'place': GlossaryCategory.PLACE,
            'location': GlossaryCategory.PLACE,
            'area': GlossaryCategory.PLACE,
            'region': GlossaryCategory.PLACE,
            'city': GlossaryCategory.PLACE,
            'building': GlossaryCategory.PLACE,
            'school': GlossaryCategory.PLACE,
            'academy': GlossaryCategory.PLACE,

            # Term-related (skills, abilities, techniques)
            'term': GlossaryCategory.TERM,
            'skill': GlossaryCategory.TERM,
            'ability': GlossaryCategory.TERM,
            'power': GlossaryCategory.TERM,
            'magic': GlossaryCategory.TERM,
            'spell': GlossaryCategory.TERM,
            'technique': GlossaryCategory.TERM,
            'martial_art': GlossaryCategory.TERM,
            'fighting_style': GlossaryCategory.TERM,

            # Other-related (everything else)
            'other': GlossaryCategory.OTHER,
            'organization': GlossaryCategory.OTHER,
            'guild': GlossaryCategory.OTHER,
            'clan': GlossaryCategory.OTHER,
            'faction': GlossaryCategory.OTHER,
            'group': GlossaryCategory.OTHER,
            'team': GlossaryCategory.OTHER,
            'concept': GlossaryCategory.OTHER,
            'idea': GlossaryCategory.OTHER,
            'theory': GlossaryCategory.OTHER,
            'principle': GlossaryCategory.OTHER,
            'rule': GlossaryCategory.OTHER,
            'law': GlossaryCategory.OTHER,
            'title': GlossaryCategory.OTHER,
            'rank': GlossaryCategory.OTHER,
            'level': GlossaryCategory.OTHER,
            'system': GlossaryCategory.OTHER,
        }

        # Return mapped category or default to OTHER
        return category_mappings.get(category_lower, GlossaryCategory.OTHER)


