import { supabase } from "../lib/supabase";
import { apiClient } from "./api";
import type { TranslationMemoryApiItem } from "../types";

export interface TMEntryCreateRequest {
  source_text: string;
  target_text: string;
  context?: string;
}

export interface TMEntryUpdateRequest {
  source_text?: string;
  target_text?: string;
  context?: string;
  usage_count?: number;
}

export type TMEntryResponse = TranslationMemoryApiItem;

class TranslationMemoryService {
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

  async createTMEntry(
    seriesId: string,
    entryData: TMEntryCreateRequest
  ): Promise<TMEntryResponse> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiClient.post<TMEntryResponse>(
        `/translation-memory/series/${seriesId}`,
        entryData,
        token
      );

      return response;
    } catch (error) {
      console.error("Error creating TM entry:", error);
      throw new Error(
        `Failed to create TM entry: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getTMEntries(seriesId: string): Promise<TMEntryResponse[]> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiClient.get<TMEntryResponse[]>(
        `/translation-memory/series/${seriesId}`,
        token
      );

      return response;
    } catch (error) {
      console.error("Error fetching TM entries:", error);
      throw new Error(
        `Failed to fetch TM entries: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async updateTMEntry(
    id: string,
    entryData: TMEntryUpdateRequest
  ): Promise<TMEntryResponse> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiClient.put<TMEntryResponse>(
        `/translation-memory/${id}`,
        entryData,
        token
      );

      return response;
    } catch (error) {
      console.error(`Error updating TM entry ${id}:`, error);
      throw new Error(
        `Failed to update TM entry: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async deleteTMEntry(id: string): Promise<void> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      await apiClient.delete(`/translation-memory/${id}`, token);
    } catch (error) {
      console.error(`Error deleting TM entry ${id}:`, error);
      throw new Error(
        `Failed to delete TM entry: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async searchTMEntries(
    seriesId: string,
    searchText: string
  ): Promise<TMEntryResponse[]> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiClient.get<TMEntryResponse[]>(
        `/translation-memory/series/${seriesId}/search?q=${encodeURIComponent(
          searchText
        )}`,
        token
      );

      return response;
    } catch (error) {
      console.error("Error searching TM entries:", error);
      throw new Error(
        `Failed to search TM entries: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async incrementUsageCount(id: string): Promise<TMEntryResponse> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiClient.post<TMEntryResponse>(
        `/translation-memory/${id}/increment-usage`,
        {},
        token
      );

      return response;
    } catch (error) {
      console.error(`Error incrementing TM entry usage ${id}:`, error);
      throw new Error(
        `Failed to increment TM entry usage: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

export const translationMemoryService = new TranslationMemoryService();
