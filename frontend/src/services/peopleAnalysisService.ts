// People Analysis Service for AI Glossary functionality - DEPRECATED: Use TerminologyAnalysisService instead

import { apiClient } from "./api";
import { supabase } from "../lib/supabase";

export interface PersonInfo {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  mentioned_chapters: number[];
  confidence_score?: number;
}

export interface TerminologyInfo {
  id: string;
  name: string; // Display name
  translated_text: string; // Vietnamese translation
  category: string; // Type: character, place, item, skill, technique, organization, etc.
  description: string; // Detailed description in Vietnamese
  mentioned_chapters: number[];
  confidence_score?: number;
  image_url?: string; // Best image showing this term
}

export interface PeopleAnalysisRequest {
  series_id: string;
  force_refresh?: boolean;
}

export interface TerminologyAnalysisRequest {
  series_id: string;
  force_refresh?: boolean;
}

export interface PeopleAnalysisResponse {
  success: boolean;
  people: PersonInfo[];
  total_people_found: number;
  processing_time?: number;
  model?: string;
  tokens_used?: number;
}

export interface TerminologyAnalysisResponse {
  success: boolean;
  terminology: TerminologyInfo[];
  total_terms_found: number;
  processing_time?: number;
  model?: string;
  tokens_used?: number;
}

class PeopleAnalysisService {
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

  /**
   * Analyze people/characters in a series
   */
  async analyzePeopleInSeries(
    seriesId: string,
    forceRefresh: boolean = false
  ): Promise<PeopleAnalysisResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      const requestData: PeopleAnalysisRequest = {
        series_id: seriesId,
        force_refresh: forceRefresh,
      };

      const response = await apiClient.post<PeopleAnalysisResponse>(
        `/series/${seriesId}/analyze-people`,
        requestData,
        token
      );

      if (response.success) {
        return response;
      } else {
        throw new Error("People analysis failed");
      }
    } catch (error: any) {
      console.error("❌ People analysis error:", error);

      // Handle different error types
      if (error.message.includes("404")) {
        throw new Error("Series not found");
      } else if (error.message.includes("429")) {
        throw new Error("Analysis service is busy. Please try again later.");
      } else if (error.message.includes("401")) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to analyze people in series");
      }
    }
  }

  /**
   * Analyze manhwa-specific terminology in a series using AI
   */
  async analyzeTerminologyInSeries(
    seriesId: string,
    forceRefresh: boolean = false
  ): Promise<TerminologyAnalysisResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      const requestData: TerminologyAnalysisRequest = {
        series_id: seriesId,
        force_refresh: forceRefresh,
      };

      const response = await apiClient.post<TerminologyAnalysisResponse>(
        `/series/${seriesId}/analyze-terminology`,
        requestData,
        token
      );

      if (response.success) {
        return response;
      } else {
        throw new Error("Terminology analysis failed");
      }
    } catch (error: any) {
      console.error("❌ Terminology analysis error:", error);

      // Handle different error types
      if (error.message.includes("404")) {
        throw new Error("Series not found");
      } else if (error.message.includes("429")) {
        throw new Error("Analysis service is busy. Please try again later.");
      } else if (error.message.includes("401")) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to analyze terminology in series");
      }
    }
  }

  /**
   * Convert PersonInfo to GlossaryCharacter format for compatibility
   */
  convertToGlossaryCharacter(person: PersonInfo): any {
    return {
      id: person.id,
      name: person.name,
      summary: person.description,
      mentionedChapters: person.mentioned_chapters,
      status: "Ongoing" as const,
      image: person.image_url,
    };
  }

  /**
   * Convert TerminologyInfo to GlossaryCharacter format for compatibility
   */
  convertTerminologyToGlossaryCharacter(term: TerminologyInfo): any {
    return {
      id: term.id,
      name: term.name,
      originalText: "", // No longer using original_text field
      translatedText: term.translated_text,
      category: term.category,
      summary: term.description,
      mentionedChapters: term.mentioned_chapters,
      status: "Ongoing" as const,
      image:
        term.image_url || this.getSimpleAvatarUrl(term.name, term.category),
    };
  }

  /**
   * Convert multiple PersonInfo objects to GlossaryCharacter format
   */
  convertToGlossaryCharacters(people: PersonInfo[]): any[] {
    return people.map((person) => this.convertToGlossaryCharacter(person));
  }

  /**
   * Create fallback people data when analysis fails
   */
  createFallbackPeople(seriesId: string): PersonInfo[] {
    const fallbackPeople: PersonInfo[] = [
      {
        id: `${seriesId}-person-1`,
        name: "Nhân vật chính",
        description:
          "Nhân vật chính của câu chuyện, xuất hiện trong hầu hết các chương.",
        mentioned_chapters: [1],
        confidence_score: 0.6,
      },
      {
        id: `${seriesId}-person-2`,
        name: "Nhân vật phụ quan trọng",
        description: "Nhân vật phụ đóng vai trò quan trọng trong cốt truyện.",
        mentioned_chapters: [1],
        confidence_score: 0.5,
      },
    ];

    return fallbackPeople;
  }

  /**
   * Get avatar URL for terminology based on name and category
   */
  getSimpleAvatarUrl(name: string, category?: string): string {
    // Generate avatar based on category
    switch (category) {
      case "character":
        // Use DiceBear avatars for characters (more realistic than letters)
        const seed = encodeURIComponent(name);
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9&size=64`;

      default:
        // For all other categories, return null to force icon display
        return null;
    }
  }

  /**
   * Enhance people data with fallback avatars if needed
   */
  enhancePeopleWithAvatars(people: PersonInfo[]): PersonInfo[] {
    return people.map((person, index) => ({
      ...person,
      image_url:
        person.image_url || this.getSimpleAvatarUrl(person.name, "character"),
    }));
  }
}

// Export singleton instance
export const peopleAnalysisService = new PeopleAnalysisService();
