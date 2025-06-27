import { apiClient, type ApiResponse } from "./api";
import { supabase } from "../lib/supabase";

// Series types for API communication
export interface SeriesCreateRequest {
  title: string;
}

export interface SeriesUpdateRequest {
  title?: string;
  total_chapters?: number;
}

export interface SeriesApiResponse {
  id: string;
  title: string;
  total_chapters: number;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SeriesStats {
  total_series: number;
  status_counts: {
    active: number;
    completed: number;
    on_hold: number;
    dropped: number;
  };
}

class SeriesService {
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

  async getAllSeries(
    skip: number = 0,
    limit: number = 100
  ): Promise<SeriesApiResponse[]> {
    try {
      const token = await this.getAuthToken();

      const response = await apiClient.get<SeriesApiResponse[]>(
        `/series/?skip=${skip}&limit=${limit}`,
        token || undefined
      );

      return response;
    } catch (error) {
      console.error("❌ Error fetching series:", error);
      throw new Error(
        `Failed to fetch series: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getSeriesById(id: string): Promise<SeriesApiResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await apiClient.get<SeriesApiResponse>(
        `/series/${id}`,
        token || undefined
      );

      return response;
    } catch (error) {
      console.error(`❌ Error fetching series ${id}:`, error);
      throw new Error(
        `Failed to fetch series: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async createSeries(
    seriesData: SeriesCreateRequest
  ): Promise<SeriesApiResponse> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("Authentication required to create series");
      }

      const response = await apiClient.post<SeriesApiResponse>(
        "/series/",
        seriesData,
        token
      );

      return response;
    } catch (error) {
      console.error("❌ Error creating series:", error);

      // If it's already an Error object with a message, just re-throw it
      // The API client already extracts the proper error message from the response
      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to create series: Unknown error");
    }
  }

  async updateSeries(
    id: string,
    seriesData: SeriesUpdateRequest
  ): Promise<SeriesApiResponse> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("Authentication required to update series");
      }

      const response = await apiClient.put<SeriesApiResponse>(
        `/series/${id}`,
        seriesData,
        token
      );

      return response;
    } catch (error) {
      console.error(`❌ Error updating series ${id}:`, error);
      throw new Error(
        `Failed to update series: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async deleteSeries(id: string): Promise<void> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("Authentication required to delete series");
      }

      await apiClient.delete<ApiResponse>(`/series/${id}`, token);
    } catch (error) {
      console.error(`❌ Error deleting series ${id}:`, error);
      throw new Error(
        `Failed to delete series: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getSeriesStats(): Promise<SeriesStats> {
    try {
      const token = await this.getAuthToken();

      const response = await apiClient.get<SeriesStats>(
        "/series/stats",
        token || undefined
      );

      return response;
    } catch (error) {
      console.error("❌ Error fetching series statistics:", error);
      throw new Error(
        `Failed to fetch series statistics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

// Export singleton instance
export const seriesService = new SeriesService();
