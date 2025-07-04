from datetime import datetime, timezone
from typing import List, Optional
from supabase import Client
from app.models import PageCreate, PageUpdate, PageResponse, BatchPageUploadResponse
import os
import uuid
from PIL import Image
import io
import base64


class PageService:
    """Service for managing pages"""

    def __init__(self, supabase: Client, ocr_service=None, chapter_service=None, series_service=None):
        self.supabase = supabase
        self.table_name = "pages"
        self.storage_bucket = "pages"
        self.ocr_service = ocr_service
        self.chapter_service = chapter_service
        self.series_service = series_service
    
    async def create_page(self, page_data: PageCreate, file_content: bytes, file_extension: str) -> PageResponse:
        """Create a new page with file upload to Supabase storage"""
        try:
            # Generate unique file name
            file_id = str(uuid.uuid4())
            file_name = f"{file_id}.{file_extension}"
            file_path = f"chapter_{page_data.chapter_id}/{file_name}"

            # Get image dimensions if not provided
            width, height = page_data.width, page_data.height
            if not width or not height:
                try:
                    image = Image.open(io.BytesIO(file_content))
                    width, height = image.size
                except Exception as e:
                    width, height = None, None

            # Upload file to Supabase storage
            try:
                # Simple upload approach
                storage_response = self.supabase.storage.from_(self.storage_bucket).upload(
                    file_path,
                    file_content
                )

                # Check for errors in the response
                if hasattr(storage_response, 'error') and storage_response.error:
                    raise Exception(f"Storage upload failed: {storage_response.error}")

            except Exception as upload_error:
                print(f"❌ Upload error: {upload_error}")
                raise Exception(f"Failed to upload file: {upload_error}")
            
            # Prepare data for database insertion
            insert_data = {
                "chapter_id": page_data.chapter_id,
                "page_number": page_data.page_number,
                "file_path": file_path,
                "file_name": page_data.file_name,
                "width": width,
                "height": height,
                "context": page_data.context or "",  # Ensure context is never None
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

            # Convert file_path to public URL
            original_path = page_data['file_path']
            public_url = self.get_page_url(original_path)
            page_data['file_path'] = public_url

            # Update chapter next_page field if chapter_service is available
            if self.chapter_service:
                try:
                    await self.chapter_service.update_next_page_number(page_data.chapter_id)
                except Exception as e:
                    print(f"⚠️ Warning: Could not update chapter next_page: {str(e)}")

            return PageResponse(**page_data)
            
        except Exception as e:
            print(f"❌ Error creating page: {str(e)}")
            raise Exception(f"Failed to create page: {str(e)}")

    async def create_pages_batch(self, chapter_id: str, files_data: List[tuple], start_page_number: int) -> BatchPageUploadResponse:
        """Create multiple pages with batch file upload"""
        try:
            # Get chapter and series information for language-specific OCR
            series_language = None
            if self.chapter_service and self.series_service:
                try:
                    chapter = await self.chapter_service.get_chapter_by_id(chapter_id)
                    if chapter:
                        series = await self.series_service.get_series_by_id(chapter.series_id)
                        if series:
                            series_language = series.language
                            print(f"🌐 Using series language for OCR: {series_language}")
                except Exception as e:
                    print(f"⚠️ Could not get series language: {str(e)}")

            # Use the provided start page number
            next_page_number = start_page_number

            created_pages = []
            failed_uploads = []

            # Process each file
            for i, (file_content, file_extension, original_filename) in enumerate(files_data):
                try:
                    page_number = next_page_number + i

                    # Process OCR if OCR service is available
                    ocr_context = ""
                    if self.ocr_service:
                        try:
                            # Convert image to base64 for OCR processing
                            base64_image = base64.b64encode(file_content).decode('utf-8')

                            # Use language-specific OCR if series language is available
                            if series_language:
                                # Get language-specific OCR reader based on series language
                                language_specific_reader = self.ocr_service.get_language_specific_reader(series_language)

                                # Process with language-specific OCR
                                ocr_result = self.ocr_service.process_image_with_specific_reader(
                                    base64_image, language_specific_reader, series_language
                                )
                                print(f"🔍 Using {series_language}-specific OCR for page {page_number}")
                            else:
                                # Fallback to generic OCR
                                ocr_result = self.ocr_service.process_image(base64_image)
                                print(f"🔍 Using generic OCR for page {page_number}")

                            if ocr_result.success and ocr_result.text.strip():
                                ocr_context = ocr_result.text.strip()
                                print(f"✅ OCR extracted text for page {page_number}: {ocr_context[:100]}...")
                            else:
                                print(f"⚠️ OCR failed for page {page_number}: No text extracted")

                        except Exception as ocr_error:
                            print(f"⚠️ OCR processing failed for page {page_number}: {str(ocr_error)}")
                            # Continue without OCR context

                    # Create page data
                    page_data = PageCreate(
                        chapter_id=chapter_id,
                        page_number=page_number,
                        file_name=original_filename or f"page_{page_number}.{file_extension}",
                        context=ocr_context  # Use OCR result or empty string
                    )

                    # Create the page
                    page = await self.create_page(page_data, file_content, file_extension)
                    created_pages.append(page)

                except Exception as e:
                    print(f"❌ Error creating page {next_page_number + i}: {str(e)}")
                    failed_uploads.append(f"Page {next_page_number + i}: {str(e)}")
                    continue

            # Update chapter next_page field if chapter_service is available and pages were created
            if self.chapter_service and len(created_pages) > 0:
                try:
                    await self.chapter_service.update_next_page_number(chapter_id)
                except Exception as e:
                    print(f"⚠️ Warning: Could not update chapter next_page: {str(e)}")

            return BatchPageUploadResponse(
                success=len(created_pages) > 0,
                message=f"Successfully uploaded {len(created_pages)} pages" +
                       (f", {len(failed_uploads)} failed" if failed_uploads else ""),
                pages=created_pages,
                total_uploaded=len(created_pages),
                failed_uploads=failed_uploads
            )

        except Exception as e:
            print(f"❌ Error in batch upload: {str(e)}")
            raise Exception(f"Failed to batch upload pages: {str(e)}")

    async def get_pages_by_chapter(self, chapter_id: str, skip: int = 0, limit: int = 100) -> List[PageResponse]:
        """Get all pages for a specific chapter with pagination"""
        try:
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
                return []

            # Convert file_path to public URL for each page
            pages_data = []
            for page in response.data:
                original_path = page['file_path']
                public_url = self.get_page_url(original_path)
                page['file_path'] = public_url
                pages_data.append(page)

            pages_list = [PageResponse(**page) for page in pages_data]

            return pages_list
            
        except Exception as e:
            print(f"❌ Error fetching pages for chapter {chapter_id}: {str(e)}")
            raise Exception(f"Failed to fetch pages: {str(e)}")
    
    async def get_page_by_id(self, page_id: str) -> Optional[PageResponse]:
        """Get a specific page by ID"""
        try:
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

            # Convert file_path to public URL
            page_data['file_path'] = self.get_page_url(page_data['file_path'])

            return PageResponse(**page_data)
            
        except Exception as e:
            print(f"❌ Error fetching page {page_id}: {str(e)}")
            raise Exception(f"Failed to fetch page: {str(e)}")
    
    async def update_page(self, page_id: str, page_data: PageUpdate) -> Optional[PageResponse]:
        """Update an existing page"""
        try:
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
            except Exception as e:
                print(f"⚠️ Warning: Could not delete file from storage: {e}")
               
            return True
            
        except Exception as e:
            print(f"❌ Error deleting page {page_id}: {str(e)}")
            raise Exception(f"Failed to delete page: {str(e)}")
    
    def get_page_url(self, file_path: str) -> str:
        """Get public URL for a page file"""
        try:
            # Check if file_path is already a full URL
            if file_path.startswith('http'):
                # Clean up any trailing ? or ?? from already processed URLs
                if file_path.endswith('??'):
                    file_path = file_path[:-2]
                elif file_path.endswith('?'):
                    file_path = file_path[:-1]
                return file_path

            # Get the Supabase project URL from environment or construct it
            supabase_url = os.getenv('SUPABASE_URL', 'https://rmxlhsorxetqhfbzvmtg.supabase.co')

            # Construct the public URL manually for more control
            public_url = f"{supabase_url}/storage/v1/object/public/{self.storage_bucket}/{file_path}"

            # Also try the Supabase client method for comparison
            try:
                response = self.supabase.storage.from_(self.storage_bucket).get_public_url(file_path)

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

    async def create_pages_batch_with_auto_textboxes(self, chapter_id: str, files_data: List[tuple], start_page_number: int, text_box_service=None) -> BatchPageUploadResponse:
        """Create multiple pages with batch file upload and automatic text box creation"""
        try:
            # Get chapter and series information for language-specific OCR
            series_language = None
            if self.chapter_service and self.series_service:
                try:
                    chapter = await self.chapter_service.get_chapter_by_id(chapter_id)
                    if chapter:
                        series = await self.series_service.get_series_by_id(chapter.series_id)
                        if series:
                            series_language = series.language
                            print(f"🌐 Using series language for OCR: {series_language}")
                except Exception as e:
                    print(f"⚠️ Could not get series language: {str(e)}")

            # Use the provided start page number
            next_page_number = start_page_number

            created_pages = []
            failed_uploads = []
            total_text_boxes_created = 0

            # Process each file
            for i, (file_content, file_extension, original_filename) in enumerate(files_data):
                try:
                    page_number = next_page_number + i

                    # Process OCR if OCR service is available
                    ocr_context = ""
                    if self.ocr_service:
                        try:
                            # Convert image to base64 for OCR processing
                            base64_image = base64.b64encode(file_content).decode('utf-8')

                            # Use language-specific OCR if series language is available
                            if series_language:
                                # Get language-specific OCR reader based on series language
                                language_specific_reader = self.ocr_service.get_language_specific_reader(series_language)

                                # Process with language-specific OCR
                                ocr_result = self.ocr_service.process_image_with_specific_reader(
                                    base64_image, language_specific_reader, series_language
                                )
                                print(f"🔍 Using {series_language}-specific OCR for page {page_number}")
                            else:
                                # Fallback to generic OCR
                                ocr_result = self.ocr_service.process_image(base64_image)
                                print(f"🔍 Using generic OCR for page {page_number}")

                            if ocr_result.success and ocr_result.text.strip():
                                ocr_context = ocr_result.text.strip()
                                print(f"✅ OCR extracted text for page {page_number}: {ocr_context[:100]}...")
                            else:
                                print(f"⚠️ OCR failed for page {page_number}: No text extracted")

                        except Exception as ocr_error:
                            print(f"⚠️ OCR processing failed for page {page_number}: {str(ocr_error)}")
                            # Continue without OCR context

                    # Create page data
                    page_data = PageCreate(
                        chapter_id=chapter_id,
                        page_number=page_number,
                        file_name=original_filename or f"page_{page_number}.{file_extension}",
                        context=ocr_context  # Use OCR result or empty string
                    )

                    # Create the page
                    page = await self.create_page(page_data, file_content, file_extension)
                    created_pages.append(page)

                    # Auto-create text boxes if services are available
                    if self.ocr_service and text_box_service:
                        try:
                            # Convert image to base64 for text region detection
                            base64_image = base64.b64encode(file_content).decode('utf-8')

                            # Detect text regions
                            detection_result = self.ocr_service.detect_text_regions(base64_image)

                            if detection_result.success and detection_result.text_regions:
                                # Get the page image URL
                                page_image_url = self.get_page_url(page.file_path)

                                # Create text boxes from detected regions
                                text_boxes = await text_box_service.create_text_boxes_from_detection(
                                    page.id, detection_result, page_image_url
                                )
                                total_text_boxes_created += len(text_boxes)
                                print(f"✅ Auto-created {len(text_boxes)} text boxes for page {page_number}")
                            else:
                                print(f"⚠️ No text regions detected for page {page_number}")

                        except Exception as textbox_error:
                            print(f"⚠️ Auto text box creation failed for page {page_number}: {str(textbox_error)}")
                            # Continue without text boxes - don't fail the page creation

                except Exception as e:
                    print(f"❌ Error creating page {next_page_number + i}: {str(e)}")
                    failed_uploads.append(f"Page {next_page_number + i}: {str(e)}")
                    continue

            success_message = f"Successfully uploaded {len(created_pages)} pages"
            if total_text_boxes_created > 0:
                success_message += f" with {total_text_boxes_created} auto-created text boxes"

            # Update chapter next_page field if chapter_service is available and pages were created
            if self.chapter_service and len(created_pages) > 0:
                try:
                    await self.chapter_service.update_next_page_number(chapter_id)
                except Exception as e:
                    print(f"⚠️ Warning: Could not update chapter next_page: {str(e)}")

            return BatchPageUploadResponse(
                success=len(created_pages) > 0,
                message=success_message,
                pages=created_pages,
                total_uploaded=len(created_pages),
                failed_uploads=failed_uploads
            )

        except Exception as e:
            print(f"❌ Error in batch page upload with auto text boxes: {str(e)}")
            raise Exception(f"Failed to upload pages: {str(e)}")
