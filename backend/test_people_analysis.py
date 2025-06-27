#!/usr/bin/env python3
"""
Test script for People Analysis API endpoint
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = "http://localhost:8000/api"
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

def get_auth_token():
    """Get authentication token from Supabase"""
    # For testing, we'll use a mock token or skip auth
    # In a real scenario, you'd authenticate with Supabase
    return "mock-token"

def test_people_analysis():
    """Test the people analysis endpoint"""
    print("🧪 Testing People Analysis API...")
    
    # Test data
    series_id = "test-series-id"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {get_auth_token()}"
    }
    
    request_data = {
        "series_id": series_id,
        "force_refresh": True
    }
    
    try:
        # Test the people analysis endpoint
        url = f"{BASE_URL}/series/{series_id}/analyze-people"
        print(f"📡 Making request to: {url}")
        print(f"📋 Request data: {json.dumps(request_data, indent=2)}")
        
        response = requests.post(url, json=request_data, headers=headers)
        
        print(f"📊 Response status: {response.status_code}")
        print(f"📄 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ People analysis successful!")
            print(f"📋 Response: {json.dumps(result, indent=2)}")
            
            if result.get("success"):
                people = result.get("people", [])
                print(f"👥 Found {len(people)} people:")
                for person in people:
                    print(f"  - {person.get('name')}: {person.get('description')[:100]}...")
            else:
                print("❌ Analysis failed according to response")
                
        else:
            print(f"❌ Request failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"📄 Error response: {json.dumps(error_data, indent=2)}")
            except:
                print(f"📄 Error response (raw): {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - make sure the backend is running on localhost:8000")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

def test_service_health():
    """Test if the people analysis service is healthy"""
    print("🏥 Testing service health...")
    
    try:
        # Test basic health endpoint
        url = f"{BASE_URL}/"
        response = requests.get(url)
        
        if response.status_code == 200:
            print("✅ Backend is running")
            print(f"📄 Response: {response.json()}")
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend - make sure it's running on localhost:8000")
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting People Analysis API Tests")
    print("=" * 50)
    
    # Test service health first
    test_service_health()
    print()
    
    # Test people analysis
    test_people_analysis()
    
    print("=" * 50)
    print("🏁 Tests completed")
