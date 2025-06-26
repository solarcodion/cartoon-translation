# Chapter Analysis Frontend Integration

## Overview

This document explains how to integrate the Chapter Analysis API in the frontend React application.

## Service Integration

The chapter analysis functionality has been added to the existing `chapterService.ts`. You can import and use it as follows:

```typescript
import { chapterService, ChapterAnalysisRequest, PageAnalysisData } from '../services/chapterService';
```

## Types

### PageAnalysisData
```typescript
interface PageAnalysisData {
  page_number: number;
  image_url: string;
  ocr_context?: string;
}
```

### ChapterAnalysisRequest
```typescript
interface ChapterAnalysisRequest {
  pages: PageAnalysisData[];
  translation_info: string[];
  existing_context?: string;
}
```

### ChapterAnalysisResponse
```typescript
interface ChapterAnalysisResponse {
  success: boolean;
  chapter_context: string;
  analysis_summary: string;
  processing_time?: number;
  model?: string;
  tokens_used?: number;
}
```

## Usage Examples

### Basic Chapter Analysis

```typescript
import { chapterService } from '../services/chapterService';

const analyzeChapter = async (chapterId: string, pages: any[]) => {
  try {
    // Prepare the analysis request
    const analysisRequest = {
      pages: pages.map(page => ({
        page_number: page.page_number,
        image_url: page.file_path, // URL from page service
        ocr_context: page.context || undefined
      })),
      translation_info: [
        "Maintain natural Vietnamese flow",
        "Preserve character names and honorifics",
        "Adapt cultural references appropriately"
      ],
      existing_context: chapter.context || undefined
    };

    // Perform analysis
    const result = await chapterService.analyzeChapter(chapterId, analysisRequest);
    
    console.log('Analysis completed:', result);
    console.log('Chapter context:', result.chapter_context);
    console.log('Analysis summary:', result.analysis_summary);
    
    return result;
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
};
```

### React Component Example

```typescript
import React, { useState } from 'react';
import { chapterService, ChapterAnalysisRequest } from '../services/chapterService';

interface AnalyzeChapterButtonProps {
  chapterId: string;
  pages: any[];
  existingContext?: string;
  onAnalysisComplete?: (result: any) => void;
}

const AnalyzeChapterButton: React.FC<AnalyzeChapterButtonProps> = ({
  chapterId,
  pages,
  existingContext,
  onAnalysisComplete
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!pages || pages.length === 0) {
      setError('No pages available for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysisRequest: ChapterAnalysisRequest = {
        pages: pages
          .sort((a, b) => a.page_number - b.page_number) // Ensure proper order
          .map(page => ({
            page_number: page.page_number,
            image_url: page.file_path,
            ocr_context: page.context || undefined
          })),
        translation_info: [
          "Maintain natural Vietnamese flow and readability",
          "Preserve character names and proper nouns",
          "Adapt Japanese/Korean cultural references to Vietnamese context",
          "Use appropriate Vietnamese honorifics and speech patterns"
        ],
        existing_context: existingContext
      };

      const result = await chapterService.analyzeChapter(chapterId, analysisRequest);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="analyze-chapter-section">
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !pages || pages.length === 0}
        className="btn btn-primary"
      >
        {isAnalyzing ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            Analyzing Chapter...
          </>
        ) : (
          <>
            <i className="bi bi-cpu me-2" />
            Analyze Chapter with AI
          </>
        )}
      </button>
      
      {error && (
        <div className="alert alert-danger mt-2">
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </div>
      )}
      
      <small className="text-muted d-block mt-1">
        Analyzes all pages to generate comprehensive chapter context
      </small>
    </div>
  );
};

export default AnalyzeChapterButton;
```

### Integration with Pages Component

```typescript
// In your pages component where you display chapter pages
import { chapterService } from '../services/chapterService';

const PagesComponent = ({ chapterId, chapter, pages }) => {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleChapterAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const analysisRequest = {
        pages: pages.map(page => ({
          page_number: page.page_number,
          image_url: page.file_path,
          ocr_context: page.context
        })),
        translation_info: [
          "Translate to natural Vietnamese",
          "Preserve character names",
          "Maintain story context"
        ],
        existing_context: chapter.context
      };

      const result = await chapterService.analyzeChapter(chapterId, analysisRequest);
      setAnalysisResult(result);
      
      // Optionally refresh chapter data to get updated context
      // await refreshChapterData();
      
    } catch (error) {
      console.error('Chapter analysis failed:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div>
      {/* Your existing pages UI */}
      
      {/* Analysis section */}
      <div className="chapter-analysis-section mt-4">
        <h5>Chapter Analysis</h5>
        
        <button
          onClick={handleChapterAnalysis}
          disabled={isAnalyzing || pages.length === 0}
          className="btn btn-outline-primary"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Chapter'}
        </button>
        
        {analysisResult && (
          <div className="analysis-results mt-3">
            <div className="card">
              <div className="card-header">
                <h6>Analysis Results</h6>
                <small className="text-muted">
                  Processed in {analysisResult.processing_time?.toFixed(2)}s
                  • {analysisResult.tokens_used} tokens used
                </small>
              </div>
              <div className="card-body">
                <h6>Chapter Context:</h6>
                <p className="text-muted">{analysisResult.chapter_context}</p>
                
                <h6>Analysis Summary:</h6>
                <p className="text-muted">{analysisResult.analysis_summary}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

## Best Practices

1. **Page Ordering**: Always sort pages by `page_number` before sending to analysis
2. **Error Handling**: Implement proper error handling with user-friendly messages
3. **Loading States**: Show loading indicators during analysis (can take 10-30 seconds)
4. **Context Updates**: Consider refreshing chapter data after analysis to show updated context
5. **Validation**: Validate that pages exist before attempting analysis
6. **Translation Info**: Customize translation guidelines based on your specific needs

## Error Handling

Common errors and how to handle them:

```typescript
try {
  const result = await chapterService.analyzeChapter(chapterId, request);
} catch (error) {
  if (error.message.includes('Authentication required')) {
    // Redirect to login
  } else if (error.message.includes('Chapter with ID')) {
    // Chapter not found
  } else if (error.message.includes('Pages array cannot be empty')) {
    // No pages to analyze
  } else {
    // General error handling
  }
}
```

## Performance Considerations

- Analysis typically takes 10-30 seconds depending on chapter length
- Consider implementing a queue system for multiple chapter analysis
- Show progress indicators to improve user experience
- Cache analysis results to avoid repeated API calls
