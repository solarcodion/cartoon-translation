import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useMemo } from "react";
import { dashboardService } from "../services/dashboardService";
import type { DashboardStore, DashboardResponse } from "../types/dashboard";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

const initialState = {
  data: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchDashboardData: async () => {
        const state = get();

        // Check if data is still fresh (within cache duration)
        if (
          state.data &&
          state.lastFetched &&
          Date.now() - state.lastFetched < CACHE_DURATION
        ) {
          return;
        }

        // If already loading, don't fetch again
        if (state.isLoading) {
          return;
        }

        set({ isLoading: true, error: null }, false, "dashboard/fetchStart");

        try {
          const data = await dashboardService.getDashboardData();

          set(
            {
              data,
              isLoading: false,
              error: null,
              lastFetched: Date.now(),
            },
            false,
            "dashboard/fetchSuccess"
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch dashboard data";

          set(
            {
              isLoading: false,
              error: errorMessage,
            },
            false,
            "dashboard/fetchError"
          );

          console.error("❌ Error fetching dashboard data:", error);
        }
      },

      updateStats: (updates) => {
        const state = get();
        if (state.data) {
          set(
            {
              data: { ...state.data, ...updates },
              lastFetched: Date.now(),
            },
            false,
            "dashboard/updateStats"
          );
        }
      },

      incrementSeries: () => {
        const state = get();
        if (state.data) {
          set(
            {
              data: {
                ...state.data,
                total_series: state.data.total_series + 1,
              },
              lastFetched: Date.now(),
            },
            false,
            "dashboard/incrementSeries"
          );
        }
      },

      decrementSeries: () => {
        const state = get();
        if (state.data) {
          set(
            {
              data: {
                ...state.data,
                total_series: Math.max(0, state.data.total_series - 1),
              },
              lastFetched: Date.now(),
            },
            false,
            "dashboard/decrementSeries"
          );
        }
      },

      incrementProgressChapters: () => {
        const state = get();
        if (state.data) {
          set(
            {
              data: {
                ...state.data,
                progress_chapters: state.data.progress_chapters + 1,
              },
              lastFetched: Date.now(),
            },
            false,
            "dashboard/incrementProgressChapters"
          );
        }
      },

      decrementProgressChapters: () => {
        const state = get();
        if (state.data) {
          set(
            {
              data: {
                ...state.data,
                progress_chapters: Math.max(
                  0,
                  state.data.progress_chapters - 1
                ),
              },
              lastFetched: Date.now(),
            },
            false,
            "dashboard/decrementProgressChapters"
          );
        }
      },

      incrementProcessedPages: () => {
        const state = get();
        if (state.data) {
          set(
            {
              data: {
                ...state.data,
                processed_pages: state.data.processed_pages + 1,
              },
              lastFetched: Date.now(),
            },
            false,
            "dashboard/incrementProcessedPages"
          );
        }
      },

      decrementProcessedPages: () => {
        const state = get();
        if (state.data) {
          set(
            {
              data: {
                ...state.data,
                processed_pages: Math.max(0, state.data.processed_pages - 1),
              },
              lastFetched: Date.now(),
            },
            false,
            "dashboard/decrementProcessedPages"
          );
        }
      },

      incrementTranslatedTextbox: () => {
        const state = get();
        if (state.data) {
          set(
            {
              data: {
                ...state.data,
                translated_textbox: state.data.translated_textbox + 1,
              },
              lastFetched: Date.now(),
            },
            false,
            "dashboard/incrementTranslatedTextbox"
          );
        }
      },

      decrementTranslatedTextbox: () => {
        const state = get();
        if (state.data) {
          set(
            {
              data: {
                ...state.data,
                translated_textbox: Math.max(
                  0,
                  state.data.translated_textbox - 1
                ),
              },
              lastFetched: Date.now(),
            },
            false,
            "dashboard/decrementTranslatedTextbox"
          );
        }
      },

      addRecentActivity: (activity) => {
        const state = get();
        if (state.data) {
          const newActivities = [
            activity,
            ...state.data.recent_activities,
          ].slice(0, 10); // Keep only last 10 activities
          set(
            {
              data: { ...state.data, recent_activities: newActivities },
              lastFetched: Date.now(),
            },
            false,
            "dashboard/addRecentActivity"
          );
        }
      },

      clearError: () => {
        set({ error: null }, false, "dashboard/clearError");
      },

      reset: () => {
        set(initialState, false, "dashboard/reset");
      },
    }),
    {
      name: "dashboard-store",
      // Only log actions in development
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// Cached selectors to prevent infinite loops
const selectData = (state: DashboardStore) => state.data;
const selectLoading = (state: DashboardStore) => state.isLoading;
const selectError = (state: DashboardStore) => state.error;

// Selector hooks for better performance
export const useDashboardData = () => useDashboardStore(selectData);
export const useDashboardLoading = () => useDashboardStore(selectLoading);
export const useDashboardError = () => useDashboardStore(selectError);

// Individual action hooks to avoid object creation
export const useDashboardActions = () => {
  const fetchDashboardData = useDashboardStore(
    (state) => state.fetchDashboardData
  );
  const updateStats = useDashboardStore((state) => state.updateStats);
  const incrementSeries = useDashboardStore((state) => state.incrementSeries);
  const decrementSeries = useDashboardStore((state) => state.decrementSeries);
  const incrementProgressChapters = useDashboardStore(
    (state) => state.incrementProgressChapters
  );
  const decrementProgressChapters = useDashboardStore(
    (state) => state.decrementProgressChapters
  );
  const incrementProcessedPages = useDashboardStore(
    (state) => state.incrementProcessedPages
  );
  const decrementProcessedPages = useDashboardStore(
    (state) => state.decrementProcessedPages
  );
  const incrementTranslatedTextbox = useDashboardStore(
    (state) => state.incrementTranslatedTextbox
  );
  const decrementTranslatedTextbox = useDashboardStore(
    (state) => state.decrementTranslatedTextbox
  );
  const addRecentActivity = useDashboardStore(
    (state) => state.addRecentActivity
  );
  const clearError = useDashboardStore((state) => state.clearError);
  const reset = useDashboardStore((state) => state.reset);

  // Memoize the actions object to prevent infinite loops
  return useMemo(
    () => ({
      fetchDashboardData,
      updateStats,
      incrementSeries,
      decrementSeries,
      incrementProgressChapters,
      decrementProgressChapters,
      incrementProcessedPages,
      decrementProcessedPages,
      incrementTranslatedTextbox,
      decrementTranslatedTextbox,
      addRecentActivity,
      clearError,
      reset,
    }),
    [
      fetchDashboardData,
      updateStats,
      incrementSeries,
      decrementSeries,
      incrementProgressChapters,
      decrementProgressChapters,
      incrementProcessedPages,
      decrementProcessedPages,
      incrementTranslatedTextbox,
      decrementTranslatedTextbox,
      addRecentActivity,
      clearError,
      reset,
    ]
  );
};

// Helper to check if data is stale - cached selector
const selectIsStale = (state: DashboardStore) => {
  if (!state.lastFetched) return true;
  return Date.now() - state.lastFetched > CACHE_DURATION;
};

export const useDashboardIsStale = () => useDashboardStore(selectIsStale);

// Utility function to invalidate cache (next fetch will get fresh data)
export const invalidateDashboardCache = () => {
  useDashboardStore.setState(
    { lastFetched: null },
    false,
    "dashboard/invalidateCache"
  );
};

// Utility functions to update dashboard stats from anywhere in the app
export const updateDashboardStats = (updates: Partial<DashboardResponse>) => {
  const { updateStats } = useDashboardStore.getState();
  updateStats(updates);
};

export const incrementDashboardSeries = () => {
  const { incrementSeries } = useDashboardStore.getState();
  incrementSeries();
};

export const decrementDashboardSeries = () => {
  const { decrementSeries } = useDashboardStore.getState();
  decrementSeries();
};

export const incrementDashboardProgressChapters = () => {
  const { incrementProgressChapters } = useDashboardStore.getState();
  incrementProgressChapters();
};

export const decrementDashboardProgressChapters = () => {
  const { decrementProgressChapters } = useDashboardStore.getState();
  decrementProgressChapters();
};

export const incrementDashboardProcessedPages = () => {
  const { incrementProcessedPages } = useDashboardStore.getState();
  incrementProcessedPages();
};

export const decrementDashboardProcessedPages = () => {
  const { decrementProcessedPages } = useDashboardStore.getState();
  decrementProcessedPages();
};

export const incrementDashboardTranslatedTextbox = () => {
  const { incrementTranslatedTextbox } = useDashboardStore.getState();
  incrementTranslatedTextbox();
};

export const decrementDashboardTranslatedTextbox = () => {
  const { decrementTranslatedTextbox } = useDashboardStore.getState();
  decrementTranslatedTextbox();
};

export const addDashboardActivity = (activity: string) => {
  const { addRecentActivity } = useDashboardStore.getState();
  addRecentActivity(activity);
};
