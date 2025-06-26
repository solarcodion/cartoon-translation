#!/usr/bin/env python3
"""
Test script for text boxes API
"""

import requests
import json
import base64

# API configuration
API_BASE_URL = "http://localhost:8000/api"

# Sample test data
sample_text_box = {
    "page_id": 1,  # Assuming page ID 1 exists
    "x": 100,
    "y": 200,
    "w": 300,
    "h": 50,
    "ocr": "What is this place, Sung Jinwoo?",
    "corrected": "Đây là đâu vậy, Sung Jinwoo?",
    "tm": 0.85,
    "reason": "Manual translation correction"
}

def test_create_text_box():
    """Test creating a text box"""
    print("🧪 Testing text box creation...")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/text-boxes/",
            json=sample_text_box,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            text_box = response.json()
            print(f"✅ Text box created successfully: ID {text_box['id']}")
            return text_box['id']
        else:
            print(f"❌ Failed to create text box: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating text box: {str(e)}")
        return None

def test_get_text_boxes_by_page(page_id=1):
    """Test getting text boxes by page"""
    print(f"🧪 Testing get text boxes for page {page_id}...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/text-boxes/page/{page_id}")
        
        if response.status_code == 200:
            text_boxes = response.json()
            print(f"✅ Found {len(text_boxes)} text boxes for page {page_id}")
            return text_boxes
        else:
            print(f"❌ Failed to get text boxes: {response.status_code}")
            print(f"Response: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error getting text boxes: {str(e)}")
        return []

def test_get_text_boxes_by_chapter(chapter_id=1):
    """Test getting text boxes by chapter"""
    print(f"🧪 Testing get text boxes for chapter {chapter_id}...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/text-boxes/chapter/{chapter_id}")
        
        if response.status_code == 200:
            text_boxes = response.json()
            print(f"✅ Found {len(text_boxes)} text boxes for chapter {chapter_id}")
            return text_boxes
        else:
            print(f"❌ Failed to get text boxes: {response.status_code}")
            print(f"Response: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error getting text boxes: {str(e)}")
        return []

def test_update_text_box(text_box_id):
    """Test updating a text box"""
    print(f"🧪 Testing text box update for ID {text_box_id}...")
    
    update_data = {
        "corrected": "Đây là nơi nào vậy, Sung Jinwoo?",
        "tm": 0.90,
        "reason": "Improved translation"
    }
    
    try:
        response = requests.put(
            f"{API_BASE_URL}/text-boxes/{text_box_id}",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            text_box = response.json()
            print(f"✅ Text box updated successfully")
            return text_box
        else:
            print(f"❌ Failed to update text box: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error updating text box: {str(e)}")
        return None

def test_delete_text_box(text_box_id):
    """Test deleting a text box"""
    print(f"🧪 Testing text box deletion for ID {text_box_id}...")
    
    try:
        response = requests.delete(f"{API_BASE_URL}/text-boxes/{text_box_id}")
        
        if response.status_code == 200:
            print(f"✅ Text box deleted successfully")
            return True
        else:
            print(f"❌ Failed to delete text box: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error deleting text box: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting text boxes API tests...\n")
    
    # Test creation
    text_box_id = test_create_text_box()
    print()
    
    if text_box_id:
        # Test getting by page
        test_get_text_boxes_by_page(1)
        print()
        
        # Test getting by chapter
        test_get_text_boxes_by_chapter(1)
        print()
        
        # Test update
        test_update_text_box(text_box_id)
        print()
        
        # Test delete
        test_delete_text_box(text_box_id)
        print()
    
    print("🏁 Tests completed!")

if __name__ == "__main__":
    main()
