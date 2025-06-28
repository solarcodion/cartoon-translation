from typing import List, Optional
from datetime import datetime, timezone
from supabase import Client

from app.models import (
    TextBoxResponse,
    TextBoxCreate,
    TextBoxUpdate
)


class TextBoxService:
    """Service for managing text boxes"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table_name = "text_boxes"
    
    async def create_text_box(self, text_box_data: TextBoxCreate) -> TextBoxResponse:
        """Create a new text box"""
        try:
            # Prepare data for database insertion
            insert_data = {
                "page_id": text_box_data.page_id,
                "image": text_box_data.image or "",
                "x": text_box_data.x,
                "y": text_box_data.y,
                "w": text_box_data.w,
                "h": text_box_data.h,
                "ocr": text_box_data.ocr or "",
                "corrected": text_box_data.corrected or "",
                "tm": text_box_data.tm,
                "reason": text_box_data.reason or "",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Insert into database
            response = self.supabase.table(self.table_name).insert(insert_data).execute()
            
            if not response.data:
                raise Exception("Failed to create text box - no data returned")
            
            text_box_data = response.data[0]
            
            return TextBoxResponse(**text_box_data)
            
        except Exception as e:
            print(f"❌ Error creating text box: {str(e)}")
            raise Exception(f"Failed to create text box: {str(e)}")
    
    async def get_text_boxes_by_page(self, page_id: str, skip: int = 0, limit: int = 100) -> List[TextBoxResponse]:
        """Get all text boxes for a specific page with pagination"""
        try:
            # Query with pagination and ordering by created_at
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("page_id", page_id)
                .order("created_at", desc=False)
                .range(skip, skip + limit - 1)
                .execute()
            )
            
            if not response.data:
                return []
            
            text_boxes = []
            for text_box_data in response.data:
                text_boxes.append(TextBoxResponse(**text_box_data))
            
            return text_boxes
            
        except Exception as e:
            print(f"❌ Error fetching text boxes for page {page_id}: {str(e)}")
            raise Exception(f"Failed to fetch text boxes: {str(e)}")
    
    async def get_text_box_by_id(self, text_box_id: str) -> Optional[TextBoxResponse]:
        """Get a specific text box by ID"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("id", text_box_id)
                .execute()
            )
            
            if not response.data:
                print(f"❌ Text box with ID {text_box_id} not found")
                return None
            
            text_box_data = response.data[0]

            return TextBoxResponse(**text_box_data)
            
        except Exception as e:
            print(f"❌ Error fetching text box {text_box_id}: {str(e)}")
            raise Exception(f"Failed to fetch text box: {str(e)}")
    
    async def update_text_box(self, text_box_id: str, text_box_data: TextBoxUpdate) -> Optional[TextBoxResponse]:
        """Update a text box"""
        try:
            # Prepare update data (only include non-None values)
            update_data = text_box_data.model_dump(exclude_unset=True)
            if update_data:
                update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            # Update in database
            response = (
                self.supabase.table(self.table_name)
                .update(update_data)
                .eq("id", text_box_id)
                .execute()
            )
            
            if not response.data:
                print(f"❌ Text box with ID {text_box_id} not found for update")
                return None
            
            updated_text_box = response.data[0]
            
            return TextBoxResponse(**updated_text_box)
            
        except Exception as e:
            print(f"❌ Error updating text box {text_box_id}: {str(e)}")
            raise Exception(f"Failed to update text box: {str(e)}")
    
    async def delete_text_box(self, text_box_id: str) -> bool:
        """Delete a text box"""
        try:
            # Delete from database
            response = (
                self.supabase.table(self.table_name)
                .delete()
                .eq("id", text_box_id)
                .execute()
            )
            
            if not response.data:
                print(f"❌ Text box with ID {text_box_id} not found for deletion")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Error deleting text box {text_box_id}: {str(e)}")
            raise Exception(f"Failed to delete text box: {str(e)}")
    
    async def get_text_boxes_by_chapter(self, chapter_id: str, skip: int = 0, limit: int = 1000) -> List[TextBoxResponse]:
        """Get all text boxes for a specific chapter (across all pages)"""
        try:
            # First get all pages for the chapter
            pages_response = (
                self.supabase.table("pages")
                .select("id")
                .eq("chapter_id", chapter_id)
                .execute()
            )
            
            if not pages_response.data:
                return []
            
            page_ids = [page["id"] for page in pages_response.data]
            
            # Then get all text boxes for those pages
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .in_("page_id", page_ids)
                .order("created_at", desc=False)
                .range(skip, skip + limit - 1)
                .execute()
            )
            
            if not response.data:
                return []
            
            text_boxes = []
            for text_box_data in response.data:
                text_boxes.append(TextBoxResponse(**text_box_data))
            
            return text_boxes
            
        except Exception as e:
            print(f"❌ Error fetching text boxes for chapter {chapter_id}: {str(e)}")
            raise Exception(f"Failed to fetch text boxes: {str(e)}")
