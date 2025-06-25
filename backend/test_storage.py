#!/usr/bin/env python3
"""
Quick test script to verify Supabase storage is working
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def test_storage():
    """Test storage operations"""
    try:
        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_service_key:
            print("❌ Missing Supabase environment variables")
            return False
        
        supabase = create_client(supabase_url, supabase_service_key)
        
        # List buckets
        print("🔍 Listing buckets...")
        buckets = supabase.storage.list_buckets()
        print(f"📋 Buckets: {buckets}")
        
        # Check if pages bucket exists
        bucket_names = []
        for bucket in buckets:
            if hasattr(bucket, 'name'):
                bucket_names.append(bucket.name)
            elif hasattr(bucket, 'id'):
                bucket_names.append(bucket.id)
            elif isinstance(bucket, dict):
                bucket_names.append(bucket.get('name', bucket.get('id', '')))

        print(f"📋 Bucket names: {bucket_names}")

        if 'pages' not in bucket_names:
            print("❌ Pages bucket not found!")
            return False
        
        print("✅ Pages bucket found!")
        
        # Test upload with a simple text file
        test_content = b"Hello, this is a test file!"
        test_path = "test/test.txt"
        
        print(f"🚀 Testing upload to pages/{test_path}")
        
        try:
            response = supabase.storage.from_('pages').upload(test_path, test_content)
            print(f"📤 Upload response: {response}")
            
            if hasattr(response, 'error') and response.error:
                print(f"❌ Upload failed: {response.error}")
                return False
            
            print("✅ Upload successful!")
            
            # Test getting public URL
            try:
                url_response = supabase.storage.from_('pages').get_public_url(test_path)
                print(f"🔗 Public URL: {url_response}")
            except Exception as url_error:
                print(f"⚠️ Could not get public URL: {url_error}")
            
            # Clean up test file
            try:
                supabase.storage.from_('pages').remove([test_path])
                print("🗑️ Test file cleaned up")
            except Exception as cleanup_error:
                print(f"⚠️ Could not clean up test file: {cleanup_error}")
            
            return True
            
        except Exception as upload_error:
            print(f"❌ Upload error: {upload_error}")
            return False
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Supabase Storage")
    print("=" * 40)
    
    success = test_storage()
    
    if success:
        print("\n✅ Storage test passed!")
    else:
        print("\n❌ Storage test failed!")
