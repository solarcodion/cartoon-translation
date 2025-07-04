// AI Glossary Service for managing glossary data from database

import { apiClient } from "./api";
import { supabase } from "../lib/supabase";

export interface AIGlossaryEntry {
  id: string;
  series_id: string;
  name: string; // Display name
  translated_text: string; // English translation of description
  category: string; // Type: character, place, item, skill, technique, organization, etc.
  description: string; // Detailed description in Vietnamese
  tm_related_ids?: string[]; // TM entry IDs that helped create this glossary entry
  created_at: string;
  updated_at: string;
}

export interface AIGlossaryCreate {
  series_id: string;
  name: string; // Display name
  translated_text: string; // English translation of description
  category: string; // Term category
  description: string; // Description in Vietnamese
  tm_related_ids?: string[];
}

export interface AIGlossaryUpdate {
  name?: string;
  translated_text?: string;
  category?: string;
  description?: string;
  tm_related_ids?: string[];
}

class AIGlossaryService {
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
   * Get all AI glossary entries for a series
   */
  async getGlossaryBySeriesId(seriesId: string): Promise<AIGlossaryEntry[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      const response = await apiClient.get<AIGlossaryEntry[]>(
        `/ai-glossary/series/${seriesId}`,
        token
      );
      return response;
    } catch (error: any) {
      console.error("AI glossary fetch error:", error);

      if (error.message.includes("404")) {
        // Return empty array if no entries found
        return [];
      } else if (error.message.includes("401")) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to fetch AI glossary");
      }
    }
  }

  /**
   * Get a specific AI glossary entry by ID
   */
  async getGlossaryEntryById(entryId: string): Promise<AIGlossaryEntry> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      const response = await apiClient.get<AIGlossaryEntry>(
        `/ai-glossary/${entryId}`,
        token
      );

      return response;
    } catch (error: any) {
      console.error("AI glossary entry fetch error:", error);

      if (error.message.includes("404")) {
        throw new Error("AI glossary entry not found");
      } else if (error.message.includes("401")) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to fetch AI glossary entry");
      }
    }
  }

  /**
   * Create a new AI glossary entry
   */
  async createGlossaryEntry(
    entryData: AIGlossaryCreate
  ): Promise<AIGlossaryEntry> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      const response = await apiClient.post<AIGlossaryEntry>(
        `/ai-glossary/`,
        entryData,
        token
      );

      return response;
    } catch (error: any) {
      console.error("AI glossary entry creation error:", error);

      if (error.message.includes("401")) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to create AI glossary entry");
      }
    }
  }

  /**
   * Update an existing AI glossary entry
   */
  async updateGlossaryEntry(
    entryId: string,
    entryData: AIGlossaryUpdate
  ): Promise<AIGlossaryEntry> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      const response = await apiClient.put<AIGlossaryEntry>(
        `/ai-glossary/${entryId}`,
        entryData,
        token
      );

      return response;
    } catch (error: any) {
      console.error("AI glossary entry update error:", error);

      if (error.message.includes("404")) {
        throw new Error("AI glossary entry not found");
      } else if (error.message.includes("401")) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to update AI glossary entry");
      }
    }
  }

  /**
   * Delete an AI glossary entry
   */
  async deleteGlossaryEntry(entryId: string): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      await apiClient.delete(`/ai-glossary/${entryId}`, token);
    } catch (error: any) {
      console.error("AI glossary entry deletion error:", error);

      if (error.message.includes("404")) {
        throw new Error("AI glossary entry not found");
      } else if (error.message.includes("401")) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to delete AI glossary entry");
      }
    }
  }

  /**
   * Clear all AI glossary entries for a series
   */
  async clearSeriesGlossary(seriesId: string): Promise<number> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      const response = await apiClient.delete<{
        success: boolean;
        message: string;
        data: { deleted_count: number };
      }>(`/ai-glossary/series/${seriesId}/clear`, token);

      const deletedCount = response.data?.deleted_count || 0;

      return deletedCount;
    } catch (error: any) {
      console.error("AI glossary clear error:", error);

      if (error.message.includes("401")) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to clear AI glossary");
      }
    }
  }

  /**
   * Convert AI glossary entry to GlossaryCharacter format for compatibility
   */
  convertToGlossaryCharacter(entry: AIGlossaryEntry): any {
    return {
      id: entry.id,
      name: entry.name,
      originalText: "", // No longer using original_text field
      translatedText: entry.translated_text,
      category: entry.category,
      summary: entry.description,
      mentionedChapters: [], // This could be enhanced to track chapters
      status: "Ongoing" as const,
      image: this.getSimpleAvatarUrl(entry.name, entry.category),
    };
  }

  /**
   * Convert multiple AI glossary entries to GlossaryCharacter format
   */
  convertToGlossaryCharacters(entries: AIGlossaryEntry[]): any[] {
    return entries.map((entry) => this.convertToGlossaryCharacter(entry));
  }

  /**
   * Get avatar URL for terminology based on category
   */
  getSimpleAvatarUrl(name: string, category?: string): string | null {
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
}

// Export singleton instance
export const aiGlossaryService = new AIGlossaryService();
