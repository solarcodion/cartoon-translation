from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from supabase import Client

from app.database import get_supabase
from app.auth import get_current_user
from app.services.dashboard_service import DashboardService
from app.models import (
    DashboardResponse,
    DashboardStats,
    ChapterStatusStats,
    UserRoleStats,
    RecentActivityItem
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def get_dashboard_service(supabase: Client = Depends(get_supabase)) -> DashboardService:
    """Dependency to get dashboard service"""
    return DashboardService(supabase)


@router.get("/", response_model=DashboardResponse)
async def get_dashboard_data(
    current_user: Dict[str, Any] = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Get complete dashboard data including statistics and recent activities
    
    Returns:
    - Overall statistics (total counts)
    - Chapter status breakdown
    - User role breakdown  
    - Recent activities
    """
    try:
        dashboard_data = await dashboard_service.get_complete_dashboard_data()
        return dashboard_data
        
    except Exception as e:
        print(f"❌ Error fetching dashboard data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard data: {str(e)}"
        )


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Get overall dashboard statistics
    
    Returns total counts for:
    - Series
    - Chapters  
    - Pages
    - Text boxes
    - Users
    - AI glossary entries
    """
    try:
        stats = await dashboard_service.get_dashboard_stats()
        return stats
        
    except Exception as e:
        print(f"❌ Error fetching dashboard statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard statistics: {str(e)}"
        )


@router.get("/stats/chapters", response_model=ChapterStatusStats)
async def get_chapter_status_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Get chapter status statistics
    
    Returns counts by status:
    - Draft
    - In Progress
    - Translated
    """
    try:
        stats = await dashboard_service.get_chapter_status_stats()
        return stats
        
    except Exception as e:
        print(f"❌ Error fetching chapter status statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chapter status statistics: {str(e)}"
        )


@router.get("/stats/users", response_model=UserRoleStats)
async def get_user_role_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Get user role statistics
    
    Returns counts by role:
    - Admin
    - Editor
    - Translator
    """
    try:
        stats = await dashboard_service.get_user_role_stats()
        return stats
        
    except Exception as e:
        print(f"❌ Error fetching user role statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user role statistics: {str(e)}"
        )


@router.get("/activities", response_model=list[RecentActivityItem])
async def get_recent_activities(
    limit: int = 10,
    current_user: Dict[str, Any] = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Get recent activities
    
    Parameters:
    - limit: Maximum number of activities to return (default: 10)
    
    Returns recent activities including:
    - New series created
    - New chapters added
    - New pages uploaded
    """
    try:
        activities = await dashboard_service.get_recent_activities(limit=limit)
        return activities
        
    except Exception as e:
        print(f"❌ Error fetching recent activities: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch recent activities: {str(e)}"
        )
