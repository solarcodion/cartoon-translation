import { apiClient } from "./api";
import { supabase } from "../lib/supabase";

// Dashboard types for API communication
export interface DashboardStats {
  total_series: number;
  total_chapters: number;
  total_pages: number;
  total_text_boxes: number;
  total_users: number;
  total_glossary_entries: number;
}

export interface ChapterStatusStats {
  draft: number;
  in_progress: number;
  translated: number;
}

export interface UserRoleStats {
  admin: number;
  editor: number;
  translator: number;
}

export interface RecentActivityItem {
  id: string;
  type: string; // 'series', 'chapter', 'page', 'user'
  action: string;
  entity_name: string;
  user_name?: string;
  timestamp: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  chapter_status_stats: ChapterStatusStats;
  user_role_stats: UserRoleStats;
  recent_activities: RecentActivityItem[];
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

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const token = await this.getAuthToken();

      const response = await apiClient.get<DashboardStats>(
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

  async getChapterStatusStats(): Promise<ChapterStatusStats> {
    try {
      const token = await this.getAuthToken();

      const response = await apiClient.get<ChapterStatusStats>(
        "/dashboard/stats/chapters",
        token || undefined
      );

      return response;
    } catch (error) {
      console.error("❌ Error fetching chapter status statistics:", error);
      throw new Error(
        `Failed to fetch chapter status statistics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getUserRoleStats(): Promise<UserRoleStats> {
    try {
      const token = await this.getAuthToken();

      const response = await apiClient.get<UserRoleStats>(
        "/dashboard/stats/users",
        token || undefined
      );

      return response;
    } catch (error) {
      console.error("❌ Error fetching user role statistics:", error);
      throw new Error(
        `Failed to fetch user role statistics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getRecentActivities(limit: number = 10): Promise<RecentActivityItem[]> {
    try {
      const token = await this.getAuthToken();

      const response = await apiClient.get<RecentActivityItem[]>(
        `/dashboard/activities?limit=${limit}`,
        token || undefined
      );

      return response;
    } catch (error) {
      console.error("❌ Error fetching recent activities:", error);
      throw new Error(
        `Failed to fetch recent activities: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Helper method to format activity timestamp for display
  formatActivityTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInMinutes < 1) {
        return "Just now";
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
      } else if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Unknown time";
    }
  }

  // Helper method to format activity action text
  formatActivityAction(activity: RecentActivityItem): string {
    const userName = activity.user_name ? `User '${activity.user_name}' ` : "";
    
    switch (activity.type) {
      case "series":
        return `${userName}${activity.action} '${activity.entity_name}'`;
      case "chapter":
        return `${userName}${activity.action} ${activity.entity_name}`;
      case "page":
        return `${userName}${activity.action} ${activity.entity_name}`;
      case "user":
        return `${activity.action} ${activity.entity_name}`;
      default:
        return `${userName}${activity.action} ${activity.entity_name}`;
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
