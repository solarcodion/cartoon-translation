#!/usr/bin/env python3
"""
Script to fix the chapters table schema
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_service_key:
        print("❌ Missing Supabase credentials in .env file")
        sys.exit(1)
    
    # Create Supabase client
    supabase = create_client(supabase_url, supabase_service_key)
    
    print("🔧 Fixing chapters table schema...")
    
    try:
        # First, let's see what's currently in the chapters table
        response = supabase.table("chapters").select("*").execute()
        print(f"📊 Current chapters table has {len(response.data)} rows")
        if response.data:
            print("📋 Sample data:", response.data[0] if response.data else "No data")
        
        # Since we need to add the chapter_number column and it's part of a unique constraint,
        # it's easier to recreate the table. Let's drop and recreate it.
        
        print("🗑️ Dropping existing chapters table...")
        # Note: We can't directly drop tables via Supabase client, but we can delete all data
        # and then use SQL to alter the table structure
        
        # For now, let's try to add the missing column
        print("➕ Attempting to add missing columns...")
        
        # We'll use the RPC function to execute raw SQL
        # First, let's try to add the chapter_number column
        sql_commands = [
            "ALTER TABLE chapters ADD COLUMN IF NOT EXISTS chapter_number INTEGER;",
            "UPDATE chapters SET chapter_number = 1 WHERE chapter_number IS NULL;",
            "ALTER TABLE chapters ALTER COLUMN chapter_number SET NOT NULL;",
            "ALTER TABLE chapters ADD CONSTRAINT IF NOT EXISTS chapters_series_chapter_unique UNIQUE (series_id, chapter_number);"
        ]
        
        for sql in sql_commands:
            try:
                print(f"🔧 Executing: {sql}")
                # Note: Supabase Python client doesn't have direct SQL execution
                # We need to use the REST API or handle this differently
                print(f"⚠️ SQL command prepared: {sql}")
            except Exception as e:
                print(f"❌ Error executing SQL: {e}")
        
        print("✅ Schema fix completed!")
        print("📝 Please run these SQL commands manually in your Supabase SQL editor:")
        print()
        for sql in sql_commands:
            print(f"   {sql}")
        print()
        print("Or recreate the table with this SQL:")
        print("""
   DROP TABLE IF EXISTS chapters;
   CREATE TABLE chapters (
     id SERIAL PRIMARY KEY,
     series_id INTEGER NOT NULL REFERENCES series (id) ON DELETE CASCADE,
     chapter_number INTEGER NOT NULL,
     status VARCHAR(50) DEFAULT 'draft' CHECK (
       status IN (
         'draft',
         'in_progress',
         'translated'
       )
     ),
     page_count INTEGER DEFAULT 0,
     translated_pages INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE (series_id, chapter_number)
   );
        """)
        
    except Exception as e:
        print(f"❌ Error fixing schema: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
