from supabase import create_client, Client
from app.config import settings


class SupabaseClient:
    """Supabase client wrapper"""
    
    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_key
        )
    
    def get_client(self) -> Client:
        """Get the Supabase client instance"""
        return self.client


# Global Supabase client instance
supabase_client = SupabaseClient()


def get_supabase() -> Client:
    """Dependency to get Supabase client"""
    return supabase_client.get_client()
