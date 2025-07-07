import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useMemo } from "react";
import { translationMemoryService } from "../services/translationMemoryService";
import type { TranslationMemory } from "../types";
import type {
  TMEntryCreateRequest,
  TMEntryUpdateRequest,
} from "../services/translationMemoryService";
import { convertApiTMToLegacy } from "../types/translation";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Store TM data grouped by series ID
export interface TMData {
  [seriesId: string]: {
    entries: TranslationMemory[];
    lastFetched: number;
    isLoading: boolean;
    error: string | null;
    totalCount: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export interface TMState {
  data: TMData;
  globalLoading: boolean;
  globalError: string | null;
}

export interface TMActions {
  fetchTMBySeriesId: (
    seriesId: string,
    page?: number,
    itemsPerPage?: number,
    forceRefresh?: boolean
  ) => Promise<void>;
  fetchTMEntriesCount: (seriesId: string) => Promise<void>;
  createTMEntry: (
    seriesId: string,
    data: TMEntryCreateRequest
  ) => Promise<TranslationMemory>;
  updateTMEntry: (
    entryId: string,
    data: TMEntryUpdateRequest
  ) => Promise<TranslationMemory>;
  deleteTMEntry: (seriesId: string, entryId: string) => Promise<void>;
  searchTMEntries: (
    seriesId: string,
    searchText: string
  ) => Promise<TranslationMemory[]>;
  incrementUsage: (seriesId: string, entryId: string) => Promise<void>;
  clearError: (seriesId?: string) => void;
  reset: () => void;
  invalidateCache: (seriesId?: string) => void;
  setTMPage: (seriesId: string, page: number) => void;
  setTMItemsPerPage: (seriesId: string, itemsPerPage: number) => void;
}

export type TMStore = TMState & TMActions;

const initialState: TMState = {
  data: {},
  globalLoading: false,
  globalError: null,
};

export const useTMStore = create<TMStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchTMBySeriesId: async (
        seriesId: string,
        page: number = 1,
        itemsPerPage: number = 10,
        forceRefresh: boolean = false
      ) => {
        const state = get();
        const seriesData = state.data[seriesId];

        // Check if data is still fresh (within cache duration) and not forcing refresh
        if (
          !forceRefresh &&
          seriesData?.entries.length > 0 &&
          seriesData.lastFetched &&
          Date.now() - seriesData.lastFetched < CACHE_DURATION &&
          seriesData.currentPage === page &&
          seriesData.itemsPerPage === itemsPerPage
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
                error: null,
                totalCount: seriesData?.totalCount || 0,
                currentPage: page,
                itemsPerPage: itemsPerPage,
              },
            },
            globalError: null,
          },
          false,
          "tm/fetchStart"
        );

        try {
          const skip = (page - 1) * itemsPerPage;
          const apiEntries = await translationMemoryService.getTMEntries(
            seriesId,
            skip,
            itemsPerPage
          );
          const legacyEntries = apiEntries.map(convertApiTMToLegacy);

          set(
            {
              data: {
                ...get().data,
                [seriesId]: {
                  entries: legacyEntries,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                  totalCount: seriesData?.totalCount || 0,
                  currentPage: page,
                  itemsPerPage: itemsPerPage,
                },
              },
            },
            false,
            "tm/fetchSuccess"
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch TM entries";

          set(
            {
              data: {
                ...get().data,
                [seriesId]: {
                  entries: seriesData?.entries || [],
                  lastFetched: seriesData?.lastFetched || 0,
                  isLoading: false,
                  error: errorMessage,
                  totalCount: seriesData?.totalCount || 0,
                  currentPage: page,
                  itemsPerPage: itemsPerPage,
                },
              },
              globalError: errorMessage,
            },
            false,
            "tm/fetchError"
          );
          throw error;
        }
      },

      createTMEntry: async (seriesId: string, data: TMEntryCreateRequest) => {
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
          "tm/createStart"
        );

        try {
          const apiEntry = await translationMemoryService.createTMEntry(
            seriesId,
            data
          );
          const newEntry = convertApiTMToLegacy(apiEntry);

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
                  error: null,
                  totalCount: (currentSeriesData?.totalCount || 0) + 1,
                  currentPage: currentSeriesData?.currentPage || 1,
                  itemsPerPage: currentSeriesData?.itemsPerPage || 10,
                },
              },
            },
            false,
            "tm/createSuccess"
          );

          return newEntry;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to create TM entry";

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
            "tm/createError"
          );
          throw error;
        }
      },

      updateTMEntry: async (entryId: string, data: TMEntryUpdateRequest) => {
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
          throw new Error("TM entry not found in any series");
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
          "tm/updateStart"
        );

        try {
          const apiEntry = await translationMemoryService.updateTMEntry(
            entryId,
            data
          );
          const updatedEntry = convertApiTMToLegacy(apiEntry);

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
                  error: null,
                },
              },
            },
            false,
            "tm/updateSuccess"
          );

          return updatedEntry;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to update TM entry";

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
            "tm/updateError"
          );
          throw error;
        }
      },

      deleteTMEntry: async (seriesId: string, entryId: string) => {
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
          "tm/deleteStart"
        );

        try {
          await translationMemoryService.deleteTMEntry(entryId);

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
                  error: null,
                  totalCount: Math.max(
                    (currentSeriesData?.totalCount || 0) - 1,
                    0
                  ),
                  currentPage: currentSeriesData?.currentPage || 1,
                  itemsPerPage: currentSeriesData?.itemsPerPage || 10,
                },
              },
            },
            false,
            "tm/deleteSuccess"
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to delete TM entry";

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
            "tm/deleteError"
          );
          throw error;
        }
      },

      searchTMEntries: async (seriesId: string, searchText: string) => {
        try {
          const apiEntries = await translationMemoryService.searchTMEntries(
            seriesId,
            searchText
          );
          return apiEntries.map(convertApiTMToLegacy);
        } catch (error) {
          console.error("Error searching TM entries:", error);
          throw error;
        }
      },

      incrementUsage: async (seriesId: string, entryId: string) => {
        try {
          const apiEntry = await translationMemoryService.incrementUsageCount(
            entryId
          );
          const updatedEntry = convertApiTMToLegacy(apiEntry);

          // Update the entry in the store
          const state = get();
          const seriesData = state.data[seriesId];
          if (seriesData) {
            const updatedEntries = seriesData.entries.map((entry) =>
              entry.id === entryId ? updatedEntry : entry
            );

            set(
              {
                data: {
                  ...state.data,
                  [seriesId]: {
                    ...seriesData,
                    entries: updatedEntries,
                    lastFetched: Date.now(),
                  },
                },
              },
              false,
              "tm/incrementUsage"
            );
          }
        } catch (error) {
          console.error("Error incrementing TM usage:", error);
          throw error;
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
              "tm/clearSeriesError"
            );
          }
        } else {
          // Clear global error
          set({ globalError: null }, false, "tm/clearGlobalError");
        }
      },

      reset: () => {
        set(initialState, false, "tm/reset");
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
              "tm/invalidateSeriesCache"
            );
          }
        } else {
          // Invalidate all caches
          const updatedData: TMData = {};
          for (const [id, data] of Object.entries(state.data)) {
            updatedData[id] = {
              ...data,
              lastFetched: 0,
            };
          }
          set({ data: updatedData }, false, "tm/invalidateAllCache");
        }
      },

      fetchTMEntriesCount: async (seriesId: string) => {
        try {
          const count = await translationMemoryService.getTMEntriesCount(
            seriesId
          );
          const state = get();
          const seriesData = state.data[seriesId];

          set(
            {
              data: {
                ...state.data,
                [seriesId]: {
                  entries: seriesData?.entries || [],
                  lastFetched: seriesData?.lastFetched || 0,
                  isLoading: seriesData?.isLoading || false,
                  error: seriesData?.error || null,
                  totalCount: count,
                  currentPage: seriesData?.currentPage || 1,
                  itemsPerPage: seriesData?.itemsPerPage || 10,
                },
              },
            },
            false,
            "tm/fetchCountSuccess"
          );
        } catch (error) {
          console.error("Error fetching TM entries count:", error);
        }
      },

      setTMPage: (seriesId: string, page: number) => {
        const state = get();
        const seriesData = state.data[seriesId];

        if (seriesData) {
          set(
            {
              data: {
                ...state.data,
                [seriesId]: {
                  ...seriesData,
                  currentPage: page,
                },
              },
            },
            false,
            "tm/setPage"
          );
        }
      },

      setTMItemsPerPage: (seriesId: string, itemsPerPage: number) => {
        const state = get();
        const seriesData = state.data[seriesId];

        if (seriesData) {
          set(
            {
              data: {
                ...state.data,
                [seriesId]: {
                  ...seriesData,
                  itemsPerPage: itemsPerPage,
                  currentPage: 1, // Reset to first page when changing items per page
                },
              },
            },
            false,
            "tm/setItemsPerPage"
          );
        }
      },
    }),
    {
      name: "tm-store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// Cached selectors to prevent infinite loops
const emptyTMEntries: TranslationMemory[] = [];
const selectTMBySeriesId = (seriesId: string) => (state: TMStore) =>
  state.data[seriesId]?.entries || emptyTMEntries;

const selectTMLoadingBySeriesId = (seriesId: string) => (state: TMStore) =>
  state.data[seriesId]?.isLoading || false;

const selectTMErrorBySeriesId = (seriesId: string) => (state: TMStore) =>
  state.data[seriesId]?.error || null;

const selectTMGlobalLoading = (state: TMStore) => state.globalLoading;
const selectTMGlobalError = (state: TMStore) => state.globalError;

const selectTMTotalCountBySeriesId = (seriesId: string) => (state: TMStore) =>
  state.data[seriesId]?.totalCount || 0;

const selectTMCurrentPageBySeriesId = (seriesId: string) => (state: TMStore) =>
  state.data[seriesId]?.currentPage || 1;

const selectTMItemsPerPageBySeriesId = (seriesId: string) => (state: TMStore) =>
  state.data[seriesId]?.itemsPerPage || 10;

// Selector hooks for better performance
export const useTMBySeriesId = (seriesId: string) =>
  useTMStore(selectTMBySeriesId(seriesId));

export const useTMLoadingBySeriesId = (seriesId: string) =>
  useTMStore(selectTMLoadingBySeriesId(seriesId));

export const useTMErrorBySeriesId = (seriesId: string) =>
  useTMStore(selectTMErrorBySeriesId(seriesId));

export const useTMGlobalLoading = () => useTMStore(selectTMGlobalLoading);
export const useTMGlobalError = () => useTMStore(selectTMGlobalError);

export const useTMTotalCountBySeriesId = (seriesId: string) =>
  useTMStore(selectTMTotalCountBySeriesId(seriesId));

export const useTMCurrentPageBySeriesId = (seriesId: string) =>
  useTMStore(selectTMCurrentPageBySeriesId(seriesId));

export const useTMItemsPerPageBySeriesId = (seriesId: string) =>
  useTMStore(selectTMItemsPerPageBySeriesId(seriesId));

// Check if data is stale (older than cache duration)
export const useTMIsStale = (seriesId: string) => {
  return useTMStore((state) => {
    const seriesData = state.data[seriesId];
    if (!seriesData?.lastFetched) return true;
    return Date.now() - seriesData.lastFetched > CACHE_DURATION;
  });
};

// Check if we have cached data (regardless of staleness)
export const useHasCachedTM = (seriesId: string) => {
  return useTMStore((state) => {
    const seriesData = state.data[seriesId];
    return seriesData?.entries.length > 0;
  });
};

// Actions hook with memoization
export const useTMActions = () => {
  const fetchTMBySeriesId = useTMStore((state) => state.fetchTMBySeriesId);
  const fetchTMEntriesCount = useTMStore((state) => state.fetchTMEntriesCount);
  const createTMEntry = useTMStore((state) => state.createTMEntry);
  const updateTMEntry = useTMStore((state) => state.updateTMEntry);
  const deleteTMEntry = useTMStore((state) => state.deleteTMEntry);
  const searchTMEntries = useTMStore((state) => state.searchTMEntries);
  const incrementUsage = useTMStore((state) => state.incrementUsage);
  const clearError = useTMStore((state) => state.clearError);
  const reset = useTMStore((state) => state.reset);
  const invalidateCache = useTMStore((state) => state.invalidateCache);
  const setTMPage = useTMStore((state) => state.setTMPage);
  const setTMItemsPerPage = useTMStore((state) => state.setTMItemsPerPage);

  return useMemo(
    () => ({
      fetchTMBySeriesId,
      fetchTMEntriesCount,
      createTMEntry,
      updateTMEntry,
      deleteTMEntry,
      searchTMEntries,
      incrementUsage,
      clearError,
      reset,
      invalidateCache,
      setTMPage,
      setTMItemsPerPage,
    }),
    [
      fetchTMBySeriesId,
      fetchTMEntriesCount,
      createTMEntry,
      updateTMEntry,
      deleteTMEntry,
      searchTMEntries,
      incrementUsage,
      clearError,
      reset,
      invalidateCache,
      setTMPage,
      setTMItemsPerPage,
    ]
  );
};

// Utility functions for external use
export const invalidateTMCache = (seriesId?: string) => {
  const { invalidateCache } = useTMStore.getState();
  invalidateCache(seriesId);
};

export const refreshTMData = async (seriesId: string) => {
  const { fetchTMBySeriesId } = useTMStore.getState();
  await fetchTMBySeriesId(seriesId);
};

// Get TM entry by ID across all series
export const getTMEntryById = (entryId: string): TranslationMemory | null => {
  const state = useTMStore.getState();

  for (const seriesData of Object.values(state.data)) {
    const entry = seriesData.entries.find((tm) => tm.id === entryId);
    if (entry) return entry;
  }

  return null;
};
