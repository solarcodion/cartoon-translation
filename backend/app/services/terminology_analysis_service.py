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
    """Service for AI-powered terminology analysis using OpenAI GPT"""

    def __init__(self, supabase: Client = None):
        """Initialize terminology analysis service with OpenAI client and optional Supabase client"""
        self.target_language = settings.translation_target_language
        self.supabase = supabase
        self.ai_glossary_service = AIGlossaryService(supabase) if supabase else None
        self.tm_service = TranslationMemoryService(supabase) if supabase else None

        if not settings.openai_api_key:
            print("⚠️ Warning: OpenAI API key not configured. Terminology analysis service will not work.")
            self.client = None
            return

        # Initialize OpenAI client
        openai.api_key = settings.openai_api_key
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
    
    async def analyze_terminology_in_series(
        self, 
        series_id: str, 
        chapters_data: List[Dict[str, Any]], 
        force_refresh: bool = False
    ) -> TerminologyAnalysisResponse:
        """
        Analyze manhwa-specific terminology across all chapters in a series
        
        Args:
            series_id: ID of the series to analyze
            chapters_data: List of chapter data with pages and contexts
            force_refresh: Whether to force re-analysis
            
        Returns:
            TerminologyAnalysisResponse with terminology data and metadata
        """
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
                    print(f"⚠️ Warning: Could not fetch TM data: {str(tm_error)}")

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
            terminology_list, useful_tm_ids = self._parse_terminology_analysis_with_tm(analysis_result, chapters_data, tm_data)
            processing_time = time.time() - start_time

            # Update usage count for useful TM entries
            if self.tm_service and useful_tm_ids:
                try:
                    for tm_id in useful_tm_ids:
                        result = await self.tm_service.increment_usage_count(tm_id)
                        if not result:
                            print(f"❌ Failed to increment usage count for TM ID: {tm_id}")
                except Exception as tm_error:
                    print(f"⚠️ Warning: Failed to update TM usage counts: {str(tm_error)}")

            # Save results to database if AI glossary service is available
            if self.ai_glossary_service and terminology_list:
                try:
                    await self.ai_glossary_service.save_terminology_analysis_results(
                        series_id=series_id,
                        terminology=terminology_list,
                        clear_existing=True
                    )
                except Exception as db_error:
                    print(f"⚠️ Warning: Failed to save to database: {str(db_error)}")
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

Your task is to identify and extract manhwa-specific terminology including:
- Character names (protagonists, antagonists, side characters)
- Place names (cities, kingdoms, dungeons, schools, organizations)
- Items (weapons, artifacts, potions, equipment)
- Skills and techniques (martial arts, magic spells, special abilities)
- Organizations (guilds, clans, sects, companies)
- Titles and ranks (cultivation levels, job classes, noble titles)
- Concepts unique to the story (cultivation systems, game mechanics, special terms)

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

Example:
{{
  "terminology": [
    {{
      "name": "Kiếm Thần",
      "translated_text": "The highest title in martial arts, only achievable by those who can completely master sword techniques. The holder of this title can cut through mountains and split oceans with their sword.",
      "category": "title",
      "description": "Danh hiệu cao quý nhất trong thế giới võ thuật, chỉ những người có thể làm chủ hoàn toàn sức mạnh kiếm thuật mới có thể đạt được. Người sở hữu danh hiệu này có thể chém đứt núi non và chia cắt đại dương.",
      "mentioned_chapters": [1, 5, 12],
      "confidence_score": 0.95
    }},
    {{
      "name": "Tao Léo",
      "translated_text": "A main character in the story, known for their unique abilities and important role in the plot development.",
      "category": "character",
      "description": "Nhân vật chính trong câu chuyện, được biết đến với những khả năng độc đáo và vai trò quan trọng trong việc phát triển cốt truyện.",
      "mentioned_chapters": [1, 3, 7],
      "confidence_score": 0.90
    }}
  ],
  "useful_tm_ids": ["tm_id_123"]
}}

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

        prompt_parts.append("\nPlease identify and extract ALL manhwa-specific terminology that appears in these chapters.")
        prompt_parts.append("IMPORTANT: Extract ALL terminology regardless of whether Translation Memory data helps or not.")
        prompt_parts.append("Focus on terms that would benefit from consistent translation across the series:")
        prompt_parts.append("- Character names (protagonists, antagonists, side characters)")
        prompt_parts.append("- Place names (cities, kingdoms, dungeons, schools, organizations)")
        prompt_parts.append("- Items (weapons, artifacts, potions, equipment)")
        prompt_parts.append("- Skills and techniques (martial arts, magic spells, special abilities)")
        prompt_parts.append("- Organizations (guilds, clans, sects, companies)")
        prompt_parts.append("- Titles and ranks (cultivation levels, job classes, noble titles)")
        prompt_parts.append("- Concepts unique to the story (cultivation systems, game mechanics, special terms)")

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
            print(f"⚠️ Warning: Could not parse terminology analysis result with TM: {str(e)}")
            # Fallback: create generic terminology
            return self._create_fallback_terminology(len(chapters_data)), []
    
    def _create_fallback_terminology(self, num_chapters: int) -> List[TerminologyInfo]:
        """Create fallback terminology when AI analysis fails"""
        fallback_terms = []
        
        # Create generic terms based on common manhwa patterns
        term_templates = [
            {
                "name": "Nhân vật chính",
                "translated_text": "The protagonist of the story who leads the plot and plays the most important role in developing events. Usually possesses special abilities or undergoes strong character development.",
                "category": GlossaryCategory.CHARACTER,
                "description": "Nhân vật chính của câu chuyện, người dẫn dắt cốt truyện và có vai trò quan trọng nhất trong việc phát triển các sự kiện. Thường sở hữu những khả năng đặc biệt hoặc trải qua quá trình phát triển mạnh mẽ.",
                "chapters": list(range(1, min(num_chapters + 1, 6)))
            },
            {
                "name": "Kỹ năng đặc biệt",
                "translated_text": "A special technique or ability that characters use in the story, often with superior power and playing an important role in battles or difficult situations.",
                "category": GlossaryCategory.SKILL,
                "description": "Kỹ năng hoặc kỹ thuật đặc biệt mà các nhân vật sử dụng trong truyện, thường có sức mạnh vượt trội và đóng vai trò quan trọng trong các trận chiến hoặc tình huống khó khăn.",
                "chapters": list(range(1, min(num_chapters + 1, 4)))
            },
            {
                "name": "Vũ khí thần thoại",
                "translated_text": "A weapon of mythological origin or created by magic, possessing extraordinary power and usually only usable by chosen individuals.",
                "category": GlossaryCategory.ITEM,
                "description": "Vũ khí có nguồn gốc từ thần thoại hoặc được tạo ra bằng ma thuật, sở hữu sức mạnh phi thường và thường chỉ có thể được sử dụng bởi những người được chọn.",
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

        # Define category mappings to enum values (only using database-allowed categories)
        category_mappings = {
            # Character-related
            'character': GlossaryCategory.CHARACTER,
            'person': GlossaryCategory.CHARACTER,
            'protagonist': GlossaryCategory.CHARACTER,
            'antagonist': GlossaryCategory.CHARACTER,
            'hero': GlossaryCategory.CHARACTER,
            'villain': GlossaryCategory.CHARACTER,
            'people': GlossaryCategory.CHARACTER,

            # Skill-related
            'skill': GlossaryCategory.SKILL,
            'ability': GlossaryCategory.SKILL,
            'technique': GlossaryCategory.SKILL,
            'power': GlossaryCategory.SKILL,
            'magic': GlossaryCategory.SKILL,
            'spell': GlossaryCategory.SKILL,
            'martial_art': GlossaryCategory.SKILL,

            # Item-related (including locations, organizations, and concepts as items)
            'item': GlossaryCategory.ITEM,
            'weapon': GlossaryCategory.ITEM,
            'tool': GlossaryCategory.ITEM,
            'artifact': GlossaryCategory.ITEM,
            'equipment': GlossaryCategory.ITEM,
            'object': GlossaryCategory.ITEM,

            # Location-related (map to item since location not allowed in DB)
            'place': GlossaryCategory.ITEM,
            'location': GlossaryCategory.ITEM,
            'area': GlossaryCategory.ITEM,
            'region': GlossaryCategory.ITEM,
            'city': GlossaryCategory.ITEM,
            'building': GlossaryCategory.ITEM,

            # Organization-related (map to item since organization not allowed in DB)
            'organization': GlossaryCategory.ITEM,
            'guild': GlossaryCategory.ITEM,
            'clan': GlossaryCategory.ITEM,
            'faction': GlossaryCategory.ITEM,
            'group': GlossaryCategory.ITEM,
            'team': GlossaryCategory.ITEM,

            # Concept-related (map to item as fallback)
            'concept': GlossaryCategory.ITEM,
            'idea': GlossaryCategory.ITEM,
            'theory': GlossaryCategory.ITEM,
            'principle': GlossaryCategory.ITEM,
            'rule': GlossaryCategory.ITEM,
            'law': GlossaryCategory.ITEM,
        }

        # Return mapped category or default to ITEM
        return category_mappings.get(category_lower, GlossaryCategory.ITEM)

    async def health_check(self) -> dict:
        """Check if terminology analysis service is working"""
        try:
            if not self.client:
                return {
                    "status": "unhealthy",
                    "service": "OpenAI GPT Terminology Analysis",
                    "error": "OpenAI API key not configured"
                }
            
            return {
                "status": "healthy",
                "service": "OpenAI GPT Terminology Analysis",
                "target_language": self.target_language,
                "model": "gpt-4o-mini"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "service": "OpenAI GPT Terminology Analysis",
                "error": str(e)
            }
