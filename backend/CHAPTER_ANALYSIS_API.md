# Chapter Analysis API Documentation

## Overview

The Chapter Analysis API provides AI-powered chapter analysis using OpenAI's GPT-4o-mini model. It analyzes complete chapters by examining all pages in order, along with their OCR-extracted text contexts, to provide comprehensive story analysis and context.

## Features

- **AI-Powered Analysis**: Uses OpenAI GPT-4o-mini for high-quality chapter analysis
- **Sequential Page Analysis**: Processes pages in order (1, 2, 3, ...) for story continuity
- **OCR Integration**: Considers both visual content and OCR-extracted text contexts
- **Translation-Aware**: Follows translation guidelines for target language analysis
- **Context Consistency**: Maintains consistency with existing chapter context
- **Automatic Context Update**: Updates chapter context in database after analysis
- **Background Processing**: Automatic analysis when pages are added/updated/deleted
- **Authentication**: Secure API endpoint with JWT authentication

## Environment Configuration

The API uses the same OpenAI configuration as the translation service:

```env
# OpenAI Configuration
***REMOVED***your_openai_api_key_here
TRANSLATION_TARGET_LANGUAGE=Vietnamese
```

## API Endpoint

### Analyze Chapter

**POST** `/api/chapters/{chapter_id}/analyze`

Analyzes a chapter using AI to generate comprehensive context and analysis.

**Path Parameters:**

- `chapter_id` (string): The ID of the chapter to analyze

**Request Body:**

```json
{
  "pages": [
    {
      "page_number": 1,
      "image_url": "https://example.com/page1.jpg",
      "ocr_context": "OCR extracted text from page 1"
    },
    {
      "page_number": 2,
      "image_url": "https://example.com/page2.jpg",
      "ocr_context": "OCR extracted text from page 2"
    }
  ],
  "translation_info": [
    "Maintain natural Vietnamese flow",
    "Preserve character names",
    "Adapt cultural references appropriately"
  ],
  "existing_context": "Previous chapter context to maintain consistency"
}
```

**Request Model:**

- `pages` (array): Sorted page data by page number
  - `page_number` (integer): Page number (1, 2, 3, ...)
  - `image_url` (string): URL to the page image
  - `ocr_context` (string, optional): OCR extracted text from the page
- `translation_info` (array): Translation guidelines to follow
- `existing_context` (string, optional): Existing context for consistency

**Response:**

```json
{
  "success": true,
  "message": "Chapter analysis completed successfully",
  "data": {
    "success": true,
    "chapter_context": "Detailed context explaining the chapter's story content...",
    "analysis_summary": "Summary of key events, character interactions, and plot developments...",
    "processing_time": 15.42,
    "model": "gpt-4o-mini",
    "tokens_used": 1250
  }
}
```

**Response Fields:**

- `success` (boolean): Whether the analysis was successful
- `chapter_context` (string): Comprehensive chapter context for future translation work
- `analysis_summary` (string): Summary of key events and plot developments
- `processing_time` (float): Time taken for analysis in seconds
- `model` (string): AI model used for analysis
- `tokens_used` (integer): Number of tokens consumed

## Usage Examples

### Basic Chapter Analysis

```bash
curl -X POST "http://localhost:8000/api/chapters/123e4567-e89b-12d3-a456-426614174000/analyze" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "pages": [
      {
        "page_number": 1,
        "image_url": "https://storage.supabase.co/v1/object/public/pages/chapter_123/page1.jpg",
        "ocr_context": "Chào bạn! Tôi là nhân vật chính."
      },
      {
        "page_number": 2,
        "image_url": "https://storage.supabase.co/v1/object/public/pages/chapter_123/page2.jpg",
        "ocr_context": "Hôm nay chúng ta sẽ bắt đầu cuộc phiêu lưu."
      }
    ],
    "translation_info": [
      "Maintain natural Vietnamese flow",
      "Preserve character names and honorifics",
      "Adapt Japanese cultural references to Vietnamese context"
    ],
    "existing_context": "This manga follows the adventures of a young hero in a fantasy world."
  }'
```

### Analysis with Minimal Data

```bash
curl -X POST "http://localhost:8000/api/chapters/123e4567-e89b-12d3-a456-426614174000/analyze" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "pages": [
      {
        "page_number": 1,
        "image_url": "https://storage.supabase.co/v1/object/public/pages/chapter_123/page1.jpg"
      }
    ],
    "translation_info": []
  }'
```

## Error Responses

### Chapter Not Found

```json
{
  "detail": "Chapter with ID 123e4567-e89b-12d3-a456-426614174000 not found"
}
```

### Empty Pages Array

```json
{
  "detail": "Pages array cannot be empty"
}
```

### OpenAI API Error

```json
{
  "detail": "Chapter analysis failed: OpenAI API error message"
}
```

## Background Processing

The system automatically triggers chapter analysis in the background when:

- **Pages are added** (`POST /api/pages/`)
- **Pages are updated** (`PUT /api/pages/{page_id}`)
- **Pages are deleted** (`DELETE /api/pages/{page_id}`)

This ensures chapter context is always up-to-date without manual intervention.

### Background Analysis Features:

- **Non-blocking**: Page operations complete immediately
- **Automatic**: No manual trigger required
- **Error-tolerant**: Page operations succeed even if analysis fails
- **Comprehensive**: Uses all available page data and OCR contexts

## Integration Notes

1. **Automatic Context Update**: After successful analysis, the chapter's context field in the database is automatically updated with the generated context.

2. **Page Ordering**: Pages are processed in sequential order based on `page_number` for proper story flow analysis.

3. **OCR Integration**: The API works best when combined with OCR-extracted text contexts from each page.

4. **Translation Guidelines**: The `translation_info` array helps the AI understand how to analyze content for the target language.

5. **Context Consistency**: Use `existing_context` to maintain consistency across multiple chapters in a series.

6. **Background Processing**: Most analysis happens automatically in the background when pages change.

## Performance

- **Model**: GPT-4o-mini for optimal balance of quality and speed
- **Token Limit**: 2000 tokens for comprehensive analysis
- **Processing Time**: Typically 10-30 seconds depending on chapter length
- **Rate Limits**: Subject to OpenAI API rate limits

## Security

- **Authentication**: Requires valid JWT token
- **Authorization**: Users can only analyze chapters they have access to
- **Input Validation**: All inputs are validated before processing
- **Error Handling**: Comprehensive error handling with detailed error messages
