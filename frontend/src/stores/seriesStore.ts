import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useMemo } from "react";
import { seriesService } from "../services/seriesService";
import type { SeriesItem } from "../types";
import type {
  SeriesCreateRequest,
  SeriesUpdateRequest,
} from "../services/seriesService";
import { convertApiSeriesToLegacy } from "../types/series";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export interface SeriesState {
  data: SeriesItem[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

export interface SeriesActions {
  fetchSeries: () => Promise<void>;
  createSeries: (data: SeriesCreateRequest) => Promise<SeriesItem>;
  updateSeries: (id: string, data: SeriesUpdateRequest) => Promise<SeriesItem>;
  deleteSeries: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
  invalidateCache: () => void;
}

export type SeriesStore = SeriesState & SeriesActions;

const initialState: SeriesState = {
  data: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

export const useSeriesStore = create<SeriesStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchSeries: async () => {
        const state = get();

        // Check if data is still fresh (within cache duration)
        if (
          state.data.length > 0 &&
          state.lastFetched &&
          Date.now() - state.lastFetched < CACHE_DURATION
        ) {
          return; // Use cached data
        }

        set({ isLoading: true, error: null }, false, "series/fetchStart");

        try {
          const apiSeries = await seriesService.getAllSeries();
          const legacySeries = apiSeries.map(convertApiSeriesToLegacy);

          set(
            {
              data: legacySeries,
              isLoading: false,
              error: null,
              lastFetched: Date.now(),
            },
            false,
            "series/fetchSuccess"
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch series";
          set(
            {
              isLoading: false,
              error: errorMessage,
            },
            false,
            "series/fetchError"
          );
          throw error;
        }
      },

      createSeries: async (data: SeriesCreateRequest) => {
        set({ error: null }, false, "series/createStart");

        try {
          const apiSeries = await seriesService.createSeries(data);
          const newSeries = convertApiSeriesToLegacy(apiSeries);

          // Optimistically update the store
          const state = get();
          set(
            {
              data: [newSeries, ...state.data],
              lastFetched: Date.now(),
            },
            false,
            "series/createSuccess"
          );

          return newSeries;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to create series";
          set({ error: errorMessage }, false, "series/createError");
          throw error;
        }
      },

      updateSeries: async (id: string, data: SeriesUpdateRequest) => {
        set({ error: null }, false, "series/updateStart");

        try {
          const apiSeries = await seriesService.updateSeries(id, data);
          const updatedSeries = convertApiSeriesToLegacy(apiSeries);

          // Optimistically update the store
          const state = get();
          const updatedData = state.data.map((series) =>
            series.id === id ? updatedSeries : series
          );

          set(
            {
              data: updatedData,
              lastFetched: Date.now(),
            },
            false,
            "series/updateSuccess"
          );

          return updatedSeries;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to update series";
          set({ error: errorMessage }, false, "series/updateError");
          throw error;
        }
      },

      deleteSeries: async (id: string) => {
        set({ error: null }, false, "series/deleteStart");

        try {
          await seriesService.deleteSeries(id);

          // Optimistically update the store
          const state = get();
          const filteredData = state.data.filter((series) => series.id !== id);

          set(
            {
              data: filteredData,
              lastFetched: Date.now(),
            },
            false,
            "series/deleteSuccess"
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to delete series";
          set({ error: errorMessage }, false, "series/deleteError");
          throw error;
        }
      },

      clearError: () => {
        set({ error: null }, false, "series/clearError");
      },

      reset: () => {
        set(initialState, false, "series/reset");
      },

      invalidateCache: () => {
        set({ lastFetched: null }, false, "series/invalidateCache");
      },
    }),
    {
      name: "series-store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// Cached selectors to prevent infinite loops
const selectData = (state: SeriesStore) => state.data;
const selectLoading = (state: SeriesStore) => state.isLoading;
const selectError = (state: SeriesStore) => state.error;

// Selector hooks for better performance
export const useSeriesData = () => useSeriesStore(selectData);
export const useSeriesLoading = () => useSeriesStore(selectLoading);
export const useSeriesError = () => useSeriesStore(selectError);

// Check if data is stale (older than cache duration)
export const useSeriesIsStale = () => {
  return useSeriesStore((state) => {
    if (!state.lastFetched) return true;
    return Date.now() - state.lastFetched > CACHE_DURATION;
  });
};

// Actions hook with memoization
export const useSeriesActions = () => {
  const fetchSeries = useSeriesStore((state) => state.fetchSeries);
  const createSeries = useSeriesStore((state) => state.createSeries);
  const updateSeries = useSeriesStore((state) => state.updateSeries);
  const deleteSeries = useSeriesStore((state) => state.deleteSeries);
  const clearError = useSeriesStore((state) => state.clearError);
  const reset = useSeriesStore((state) => state.reset);
  const invalidateCache = useSeriesStore((state) => state.invalidateCache);

  return useMemo(
    () => ({
      fetchSeries,
      createSeries,
      updateSeries,
      deleteSeries,
      clearError,
      reset,
      invalidateCache,
    }),
    [
      fetchSeries,
      createSeries,
      updateSeries,
      deleteSeries,
      clearError,
      reset,
      invalidateCache,
    ]
  );
};

// Utility functions for external use
export const invalidateSeriesCache = () => {
  const { invalidateCache } = useSeriesStore.getState();
  invalidateCache();
};

export const refreshSeriesData = async () => {
  const { fetchSeries } = useSeriesStore.getState();
  await fetchSeries();
};
