import cv2
import numpy as np
import base64
import io
from PIL import Image
from typing import List, Optional, Tuple
import requests


class AvatarExtractionService:
    """Service for extracting character avatars from manga/manhwa images"""
    
    def __init__(self):
        """Initialize avatar extraction service"""
        # Load pre-trained face detection model
        try:
            # Using OpenCV's DNN face detector (more accurate than Haar cascades)
            self.face_net = cv2.dnn.readNetFromTensorflow(
                'opencv_face_detector_uint8.pb',
                'opencv_face_detector.pbtxt'
            )
            self.face_detection_available = True
        except Exception as e:
            print(f"⚠️ Warning: Face detection model not available: {str(e)}")
            self.face_detection_available = False
    
    def extract_faces_from_image(self, image_url: str) -> List[Tuple[np.ndarray, float]]:
        """
        Extract faces from an image URL
        
        Args:
            image_url: URL of the image to process
            
        Returns:
            List of tuples containing (face_image, confidence_score)
        """
        if not self.face_detection_available:
            return []
        
        try:
            # Download image
            response = requests.get(image_url, timeout=10)
            if response.status_code != 200:
                return []
            
            # Convert to OpenCV format
            image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            
            if image is None:
                return []
            
            # Get image dimensions
            (h, w) = image.shape[:2]
            
            # Create blob from image
            blob = cv2.dnn.blobFromImage(
                cv2.resize(image, (300, 300)), 1.0,
                (300, 300), (104.0, 177.0, 123.0)
            )
            
            # Pass blob through network
            self.face_net.setInput(blob)
            detections = self.face_net.forward()
            
            faces = []
            
            # Loop over detections
            for i in range(0, detections.shape[2]):
                confidence = detections[0, 0, i, 2]
                
                # Filter weak detections
                if confidence > 0.5:
                    # Compute bounding box coordinates
                    box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                    (startX, startY, endX, endY) = box.astype("int")
                    
                    # Ensure bounding box is within image bounds
                    startX = max(0, startX)
                    startY = max(0, startY)
                    endX = min(w, endX)
                    endY = min(h, endY)
                    
                    # Extract face region
                    face = image[startY:endY, startX:endX]
                    
                    if face.size > 0:
                        # Resize face to standard size
                        face_resized = cv2.resize(face, (128, 128))
                        faces.append((face_resized, float(confidence)))
            
            return faces
            
        except Exception as e:
            print(f"❌ Error extracting faces from {image_url}: {str(e)}")
            return []
    
    def extract_character_avatars(
        self, 
        chapters_data: List[dict], 
        max_avatars_per_character: int = 3
    ) -> dict:
        """
        Extract character avatars from all chapter pages
        
        Args:
            chapters_data: List of chapter data with pages
            max_avatars_per_character: Maximum number of avatar candidates per character
            
        Returns:
            Dictionary mapping character descriptions to avatar image data
        """
        if not self.face_detection_available:
            return {}
        
        all_faces = []
        
        # Extract faces from all pages
        for chapter in chapters_data:
            chapter_num = chapter.get('number', 'Unknown')
            pages = chapter.get('pages', [])
            
            for page in pages:
                image_url = page.get('image_url')
                if not image_url:
                    continue
                
                faces = self.extract_faces_from_image(image_url)
                for face, confidence in faces:
                    all_faces.append({
                        'face': face,
                        'confidence': confidence,
                        'chapter': chapter_num,
                        'page': page.get('number', 'Unknown'),
                        'source_url': image_url
                    })
        
        # Group similar faces (this would need more sophisticated clustering)
        # For now, just return the best faces
        character_avatars = {}
        
        # Sort faces by confidence and take the best ones
        sorted_faces = sorted(all_faces, key=lambda x: x['confidence'], reverse=True)
        
        for i, face_data in enumerate(sorted_faces[:max_avatars_per_character * 3]):
            character_key = f"character_{i // max_avatars_per_character + 1}"
            
            if character_key not in character_avatars:
                character_avatars[character_key] = []
            
            if len(character_avatars[character_key]) < max_avatars_per_character:
                # Convert face to base64 for storage/transmission
                face_base64 = self.face_to_base64(face_data['face'])
                character_avatars[character_key].append({
                    'image_data': face_base64,
                    'confidence': face_data['confidence'],
                    'source_chapter': face_data['chapter'],
                    'source_page': face_data['page'],
                    'source_url': face_data['source_url']
                })
        
        return character_avatars
    
    def face_to_base64(self, face_image: np.ndarray) -> str:
        """Convert face image to base64 string"""
        try:
            # Convert BGR to RGB
            face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            
            # Convert to PIL Image
            pil_image = Image.fromarray(face_rgb)
            
            # Save to bytes
            buffer = io.BytesIO()
            pil_image.save(buffer, format='PNG')
            
            # Encode to base64
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return f"data:image/png;base64,{image_base64}"
            
        except Exception as e:
            print(f"❌ Error converting face to base64: {str(e)}")
            return ""
    
    def create_avatar_url(self, face_base64: str, character_id: str) -> str:
        """
        Create a URL for the extracted avatar
        This could upload to cloud storage and return a URL
        """
        # For now, return the base64 data URL
        # In production, you'd upload to cloud storage (S3, Supabase Storage, etc.)
        return face_base64
    
    async def health_check(self) -> dict:
        """Check if avatar extraction service is working"""
        return {
            "status": "healthy" if self.face_detection_available else "limited",
            "service": "Avatar Extraction",
            "face_detection": self.face_detection_available,
            "note": "Face detection requires OpenCV DNN models" if not self.face_detection_available else None
        }
