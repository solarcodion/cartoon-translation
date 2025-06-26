# Translation API Documentation

## Overview

The Translation API provides AI-powered text translation using OpenAI's GPT models. It's specifically designed for manga/manhwa translation with context-aware capabilities.

## Features

- **AI Translation**: Uses OpenAI GPT-4o-mini for high-quality translations
- **Context-Aware**: Supports series-specific context and character name preservation
- **Multiple Languages**: Supports 15+ target languages
- **Quick Translation**: Simple endpoint for fast translations
- **Enhanced Translation**: Advanced endpoint with series context
- **Authentication**: Secure API endpoints with JWT authentication

## Environment Configuration

Add these variables to your `.env` file:

```env
# OpenAI Configuration
***REMOVED***your_openai_api_key_here
TRANSLATION_TARGET_LANGUAGE=Vietnamese
```

## API Endpoints

### 1. Quick Translate

**POST** `/api/translation/quick-translate`

Simple translation endpoint for basic text translation.

**Request:**

```json
{
  "text": "Hello world"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Quick translation completed successfully",
  "data": {
    "original_text": "Hello world",
    "translated_text": "Xin chào thế giới",
    "target_language": "Vietnamese",
    "processing_time": 1.23
  }
}
```

### 2. Standard Translate

**POST** `/api/translation/translate`

Standard translation with optional context and target language.

**Request:**

```json
{
  "source_text": "The hero defeated the dragon",
  "target_language": "Vietnamese",
  "context": "Fantasy manga dialogue"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Text translated successfully",
  "data": {
    "success": true,
    "source_text": "The hero defeated the dragon",
    "translated_text": "Anh hùng đã đánh bại con rồng",
    "target_language": "Vietnamese",
    "processing_time": 1.45,
    "model": "gpt-4o-mini",
    "tokens_used": 25
  }
}
```

### 3. Enhanced Translate

**POST** `/api/translation/translate-enhanced`

Advanced translation with series context and character name preservation.

**Request:**

```json
{
  "source_text": "Naruto used his jutsu",
  "target_language": "Vietnamese",
  "series_context": "Ninja manga with special techniques called jutsu",
  "character_names": ["Naruto", "Sasuke", "Sakura"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Enhanced text translation completed successfully",
  "data": {
    "success": true,
    "source_text": "Naruto used his jutsu",
    "translated_text": "Naruto đã sử dụng jutsu của mình",
    "target_language": "Vietnamese",
    "processing_time": 1.67,
    "model": "gpt-4o-mini",
    "tokens_used": 35
  }
}
```

### 4. Get Supported Languages

**GET** `/api/translation/languages`

Returns list of supported target languages.

**Response:**

```json
{
  "success": true,
  "message": "Supported languages retrieved successfully",
  "data": {
    "languages": [
      "Vietnamese",
      "English",
      "Spanish",
      "French",
      "German",
      "Italian",
      "Portuguese",
      "Russian",
      "Chinese (Simplified)",
      "Chinese (Traditional)",
      "Japanese",
      "Korean",
      "Thai",
      "Indonesian",
      "Malay"
    ],
    "default_language": "Vietnamese"
  }
}
```

### 5. Health Check

**GET** `/api/translation/health`

Check translation service status.

**Response:**

```json
{
  "success": true,
  "message": "Translation service is healthy and ready",
  "data": {
    "status": "healthy",
    "service": "OpenAI GPT Translation",
    "target_language": "Vietnamese",
    "test_successful": true
  }
}
```

## Frontend Integration

### Import the Service

```typescript
import { translationService } from "../services/translationService";
```

### Quick Translation

```typescript
const result = await translationService.quickTranslate("Hello world");
console.log(result.translated_text); // "Xin chào thế giới"
```

### Standard Translation

```typescript
const result = await translationService.translateText({
  source_text: "The hero defeated the dragon",
  target_language: "Vietnamese",
  context: "Fantasy manga dialogue",
});
```

### Enhanced Translation

```typescript
const result = await translationService.translateTextEnhanced({
  source_text: "Naruto used his jutsu",
  target_language: "Vietnamese",
  series_context: "Ninja manga with special techniques",
  character_names: ["Naruto", "Sasuke", "Sakura"],
});
```

## Error Handling

The API provides detailed error messages for common issues:

- **Authentication Error**: Invalid or missing JWT token
- **Rate Limit Error**: OpenAI API rate limit exceeded
- **Validation Error**: Invalid request parameters
- **Service Error**: OpenAI API or internal service errors

## Usage in AddTextBoxModal

The translation functionality is integrated into the AddTextBoxModal component:

1. User extracts text using OCR
2. Clicks "Translate with AI" button
3. System calls `translationService.quickTranslate()`
4. Translated text appears in the AI Translated Text section
5. User can copy the translated text

## Performance

- **Average Response Time**: 1-3 seconds
- **Model**: GPT-4o-mini (fast and cost-effective)
- **Token Usage**: Optimized prompts to minimize costs
- **Caching**: Consider implementing caching for repeated translations

## Security

- **Authentication**: All endpoints require valid JWT tokens
- **API Key Protection**: OpenAI API key stored securely in environment variables
- **Input Validation**: All inputs are validated and sanitized
- **Error Handling**: Sensitive information is not exposed in error messages
