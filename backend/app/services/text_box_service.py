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
from app.services.tm_calculation_service import TMCalculationService
from app.services.translation_memory_service import TranslationMemoryService


class TextBoxService:
    """Service for managing text boxes"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table_name = "text_boxes"
        self.tm_service = TMCalculationService(supabase)
        self.tm_memory_service = TranslationMemoryService(supabase)
    
    async def create_text_box(self, text_box_data: TextBoxCreate) -> TextBoxResponse:
        """Create a new text box"""
        try:
            # Get page image URL if not provided
            page_image_url = text_box_data.image
            if not page_image_url:
                page_image_url = await self._get_page_image_url(text_box_data.page_id)

            # Calculate TM score if OCR text is provided and no TM score is set
            tm_score = text_box_data.tm
            if text_box_data.ocr and text_box_data.ocr.strip() and tm_score is None:
                try:
                    # Get series_id from page_id
                    series_id = await self._get_series_id_from_page(text_box_data.page_id)
                    if series_id:
                        # Calculate TM score
                        tm_score, best_match = await self.tm_service.calculate_tm_score(
                            text_box_data.ocr.strip(),
                            series_id
                        )
                        print(f"📊 Calculated TM score: {tm_score:.3f} for text: '{text_box_data.ocr[:50]}...'")
                        if best_match:
                            print(f"📝 Best match: '{best_match.source_text}' -> '{best_match.target_text}'")
                        else:
                            print(f"📊 No TM match found for text: '{text_box_data.ocr[:50]}...' - setting TM to 0")
                    else:
                        print(f"⚠️ Could not get series_id for page - setting TM to 0")
                        tm_score = 0.0
                except Exception as tm_error:
                    print(f"⚠️ TM calculation failed: {str(tm_error)} - setting TM to 0")
                    tm_score = 0.0

            # Ensure tm_score is never None - default to 0.0
            if tm_score is None:
                tm_score = 0.0

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
                "tm": tm_score,
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
        """Update a text box and optionally create TM entry"""
        try:
            # Get the current text box to check for changes
            current_text_box = await self.get_text_box_by_id(text_box_id)
            if not current_text_box:
                print(f"❌ Text box with ID {text_box_id} not found")
                return None

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
            updated_response = TextBoxResponse(**updated_text_box)

            # Create TM entry if we have both OCR and corrected text
            await self._create_tm_entry_if_needed(updated_response, current_text_box)

            return updated_response

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

    async def get_text_boxes_count_by_chapter(self, chapter_id: str) -> int:
        """Get total count of text boxes for a specific chapter"""
        try:
            # First get all pages for the chapter
            pages_response = (
                self.supabase.table("pages")
                .select("id")
                .eq("chapter_id", chapter_id)
                .execute()
            )

            if not pages_response.data:
                return 0

            page_ids = [page["id"] for page in pages_response.data]

            # Count text boxes for those pages
            response = (
                self.supabase.table(self.table_name)
                .select("id", count="exact")
                .in_("page_id", page_ids)
                .execute()
            )

            return response.count or 0

        except Exception as e:
            print(f"❌ Error counting text boxes for chapter {chapter_id}: {str(e)}")
            return 0

    async def clear_chapter_text_boxes(self, chapter_id: str) -> int:
        """Clear all text boxes for a chapter (used when resetting chapter translations)"""
        try:
            # Since pages functionality is removed, we can't clear text boxes by chapter
            # Return 0 as no text boxes were cleared
            return 0

        except Exception as e:
            print(f"❌ Error clearing text boxes for chapter {chapter_id}: {str(e)}")
            raise Exception(f"Failed to clear text boxes: {str(e)}")

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
                        tm=None  # Let create_text_box calculate proper TM score from translation memory
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
            response = (
                self.supabase.table("pages")
                .select("file_path")
                .eq("id", page_id)
                .execute()
            )

            if not response.data or not response.data[0]:
                print(f"❌ Page with ID {page_id} not found")
                return ""

            return response.data[0].get("file_path", "")

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

    async def _get_series_id_from_page(self, page_id: str) -> Optional[str]:
        """Get series_id from page_id by joining pages and chapters tables"""
        try:
            # First get the chapter_id from the page
            page_response = (
                self.supabase.table("pages")
                .select("chapter_id")
                .eq("id", page_id)
                .execute()
            )

            if not page_response.data or not page_response.data[0]:
                print(f"❌ Page with ID {page_id} not found")
                return None

            chapter_id = page_response.data[0].get("chapter_id")
            if not chapter_id:
                print(f"❌ No chapter_id found for page {page_id}")
                return None

            # Then get the series_id from the chapter
            chapter_response = (
                self.supabase.table("chapters")
                .select("series_id")
                .eq("id", chapter_id)
                .execute()
            )

            if not chapter_response.data or not chapter_response.data[0]:
                print(f"❌ Chapter with ID {chapter_id} not found")
                return None

            series_id = chapter_response.data[0].get("series_id")
            if not series_id:
                print(f"❌ No series_id found for chapter {chapter_id}")
                return None

            return series_id

        except Exception as e:
            print(f"❌ Error getting series_id from page {page_id}: {str(e)}")
            return None

    async def _create_tm_entry_if_needed(self, updated_text_box: TextBoxResponse, original_text_box: TextBoxResponse) -> None:
        """Create TM entry if text box has both OCR and corrected text"""
        try:
            # Check if we have both OCR and corrected text
            if not updated_text_box.ocr or not updated_text_box.ocr.strip():
                return

            if not updated_text_box.corrected or not updated_text_box.corrected.strip():
                return

            # Check if corrected text was actually updated (avoid duplicate TM entries)
            if (original_text_box.corrected and
                original_text_box.corrected.strip() == updated_text_box.corrected.strip()):
                return  # No change in corrected text, don't create duplicate TM entry

            # Get series_id
            series_id = await self._get_series_id_from_page(updated_text_box.page_id)
            if not series_id:
                print(f"⚠️ Could not get series_id for text box {updated_text_box.id}, skipping TM creation")
                return

            # Create TM entry
            from app.models import TranslationMemoryCreate
            tm_data = TranslationMemoryCreate(
                series_id=series_id,
                source_text=updated_text_box.ocr.strip(),
                target_text=updated_text_box.corrected.strip(),
                context=updated_text_box.reason or "Auto-created from text box save"
            )

            tm_entry = await self.tm_memory_service.create_tm_entry(tm_data)
            print(f"✅ Created TM entry: '{tm_entry.source_text}' -> '{tm_entry.target_text}'")

        except Exception as e:
            print(f"⚠️ Failed to create TM entry for text box {updated_text_box.id}: {str(e)}")
            # Don't raise exception - TM creation failure shouldn't break text box update
