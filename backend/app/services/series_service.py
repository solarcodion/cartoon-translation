from typing import List, Optional, Dict, Any
from supabase import Client
from datetime import datetime
from app.models import SeriesCreate, SeriesUpdate, SeriesResponse, SeriesInDB


class SeriesService:
    """Service for handling series operations"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table_name = "series"
    
    async def create_series(self, series_data: SeriesCreate, created_by: str) -> SeriesResponse:
        """Create a new series"""
        try:
            # Prepare data for insertion with defaults
            insert_data = {
                "title": series_data.title,
                "total_chapters": 0,  # Default to 0
                "user_id": created_by,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Insert into database
            response = self.supabase.table(self.table_name).insert(insert_data).execute()
            
            if not response.data:
                raise Exception("Failed to create series - no data returned")
            
            series_data = response.data[0]
            
            return SeriesResponse(**series_data)
            
        except Exception as e:
            print(f"❌ Error creating series: {str(e)}")
            raise Exception(f"Failed to create series: {str(e)}")
    
    async def get_series_list(self, skip: int = 0, limit: int = 100) -> List[SeriesResponse]:
        """Get list of all series with pagination"""
        try:
            # Query with pagination
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .order("created_at", desc=True)
                .range(skip, skip + limit - 1)
                .execute()
            )
            
            if not response.data:
                return []
            
            series_list = [SeriesResponse(**series) for series in response.data]
            
            return series_list
            
        except Exception as e:
            print(f"❌ Error fetching series list: {str(e)}")
            raise Exception(f"Failed to fetch series list: {str(e)}")
    
    async def get_series_by_id(self, series_id: str) -> Optional[SeriesResponse]:
        """Get a specific series by ID"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("id", series_id)
                .execute()
            )

            if not response.data:
                print(f"❌ Series with ID {series_id} not found")
                return None

            series_data = response.data[0]

            return SeriesResponse(**series_data)

        except Exception as e:
            print(f"❌ Error fetching series {series_id}: {str(e)}")
            raise Exception(f"Failed to fetch series: {str(e)}")

    async def update_series(self, series_id: str, series_data: SeriesUpdate, updated_by: str) -> Optional[SeriesResponse]:
        """Update an existing series"""
        try:
            # Prepare update data (only include non-None values)
            update_data = {}
            for field, value in series_data.dict(exclude_unset=True).items():
                if value is not None:
                    if field == "status" and hasattr(value, "value"):
                        update_data[field] = value.value
                    else:
                        update_data[field] = value
            
            # Always update the updated_at timestamp
            update_data["updated_at"] = datetime.utcnow().isoformat()
            
            if not update_data:
                raise Exception("No valid fields to update")
            
            # Update in database
            response = (
                self.supabase.table(self.table_name)
                .update(update_data)
                .eq("id", series_id)
                .execute()
            )
            
            if not response.data:
                print(f"❌ Series with ID {series_id} not found for update")
                return None
            
            updated_series = response.data[0]
            
            return SeriesResponse(**updated_series)
            
        except Exception as e:
            print(f"❌ Error updating series {series_id}: {str(e)}")
            raise Exception(f"Failed to update series: {str(e)}")
    
    async def delete_series(self, series_id: str) -> bool:
        """Delete a series"""
        try:
            # First check if series exists
            existing_series = await self.get_series_by_id(series_id)
            if not existing_series:
                print(f"❌ Series with ID {series_id} not found for deletion")
                return False
            
            # Delete from database
            response = (
                self.supabase.table(self.table_name)
                .delete()
                .eq("id", series_id)
                .execute()
            )
            
            return True
            
        except Exception as e:
            print(f"❌ Error deleting series {series_id}: {str(e)}")
            raise Exception(f"Failed to delete series: {str(e)}")
    
    async def get_series_stats(self) -> Dict[str, Any]:
        """Get series statistics"""
        try:
            # Get total count
            response = self.supabase.table(self.table_name).select("id", count="exact").execute()
            total_series = response.count or 0
            
            # Get count by status
            status_counts = {}
            for status in ["active", "completed", "on_hold", "dropped"]:
                response = (
                    self.supabase.table(self.table_name)
                    .select("id", count="exact")
                    .eq("status", status)
                    .execute()
                )
                status_counts[status] = response.count or 0
            
            stats = {
                "total_series": total_series,
                "status_counts": status_counts
            }
            
            return stats
            
        except Exception as e:
            print(f"❌ Error fetching series statistics: {str(e)}")
            raise Exception(f"Failed to fetch series statistics: {str(e)}")

    async def get_chapters_with_pages_for_analysis(self, series_id: str) -> List[Dict[str, Any]]:
        """Get all chapters with their pages and contexts for people analysis"""
        try:
            # Get all chapters for the series
            chapters_response = (
                self.supabase.table("chapters")
                .select("*")
                .eq("series_id", series_id)
                .order("chapter_number")
                .execute()
            )

            if not chapters_response.data:
                return []

            chapters_data = []

            for chapter in chapters_response.data:
                chapter_id = chapter["id"]

                # Get pages for this chapter
                pages_response = (
                    self.supabase.table("pages")
                    .select("*")
                    .eq("chapter_id", chapter_id)
                    .order("page_number")
                    .execute()
                )

                pages_data = []
                if pages_response.data:
                    for page in pages_response.data:
                        pages_data.append({
                            "number": page.get("page_number"),
                            "image_url": page.get("image_url"),
                            "context": page.get("context")
                        })

                chapter_data = {
                    "id": chapter_id,
                    "number": chapter.get("chapter_number"),
                    "context": chapter.get("context", ""),
                    "pages": pages_data
                }

                chapters_data.append(chapter_data)

            return chapters_data

        except Exception as e:
            print(f"❌ Error getting chapters with pages: {str(e)}")
            raise Exception(f"Failed to get chapters with pages: {str(e)}")
