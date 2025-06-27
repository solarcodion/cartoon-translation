import openai
import time
from typing import Optional
from app.config import settings


class TranslationService:
    """Service for AI translation using OpenAI GPT"""
    
    def __init__(self):
        """Initialize translation service with OpenAI client"""
        self.target_language = settings.translation_target_language

        if not settings.openai_api_key:
            print("⚠️ Warning: OpenAI API key not configured. Translation service will not work.")
            self.client = None
            return

        # Initialize OpenAI client
        openai.api_key = settings.openai_api_key
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
    
    async def translate_text(
        self, 
        source_text: str, 
        target_language: Optional[str] = None,
        context: Optional[str] = None
    ) -> dict:
        """
        Translate text using OpenAI GPT
        
        Args:
            source_text: Text to translate
            target_language: Target language (defaults to configured language)
            context: Additional context for better translation
            
        Returns:
            Dictionary with translation result and metadata
        """
        try:
            start_time = time.time()

            if not source_text or not source_text.strip():
                raise ValueError("Source text cannot be empty")

            if not self.client:
                raise ValueError("Translation service is not properly configured. Please check OpenAI API key.")

            # Use provided target language or default
            target_lang = target_language or self.target_language
            
            # Build the translation prompt
            system_prompt = self._build_system_prompt(target_lang, context)
            user_prompt = f"Translate this text: {source_text.strip()}"
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=800,  # Maximum response length set to 800 tokens
                temperature=0.3,  # Lower temperature for more consistent translations
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )
            
            # Extract translated text
            translated_text = response.choices[0].message.content.strip()
            processing_time = time.time() - start_time
            
            return {
                "success": True,
                "source_text": source_text,
                "translated_text": translated_text,
                "target_language": target_lang,
                "processing_time": processing_time,
                "model": "gpt-3.5-turbo",
                "tokens_used": response.usage.total_tokens if response.usage else None
            }
            
        except openai.RateLimitError as e:
            print(f"❌ OpenAI rate limit exceeded: {str(e)}")
            raise Exception("Translation service is currently busy. Please try again later.")
        
        except openai.AuthenticationError as e:
            print(f"❌ OpenAI authentication error: {str(e)}")
            raise Exception("Translation service authentication failed.")
        
        except openai.APIError as e:
            print(f"❌ OpenAI API error: {str(e)}")
            raise Exception(f"Translation service error: {str(e)}")
        
        except Exception as e:
            print(f"❌ Translation error: {str(e)}")
            raise Exception(f"Translation failed: {str(e)}")
    
    def _build_system_prompt(self, target_language: str, context: Optional[str] = None) -> str:
        """Build system prompt for translation"""
        base_prompt = f"""You are a professional translator specializing in manga/manhwa translation.
        
Your task is to translate text from images (likely Korean or Japanese) to {target_language}.

Guidelines:
1. Provide natural, fluent translations that preserve the original meaning
2. Consider the context of manga/manhwa dialogue and narration
3. Maintain the tone and style appropriate for the genre
4. For onomatopoeia (sound effects), either translate to equivalent sounds in {target_language} or keep original if more appropriate
5. For names and proper nouns, keep them in original form unless there's a standard translation
6. Return ONLY the translated text, no explanations or additional comments"""

        if context:
            base_prompt += f"\n\nAdditional context: {context}"
        
        return base_prompt
    
    async def translate_with_memory(
        self,
        source_text: str,
        series_context: Optional[str] = None,
        character_names: Optional[list] = None,
        target_language: Optional[str] = None
    ) -> dict:
        """
        Translate text with series-specific context and character names
        
        Args:
            source_text: Text to translate
            series_context: Context about the series/story
            character_names: List of character names to preserve
            target_language: Target language
            
        Returns:
            Dictionary with translation result and metadata
        """
        try:
            # Build enhanced context
            context_parts = []
            
            if series_context:
                context_parts.append(f"Series context: {series_context}")
            
            if character_names:
                names_str = ", ".join(character_names)
                context_parts.append(f"Character names to preserve: {names_str}")
            
            enhanced_context = " | ".join(context_parts) if context_parts else None
            
            # Use the regular translation method with enhanced context
            return await self.translate_text(
                source_text=source_text,
                target_language=target_language,
                context=enhanced_context
            )
            
        except Exception as e:
            print(f"❌ Enhanced translation error: {str(e)}")
            raise Exception(f"Enhanced translation failed: {str(e)}")
    
    def get_supported_languages(self) -> list:
        """Get list of supported target languages"""
        return [
            "Vietnamese",
            "English", 
            "Spanish",
            "French",
            "German",
            "Italian",
            "Portuguese",
            "Russian",
            "Chinese (Simplified)",
            "Chinese (Traditional)",
            "Japanese",
            "Korean",
            "Thai",
            "Indonesian",
            "Malay"
        ]
    
    async def health_check(self) -> dict:
        """Check if translation service is working"""
        try:
            # Simple test translation
            test_result = await self.translate_text("Hello", "Vietnamese")
            return {
                "status": "healthy",
                "service": "OpenAI GPT Translation",
                "target_language": self.target_language,
                "test_successful": test_result["success"]
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "service": "OpenAI GPT Translation",
                "error": str(e)
            }
