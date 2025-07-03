import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useMemo } from "react";
import { aiGlossaryService } from "../services/aiGlossaryService";
import { peopleAnalysisService } from "../services/peopleAnalysisService";
import type { GlossaryCharacter } from "../types";
import type {
  AIGlossaryCreate,
  AIGlossaryUpdate,
} from "../services/aiGlossaryService";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Store AI Glossary data grouped by series ID
export interface AIGlossaryData {
  [seriesId: string]: {
    entries: GlossaryCharacter[];
    lastFetched: number;
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
  };
}

export interface AIGlossaryState {
  data: AIGlossaryData;
  globalLoading: boolean;
  globalError: string | null;
}

export interface AIGlossaryActions {
  fetchGlossaryBySeriesId: (seriesId: string) => Promise<void>;
  createGlossaryEntry: (data: AIGlossaryCreate) => Promise<GlossaryCharacter>;
  updateGlossaryEntry: (
    entryId: string,
    data: AIGlossaryUpdate
  ) => Promise<GlossaryCharacter>;
  deleteGlossaryEntry: (seriesId: string, entryId: string) => Promise<void>;
  refreshGlossary: (seriesId: string, forceRefresh?: boolean) => Promise<void>;
  clearError: (seriesId?: string) => void;
  reset: () => void;
  invalidateCache: (seriesId?: string) => void;
}

export type AIGlossaryStore = AIGlossaryState & AIGlossaryActions;

const initialState: AIGlossaryState = {
  data: {},
  globalLoading: false,
  globalError: null,
};

export const useAIGlossaryStore = create<AIGlossaryStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchGlossaryBySeriesId: async (seriesId: string) => {
        const state = get();
        const seriesData = state.data[seriesId];

        // Check if data is still fresh (within cache duration)
        if (
          seriesData?.entries.length > 0 &&
          seriesData.lastFetched &&
          Date.now() - seriesData.lastFetched < CACHE_DURATION
        ) {
          return; // Use cached data
        }

        // Set loading state for this series
        set(
          {
            data: {
              ...state.data,
              [seriesId]: {
                entries: seriesData?.entries || [],
                lastFetched: seriesData?.lastFetched || 0,
                isLoading: true,
                isRefreshing: false,
                error: null,
              },
            },
            globalError: null,
          },
          false,
          "aiGlossary/fetchStart"
        );

        try {
          const apiEntries = await aiGlossaryService.getGlossaryBySeriesId(
            seriesId
          );
          const glossaryCharacters =
            aiGlossaryService.convertToGlossaryCharacters(apiEntries);

          set(
            {
              data: {
                ...get().data,
                [seriesId]: {
                  entries: glossaryCharacters,
                  lastFetched: Date.now(),
                  isLoading: false,
                  isRefreshing: false,
                  error: null,
                },
              },
            },
            false,
            "aiGlossary/fetchSuccess"
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch AI glossary";

          set(
            {
              data: {
                ...get().data,
                [seriesId]: {
                  entries: seriesData?.entries || [],
                  lastFetched: seriesData?.lastFetched || 0,
                  isLoading: false,
                  isRefreshing: false,
                  error: errorMessage,
                },
              },
              globalError: errorMessage,
            },
            false,
            "aiGlossary/fetchError"
          );
          throw error;
        }
      },

      createGlossaryEntry: async (data: AIGlossaryCreate) => {
        const seriesId = data.series_id;
        const state = get();
        const seriesData = state.data[seriesId];

        set(
          {
            data: {
              ...state.data,
              [seriesId]: {
                ...seriesData,
                error: null,
              },
            },
            globalError: null,
          },
          false,
          "aiGlossary/createStart"
        );

        try {
          const apiEntry = await aiGlossaryService.createGlossaryEntry(data);
          const newEntry =
            aiGlossaryService.convertToGlossaryCharacter(apiEntry);

          // Optimistically update the store
          const currentState = get();
          const currentSeriesData = currentState.data[seriesId];
          const updatedEntries = [
            newEntry,
            ...(currentSeriesData?.entries || []),
          ];

          set(
            {
              data: {
                ...currentState.data,
                [seriesId]: {
                  entries: updatedEntries,
                  lastFetched: Date.now(),
                  isLoading: false,
                  isRefreshing: false,
                  error: null,
                },
              },
            },
            false,
            "aiGlossary/createSuccess"
          );

          return newEntry;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to create glossary entry";

          set(
            {
              data: {
                ...get().data,
                [seriesId]: {
                  ...seriesData,
                  error: errorMessage,
                },
              },
              globalError: errorMessage,
            },
            false,
            "aiGlossary/createError"
          );
          throw error;
        }
      },

      updateGlossaryEntry: async (entryId: string, data: AIGlossaryUpdate) => {
        // First, find which series this entry belongs to
        const state = get();
        let targetSeriesId: string | null = null;

        for (const [seriesId, seriesData] of Object.entries(state.data)) {
          if (seriesData.entries.some((entry) => entry.id === entryId)) {
            targetSeriesId = seriesId;
            break;
          }
        }

        if (!targetSeriesId) {
          throw new Error("Glossary entry not found in any series");
        }

        const seriesData = state.data[targetSeriesId];

        set(
          {
            data: {
              ...state.data,
              [targetSeriesId]: {
                ...seriesData,
                error: null,
              },
            },
            globalError: null,
          },
          false,
          "aiGlossary/updateStart"
        );

        try {
          const apiEntry = await aiGlossaryService.updateGlossaryEntry(
            entryId,
            data
          );
          const updatedEntry =
            aiGlossaryService.convertToGlossaryCharacter(apiEntry);

          // Optimistically update the store
          const currentState = get();
          const currentSeriesData = currentState.data[targetSeriesId];
          const updatedEntries = currentSeriesData.entries.map((entry) =>
            entry.id === entryId ? updatedEntry : entry
          );

          set(
            {
              data: {
                ...currentState.data,
                [targetSeriesId]: {
                  entries: updatedEntries,
                  lastFetched: Date.now(),
                  isLoading: false,
                  isRefreshing: false,
                  error: null,
                },
              },
            },
            false,
            "aiGlossary/updateSuccess"
          );

          return updatedEntry;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to update glossary entry";

          set(
            {
              data: {
                ...get().data,
                [targetSeriesId]: {
                  ...seriesData,
                  error: errorMessage,
                },
              },
              globalError: errorMessage,
            },
            false,
            "aiGlossary/updateError"
          );
          throw error;
        }
      },

      deleteGlossaryEntry: async (seriesId: string, entryId: string) => {
        const state = get();
        const seriesData = state.data[seriesId];

        set(
          {
            data: {
              ...state.data,
              [seriesId]: {
                ...seriesData,
                error: null,
              },
            },
            globalError: null,
          },
          false,
          "aiGlossary/deleteStart"
        );

        try {
          await aiGlossaryService.deleteGlossaryEntry(entryId);

          // Optimistically update the store
          const currentState = get();
          const currentSeriesData = currentState.data[seriesId];
          const filteredEntries = currentSeriesData.entries.filter(
            (entry) => entry.id !== entryId
          );

          set(
            {
              data: {
                ...currentState.data,
                [seriesId]: {
                  entries: filteredEntries,
                  lastFetched: Date.now(),
                  isLoading: false,
                  isRefreshing: false,
                  error: null,
                },
              },
            },
            false,
            "aiGlossary/deleteSuccess"
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to delete glossary entry";

          set(
            {
              data: {
                ...get().data,
                [seriesId]: {
                  ...seriesData,
                  error: errorMessage,
                },
              },
              globalError: errorMessage,
            },
            false,
            "aiGlossary/deleteError"
          );
          throw error;
        }
      },

      refreshGlossary: async (seriesId: string, forceRefresh = false) => {
        const state = get();
        const seriesData = state.data[seriesId];

        // Set refreshing state
        set(
          {
            data: {
              ...state.data,
              [seriesId]: {
                ...seriesData,
                isRefreshing: true,
                error: null,
              },
            },
            globalError: null,
          },
          false,
          "aiGlossary/refreshStart"
        );

        try {
          // Analyze terminology in the series (this will save to database automatically)
          const result = await peopleAnalysisService.analyzeTerminologyInSeries(
            seriesId,
            forceRefresh
          );

          if (result.success) {
            // Fetch the updated data from database
            const apiEntries = await aiGlossaryService.getGlossaryBySeriesId(
              seriesId
            );
            const glossaryCharacters =
              aiGlossaryService.convertToGlossaryCharacters(apiEntries);

            set(
              {
                data: {
                  ...get().data,
                  [seriesId]: {
                    entries: glossaryCharacters,
                    lastFetched: Date.now(),
                    isLoading: false,
                    isRefreshing: false,
                    error: null,
                  },
                },
              },
              false,
              "aiGlossary/refreshSuccess"
            );
          } else {
            throw new Error("Terminology analysis failed");
          }
        } catch (error) {
          console.error("❌ Error refreshing glossary:", error);

          // Try to fetch existing data from database as fallback
          try {
            const apiEntries = await aiGlossaryService.getGlossaryBySeriesId(
              seriesId
            );
            const glossaryCharacters =
              aiGlossaryService.convertToGlossaryCharacters(apiEntries);

            set(
              {
                data: {
                  ...get().data,
                  [seriesId]: {
                    entries: glossaryCharacters,
                    lastFetched: Date.now(),
                    isLoading: false,
                    isRefreshing: false,
                    error: null,
                  },
                },
              },
              false,
              "aiGlossary/refreshFallback"
            );
          } catch (dbError) {
            console.error("❌ Error loading fallback data:", dbError);
            // Create minimal fallback data
            const fallbackPeople =
              peopleAnalysisService.createFallbackPeople(seriesId);
            const enhancedFallback =
              peopleAnalysisService.enhancePeopleWithAvatars(fallbackPeople);
            const fallbackGlossary =
              peopleAnalysisService.convertToGlossaryCharacters(
                enhancedFallback
              );

            set(
              {
                data: {
                  ...get().data,
                  [seriesId]: {
                    entries: fallbackGlossary,
                    lastFetched: Date.now(),
                    isLoading: false,
                    isRefreshing: false,
                    error: "Using fallback data",
                  },
                },
              },
              false,
              "aiGlossary/refreshFallbackData"
            );
          }
        }
      },

      clearError: (seriesId?: string) => {
        const state = get();

        if (seriesId) {
          // Clear error for specific series
          const seriesData = state.data[seriesId];
          if (seriesData) {
            set(
              {
                data: {
                  ...state.data,
                  [seriesId]: {
                    ...seriesData,
                    error: null,
                  },
                },
              },
              false,
              "aiGlossary/clearSeriesError"
            );
          }
        } else {
          // Clear global error
          set({ globalError: null }, false, "aiGlossary/clearGlobalError");
        }
      },

      reset: () => {
        set(initialState, false, "aiGlossary/reset");
      },

      invalidateCache: (seriesId?: string) => {
        const state = get();

        if (seriesId) {
          // Invalidate cache for specific series
          const seriesData = state.data[seriesId];
          if (seriesData) {
            set(
              {
                data: {
                  ...state.data,
                  [seriesId]: {
                    ...seriesData,
                    lastFetched: 0,
                  },
                },
              },
              false,
              "aiGlossary/invalidateSeriesCache"
            );
          }
        } else {
          // Invalidate all caches
          const updatedData: AIGlossaryData = {};
          for (const [id, data] of Object.entries(state.data)) {
            updatedData[id] = {
              ...data,
              lastFetched: 0,
            };
          }
          set({ data: updatedData }, false, "aiGlossary/invalidateAllCache");
        }
      },
    }),
    {
      name: "ai-glossary-store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// Cached selectors to prevent infinite loops
const selectGlossaryBySeriesId =
  (seriesId: string) => (state: AIGlossaryStore) =>
    state.data[seriesId]?.entries || [];

const selectGlossaryLoadingBySeriesId =
  (seriesId: string) => (state: AIGlossaryStore) =>
    state.data[seriesId]?.isLoading || false;

const selectGlossaryRefreshingBySeriesId =
  (seriesId: string) => (state: AIGlossaryStore) =>
    state.data[seriesId]?.isRefreshing || false;

const selectGlossaryErrorBySeriesId =
  (seriesId: string) => (state: AIGlossaryStore) =>
    state.data[seriesId]?.error || null;

const selectGlossaryGlobalLoading = (state: AIGlossaryStore) =>
  state.globalLoading;
const selectGlossaryGlobalError = (state: AIGlossaryStore) => state.globalError;

// Selector hooks for better performance
export const useGlossaryBySeriesId = (seriesId: string) =>
  useAIGlossaryStore(selectGlossaryBySeriesId(seriesId));

export const useGlossaryLoadingBySeriesId = (seriesId: string) =>
  useAIGlossaryStore(selectGlossaryLoadingBySeriesId(seriesId));

export const useGlossaryRefreshingBySeriesId = (seriesId: string) =>
  useAIGlossaryStore(selectGlossaryRefreshingBySeriesId(seriesId));

export const useGlossaryErrorBySeriesId = (seriesId: string) =>
  useAIGlossaryStore(selectGlossaryErrorBySeriesId(seriesId));

export const useGlossaryGlobalLoading = () =>
  useAIGlossaryStore(selectGlossaryGlobalLoading);
export const useGlossaryGlobalError = () =>
  useAIGlossaryStore(selectGlossaryGlobalError);

// Check if data is stale (older than cache duration)
export const useGlossaryIsStale = (seriesId: string) => {
  return useAIGlossaryStore((state) => {
    const seriesData = state.data[seriesId];
    if (!seriesData?.lastFetched) return true;
    return Date.now() - seriesData.lastFetched > CACHE_DURATION;
  });
};

// Check if we have cached data (regardless of staleness)
export const useHasCachedGlossary = (seriesId: string) => {
  return useAIGlossaryStore((state) => {
    const seriesData = state.data[seriesId];
    return seriesData?.entries.length > 0;
  });
};

// Actions hook with memoization
export const useAIGlossaryActions = () => {
  const fetchGlossaryBySeriesId = useAIGlossaryStore(
    (state) => state.fetchGlossaryBySeriesId
  );
  const createGlossaryEntry = useAIGlossaryStore(
    (state) => state.createGlossaryEntry
  );
  const updateGlossaryEntry = useAIGlossaryStore(
    (state) => state.updateGlossaryEntry
  );
  const deleteGlossaryEntry = useAIGlossaryStore(
    (state) => state.deleteGlossaryEntry
  );
  const refreshGlossary = useAIGlossaryStore((state) => state.refreshGlossary);
  const clearError = useAIGlossaryStore((state) => state.clearError);
  const reset = useAIGlossaryStore((state) => state.reset);
  const invalidateCache = useAIGlossaryStore((state) => state.invalidateCache);

  return useMemo(
    () => ({
      fetchGlossaryBySeriesId,
      createGlossaryEntry,
      updateGlossaryEntry,
      deleteGlossaryEntry,
      refreshGlossary,
      clearError,
      reset,
      invalidateCache,
    }),
    [
      fetchGlossaryBySeriesId,
      createGlossaryEntry,
      updateGlossaryEntry,
      deleteGlossaryEntry,
      refreshGlossary,
      clearError,
      reset,
      invalidateCache,
    ]
  );
};

// Utility functions for external use
export const invalidateGlossaryCache = (seriesId?: string) => {
  const { invalidateCache } = useAIGlossaryStore.getState();
  invalidateCache(seriesId);
};

export const refreshGlossaryData = async (
  seriesId: string,
  forceRefresh = false
) => {
  const { refreshGlossary } = useAIGlossaryStore.getState();
  await refreshGlossary(seriesId, forceRefresh);
};

// Get glossary entry by ID across all series
export const getGlossaryEntryById = (
  entryId: string
): GlossaryCharacter | null => {
  const state = useAIGlossaryStore.getState();

  for (const seriesData of Object.values(state.data)) {
    const entry = seriesData.entries.find(
      (glossary) => glossary.id === entryId
    );
    if (entry) return entry;
  }

  return null;
};
