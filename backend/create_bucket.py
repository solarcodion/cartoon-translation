#!/usr/bin/env python3
"""
Script to create the pages storage bucket in Supabase
Run this once to set up the storage bucket for pages
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def create_pages_bucket():
    """Create the pages storage bucket"""
    try:
        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_service_key:
            print("❌ Missing Supabase environment variables")
            print("Please check your .env file has SUPABASE_URL and SUPABASE_SERVICE_KEY")
            return False
        
        supabase = create_client(supabase_url, supabase_service_key)
        
        # Check if bucket already exists
        print("🔍 Checking existing buckets...")
        buckets = supabase.storage.list_buckets()
        bucket_names = [bucket.get('name', bucket.get('id', '')) for bucket in buckets]
        print(f"📋 Existing buckets: {bucket_names}")
        
        if 'pages' in bucket_names:
            print("✅ Pages bucket already exists!")
            return True
        
        # Create the bucket
        print("🚀 Creating pages bucket...")
        
        # Try different creation methods
        try:
            # Method 1: Simple creation
            response = supabase.storage.create_bucket('pages')
            print(f"✅ Bucket created successfully (method 1): {response}")
            return True
        except Exception as e1:
            print(f"⚠️ Method 1 failed: {e1}")
            
            try:
                # Method 2: With public option
                response = supabase.storage.create_bucket('pages', {'public': True})
                print(f"✅ Bucket created successfully (method 2): {response}")
                return True
            except Exception as e2:
                print(f"⚠️ Method 2 failed: {e2}")
                
                try:
                    # Method 3: With options parameter
                    response = supabase.storage.create_bucket('pages', options={'public': True})
                    print(f"✅ Bucket created successfully (method 3): {response}")
                    return True
                except Exception as e3:
                    print(f"❌ All methods failed:")
                    print(f"   Method 1: {e1}")
                    print(f"   Method 2: {e2}")
                    print(f"   Method 3: {e3}")
                    return False
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Supabase Pages Bucket Setup")
    print("=" * 40)
    
    success = create_pages_bucket()
    
    if success:
        print("\n✅ Setup complete! You can now upload pages.")
    else:
        print("\n❌ Setup failed. Please create the 'pages' bucket manually in Supabase dashboard:")
        print("   1. Go to your Supabase project dashboard")
        print("   2. Navigate to Storage")
        print("   3. Click 'Create bucket'")
        print("   4. Name it 'pages'")
        print("   5. Make it public")
        print("   6. Click 'Create bucket'")
