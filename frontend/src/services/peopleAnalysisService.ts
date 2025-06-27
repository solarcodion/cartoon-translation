// People Analysis Service for AI Glossary functionality

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

export interface PeopleAnalysisRequest {
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
   * Get simple avatar URL for fallback cases
   */
  getSimpleAvatarUrl(personIndex: number): string {
    // You can replace this with actual avatar generation service
    const avatarColors = ["blue", "green", "purple", "orange", "red"];
    const color = avatarColors[personIndex % avatarColors.length];

    // Using a simple avatar service (you can replace with your preferred service)
    return `https://ui-avatars.com/api/?name=Person+${
      personIndex + 1
    }&background=${color}&color=fff&size=128`;
  }

  /**
   * Enhance people data with fallback avatars if needed
   */
  enhancePeopleWithAvatars(people: PersonInfo[]): PersonInfo[] {
    return people.map((person, index) => ({
      ...person,
      image_url: person.image_url || this.getSimpleAvatarUrl(index),
    }));
  }
}

// Export singleton instance
export const peopleAnalysisService = new PeopleAnalysisService();
