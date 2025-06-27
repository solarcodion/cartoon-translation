from typing import List, Optional, Dict, Any
from supabase import Client
from datetime import datetime
from app.models import AIGlossaryCreate, AIGlossaryUpdate, AIGlossaryResponse, PersonInfo


class AIGlossaryService:
    """Service for handling AI glossary operations"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table_name = "ai_glossary"
    
    async def create_glossary_entry(
        self, 
        glossary_data: AIGlossaryCreate, 
        created_by: str
    ) -> AIGlossaryResponse:
        """Create a new AI glossary entry"""
        try:
            # Prepare data for insertion
            insert_data = {
                "series_id": glossary_data.series_id,
                "name": glossary_data.name,
                "description": glossary_data.description,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Insert into database
            response = self.supabase.table(self.table_name).insert(insert_data).execute()
            
            if not response.data:
                raise Exception("Failed to create AI glossary entry - no data returned")
            
            entry_data = response.data[0]
            
            return AIGlossaryResponse(**entry_data)
            
        except Exception as e:
            print(f"❌ Error creating AI glossary entry: {str(e)}")
            raise Exception(f"Failed to create AI glossary entry: {str(e)}")
    
    async def get_glossary_by_series_id(self, series_id: str) -> List[AIGlossaryResponse]:
        """Get all AI glossary entries for a specific series"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("series_id", series_id)
                .order("created_at", desc=False)
                .execute()
            )
            
            if not response.data:
                return []
            
            entries = [AIGlossaryResponse(**entry) for entry in response.data]
            
            return entries
            
        except Exception as e:
            print(f"❌ Error fetching AI glossary entries for series {series_id}: {str(e)}")
            raise Exception(f"Failed to fetch AI glossary entries: {str(e)}")
    
    async def get_glossary_entry_by_id(self, entry_id: str) -> Optional[AIGlossaryResponse]:
        """Get a specific AI glossary entry by ID"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("id", entry_id)
                .execute()
            )
            
            if not response.data:
                return None
            
            entry_data = response.data[0]
            
            return AIGlossaryResponse(**entry_data)
            
        except Exception as e:
            print(f"❌ Error fetching AI glossary entry {entry_id}: {str(e)}")
            raise Exception(f"Failed to fetch AI glossary entry: {str(e)}")
    
    async def update_glossary_entry(
        self, 
        entry_id: str, 
        glossary_data: AIGlossaryUpdate, 
        updated_by: str
    ) -> Optional[AIGlossaryResponse]:
        """Update an existing AI glossary entry"""
        try:
            # Prepare update data (only include non-None values)
            update_data = {}
            if glossary_data.name is not None:
                update_data["name"] = glossary_data.name
            if glossary_data.description is not None:
                update_data["description"] = glossary_data.description
            
            # Always update the updated_at timestamp
            update_data["updated_at"] = datetime.utcnow().isoformat()
            
            if not update_data or len(update_data) == 1:  # Only updated_at
                raise Exception("No valid fields to update")
            
            # Update in database
            response = (
                self.supabase.table(self.table_name)
                .update(update_data)
                .eq("id", entry_id)
                .execute()
            )
            
            if not response.data:
                return None
            
            entry_data = response.data[0]
            
            return AIGlossaryResponse(**entry_data)
            
        except Exception as e:
            print(f"❌ Error updating AI glossary entry {entry_id}: {str(e)}")
            raise Exception(f"Failed to update AI glossary entry: {str(e)}")
    
    async def delete_glossary_entry(self, entry_id: str) -> bool:
        """Delete an AI glossary entry"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .delete()
                .eq("id", entry_id)
                .execute()
            )
            
            if not response.data:
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Error deleting AI glossary entry {entry_id}: {str(e)}")
            raise Exception(f"Failed to delete AI glossary entry: {str(e)}")
    
    async def clear_series_glossary(self, series_id: str) -> int:
        """Clear all AI glossary entries for a series (used before refresh)"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .delete()
                .eq("series_id", series_id)
                .execute()
            )
            
            deleted_count = len(response.data) if response.data else 0
            
            return deleted_count
            
        except Exception as e:
            print(f"❌ Error clearing AI glossary entries for series {series_id}: {str(e)}")
            raise Exception(f"Failed to clear AI glossary entries: {str(e)}")
    
    async def save_people_analysis_results(
        self, 
        series_id: str, 
        people: List[PersonInfo], 
        clear_existing: bool = True
    ) -> List[AIGlossaryResponse]:
        """Save people analysis results to AI glossary table"""
        try:
            # Clear existing entries if requested
            if clear_existing:
                await self.clear_series_glossary(series_id)
            
            # Create new entries
            created_entries = []
            for person in people:
                glossary_data = AIGlossaryCreate(
                    series_id=series_id,
                    name=person.name,
                    description=person.description
                )
                
                entry = await self.create_glossary_entry(glossary_data, "system")
                created_entries.append(entry)
            
            return created_entries
            
        except Exception as e:
            print(f"❌ Error saving people analysis results: {str(e)}")
            raise Exception(f"Failed to save people analysis results: {str(e)}")
    
    async def get_glossary_stats(self) -> Dict[str, Any]:
        """Get AI glossary statistics"""
        try:
            # Get total count
            response = self.supabase.table(self.table_name).select("id", count="exact").execute()
            total_entries = response.count if response.count is not None else 0
            
            # Get count by series (top 5)
            series_response = (
                self.supabase.table(self.table_name)
                .select("series_id", count="exact")
                .execute()
            )
            
            stats = {
                "total_entries": total_entries,
                "total_series_with_glossary": len(set(entry["series_id"] for entry in series_response.data)) if series_response.data else 0,
                "average_entries_per_series": round(total_entries / max(1, len(set(entry["series_id"] for entry in series_response.data)) if series_response.data else 1), 2)
            }
            
            return stats
            
        except Exception as e:
            print(f"❌ Error getting AI glossary statistics: {str(e)}")
            raise Exception(f"Failed to get AI glossary statistics: {str(e)}")
