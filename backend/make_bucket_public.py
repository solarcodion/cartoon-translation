#!/usr/bin/env python3
"""
Script to make the pages bucket public
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def make_bucket_public():
    """Make the pages bucket public"""
    try:
        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_service_key:
            print("❌ Missing Supabase environment variables")
            return False
        
        supabase = create_client(supabase_url, supabase_service_key)
        
        # Try to update bucket to be public
        print("🔧 Making pages bucket public...")
        
        try:
            # Method 1: Update bucket
            response = supabase.storage.update_bucket('pages', {'public': True})
            print(f"✅ Bucket updated: {response}")
            return True
        except Exception as e1:
            print(f"⚠️ Method 1 failed: {e1}")
            
            try:
                # Method 2: Different approach
                response = supabase.storage.update_bucket('pages', options={'public': True})
                print(f"✅ Bucket updated (method 2): {response}")
                return True
            except Exception as e2:
                print(f"❌ Both methods failed:")
                print(f"   Method 1: {e1}")
                print(f"   Method 2: {e2}")
                print("\n📝 Manual steps to make bucket public:")
                print("   1. Go to your Supabase project dashboard")
                print("   2. Navigate to Storage")
                print("   3. Click on the 'pages' bucket")
                print("   4. Click 'Settings' or 'Edit'")
                print("   5. Enable 'Public bucket'")
                print("   6. Save changes")
                return False
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Making Pages Bucket Public")
    print("=" * 40)
    
    success = make_bucket_public()
    
    if success:
        print("\n✅ Bucket is now public!")
    else:
        print("\n❌ Could not make bucket public automatically.")
