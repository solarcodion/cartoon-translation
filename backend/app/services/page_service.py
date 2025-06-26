from datetime import datetime, timezone
from typing import List, Optional
from supabase import Client
from app.models import PageCreate, PageUpdate, PageResponse
import os
import uuid
from PIL import Image
import io


class PageService:
    """Service for managing pages"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table_name = "pages"
        self.storage_bucket = "pages"
    
    async def create_page(self, page_data: PageCreate, file_content: bytes, file_extension: str) -> PageResponse:
        """Create a new page with file upload to Supabase storage"""
        try:
            # Generate unique file name
            file_id = str(uuid.uuid4())
            file_name = f"{file_id}.{file_extension}"
            file_path = f"chapter_{page_data.chapter_id}/{file_name}"

            print(f"📝 Creating page with data: {page_data.model_dump()}")
            print(f"📁 File path: {file_path}")

            # Get image dimensions if not provided
            width, height = page_data.width, page_data.height
            if not width or not height:
                try:
                    image = Image.open(io.BytesIO(file_content))
                    width, height = image.size
                    print(f"📐 Detected image dimensions: {width}x{height}")
                except Exception as e:
                    print(f"⚠️ Could not detect image dimensions: {e}")
                    width, height = None, None

            # Skip bucket creation - assume it exists
            print(f"ℹ️ Using storage bucket: {self.storage_bucket}")

            # Upload file to Supabase storage
            try:
                print(f"🚀 Uploading file to {self.storage_bucket}/{file_path}")

                # Simple upload approach
                storage_response = self.supabase.storage.from_(self.storage_bucket).upload(
                    file_path,
                    file_content
                )

                print(f"📤 Upload response: {storage_response}")

                # Check for errors in the response
                if hasattr(storage_response, 'error') and storage_response.error:
                    raise Exception(f"Storage upload failed: {storage_response.error}")

                print(f"✅ File uploaded to storage: {file_path}")

            except Exception as upload_error:
                print(f"❌ Upload error: {upload_error}")
                raise Exception(f"Failed to upload file: {upload_error}")

            print(f"✅ File uploaded to storage: {file_path}")
            
            # Prepare data for database insertion
            insert_data = {
                "chapter_id": page_data.chapter_id,
                "page_number": page_data.page_number,
                "file_path": file_path,
                "file_name": page_data.file_name,
                "width": width,
                "height": height,
                "context": page_data.context,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Insert into database
            response = self.supabase.table(self.table_name).insert(insert_data).execute()
            
            if not response.data:
                # If database insert fails, clean up uploaded file
                self.supabase.storage.from_(self.storage_bucket).remove([file_path])
                raise Exception("Failed to create page - no data returned")
            
            page_data = response.data[0]
            print(f"✅ Page created successfully: {page_data}")

            # Convert file_path to public URL
            original_path = page_data['file_path']
            public_url = self.get_page_url(original_path)
            print(f"🔗 Converting path '{original_path}' to URL: '{public_url}'")
            page_data['file_path'] = public_url

            return PageResponse(**page_data)
            
        except Exception as e:
            print(f"❌ Error creating page: {str(e)}")
            raise Exception(f"Failed to create page: {str(e)}")
    
    async def get_pages_by_chapter(self, chapter_id: str, skip: int = 0, limit: int = 100) -> List[PageResponse]:
        """Get all pages for a specific chapter with pagination"""
        try:
            print(f"📋 Fetching pages for chapter {chapter_id} (skip: {skip}, limit: {limit})")
            
            # Query with pagination and ordering by page_number
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("chapter_id", chapter_id)
                .order("page_number", desc=False)
                .range(skip, skip + limit - 1)
                .execute()
            )
            
            if not response.data:
                print(f"📋 No pages found for chapter {chapter_id}")
                return []

            # Convert file_path to public URL for each page
            pages_data = []
            for page in response.data:
                original_path = page['file_path']
                public_url = self.get_page_url(original_path)
                print(f"🔄 Converting page {page.get('id', 'unknown')} path '{original_path}' to URL: '{public_url}'")
                page['file_path'] = public_url
                pages_data.append(page)

            pages_list = [PageResponse(**page) for page in pages_data]
            print(f"✅ Retrieved {len(pages_list)} pages for chapter {chapter_id}")

            return pages_list
            
        except Exception as e:
            print(f"❌ Error fetching pages for chapter {chapter_id}: {str(e)}")
            raise Exception(f"Failed to fetch pages: {str(e)}")
    
    async def get_page_by_id(self, page_id: str) -> Optional[PageResponse]:
        """Get a specific page by ID"""
        try:
            print(f"🔍 Fetching page with ID: {page_id}")
            
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("id", page_id)
                .execute()
            )
            
            if not response.data:
                print(f"❌ Page with ID {page_id} not found")
                return None
            
            page_data = response.data[0]
            print(f"✅ Page found: {page_data}")

            # Convert file_path to public URL
            page_data['file_path'] = self.get_page_url(page_data['file_path'])

            return PageResponse(**page_data)
            
        except Exception as e:
            print(f"❌ Error fetching page {page_id}: {str(e)}")
            raise Exception(f"Failed to fetch page: {str(e)}")
    
    async def update_page(self, page_id: str, page_data: PageUpdate) -> Optional[PageResponse]:
        """Update an existing page"""
        try:
            print(f"📝 Updating page {page_id} with data: {page_data.model_dump(exclude_unset=True)}")

            # Prepare update data (only include non-None fields)
            update_data = page_data.model_dump(exclude_unset=True)
            if update_data:
                update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
                
                response = (
                    self.supabase.table(self.table_name)
                    .update(update_data)
                    .eq("id", page_id)
                    .execute()
                )
                
                if not response.data:
                    print(f"❌ Page with ID {page_id} not found for update")
                    return None
                
                updated_page = response.data[0]
                print(f"✅ Page updated successfully: {updated_page}")

                # Convert file_path to public URL
                updated_page['file_path'] = self.get_page_url(updated_page['file_path'])

                return PageResponse(**updated_page)
            else:
                # No fields to update
                return await self.get_page_by_id(page_id)
                
        except Exception as e:
            print(f"❌ Error updating page {page_id}: {str(e)}")
            raise Exception(f"Failed to update page: {str(e)}")
    
    async def delete_page(self, page_id: str) -> bool:
        """Delete a page and its associated file"""
        try:
            print(f"🗑️ Deleting page with ID: {page_id}")
            
            # First get the page to get file path
            page = await self.get_page_by_id(page_id)
            if not page:
                print(f"❌ Page with ID {page_id} not found for deletion")
                return False
            
            # Delete from database first
            response = (
                self.supabase.table(self.table_name)
                .delete()
                .eq("id", page_id)
                .execute()
            )
            
            if not response.data:
                print(f"❌ Failed to delete page {page_id} from database")
                return False
            
            # Delete file from storage
            try:
                storage_response = self.supabase.storage.from_(self.storage_bucket).remove([page.file_path])
                print(f"✅ File deleted from storage: {page.file_path}")
            except Exception as e:
                print(f"⚠️ Warning: Could not delete file from storage: {e}")
                # Don't fail the operation if file deletion fails
            
            print(f"✅ Page {page_id} deleted successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error deleting page {page_id}: {str(e)}")
            raise Exception(f"Failed to delete page: {str(e)}")
    
    def get_page_url(self, file_path: str) -> str:
        """Get public URL for a page file"""
        try:
            print(f"🔗 Getting public URL for: {file_path}")

            # Check if file_path is already a full URL
            if file_path.startswith('http'):
                print(f"🔗 File path is already a URL: {file_path}")
                # Clean up any trailing ? or ?? from already processed URLs
                if file_path.endswith('??'):
                    file_path = file_path[:-2]
                    print(f"🔗 Cleaned already-URL (removed ??): {file_path}")
                elif file_path.endswith('?'):
                    file_path = file_path[:-1]
                    print(f"🔗 Cleaned already-URL (removed ?): {file_path}")
                return file_path

            # Get the Supabase project URL from environment or construct it
            supabase_url = os.getenv('SUPABASE_URL', 'https://rmxlhsorxetqhfbzvmtg.supabase.co')

            # Construct the public URL manually for more control
            public_url = f"{supabase_url}/storage/v1/object/public/{self.storage_bucket}/{file_path}"
            print(f"🔗 Constructed public URL: {public_url}")

            # Also try the Supabase client method for comparison
            try:
                response = self.supabase.storage.from_(self.storage_bucket).get_public_url(file_path)
                print(f"🔗 Supabase client response: {response}")
                print(f"🔗 Response type: {type(response)}")
                print(f"🔗 Response dir: {dir(response) if hasattr(response, '__dict__') else 'No __dict__'}")

                # Handle different response formats from Supabase
                client_url = ""
                if isinstance(response, dict):
                    # Try different possible keys
                    client_url = response.get('publicURL') or response.get('publicUrl') or response.get('url') or response.get('signedURL') or ""
                    print(f"🔗 Extracted URL from dict: {client_url}")
                elif hasattr(response, 'publicURL'):
                    client_url = response.publicURL
                    print(f"🔗 Using publicURL attribute: {client_url}")
                elif hasattr(response, 'publicUrl'):
                    client_url = response.publicUrl
                    print(f"🔗 Using publicUrl attribute: {client_url}")
                elif hasattr(response, 'url'):
                    client_url = response.url
                    print(f"🔗 Using url attribute: {client_url}")
                else:
                    client_url = str(response)
                    print(f"🔗 Converting to string: {client_url}")

                # Clean up any malformed URLs (remove trailing ? or ??)
                if client_url.endswith('??'):
                    client_url = client_url[:-2]
                    print(f"🔗 Cleaned client URL (removed ??): {client_url}")
                elif client_url.endswith('?'):
                    client_url = client_url[:-1]
                    print(f"🔗 Cleaned client URL (removed ?): {client_url}")

                # Use client URL if it looks valid
                if client_url and client_url.startswith('http'):
                    print(f"🔗 Using cleaned client URL: {client_url}")
                    return client_url

            except Exception as client_error:
                print(f"⚠️ Supabase client method failed: {client_error}")

            # Fallback to constructed URL
            print(f"🔗 Using constructed URL: {public_url}")
            return public_url

        except Exception as e:
            print(f"❌ Error getting page URL: {str(e)}")
            return ""
