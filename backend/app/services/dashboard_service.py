from supabase import Client
from app.models import (
    DashboardResponse
)


class DashboardService:
    """Service for dashboard-related operations"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    async def get_dashboard_stats(self) -> DashboardResponse:
        """Get overall dashboard statistics from dashboard table"""
        try:
            # Get dashboard data from the dashboard table (single query)
            dashboard_response = (
                self.supabase.table("dashboard")
                .select("total_series, progress_chapters, processed_pages, translated_textbox, recent_activities")
                .eq("id", 1)
                .execute()
            )

            if not dashboard_response.data:
                # If no dashboard record exists, initialize with zeros
                print("⚠️ No dashboard record found, initializing with default values")
                await self._initialize_dashboard_record()
                return DashboardResponse(
                    total_series=0,
                    progress_chapters=0,
                    processed_pages=0,
                    translated_textbox=0,
                    recent_activities=[]
                )

            dashboard_data = dashboard_response.data[0]

            return DashboardResponse(
                total_series=dashboard_data.get("total_series", 0),
                progress_chapters=dashboard_data.get("progress_chapters", 0),
                processed_pages=dashboard_data.get("processed_pages", 0),
                translated_textbox=dashboard_data.get("translated_textbox", 0),
                recent_activities=dashboard_data.get("recent_activities", [])
            )
            
        except Exception as e:
            print(f"❌ Error fetching dashboard statistics: {str(e)}")
            raise Exception(f"Failed to fetch dashboard statistics: {str(e)}")
    
    async def _initialize_dashboard_record(self) -> None:
        """Initialize dashboard record with current counts"""
        try:
            # Calculate current counts for initialization
            series_count = (self.supabase.table("series").select("id", count="exact").execute()).count or 0
            progress_chapters_count = (
                self.supabase.table("chapters")
                .select("id", count="exact")
                .eq("status", "in_progress")
                .execute()
            ).count or 0
            pages_count = (self.supabase.table("pages").select("id", count="exact").execute()).count or 0
            textbox_count = (self.supabase.table("text_boxes").select("id", count="exact").execute()).count or 0
            
            # Insert initial dashboard record
            self.supabase.table("dashboard").insert({
                "id": 1,
                "total_series": series_count,
                "progress_chapters": progress_chapters_count,
                "processed_pages": pages_count,
                "translated_textbox": textbox_count,
                "recent_activities": []
            }).execute()
            
        except Exception as e:
            print(f"❌ Error initializing dashboard record: {str(e)}")
            raise Exception(f"Failed to initialize dashboard record: {str(e)}")
    
    async def update_dashboard_stats(self, **kwargs) -> None:
        """Update dashboard statistics"""
        try:
            # Build update data from provided kwargs
            update_data = {}
            if "total_series" in kwargs:
                update_data["total_series"] = kwargs["total_series"]
            if "progress_chapters" in kwargs:
                update_data["progress_chapters"] = kwargs["progress_chapters"]
            if "processed_pages" in kwargs:
                update_data["processed_pages"] = kwargs["processed_pages"]
            if "translated_textbox" in kwargs:
                update_data["translated_textbox"] = kwargs["translated_textbox"]
            if "recent_activities" in kwargs:
                update_data["recent_activities"] = kwargs["recent_activities"]
            
            if not update_data:
                return
            
            # Update dashboard record
            self.supabase.table("dashboard").update(update_data).eq("id", 1).execute()
            
        except Exception as e:
            print(f"❌ Error updating dashboard statistics: {str(e)}")
            raise Exception(f"Failed to update dashboard statistics: {str(e)}")
    
    async def refresh_dashboard_stats(self) -> None:
        """Refresh dashboard statistics by recalculating from source tables"""
        try:
            # Recalculate all statistics
            series_count = (self.supabase.table("series").select("id", count="exact").execute()).count or 0
            progress_chapters_count = (
                self.supabase.table("chapters")
                .select("id", count="exact")
                .eq("status", "in_progress")
                .execute()
            ).count or 0
            pages_count = (self.supabase.table("pages").select("id", count="exact").execute()).count or 0
            textbox_count = (self.supabase.table("text_boxes").select("id", count="exact").execute()).count or 0
            
            # Update dashboard record with fresh counts
            await self.update_dashboard_stats(
                total_series=series_count,
                progress_chapters=progress_chapters_count,
                processed_pages=pages_count,
                translated_textbox=textbox_count
            )
            
        except Exception as e:
            print(f"❌ Error refreshing dashboard statistics: {str(e)}")
            raise Exception(f"Failed to refresh dashboard statistics: {str(e)}")
    
    async def increment_series_count(self) -> None:
        """Increment total series count in dashboard"""
        try:
            current_stats = await self.get_dashboard_stats()
            await self.update_dashboard_stats(total_series=current_stats.total_series + 1)
        except Exception as e:
            print(f"❌ Error incrementing series count: {str(e)}")
    
    async def decrement_series_count(self) -> None:
        """Decrement total series count in dashboard"""
        try:
            current_stats = await self.get_dashboard_stats()
            new_count = max(0, current_stats.total_series - 1)
            await self.update_dashboard_stats(total_series=new_count)
        except Exception as e:
            print(f"❌ Error decrementing series count: {str(e)}")
    
    async def update_progress_chapters_count(self) -> None:
        """Update progress chapters count by recalculating from database"""
        try:
            progress_chapters_count = (
                self.supabase.table("chapters")
                .select("id", count="exact")
                .eq("status", "in_progress")
                .execute()
            ).count or 0
            await self.update_dashboard_stats(progress_chapters=progress_chapters_count)
        except Exception as e:
            print(f"❌ Error updating progress chapters count: {str(e)}")
    
    async def increment_pages_count(self) -> None:
        """Increment processed pages count in dashboard"""
        try:
            current_stats = await self.get_dashboard_stats()
            await self.update_dashboard_stats(processed_pages=current_stats.processed_pages + 1)
        except Exception as e:
            print(f"❌ Error incrementing pages count: {str(e)}")
    
    async def decrement_pages_count(self) -> None:
        """Decrement processed pages count in dashboard"""
        try:
            current_stats = await self.get_dashboard_stats()
            new_count = max(0, current_stats.processed_pages - 1)
            await self.update_dashboard_stats(processed_pages=new_count)
        except Exception as e:
            print(f"❌ Error decrementing pages count: {str(e)}")
    
    async def increment_textbox_count(self) -> None:
        """Increment translated textbox count in dashboard"""
        try:
            current_stats = await self.get_dashboard_stats()
            await self.update_dashboard_stats(translated_textbox=current_stats.translated_textbox + 1)
        except Exception as e:
            print(f"❌ Error incrementing textbox count: {str(e)}")
    
    async def decrement_textbox_count(self) -> None:
        """Decrement translated textbox count in dashboard"""
        try:
            current_stats = await self.get_dashboard_stats()
            new_count = max(0, current_stats.translated_textbox - 1)
            await self.update_dashboard_stats(translated_textbox=new_count)
        except Exception as e:
            print(f"❌ Error decrementing textbox count: {str(e)}")
    
    async def add_recent_activity(self, activity: str) -> None:
        """Add a new activity to recent activities list"""
        try:
            current_stats = await self.get_dashboard_stats()
            recent_activities = current_stats.recent_activities.copy()
            
            # Add new activity at the beginning
            recent_activities.insert(0, activity)
            
            # Keep only the last 10 activities
            recent_activities = recent_activities[:10]
            
            await self.update_dashboard_stats(recent_activities=recent_activities)
        except Exception as e:
            print(f"❌ Error adding recent activity: {str(e)}")
    
    async def get_complete_dashboard_data(self) -> DashboardResponse:
        """Get complete dashboard data"""
        try:
            # Only fetch dashboard stats since that's all we need now
            return await self.get_dashboard_stats()
            
        except Exception as e:
            print(f"❌ Error fetching complete dashboard data: {str(e)}")
            raise Exception(f"Failed to fetch complete dashboard data: {str(e)}")
