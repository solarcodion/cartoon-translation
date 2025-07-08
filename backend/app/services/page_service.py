from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import os
import base64
from io import BytesIO
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("Warning: PIL not available. Image dimension detection will be disabled.")

from supabase import Client

from app.models import PageCreate, PageUpdate, PageResponse, BatchPageUploadResponse


class PageService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table_name = "pages"
        self.storage_bucket = "pages"

    async def create_page(self, page_data: PageCreate, file_data: bytes, file_extension: str) -> PageResponse:
        """Create a new page with file upload"""
        try:
            # Generate unique filename
            file_id = str(uuid.uuid4())
            file_name = f"{file_id}.{file_extension}"
            file_path = f"{page_data.chapter_id}/{file_name}"

            # Upload file to Supabase Storage
            try:
                upload_response = self.supabase.storage.from_(self.storage_bucket).upload(
                    file_path, file_data, {"content-type": f"image/{file_extension}"}
                )

                # Check if upload was successful
                # UploadResponse object has path, full_path, and fullPath attributes when successful
                if not hasattr(upload_response, 'path') or not upload_response.path:
                    raise Exception("File upload failed: No path returned")

                print(f"✅ File uploaded successfully: {upload_response.path}")

            except Exception as upload_error:
                print(f"❌ Error uploading file: {str(upload_error)}")
                raise Exception(f"Failed to upload file: {str(upload_error)}")

            # Get public URL for the uploaded file
            try:
                public_url_response = self.supabase.storage.from_(self.storage_bucket).get_public_url(file_path)
                public_url = public_url_response
            except Exception as url_error:
                print(f"❌ Error getting public URL: {str(url_error)}")
                # Clean up uploaded file
                self.supabase.storage.from_(self.storage_bucket).remove([file_path])
                raise Exception(f"Failed to get public URL: {str(url_error)}")

            # Prepare data for database insertion
            insert_data = {
                "chapter_id": page_data.chapter_id,
                "page_number": page_data.page_number,
                "file_path": public_url,
                "file_name": page_data.file_name,
                "width": page_data.width or 0,
                "height": page_data.height or 0,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            # Insert into database
            response = self.supabase.table(self.table_name).insert(insert_data).execute()

            if not response.data:
                # Clean up uploaded file
                self.supabase.storage.from_(self.storage_bucket).remove([file_path])
                raise Exception("Failed to create page - no data returned")

            page_data = response.data[0]
            return PageResponse(**page_data)

        except Exception as e:
            print(f"❌ Error creating page: {str(e)}")
            raise Exception(f"Failed to create page: {str(e)}")

    async def batch_create_pages(
        self, 
        chapter_id: str, 
        files_data: List[Dict[str, Any]], 
        start_page_number: int
    ) -> BatchPageUploadResponse:
        """Create multiple pages in batch"""
        try:
            created_pages = []
            failed_uploads = []
            
            for i, file_info in enumerate(files_data):
                try:
                    page_number = start_page_number + i
                    
                    # Create page data
                    page_data = PageCreate(
                        chapter_id=chapter_id,
                        page_number=page_number,
                        file_name=file_info["original_name"],
                        width=file_info.get("width", 0),
                        height=file_info.get("height", 0)
                    )
                    
                    # Create the page
                    page = await self.create_page(
                        page_data, 
                        file_info["data"], 
                        file_info["extension"]
                    )
                    created_pages.append(page)
                    
                except Exception as e:
                    print(f"❌ Failed to upload file {file_info.get('original_name', 'unknown')}: {str(e)}")
                    failed_uploads.append(file_info.get("original_name", "unknown"))

            # Update chapter's next_page number
            if created_pages:
                next_page = start_page_number + len(created_pages)
                try:
                    self.supabase.table("chapters").update({
                        "next_page": next_page,
                        "page_count": len(created_pages),
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", chapter_id).execute()
                except Exception as update_error:
                    print(f"⚠️ Warning: Failed to update chapter next_page: {str(update_error)}")

            return BatchPageUploadResponse(
                success=len(created_pages) > 0,
                message=f"Successfully uploaded {len(created_pages)} pages",
                pages=created_pages,
                total_uploaded=len(created_pages),
                failed_uploads=failed_uploads
            )

        except Exception as e:
            print(f"❌ Error in batch page creation: {str(e)}")
            raise Exception(f"Failed to create pages: {str(e)}")

    async def get_pages_by_chapter(
        self, 
        chapter_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[PageResponse]:
        """Get all pages for a specific chapter with pagination"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("chapter_id", chapter_id)
                .order("page_number", desc=False)
                .range(skip, skip + limit - 1)
                .execute()
            )
            
            if not response.data:
                return []
            
            pages_list = [PageResponse(**page) for page in response.data]
            return pages_list
            
        except Exception as e:
            print(f"❌ Error fetching pages for chapter {chapter_id}: {str(e)}")
            raise Exception(f"Failed to fetch pages: {str(e)}")

    async def get_page_count_by_chapter(self, chapter_id: str) -> int:
        """Get total count of pages for a chapter"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .select("id", count="exact")
                .eq("chapter_id", chapter_id)
                .execute()
            )
            
            return response.count or 0
            
        except Exception as e:
            print(f"❌ Error getting page count for chapter {chapter_id}: {str(e)}")
            return 0

    async def get_page_by_id(self, page_id: str) -> PageResponse:
        """Get a specific page by ID"""
        try:
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("id", page_id)
                .single()
                .execute()
            )
            
            if not response.data:
                raise Exception(f"Page with ID {page_id} not found")
            
            return PageResponse(**response.data)
            
        except Exception as e:
            print(f"❌ Error fetching page {page_id}: {str(e)}")
            raise Exception(f"Failed to fetch page: {str(e)}")

    async def update_page(self, page_id: str, page_data: PageUpdate) -> PageResponse:
        """Update an existing page"""
        try:
            # Prepare update data
            update_data = {
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Add fields that are being updated
            if page_data.page_number is not None:
                update_data["page_number"] = page_data.page_number
            if page_data.file_name is not None:
                update_data["file_name"] = page_data.file_name
            if page_data.width is not None:
                update_data["width"] = page_data.width
            if page_data.height is not None:
                update_data["height"] = page_data.height

            # Update in database
            response = (
                self.supabase.table(self.table_name)
                .update(update_data)
                .eq("id", page_id)
                .execute()
            )

            if not response.data:
                raise Exception("Failed to update page - no data returned")

            return PageResponse(**response.data[0])

        except Exception as e:
            print(f"❌ Error updating page {page_id}: {str(e)}")
            raise Exception(f"Failed to update page: {str(e)}")

    async def delete_page(self, page_id: str) -> None:
        """Delete a page and its associated file"""
        try:
            # First get the page to find the file path
            page = await self.get_page_by_id(page_id)
            
            # Delete from database first
            response = (
                self.supabase.table(self.table_name)
                .delete()
                .eq("id", page_id)
                .execute()
            )

            if not response.data:
                raise Exception("Failed to delete page from database")

            # Try to delete the file from storage
            try:
                # Extract file path from public URL
                file_path = page.file_path.split(f"/{self.storage_bucket}/")[-1]
                self.supabase.storage.from_(self.storage_bucket).remove([file_path])
            except Exception as file_error:
                print(f"⚠️ Warning: Failed to delete file from storage: {str(file_error)}")
                # Don't fail the entire operation if file deletion fails

        except Exception as e:
            print(f"❌ Error deleting page {page_id}: {str(e)}")
            raise Exception(f"Failed to delete page: {str(e)}")

    def _get_image_dimensions(self, file_data: bytes) -> tuple[int, int]:
        """Get image dimensions from file data"""
        if not PIL_AVAILABLE:
            return (0, 0)

        try:
            image = Image.open(BytesIO(file_data))
            return image.size
        except Exception as e:
            print(f"⚠️ Warning: Could not get image dimensions: {str(e)}")
            return (0, 0)

    def _get_file_extension(self, filename: str) -> str:
        """Extract file extension from filename"""
        return filename.split('.')[-1].lower() if '.' in filename else 'jpg'
