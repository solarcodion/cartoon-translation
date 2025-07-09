import openai
import time
from typing import Optional
from app.config import settings


class TranslationService:
    def __init__(self):
        self.target_language = settings.translation_target_language

        if not settings.openai_api_key:
            print("Warning: OpenAI API key not configured. Translation service will not work.")
            self.client = None
            return

        self.client = openai.OpenAI(api_key=settings.openai_api_key)

    async def translate_text(
        self,
        source_text: str,
        target_language: Optional[str] = None,
        context: Optional[str] = None
    ) -> dict:
        try:
            start_time = time.time()

            if not source_text or not source_text.strip():
                raise ValueError("Source text cannot be empty")

            if not self.client:
                raise ValueError("Translation service is not properly configured. Please check OpenAI API key.")

            target_lang = target_language or self.target_language
            
            # Build the translation prompt
            system_prompt = self._build_system_prompt(target_lang, context)
            user_prompt = f"Translate this text: {source_text.strip()}"
            
            # Call OpenAI API with latest GPT model
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Use latest GPT model for better accuracy
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
                "model": "gpt-4o-mini",
                "tokens_used": response.usage.total_tokens if response.usage else None
            }
            
        except openai.RateLimitError as e:
            print(f"OpenAI rate limit exceeded: {str(e)}")
            raise Exception("Translation service is currently busy. Please try again later.")

        except openai.AuthenticationError as e:
            print(f"OpenAI authentication error: {str(e)}")
            raise Exception("Translation service authentication failed.")

        except openai.APIError as e:
            print(f"OpenAI API error: {str(e)}")
            raise Exception(f"Translation service error: {str(e)}")

        except Exception as e:
            print(f"Translation error: {str(e)}")
            raise Exception(f"Translation failed: {str(e)}")
    
    def _build_system_prompt(self, target_language: str, context: Optional[str] = None) -> str:
        base_prompt = f"""You are assisting in the translation and localization of manhwa panels for professional comic production.

Your task is to:

1. Detect and transcribe all text in the image, including:
   - Dialogue
   - Narration
   - Sound effects (SFX)
   - Overlayed or stylized text

2. Translate each piece of text accurately into {target_language}.

3. Localize the translated text into natural, fluent {target_language} suitable for an official manhwa/webtoon adaptation. Keep the tone appropriate to the context (e.g., dramatic, somber, intense, comedic).

Professional Translation Guidelines:
- Preserve the original meaning and emotional impact
- Adapt cultural references and idioms appropriately for {target_language} readers
- Maintain character voice consistency and personality through dialogue
- Handle honorifics and formal/informal speech patterns appropriately
- For sound effects (SFX), either translate to equivalent sounds in {target_language} or keep original if more impactful
- Preserve proper nouns, character names, and place names unless standard translations exist
- Ensure dialogue flows naturally when read aloud
- Consider panel layout and text space constraints for localization
- Maintain narrative pacing and dramatic timing through translation choices

Text Classification and Handling:
- DIALOGUE: Character speech - maintain personality and speaking style
- NARRATION: Story text - keep formal narrative tone
- THOUGHTS: Internal monologue - often more casual or introspective
- SFX: Sound effects - prioritize impact over literal translation
- SIGNS/TEXT: Background text - translate for reader comprehension

Return ONLY the translated text without explanations, formatting, or additional comments."""

        if context:
            base_prompt += f"\n\nAdditional context for this translation: {context}"

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
