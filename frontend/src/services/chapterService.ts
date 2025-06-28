import { apiClient } from "./api";
import { supabase } from "../lib/supabase";

// Chapter types for API communication
export interface ChapterCreateRequest {
  chapter_number: number;
}

export interface ChapterUpdateRequest {
  chapter_number?: number;
  status?: "draft" | "in_progress" | "translated";
  page_count?: number;
  context?: string;
}

export interface ChapterApiResponse {
  id: string;
  series_id: string;
  chapter_number: number;
  status: "draft" | "in_progress" | "translated";
  page_count: number;
  context: string;
  created_at: string;
  updated_at: string;
}

// Text Box Translation Data for Chapter Analysis
export interface TextBoxTranslationData {
  x: number;
  y: number;
  w: number;
  h: number;
  ocr_text?: string;
  translated_text?: string;
  corrected_text?: string;
}

// Chapter Analysis types
export interface PageAnalysisData {
  page_number: number;
  image_url: string;
  ocr_context?: string;
  text_boxes?: TextBoxTranslationData[];
}

export interface ChapterAnalysisRequest {
  pages: PageAnalysisData[];
  translation_info: string[];
  existing_context?: string;
}

export interface ChapterAnalysisResponse {
  success: boolean;
  chapter_context: string;
  analysis_summary: string;
  processing_time?: number;
  model?: string;
  tokens_used?: number;
}

class ChapterService {
  private async getAuthToken(): Promise<string | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }

  async getChaptersBySeriesId(
    seriesId: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<ChapterApiResponse[]> {
    try {
      const token = await this.getAuthToken();

      const response = await apiClient.get<ChapterApiResponse[]>(
        `/chapters/series/${seriesId}?skip=${skip}&limit=${limit}`,
        token || undefined
      );

      return response;
    } catch (error) {
      console.error(
        `❌ Error fetching chapters for series ${seriesId}:`,
        error
      );
      throw new Error(
        `Failed to fetch chapters: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getChapterById(chapterId: string): Promise<ChapterApiResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await apiClient.get<ChapterApiResponse>(
        `/chapters/${chapterId}`,
        token || undefined
      );

      return response;
    } catch (error) {
      console.error(`❌ Error fetching chapter ${chapterId}:`, error);
      throw new Error(
        `Failed to fetch chapter: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async updateChapter(
    chapterId: string,
    updateData: ChapterUpdateRequest
  ): Promise<ChapterApiResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await apiClient.put<ChapterApiResponse>(
        `/chapters/${chapterId}`,
        updateData,
        token || undefined
      );

      return response;
    } catch (error) {
      console.error(`❌ Error updating chapter ${chapterId}:`, error);
      throw new Error(
        `Failed to update chapter: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async createChapter(
    seriesId: string,
    chapterData: ChapterCreateRequest
  ): Promise<ChapterApiResponse> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiClient.post<ChapterApiResponse>(
        `/chapters/series/${seriesId}`,
        chapterData,
        token
      );

      return response;
    } catch (error) {
      console.error("❌ Error creating chapter:", error);
      throw new Error(
        `Failed to create chapter: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async deleteChapter(id: string): Promise<void> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      await apiClient.delete(`/chapters/${id}`, token);
    } catch (error) {
      console.error(`❌ Error deleting chapter ${id}:`, error);
      throw new Error(
        `Failed to delete chapter: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getChapterCount(seriesId: string): Promise<number> {
    try {
      const token = await this.getAuthToken();

      const response = await apiClient.get<{ count: number }>(
        `/chapters/series/${seriesId}/count`,
        token || undefined
      );

      return response.count;
    } catch (error) {
      console.error(
        `❌ Error fetching chapter count for series ${seriesId}:`,
        error
      );
      throw new Error(
        `Failed to fetch chapter count: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async analyzeChapter(
    chapterId: string,
    analysisRequest: ChapterAnalysisRequest
  ): Promise<ChapterAnalysisResponse> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: ChapterAnalysisResponse;
      }>(`/chapters/${chapterId}/analyze`, analysisRequest, token);

      if (!response.success) {
        throw new Error(response.message || "Chapter analysis failed");
      }

      return response.data;
    } catch (error) {
      console.error(`❌ Error analyzing chapter ${chapterId}:`, error);
      throw new Error(
        `Failed to analyze chapter: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Helper method to update chapter status
  async updateChapterStatus(
    id: string,
    status: "draft" | "in_progress" | "translated"
  ): Promise<ChapterApiResponse> {
    return this.updateChapter(id, { status });
  }

  // Helper method to update page count
  async updatePageCount(
    id: string,
    pageCount: number
  ): Promise<ChapterApiResponse> {
    return this.updateChapter(id, {
      page_count: pageCount,
    });
  }
}

// Export singleton instance
export const chapterService = new ChapterService();
