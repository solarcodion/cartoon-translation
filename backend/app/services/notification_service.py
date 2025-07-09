from typing import Dict, Any, Optional
import json
from app.config import settings


class NotificationService:
    """Service for sending WebSocket notifications to users"""
    
    def __init__(self):
        self.manager = None
    
    def set_manager(self, manager):
        """Set the WebSocket connection manager"""
        self.manager = manager
    
    async def notify_auto_extract_completed(
        self, 
        user_id: str, 
        chapter_id: str, 
        page_id: str, 
        text_boxes_count: int,
        page_number: int
    ):
        """
        Notify user that auto-extract has completed for a page
        
        Args:
            user_id: ID of the user to notify
            chapter_id: ID of the chapter
            page_id: ID of the page that was processed
            text_boxes_count: Number of text boxes created
            page_number: Page number for display
        """
        if not self.manager:
            print("⚠️ WebSocket manager not set, skipping notification")
            return
            
        message = {
            "type": "auto_extract_completed",
            "data": {
                "chapter_id": chapter_id,
                "page_id": page_id,
                "text_boxes_count": text_boxes_count,
                "page_number": page_number,
                "timestamp": self._get_current_timestamp()
            }
        }
        
        try:
            await self.manager.send_personal_message(message, user_id)
            print(f"✅ Sent auto-extract completion notification to user {user_id} for page {page_number}")
        except Exception as e:
            print(f"❌ Failed to send notification to user {user_id}: {str(e)}")
    
    async def notify_auto_extract_batch_completed(
        self, 
        user_id: str, 
        chapter_id: str, 
        total_pages: int,
        total_text_boxes: int
    ):
        """
        Notify user that auto-extract batch has completed for all pages in a chapter
        
        Args:
            user_id: ID of the user to notify
            chapter_id: ID of the chapter
            total_pages: Total number of pages processed
            total_text_boxes: Total number of text boxes created
        """
        if not self.manager:
            print("⚠️ WebSocket manager not set, skipping notification")
            return
            
        message = {
            "type": "auto_extract_batch_completed",
            "data": {
                "chapter_id": chapter_id,
                "total_pages": total_pages,
                "total_text_boxes": total_text_boxes,
                "timestamp": self._get_current_timestamp()
            }
        }
        
        try:
            await self.manager.send_personal_message(message, user_id)
            print(f"✅ Sent auto-extract batch completion notification to user {user_id} for chapter {chapter_id}")
        except Exception as e:
            print(f"❌ Failed to send batch notification to user {user_id}: {str(e)}")
    
    async def notify_error(
        self, 
        user_id: str, 
        error_type: str, 
        message: str, 
        context: Optional[Dict[str, Any]] = None
    ):
        """
        Notify user of an error during processing
        
        Args:
            user_id: ID of the user to notify
            error_type: Type of error (e.g., "auto_extract_error")
            message: Error message
            context: Additional context data
        """
        if not self.manager:
            print("⚠️ WebSocket manager not set, skipping error notification")
            return
            
        notification = {
            "type": "error",
            "data": {
                "error_type": error_type,
                "message": message,
                "context": context or {},
                "timestamp": self._get_current_timestamp()
            }
        }
        
        try:
            await self.manager.send_personal_message(notification, user_id)
            print(f"✅ Sent error notification to user {user_id}: {error_type}")
        except Exception as e:
            print(f"❌ Failed to send error notification to user {user_id}: {str(e)}")
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"


# Global notification service instance
notification_service = NotificationService()


def get_notification_service() -> NotificationService:
    """Dependency to get notification service"""
    return notification_service
