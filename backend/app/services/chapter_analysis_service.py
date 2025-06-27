import openai
import time
from typing import Optional, List
from app.config import settings
from app.models import ChapterAnalysisRequest, ChapterAnalysisResponse, PageAnalysisData


class ChapterAnalysisService:
    """Service for AI-powered chapter analysis using OpenAI GPT"""
    
    def __init__(self):
        """Initialize chapter analysis service with OpenAI client"""
        self.target_language = settings.translation_target_language

        if not settings.openai_api_key:
            print("⚠️ Warning: OpenAI API key not configured. Chapter analysis service will not work.")
            self.client = None
            return

        # Initialize OpenAI client
        openai.api_key = settings.openai_api_key
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
    
    async def analyze_chapter(self, request: ChapterAnalysisRequest) -> ChapterAnalysisResponse:
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

            # Build the analysis prompt
            system_prompt = self._build_system_prompt(request.translation_info, request.existing_context)
            user_prompt = self._build_user_prompt(request.pages)
            
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
            
            # Parse the analysis result to extract context and summary
            chapter_context, analysis_summary = self._parse_analysis_result(analysis_result)
            
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
- Explain picture content and preserve story understanding
- Provide comprehensive context for future translation work
- Focus on character development, plot progression, and key story elements
- Maintain consistency with any existing context provided

Format your response as:
CHAPTER_CONTEXT: [Detailed context explaining the chapter's story content]
ANALYSIS_SUMMARY: [Summary of key events, character interactions, and plot developments]"""

        return base_prompt
    
    def _build_user_prompt(self, pages: List[PageAnalysisData]) -> str:
        """Build user prompt with page data"""
        prompt = f"Please analyze this chapter with {len(pages)} pages:\n\n"
        
        for page in sorted(pages, key=lambda x: x.page_number):
            prompt += f"Page {page.page_number}:\n"
            prompt += f"- Image URL: {page.image_url}\n"
            if page.ocr_context:
                prompt += f"- OCR Context: {page.ocr_context}\n"
            else:
                prompt += "- OCR Context: [No text detected]\n"
            prompt += "\n"
        
        prompt += "Please provide a comprehensive analysis following the format specified in the system prompt."
        
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
