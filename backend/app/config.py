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

# Global settings instance
settings = Settings()
