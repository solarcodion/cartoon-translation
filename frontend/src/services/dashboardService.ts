import { apiClient } from "./api";
import { supabase } from "../lib/supabase";

// Dashboard types for API communication
export interface DashboardResponse {
  total_series: number;
  progress_chapters: number;
  processed_pages: number;
  translated_textbox: number;
  recent_activities: string[];
}

class DashboardService {
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

  async getDashboardData(): Promise<DashboardResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await apiClient.get<DashboardResponse>(
        "/dashboard/",
        token || undefined
      );

      return response;
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      throw new Error(
        `Failed to fetch dashboard data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getDashboardStats(): Promise<DashboardResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await apiClient.get<DashboardResponse>(
        "/dashboard/stats",
        token || undefined
      );

      return response;
    } catch (error) {
      console.error("❌ Error fetching dashboard statistics:", error);
      throw new Error(
        `Failed to fetch dashboard statistics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async refreshDashboardStats(): Promise<void> {
    try {
      const token = await this.getAuthToken();

      await apiClient.post<{ success: boolean; message: string }>(
        "/dashboard/refresh",
        {},
        token || undefined
      );
    } catch (error) {
      console.error("❌ Error refreshing dashboard statistics:", error);
      throw new Error(
        `Failed to refresh dashboard statistics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Helper method to format activity action text (now just returns the activity string)
  formatActivityAction(activity: string): string {
    return activity;
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
