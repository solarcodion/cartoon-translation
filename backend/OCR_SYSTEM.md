# OCR System Documentation

## Overview

The OCR (Optical Character Recognition) system is integrated into the ManhwaTrans application to automatically extract text from cropped image regions. It uses EasyOCR for text detection and extraction.

## Features

- **Automatic Text Extraction**: Extract English text from cropped image areas
- **Image Preprocessing**: Enhanced OCR with image preprocessing for better accuracy
- **Real-time Processing**: Fast OCR processing with loading indicators
- **Error Handling**: Graceful error handling with fallback options
- **Authentication**: Secure API endpoints with JWT authentication

## Backend Implementation

### Dependencies

```
easyocr==1.7.0
opencv-python==4.8.1.78
numpy==1.24.3
Pillow==9.5.0
```

**Note**: Pillow is pinned to version 9.5.0 for compatibility with EasyOCR. Newer versions (10.0.0+) have breaking changes that affect the OCR functionality.

### API Endpoints

#### 1. Extract Text (Basic)

- **Endpoint**: `POST /api/ocr/extract-text`
- **Description**: Extract text from base64 encoded image
- **Authentication**: Required (JWT token)

**Request Body:**

```json
{
  "image_data": "base64_encoded_image_data"
}
```

**Response:**

```json
{
  "success": true,
  "text": "Extracted text content",
  "confidence": 0.95,
  "processing_time": 1.23
}
```

#### 2. Extract Text (Enhanced)

- **Endpoint**: `POST /api/ocr/extract-text-enhanced`
- **Description**: Extract text with image preprocessing for better accuracy
- **Authentication**: Required (JWT token)

**Request Body:**

```json
{
  "image_data": "base64_encoded_image_data"
}
```

**Response:**

```json
{
  "success": true,
  "text": "Extracted text content",
  "confidence": 0.98,
  "processing_time": 2.45
}
```

#### 3. Health Check

- **Endpoint**: `GET /api/ocr/health`
- **Description**: Check OCR service status
- **Authentication**: Required (JWT token)

**Response:**

```json
{
  "success": true,
  "message": "OCR service is healthy and ready",
  "data": {
    "service": "EasyOCR",
    "languages": ["en"],
    "status": "ready"
  }
}
```

### Service Architecture

#### OCRService Class

- **Location**: `backend/app/services/ocr_service.py`
- **Features**:
  - EasyOCR initialization with GPU/CPU fallback
  - Image preprocessing for better OCR results
  - Confidence filtering (minimum 0.3)
  - Performance monitoring

#### Key Methods

- `process_image()`: Basic OCR processing
- `process_image_with_preprocessing()`: Enhanced OCR with preprocessing
- `preprocess_image()`: Image enhancement techniques
- `_choose_best_results()`: Select best results between original and preprocessed

## Frontend Integration

### OCR Service

- **Location**: `frontend/src/services/ocrService.ts`
- **Features**:
  - API communication with authentication
  - Base64 image conversion utilities
  - Error handling and logging

### AddTextBoxModal Integration

- **Location**: `frontend/src/components/Modals/AddTextBoxModal.tsx`
- **Features**:
  - Automatic OCR when crop button is clicked
  - Loading states during OCR processing
  - Text field population with extracted text
  - Error handling with graceful fallbacks

### User Workflow

1. User selects an area on the image using drag selection
2. User clicks "Crop & OCR" button
3. Image is cropped to the selected bounding box
4. Cropped image is sent to OCR API as base64 data
5. Extracted text is automatically populated in the OCR text field
6. User can edit the text if needed before saving

## Configuration

### Environment Variables

No additional environment variables required. The OCR service uses default EasyOCR settings.

### GPU Support

- Automatically detects and uses GPU if available
- Falls back to CPU if GPU is not available
- No configuration required

## Performance Considerations

### Processing Time

- Basic OCR: ~1-3 seconds per image
- Enhanced OCR: ~2-5 seconds per image
- Depends on image size and complexity

### Memory Usage

- EasyOCR models are loaded once at startup
- Shared across all requests (singleton pattern)
- Approximately 500MB-1GB memory usage

### Optimization Tips

- Crop images to text regions only for better accuracy
- Use enhanced OCR for difficult-to-read text
- Smaller images process faster

## Error Handling

### Common Issues

1. **Authentication Errors**: Ensure valid JWT token
2. **Image Format Errors**: Only PNG/JPG supported
3. **OCR Initialization Errors**: Check dependencies installation
4. **Memory Errors**: Restart service if memory issues occur
5. **PIL.Image.ANTIALIAS Error**: Ensure Pillow version 9.5.0 is installed

### Troubleshooting

- Check backend logs for detailed error messages
- Verify image data is valid base64
- Ensure sufficient system memory
- Check network connectivity between frontend and backend
- **PIL Compatibility**: If you see `PIL.Image.ANTIALIAS` errors, run:
  ```bash
  python3 -m pip install Pillow==9.5.0 --force-reinstall
  ```

## Future Enhancements

### Planned Features

- Support for multiple languages
- Custom OCR model training
- Batch processing capabilities
- OCR confidence visualization
- Text region detection automation

### Performance Improvements

- Model caching optimization
- Parallel processing for multiple images
- Image compression before OCR
- Result caching for identical images

## Testing

### Manual Testing

1. Start backend server: `python3 main.py`
2. Start frontend: `yarn dev`
3. Navigate to Pages section
4. Upload an image with text
5. Use "Add Text Box" modal
6. Select text area and click "Crop & OCR"
7. Verify text extraction works correctly

### API Testing

Use the Swagger UI at `http://localhost:8000/docs` to test OCR endpoints directly.

## Dependencies

### Backend

- EasyOCR: Text detection and extraction
- OpenCV: Image processing
- NumPy: Array operations
- Pillow: Image manipulation

### Frontend

- No additional dependencies required
- Uses existing fetch API and authentication system
