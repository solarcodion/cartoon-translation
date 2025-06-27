// Dashboard related types

export interface StatsData {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ActivityItem {
  id: number;
  action: string;
  timestamp: string;
}

// API Dashboard types (from dashboardService)
export type {
  DashboardStats,
  ChapterStatusStats,
  UserRoleStats,
  RecentActivityItem,
  DashboardResponse,
} from "../services/dashboardService";
