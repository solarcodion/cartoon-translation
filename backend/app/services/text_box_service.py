from typing import List, Optional
from datetime import datetime, timezone
from supabase import Client
import os

from app.models import (
    TextBoxResponse,
    TextBoxCreate,
    TextBoxUpdate,
    TextRegionDetectionResponse
)


class TextBoxService:
    """Service for managing text boxes"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table_name = "text_boxes"
    
    async def create_text_box(self, text_box_data: TextBoxCreate) -> TextBoxResponse:
        """Create a new text box"""
        try:
            # Get page image URL if not provided
            page_image_url = text_box_data.image
            if not page_image_url:
                page_image_url = await self._get_page_image_url(text_box_data.page_id)

            # Prepare data for database insertion
            insert_data = {
                "page_id": text_box_data.page_id,
                "image": page_image_url or "",
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

    async def create_text_boxes_from_detection(self, page_id: str, detection_result: TextRegionDetectionResponse, page_image_url: str = None) -> List[TextBoxResponse]:
        """
        Create text boxes automatically from text region detection results

        Args:
            page_id: ID of the page to create text boxes for
            detection_result: Text region detection results from OCR service
            page_image_url: URL of the original page image (stored in image field)

        Returns:
            List of created text boxes
        """
        try:
            if not detection_result.success or not detection_result.text_regions:
                print(f"⚠️ No text regions detected for page {page_id}")
                return []

            created_text_boxes = []

            for region in detection_result.text_regions:
                try:
                    # Create text box data
                    text_box_data = TextBoxCreate(
                        page_id=page_id,
                        image=page_image_url,  # Store page image URL in the image field
                        x=region.x,
                        y=region.y,
                        w=region.width,
                        h=region.height,
                        ocr=region.text,
                        tm=region.confidence  # Use OCR confidence as TM score
                    )

                    # Create the text box
                    text_box = await self.create_text_box(text_box_data)
                    created_text_boxes.append(text_box)

                except Exception as e:
                    print(f"❌ Error creating text box for region at ({region.x}, {region.y}): {str(e)}")
                    continue

            print(f"✅ Created {len(created_text_boxes)} text boxes for page {page_id}")
            return created_text_boxes

        except Exception as e:
            print(f"❌ Error creating text boxes from detection for page {page_id}: {str(e)}")
            return []

    async def _get_page_image_url(self, page_id: str) -> str:
        """Get the page image URL from the page data"""
        try:
            # Fetch page data from database
            response = self.supabase.table("pages").select("file_path").eq("id", page_id).execute()

            if not response.data:
                print(f"⚠️ Page not found: {page_id}")
                return ""

            page_data = response.data[0]
            file_path = page_data.get("file_path", "")

            if not file_path:
                print(f"⚠️ No file_path found for page: {page_id}")
                return ""

            # Use the same URL construction logic as PageService
            return self._get_page_url(file_path)

        except Exception as e:
            print(f"❌ Error getting page image URL for page {page_id}: {str(e)}")
            return ""

    def _get_page_url(self, file_path: str) -> str:
        """Get public URL for a page file (same logic as PageService)"""
        try:
            # Check if file_path is already a full URL
            if file_path.startswith('http'):
                # Clean up any trailing ? or ?? from already processed URLs
                if file_path.endswith('??'):
                    file_path = file_path[:-2]
                elif file_path.endswith('?'):
                    file_path = file_path[:-1]
                return file_path

            # Get the Supabase project URL from environment
            supabase_url = os.getenv('SUPABASE_URL', 'https://rmxlhsorxetqhfbzvmtg.supabase.co')
            storage_bucket = "pages"

            # Construct the public URL manually
            public_url = f"{supabase_url}/storage/v1/object/public/{storage_bucket}/{file_path}"

            # Also try the Supabase client method for comparison
            try:
                response = self.supabase.storage.from_(storage_bucket).get_public_url(file_path)

                # Handle different response formats from Supabase
                client_url = ""
                if isinstance(response, dict):
                    # Try different possible keys
                    client_url = response.get('publicURL') or response.get('publicUrl') or response.get('url') or response.get('signedURL') or ""
                elif hasattr(response, 'publicURL'):
                    client_url = response.publicURL
                elif hasattr(response, 'publicUrl'):
                    client_url = response.publicUrl
                elif hasattr(response, 'url'):
                    client_url = response.url
                else:
                    client_url = str(response)

                # Clean up any malformed URLs (remove trailing ? or ??)
                if client_url.endswith('??'):
                    client_url = client_url[:-2]
                elif client_url.endswith('?'):
                    client_url = client_url[:-1]

                # Use client URL if it looks valid
                if client_url and client_url.startswith('http'):
                    return client_url

            except Exception as client_error:
                print(f"⚠️ Supabase client method failed: {client_error}")

            # Fallback to constructed URL
            return public_url

        except Exception as e:
            print(f"❌ Error getting page URL: {str(e)}")
            return ""
