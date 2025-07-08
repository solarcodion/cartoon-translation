#!/usr/bin/env python3
"""
Script to set up Supabase storage bucket and database tables for pages
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def setup_pages_table(supabase):
    """Create the pages table if it doesn't exist"""
    try:
        print("🗄️ Setting up pages table...")

        # SQL to create pages table with proper foreign key relationship
        create_pages_table_sql = """
        CREATE TABLE IF NOT EXISTS pages (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
            page_number integer NOT NULL DEFAULT 0,
            file_path text NOT NULL DEFAULT '',
            file_name varchar(255) NOT NULL DEFAULT '',
            width integer NOT NULL DEFAULT 0,
            height integer NOT NULL DEFAULT 0,
            created_at timestamp with time zone DEFAULT NOW(),
            updated_at timestamp with time zone DEFAULT NOW(),
            UNIQUE(chapter_id, page_number)
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_pages_chapter_id ON pages(chapter_id);
        CREATE INDEX IF NOT EXISTS idx_pages_page_number ON pages(page_number);

        -- Enable RLS (Row Level Security)
        ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies (allow all operations for authenticated users)
        DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON pages;
        CREATE POLICY "Allow all operations for authenticated users" ON pages
            FOR ALL USING (auth.role() = 'authenticated');
        """

        # Execute the SQL
        result = supabase.rpc('exec_sql', {'sql': create_pages_table_sql}).execute()

        if result.data:
            print("✅ Pages table created successfully")
            return True
        else:
            print("⚠️ Pages table creation returned no data (might already exist)")
            return True

    except Exception as e:
        print(f"❌ Error creating pages table: {str(e)}")
        # Try alternative approach using direct SQL execution
        try:
            print("🔄 Trying alternative table creation method...")

            # Check if pages table exists
            check_table_sql = """
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'pages'
            );
            """

            result = supabase.rpc('exec_sql', {'sql': check_table_sql}).execute()

            if result.data and result.data[0]:
                print("✅ Pages table already exists")
                return True
            else:
                print("❌ Pages table does not exist and creation failed")
                print("Please create the pages table manually in Supabase SQL editor:")
                print(create_pages_table_sql)
                return False

        except Exception as alt_error:
            print(f"❌ Alternative method also failed: {str(alt_error)}")
            print("Please create the pages table manually in Supabase SQL editor using the SQL provided above")
            return False

def setup_storage_bucket(supabase):
    """Create the pages storage bucket if it doesn't exist"""
    try:
        
        # Try to create the pages bucket
        bucket_name = "pages"
        
        try:
            # Check if bucket exists
            buckets = supabase.storage.list_buckets()
            existing_bucket = next((b for b in buckets if b.name == bucket_name), None)
            
            if existing_bucket:
                print(f"✅ Storage bucket '{bucket_name}' already exists")
                return True
            
            # Create the bucket
            result = supabase.storage.create_bucket(bucket_name, {
                "public": True,  # Make bucket public for easy access to images
                "file_size_limit": 10485760,  # 10MB limit
                "allowed_mime_types": ["image/jpeg", "image/jpg", "image/png", "image/webp"]
            })
            
            if result:
                print(f"✅ Successfully created storage bucket '{bucket_name}'")
                return True
            else:
                print(f"❌ Failed to create storage bucket '{bucket_name}'")
                return False
                
        except Exception as bucket_error:
            print(f"❌ Error managing storage bucket: {str(bucket_error)}")
            # Try to create bucket with minimal config if detailed config fails
            try:
                result = supabase.storage.create_bucket(bucket_name)
                if result:
                    print(f"✅ Successfully created storage bucket '{bucket_name}' with basic config")
                    return True
            except Exception as basic_error:
                print(f"❌ Failed to create bucket with basic config: {str(basic_error)}")
                return False
        
    except Exception as e:
        print(f"❌ Error setting up storage: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Setting up Supabase storage and database for ManhwaTrans...")

    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_service_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required")
        sys.exit(1)

    # Create Supabase client
    supabase = create_client(supabase_url, supabase_service_key)

    # Setup pages table
    table_success = setup_pages_table(supabase)

    # Setup storage bucket
    storage_success = setup_storage_bucket(supabase)

    if table_success and storage_success:
        print("✅ Setup completed successfully!")
        sys.exit(0)
    else:
        print("❌ Setup failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
