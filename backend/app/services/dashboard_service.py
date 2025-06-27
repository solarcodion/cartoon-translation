from datetime import datetime, timezone
from typing import List, Dict, Any
from supabase import Client
from app.models import (
    DashboardStats,
    ChapterStatusStats,
    UserRoleStats,
    RecentActivityItem,
    DashboardResponse
)


class DashboardService:
    """Service for dashboard-related operations"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    async def get_dashboard_stats(self) -> DashboardStats:
        """Get overall dashboard statistics"""
        try:
            # Get total series count
            series_response = self.supabase.table("series").select("id", count="exact").execute()
            total_series = series_response.count or 0
            
            # Get total chapters count
            chapters_response = self.supabase.table("chapters").select("id", count="exact").execute()
            total_chapters = chapters_response.count or 0
            
            # Get total pages count
            pages_response = self.supabase.table("pages").select("id", count="exact").execute()
            total_pages = pages_response.count or 0
            
            # Get total text boxes count
            text_boxes_response = self.supabase.table("text_boxes").select("id", count="exact").execute()
            total_text_boxes = text_boxes_response.count or 0
            
            # Get total users count
            users_response = self.supabase.table("users").select("id", count="exact").execute()
            total_users = users_response.count or 0
            
            # Get total AI glossary entries count
            glossary_response = self.supabase.table("ai_glossary").select("id", count="exact").execute()
            total_glossary_entries = glossary_response.count or 0
            
            return DashboardStats(
                total_series=total_series,
                total_chapters=total_chapters,
                total_pages=total_pages,
                total_text_boxes=total_text_boxes,
                total_users=total_users,
                total_glossary_entries=total_glossary_entries
            )
            
        except Exception as e:
            print(f"❌ Error fetching dashboard statistics: {str(e)}")
            raise Exception(f"Failed to fetch dashboard statistics: {str(e)}")
    
    async def get_chapter_status_stats(self) -> ChapterStatusStats:
        """Get chapter status statistics"""
        try:
            # Get count by status
            draft_response = (
                self.supabase.table("chapters")
                .select("id", count="exact")
                .eq("status", "draft")
                .execute()
            )
            draft_count = draft_response.count or 0
            
            in_progress_response = (
                self.supabase.table("chapters")
                .select("id", count="exact")
                .eq("status", "in_progress")
                .execute()
            )
            in_progress_count = in_progress_response.count or 0
            
            translated_response = (
                self.supabase.table("chapters")
                .select("id", count="exact")
                .eq("status", "translated")
                .execute()
            )
            translated_count = translated_response.count or 0
            
            return ChapterStatusStats(
                draft=draft_count,
                in_progress=in_progress_count,
                translated=translated_count
            )
            
        except Exception as e:
            print(f"❌ Error fetching chapter status statistics: {str(e)}")
            raise Exception(f"Failed to fetch chapter status statistics: {str(e)}")
    
    async def get_user_role_stats(self) -> UserRoleStats:
        """Get user role statistics"""
        try:
            # Get count by role
            admin_response = (
                self.supabase.table("users")
                .select("id", count="exact")
                .eq("role", "admin")
                .execute()
            )
            admin_count = admin_response.count or 0
            
            editor_response = (
                self.supabase.table("users")
                .select("id", count="exact")
                .eq("role", "editor")
                .execute()
            )
            editor_count = editor_response.count or 0
            
            translator_response = (
                self.supabase.table("users")
                .select("id", count="exact")
                .eq("role", "translator")
                .execute()
            )
            translator_count = translator_response.count or 0
            
            return UserRoleStats(
                admin=admin_count,
                editor=editor_count,
                translator=translator_count
            )
            
        except Exception as e:
            print(f"❌ Error fetching user role statistics: {str(e)}")
            raise Exception(f"Failed to fetch user role statistics: {str(e)}")
    
    async def get_recent_activities(self, limit: int = 10) -> List[RecentActivityItem]:
        """Get recent activities across all entities"""
        try:
            activities = []
            
            # Get recent series
            series_response = (
                self.supabase.table("series")
                .select("id, title, created_at, user_id")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            
            for series in series_response.data or []:
                # Get user name if available
                user_name = None
                if series.get("user_id"):
                    user_response = (
                        self.supabase.table("users")
                        .select("name")
                        .eq("id", series["user_id"])
                        .execute()
                    )
                    if user_response.data:
                        user_name = user_response.data[0]["name"]
                
                activities.append(RecentActivityItem(
                    id=series["id"],
                    type="series",
                    action="created new series",
                    entity_name=series["title"],
                    user_name=user_name,
                    timestamp=datetime.fromisoformat(series["created_at"].replace('Z', '+00:00'))
                ))
            
            # Get recent chapters
            chapters_response = (
                self.supabase.table("chapters")
                .select("id, chapter_number, created_at, series_id")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            
            for chapter in chapters_response.data or []:
                # Get series name
                series_name = "Unknown Series"
                if chapter.get("series_id"):
                    series_response = (
                        self.supabase.table("series")
                        .select("title")
                        .eq("id", chapter["series_id"])
                        .execute()
                    )
                    if series_response.data:
                        series_name = series_response.data[0]["title"]
                
                activities.append(RecentActivityItem(
                    id=chapter["id"],
                    type="chapter",
                    action="added new chapter",
                    entity_name=f"Chapter {chapter['chapter_number']} of {series_name}",
                    user_name=None,
                    timestamp=datetime.fromisoformat(chapter["created_at"].replace('Z', '+00:00'))
                ))
            
            # Get recent pages
            pages_response = (
                self.supabase.table("pages")
                .select("id, page_number, created_at, chapter_id")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            
            for page in pages_response.data or []:
                # Get chapter and series info
                entity_name = f"Page {page['page_number']}"
                if page.get("chapter_id"):
                    chapter_response = (
                        self.supabase.table("chapters")
                        .select("chapter_number, series_id")
                        .eq("id", page["chapter_id"])
                        .execute()
                    )
                    if chapter_response.data:
                        chapter_data = chapter_response.data[0]
                        series_name = "Unknown Series"
                        if chapter_data.get("series_id"):
                            series_response = (
                                self.supabase.table("series")
                                .select("title")
                                .eq("id", chapter_data["series_id"])
                                .execute()
                            )
                            if series_response.data:
                                series_name = series_response.data[0]["title"]
                        
                        entity_name = f"Page {page['page_number']} of Chapter {chapter_data['chapter_number']} ({series_name})"
                
                activities.append(RecentActivityItem(
                    id=page["id"],
                    type="page",
                    action="uploaded new page",
                    entity_name=entity_name,
                    user_name=None,
                    timestamp=datetime.fromisoformat(page["created_at"].replace('Z', '+00:00'))
                ))
            
            # Sort all activities by timestamp (most recent first) and limit
            activities.sort(key=lambda x: x.timestamp, reverse=True)
            return activities[:limit]
            
        except Exception as e:
            print(f"❌ Error fetching recent activities: {str(e)}")
            raise Exception(f"Failed to fetch recent activities: {str(e)}")
    
    async def get_complete_dashboard_data(self) -> DashboardResponse:
        """Get complete dashboard data"""
        try:
            # Fetch all dashboard data concurrently
            stats = await self.get_dashboard_stats()
            chapter_status_stats = await self.get_chapter_status_stats()
            user_role_stats = await self.get_user_role_stats()
            recent_activities = await self.get_recent_activities()
            
            return DashboardResponse(
                stats=stats,
                chapter_status_stats=chapter_status_stats,
                user_role_stats=user_role_stats,
                recent_activities=recent_activities
            )
            
        except Exception as e:
            print(f"❌ Error fetching complete dashboard data: {str(e)}")
            raise Exception(f"Failed to fetch complete dashboard data: {str(e)}")
