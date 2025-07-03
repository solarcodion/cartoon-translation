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
export type { DashboardResponse } from "../services/dashboardService";
import type { DashboardResponse } from "../services/dashboardService";

// Dashboard Store Types
export interface DashboardState {
  data: DashboardResponse | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

export interface DashboardActions {
  fetchDashboardData: () => Promise<void>;
  updateStats: (updates: Partial<DashboardResponse>) => void;
  incrementSeries: () => void;
  decrementSeries: () => void;
  incrementProgressChapters: () => void;
  decrementProgressChapters: () => void;
  incrementProcessedPages: () => void;
  decrementProcessedPages: () => void;
  incrementTranslatedTextbox: () => void;
  decrementTranslatedTextbox: () => void;
  addRecentActivity: (activity: string) => void;
  clearError: () => void;
  reset: () => void;
}

export interface DashboardStore extends DashboardState, DashboardActions {}
