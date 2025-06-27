from datetime import datetime
from typing import List, Optional
from supabase import Client
from app.models import (
    TranslationMemoryResponse,
    TranslationMemoryCreate,
    TranslationMemoryUpdate
)


class TranslationMemoryService:
    """Service for managing translation memory entries"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table_name = "translation_memory"
    
    async def create_tm_entry(self, tm_data: TranslationMemoryCreate) -> TranslationMemoryResponse:
        """Create a new translation memory entry"""
        try:
            # Prepare data for insertion with defaults
            insert_data = {
                "series_id": tm_data.series_id,
                "source_text": tm_data.source_text,
                "target_text": tm_data.target_text,
                "context": tm_data.context,
                "usage_count": 0,  # Default to 0
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Insert into database
            response = self.supabase.table(self.table_name).insert(insert_data).execute()
            
            if not response.data:
                raise Exception("Failed to create TM entry - no data returned")
            
            tm_entry_data = response.data[0]
            
            return TranslationMemoryResponse(**tm_entry_data)
            
        except Exception as e:
            print(f"❌ Error creating TM entry: {str(e)}")
            raise Exception(f"Failed to create TM entry: {str(e)}")
    
    async def get_tm_entries_by_series(self, series_id: str, skip: int = 0, limit: int = 100) -> List[TranslationMemoryResponse]:
        """Get all translation memory entries for a specific series with pagination"""
        try:
            # Query with pagination and ordering by created_at
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("series_id", series_id)
                .order("created_at", desc=True)
                .range(skip, skip + limit - 1)
                .execute()
            )
            
            if not response.data:
                return []
            
            tm_entries_list = [TranslationMemoryResponse(**entry) for entry in response.data]
            
            return tm_entries_list
            
        except Exception as e:
            print(f"❌ Error fetching TM entries for series {series_id}: {str(e)}")
            raise Exception(f"Failed to fetch TM entries: {str(e)}")
    
    async def get_tm_entry_by_id(self, tm_id: str) -> Optional[TranslationMemoryResponse]:
        """Get a specific translation memory entry by ID"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("id", tm_id)
                .execute()
            )
            
            if not response.data:
                print(f"❌ TM entry with ID {tm_id} not found")
                return None
            
            tm_entry_data = response.data[0]
            
            return TranslationMemoryResponse(**tm_entry_data)
            
        except Exception as e:
            print(f"❌ Error fetching TM entry {tm_id}: {str(e)}")
            raise Exception(f"Failed to fetch TM entry: {str(e)}")
    
    async def update_tm_entry(self, tm_id: str, tm_data: TranslationMemoryUpdate) -> Optional[TranslationMemoryResponse]:
        """Update an existing translation memory entry"""
        try:
            # Prepare update data (only include non-None fields)
            update_data = tm_data.model_dump(exclude_unset=True)
            if update_data:
                update_data["updated_at"] = datetime.utcnow().isoformat()
                
                response = (
                    self.supabase.table(self.table_name)
                    .update(update_data)
                    .eq("id", tm_id)
                    .execute()
                )
                
                if not response.data:
                    print(f"❌ TM entry with ID {tm_id} not found for update")
                    return None
                
                updated_tm_entry = response.data[0]
                
                return TranslationMemoryResponse(**updated_tm_entry)
            else:
                # No fields to update
                return await self.get_tm_entry_by_id(tm_id)
                
        except Exception as e:
            print(f"❌ Error updating TM entry {tm_id}: {str(e)}")
            raise Exception(f"Failed to update TM entry: {str(e)}")
    
    async def delete_tm_entry(self, tm_id: str) -> bool:
        """Delete a translation memory entry"""
        try:
            # First check if TM entry exists
            existing_tm_entry = await self.get_tm_entry_by_id(tm_id)
            if not existing_tm_entry:
                print(f"❌ TM entry with ID {tm_id} not found for deletion")
                return False
            
            # Delete from database
            response = (
                self.supabase.table(self.table_name)
                .delete()
                .eq("id", tm_id)
                .execute()
            )
            
            return True
            
        except Exception as e:
            print(f"❌ Error deleting TM entry {tm_id}: {str(e)}")
            raise Exception(f"Failed to delete TM entry: {str(e)}")
    
    async def increment_usage_count(self, tm_id: str) -> Optional[TranslationMemoryResponse]:
        """Increment the usage count for a translation memory entry"""
        try:
            # Get current entry
            current_entry = await self.get_tm_entry_by_id(tm_id)
            if not current_entry:
                return None
            
            # Update usage count
            new_usage_count = current_entry.usage_count + 1
            update_data = TranslationMemoryUpdate(usage_count=new_usage_count)
            
            return await self.update_tm_entry(tm_id, update_data)
            
        except Exception as e:
            print(f"❌ Error incrementing usage count for TM entry {tm_id}: {str(e)}")
            raise Exception(f"Failed to increment usage count: {str(e)}")
    
    async def search_tm_entries(self, series_id: int, search_text: str, limit: int = 10) -> List[TranslationMemoryResponse]:
        """Search translation memory entries by source or target text"""
        try:
            # Search in both source_text and target_text using ilike (case-insensitive)
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("series_id", series_id)
                .or_(f"source_text.ilike.%{search_text}%,target_text.ilike.%{search_text}%")
                .order("usage_count", desc=True)
                .limit(limit)
                .execute()
            )
            
            if not response.data:
                return []
            
            tm_entries_list = [TranslationMemoryResponse(**entry) for entry in response.data]
            
            return tm_entries_list
            
        except Exception as e:
            print(f"❌ Error searching TM entries: {str(e)}")
            raise Exception(f"Failed to search TM entries: {str(e)}")
