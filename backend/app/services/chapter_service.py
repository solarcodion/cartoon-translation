from datetime import datetime
from typing import List, Optional
from supabase import Client
from app.models import (
    ChapterResponse,
    ChapterCreate,
    ChapterUpdate,
    ChapterStatus
)


class ChapterService:
    """Service for managing chapters"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table_name = "chapters"
    
    async def create_chapter(self, chapter_data: ChapterCreate, series_id: str) -> ChapterResponse:
        """Create a new chapter"""
        try:
            # Prepare data for insertion with defaults
            insert_data = {
                "series_id": series_id,
                "chapter_number": chapter_data.chapter_number,
                "status": ChapterStatus.DRAFT.value,  # Default to draft
                "page_count": 0,  # Default to 0
                "context": "",  # Default to empty string (NOT NULL constraint)
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Insert into database
            response = self.supabase.table(self.table_name).insert(insert_data).execute()
            
            if not response.data:
                raise Exception("Failed to create chapter - no data returned")
            
            chapter_data = response.data[0]
            
            return ChapterResponse(**chapter_data)
            
        except Exception as e:
            print(f"❌ Error creating chapter: {str(e)}")
            raise Exception(f"Failed to create chapter: {str(e)}")
    
    async def get_chapters_by_series(self, series_id: str, skip: int = 0, limit: int = 100) -> List[ChapterResponse]:
        """Get all chapters for a specific series with pagination"""
        try:
            # Query with pagination and ordering by chapter_number
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("series_id", series_id)
                .order("chapter_number", desc=False)
                .range(skip, skip + limit - 1)
                .execute()
            )
            
            if not response.data:
                return []
            
            chapters_list = [ChapterResponse(**chapter) for chapter in response.data]
            
            return chapters_list
            
        except Exception as e:
            print(f"❌ Error fetching chapters for series {series_id}: {str(e)}")
            raise Exception(f"Failed to fetch chapters: {str(e)}")
    
    async def get_chapter_by_id(self, chapter_id: str) -> Optional[ChapterResponse]:
        """Get a specific chapter by ID"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("id", chapter_id)
                .execute()
            )
            
            if not response.data:
                print(f"❌ Chapter with ID {chapter_id} not found")
                return None
            
            chapter_data = response.data[0]
            
            return ChapterResponse(**chapter_data)
            
        except Exception as e:
            print(f"❌ Error fetching chapter {chapter_id}: {str(e)}")
            raise Exception(f"Failed to fetch chapter: {str(e)}")
    
    async def update_chapter(self, chapter_id: str, chapter_data: ChapterUpdate) -> Optional[ChapterResponse]:
        """Update a chapter"""
        try:
            # Prepare update data (only include non-None fields)
            update_data = chapter_data.model_dump(exclude_unset=True)
            if update_data:
                update_data["updated_at"] = datetime.utcnow().isoformat()
                
                # Convert enum to string if status is being updated
                if "status" in update_data:
                    update_data["status"] = update_data["status"].value
                
                response = (
                    self.supabase.table(self.table_name)
                    .update(update_data)
                    .eq("id", chapter_id)
                    .execute()
                )
                
                if not response.data:
                    print(f"❌ Chapter with ID {chapter_id} not found for update")
                    return None
                
                updated_chapter = response.data[0]
                
                return ChapterResponse(**updated_chapter)
            else:
                # No fields to update
                return await self.get_chapter_by_id(chapter_id)
                
        except Exception as e:
            print(f"❌ Error updating chapter {chapter_id}: {str(e)}")
            raise Exception(f"Failed to update chapter: {str(e)}")
    
    async def delete_chapter(self, chapter_id: str) -> bool:
        """Delete a chapter"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .delete()
                .eq("id", chapter_id)
                .execute()
            )
            
            if not response.data:
                print(f"❌ Chapter with ID {chapter_id} not found for deletion")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Error deleting chapter {chapter_id}: {str(e)}")
            raise Exception(f"Failed to delete chapter: {str(e)}")
    
    async def get_chapter_count_by_series(self, series_id: str) -> int:
        """Get the total count of chapters for a series"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .select("id", count="exact")
                .eq("series_id", series_id)
                .execute()
            )
            
            count = response.count or 0
            
            return count
            
        except Exception as e:
            print(f"❌ Error getting chapter count for series {series_id}: {str(e)}")
            raise Exception(f"Failed to get chapter count: {str(e)}")
