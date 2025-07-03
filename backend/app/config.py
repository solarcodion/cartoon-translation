import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    """Application settings"""

    def __init__(self):
        # API Settings
        self.api_title: str = os.getenv("API_TITLE")
        self.api_version: str = os.getenv("API_VERSION")
        self.api_description: str = os.getenv("API_DESCRIPTION")

        # Server Settings
        self.host: str = os.getenv("HOST")
        self.port: int = int(os.getenv("PORT"))
        self.debug: bool = os.getenv("DEBUG").lower() == "true"

        # CORS Settings
        cors_origins_str = os.getenv("CORS_ORIGINS")
        self.cors_origins: List[str] = [origin.strip() for origin in cors_origins_str.split(',')]

        # Supabase Settings
        self.supabase_url: str = os.getenv("SUPABASE_URL")
        self.supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY")
        self.supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY")

        # OCR Settings
        ocr_languages_str = os.getenv("OCR_LANGUAGES")
        self.ocr_languages: List[str] = [lang.strip() for lang in ocr_languages_str.split(',')]
        self.ocr_auto_detect_language: bool = os.getenv("OCR_AUTO_DETECT_LANGUAGE", "true").lower() == "true"

        # OpenAI Settings
        self.openai_api_key: str = os.getenv("OPENAI_API_KEY")
        self.translation_target_language: str = os.getenv("TRANSLATION_TARGET_LANGUAGE", "Vietnamese")

        # Validate required Supabase settings
        if not self.supabase_url:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not self.supabase_service_key:
            raise ValueError("SUPABASE_SERVICE_KEY environment variable is required")
        if not self.supabase_anon_key:
            raise ValueError("SUPABASE_ANON_KEY environment variable is required")

        # Validate OpenAI settings (warn if not set, but don't fail)
        if not self.openai_api_key:
            print("⚠️ Warning: OPENAI_API_KEY environment variable is not set. Translation features will not work.")

# Global settings instance
settings = Settings()
