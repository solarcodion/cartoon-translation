#!/usr/bin/env python3
"""
Script to check and create the chapters table schema
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
    
    print("🔍 Checking current database schema...")
    
    # Check if chapters table exists and get its structure
    try:
        # Try to query the chapters table to see what columns exist
        response = supabase.table("chapters").select("*").limit(1).execute()
        print("✅ Chapters table exists")
        
        # If we get here, the table exists but might have wrong schema
        # Let's check what columns are available by trying to select specific ones
        try:
            response = supabase.table("chapters").select("id, series_id, chapter_number, status, page_count, translated_pages, created_at, updated_at").limit(1).execute()
            print("✅ All expected columns exist in chapters table")
            print("📊 Current chapters data:", response.data)
        except Exception as e:
            print(f"❌ Missing columns in chapters table: {e}")
            print("🔧 The table exists but has wrong schema")
            
    except Exception as e:
        print(f"❌ Chapters table doesn't exist or has issues: {e}")
        print("🔧 Need to create the chapters table")
    
    # Check series table
    try:
        response = supabase.table("series").select("id, title, total_chapters, user_id, created_at, updated_at").limit(1).execute()
        print("✅ Series table exists with correct schema")
        print("📊 Current series data:", response.data)
    except Exception as e:
        print(f"❌ Series table issues: {e}")

if __name__ == "__main__":
    main()
