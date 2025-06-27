# People Analysis API Documentation

## Overview

The People Analysis API provides AI-powered character/people analysis for manga/manhwa series using OpenAI's GPT-4o-mini model. It analyzes all chapters in a series to identify and describe the main people/characters that appear throughout the story.

## Features

- **AI-Powered Character Detection**: Uses OpenAI GPT-4o-mini for high-quality character analysis
- **Series-Wide Analysis**: Analyzes all chapters in a series to identify recurring characters
- **Fallback Support**: Provides generic character data when AI analysis fails
- **Avatar Generation**: Automatically generates simple avatars for characters without images
- **Vietnamese Descriptions**: Generates character descriptions in Vietnamese (configurable)
- **Authentication**: Secure API endpoint with JWT authentication

## Environment Configuration

The API uses the same OpenAI configuration as other AI services:

```env
# OpenAI Configuration
***REMOVED***your_openai_api_key_here
TRANSLATION_TARGET_LANGUAGE=Vietnamese
```

## API Endpoint

### Analyze People in Series

**POST** `/api/series/{series_id}/analyze-people`

Analyzes all chapters in a series to identify and describe people/characters.

**Path Parameters:**

- `series_id` (string): The ID of the series to analyze

**Request Body:**

```json
{
  "series_id": "123e4567-e89b-12d3-a456-426614174000",
  "force_refresh": true
}
```

**Request Fields:**

- `series_id` (string, required): ID of the series to analyze
- `force_refresh` (boolean, optional): Whether to force re-analysis even if data exists (default: false)

**Response:**

```json
{
  "success": true,
  "people": [
    {
      "id": "char-123e4567-e89b-12d3-a456-426614174000",
      "name": "Sung Jinwoo",
      "description": "Nhân vật chính của câu chuyện, ban đầu được biết đến là 'Thợ săn yếu nhất thế giới.' Trải qua một sự thức tỉnh độc đáo, cho phép anh ta nâng cấp và trở nên mạnh mẽ hơn bằng cách hoàn thành các nhiệm vụ trong một 'Hệ thống' bí ẩn.",
      "image_url": "https://ui-avatars.com/api/?name=Person+1&background=blue&color=fff&size=128",
      "mentioned_chapters": [1, 2, 3],
      "confidence_score": 0.95
    },
    {
      "id": "char-456e7890-e89b-12d3-a456-426614174001",
      "name": "Cha Hae-In",
      "description": "Một thợ săn hạng S và Phó Chủ tịch của Guild Thợ săn. Sở hữu khả năng đặc biệt có thể ngửi thấy mana, điều này thường khiến cô khó chịu khi ở gần các thợ săn khác.",
      "image_url": "https://ui-avatars.com/api/?name=Person+2&background=green&color=fff&size=128",
      "mentioned_chapters": [2, 3],
      "confidence_score": 0.88
    }
  ],
  "total_people_found": 2,
  "processing_time": 3.45,
  "model": "gpt-4o-mini",
  "tokens_used": 1250
}
```

**Response Fields:**

- `success` (boolean): Whether the analysis was successful
- `people` (array): List of detected people/characters
  - `id` (string): Unique identifier for the character
  - `name` (string): Character name or descriptive name
  - `description` (string): Detailed description in target language
  - `image_url` (string, optional): URL to character image or generated avatar
  - `mentioned_chapters` (array): List of chapter numbers where character appears
  - `confidence_score` (number, optional): AI confidence score (0.0-1.0)
- `total_people_found` (integer): Total number of characters found
- `processing_time` (number, optional): Analysis processing time in seconds
- `model` (string, optional): AI model used for analysis
- `tokens_used` (integer, optional): Number of tokens consumed

## Frontend Integration

### Service Usage

```typescript
import { peopleAnalysisService } from '../services/peopleAnalysisService';

// Analyze people in a series
const result = await peopleAnalysisService.analyzePeopleInSeries(
  seriesId,
  true // force refresh
);

// Convert to glossary character format
const glossaryCharacters = peopleAnalysisService.convertToGlossaryCharacters(
  result.people
);

// Enhance with avatars
const enhancedCharacters = peopleAnalysisService.enhancePeopleWithAvatars(
  result.people
);
```

### Component Integration

The AI Glossary tab in the Chapters page now includes:

- **Refresh Button**: Triggers people analysis for the current series
- **Loading State**: Shows "Analyzing..." while processing
- **Character Cards**: Displays detected characters with images and descriptions
- **Fallback Support**: Shows generic characters when analysis fails

## Fallback Behavior

When AI analysis fails or no characters are detected, the system provides fallback data:

1. **Generic Characters**: Creates 2-3 generic character entries
2. **Simple Avatars**: Generates colored avatar images using UI Avatars service
3. **Vietnamese Names**: Uses descriptive Vietnamese names like "Nhân vật chính"
4. **Lower Confidence**: Marks fallback data with lower confidence scores

## Error Handling

The API handles various error scenarios:

- **Series Not Found**: Returns 404 if series doesn't exist
- **No Chapters**: Returns empty people array if no chapters found
- **OpenAI API Errors**: Falls back to generic character data
- **Authentication Errors**: Returns 401 for invalid tokens
- **Rate Limiting**: Returns 429 when OpenAI rate limits are exceeded

## Performance Considerations

- **Token Usage**: Analysis consumes OpenAI tokens based on chapter content
- **Processing Time**: Typically 2-5 seconds depending on series size
- **Caching**: Consider implementing caching for frequently analyzed series
- **Rate Limits**: Respect OpenAI API rate limits

## Example Usage

1. **Navigate to Series**: Go to any series in the application
2. **Open AI Glossary Tab**: Click on the "AI Glossary" tab
3. **Refresh Analysis**: Click the "Refresh Glossary" button
4. **View Results**: See detected characters with descriptions and avatars

The system will automatically analyze all chapters in the series and display the detected people/characters in an easy-to-read card format.
