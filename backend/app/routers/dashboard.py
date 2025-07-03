from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from supabase import Client

from app.database import get_supabase
from app.auth import get_current_user
from app.services.dashboard_service import DashboardService
from app.models import (
    DashboardResponse,
    ApiResponse
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


@router.get("/stats", response_model=DashboardResponse)
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





@router.post("/refresh", response_model=ApiResponse)
async def refresh_dashboard_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Refresh dashboard statistics by recalculating from source tables

    This endpoint recalculates all dashboard statistics from the source tables
    and updates the dashboard table. Useful for ensuring data consistency.
    """
    try:
        await dashboard_service.refresh_dashboard_stats()
        return ApiResponse(
            success=True,
            message="Dashboard statistics refreshed successfully"
        )

    except Exception as e:
        print(f"❌ Error refreshing dashboard statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh dashboard statistics: {str(e)}"
        )
