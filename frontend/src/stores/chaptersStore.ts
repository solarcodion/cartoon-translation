import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useMemo } from "react";
import { chapterService } from "../services/chapterService";
import type { Chapter } from "../types";
import type {
  ChapterCreateRequest,
  ChapterUpdateRequest,
} from "../services/chapterService";
import { convertApiChapterToLegacy } from "../types/series";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Store chapters data grouped by series ID
export interface ChaptersData {
  [seriesId: string]: {
    chapters: Chapter[];
    lastFetched: number;
    isLoading: boolean;
    error: string | null;
  };
}

export interface ChaptersState {
  data: ChaptersData;
  globalLoading: boolean;
  globalError: string | null;
}

export interface ChaptersActions {
  fetchChaptersBySeriesId: (seriesId: string) => Promise<void>;
  createChapter: (
    seriesId: string,
    data: ChapterCreateRequest
  ) => Promise<Chapter>;
  updateChapter: (
    chapterId: string,
    data: ChapterUpdateRequest
  ) => Promise<Chapter>;
  deleteChapter: (seriesId: string, chapterId: string) => Promise<void>;
  clearError: (seriesId?: string) => void;
  reset: () => void;
  invalidateCache: (seriesId?: string) => void;
}

export type ChaptersStore = ChaptersState & ChaptersActions;

const initialState: ChaptersState = {
  data: {},
  globalLoading: false,
  globalError: null,
};

export const useChaptersStore = create<ChaptersStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchChaptersBySeriesId: async (seriesId: string) => {
        const state = get();
        const seriesData = state.data[seriesId];

        // Check if data is still fresh (within cache duration)
        if (
          seriesData?.chapters.length > 0 &&
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
                chapters: seriesData?.chapters || [],
                lastFetched: seriesData?.lastFetched || 0,
                isLoading: true,
                error: null,
              },
            },
            globalError: null,
          },
          false,
          "chapters/fetchStart"
        );

        try {
          const apiChapters = await chapterService.getChaptersBySeriesId(
            seriesId
          );
          const legacyChapters = apiChapters.map(convertApiChapterToLegacy);

          // Sort chapters by chapter number in ascending order
          const sortedChapters = legacyChapters.sort(
            (a, b) => a.number - b.number
          );

          set(
            {
              data: {
                ...get().data,
                [seriesId]: {
                  chapters: sortedChapters,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                },
              },
            },
            false,
            "chapters/fetchSuccess"
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch chapters";

          set(
            {
              data: {
                ...get().data,
                [seriesId]: {
                  chapters: seriesData?.chapters || [],
                  lastFetched: seriesData?.lastFetched || 0,
                  isLoading: false,
                  error: errorMessage,
                },
              },
              globalError: errorMessage,
            },
            false,
            "chapters/fetchError"
          );
          throw error;
        }
      },

      createChapter: async (seriesId: string, data: ChapterCreateRequest) => {
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
          "chapters/createStart"
        );

        try {
          const apiChapter = await chapterService.createChapter(seriesId, data);
          const newChapter = convertApiChapterToLegacy(apiChapter);

          // Optimistically update the store
          const currentState = get();
          const currentSeriesData = currentState.data[seriesId];
          const updatedChapters = [
            newChapter,
            ...(currentSeriesData?.chapters || []),
          ];
          const sortedChapters = updatedChapters.sort(
            (a, b) => a.number - b.number
          );

          set(
            {
              data: {
                ...currentState.data,
                [seriesId]: {
                  chapters: sortedChapters,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                },
              },
            },
            false,
            "chapters/createSuccess"
          );

          return newChapter;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to create chapter";

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
            "chapters/createError"
          );
          throw error;
        }
      },

      updateChapter: async (chapterId: string, data: ChapterUpdateRequest) => {
        // First, find which series this chapter belongs to
        const state = get();
        let targetSeriesId: string | null = null;

        for (const [seriesId, seriesData] of Object.entries(state.data)) {
          if (seriesData.chapters.some((chapter) => chapter.id === chapterId)) {
            targetSeriesId = seriesId;
            break;
          }
        }

        if (!targetSeriesId) {
          throw new Error("Chapter not found in any series");
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
          "chapters/updateStart"
        );

        try {
          const apiChapter = await chapterService.updateChapter(
            chapterId,
            data
          );
          const updatedChapter = convertApiChapterToLegacy(apiChapter);

          // Optimistically update the store
          const currentState = get();
          const currentSeriesData = currentState.data[targetSeriesId];
          const updatedChapters = currentSeriesData.chapters.map((chapter) =>
            chapter.id === chapterId ? updatedChapter : chapter
          );
          const sortedChapters = updatedChapters.sort(
            (a, b) => a.number - b.number
          );

          set(
            {
              data: {
                ...currentState.data,
                [targetSeriesId]: {
                  chapters: sortedChapters,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                },
              },
            },
            false,
            "chapters/updateSuccess"
          );

          return updatedChapter;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to update chapter";

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
            "chapters/updateError"
          );
          throw error;
        }
      },

      deleteChapter: async (seriesId: string, chapterId: string) => {
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
          "chapters/deleteStart"
        );

        try {
          await chapterService.deleteChapter(chapterId);

          // Optimistically update the store
          const currentState = get();
          const currentSeriesData = currentState.data[seriesId];
          const filteredChapters = currentSeriesData.chapters.filter(
            (chapter) => chapter.id !== chapterId
          );

          set(
            {
              data: {
                ...currentState.data,
                [seriesId]: {
                  chapters: filteredChapters,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                },
              },
            },
            false,
            "chapters/deleteSuccess"
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to delete chapter";

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
            "chapters/deleteError"
          );
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
              "chapters/clearSeriesError"
            );
          }
        } else {
          // Clear global error
          set({ globalError: null }, false, "chapters/clearGlobalError");
        }
      },

      reset: () => {
        set(initialState, false, "chapters/reset");
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
              "chapters/invalidateSeriesCache"
            );
          }
        } else {
          // Invalidate all caches
          const updatedData: ChaptersData = {};
          for (const [id, data] of Object.entries(state.data)) {
            updatedData[id] = {
              ...data,
              lastFetched: 0,
            };
          }
          set({ data: updatedData }, false, "chapters/invalidateAllCache");
        }
      },
    }),
    {
      name: "chapters-store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// Cached selectors to prevent infinite loops
const selectChaptersBySeriesId = (seriesId: string) => (state: ChaptersStore) =>
  state.data[seriesId]?.chapters || [];

const selectLoadingBySeriesId = (seriesId: string) => (state: ChaptersStore) =>
  state.data[seriesId]?.isLoading || false;

const selectErrorBySeriesId = (seriesId: string) => (state: ChaptersStore) =>
  state.data[seriesId]?.error || null;

const selectGlobalLoading = (state: ChaptersStore) => state.globalLoading;
const selectGlobalError = (state: ChaptersStore) => state.globalError;

// Selector hooks for better performance
export const useChaptersBySeriesId = (seriesId: string) =>
  useChaptersStore(selectChaptersBySeriesId(seriesId));

export const useChaptersLoadingBySeriesId = (seriesId: string) =>
  useChaptersStore(selectLoadingBySeriesId(seriesId));

export const useChaptersErrorBySeriesId = (seriesId: string) =>
  useChaptersStore(selectErrorBySeriesId(seriesId));

export const useChaptersGlobalLoading = () =>
  useChaptersStore(selectGlobalLoading);
export const useChaptersGlobalError = () => useChaptersStore(selectGlobalError);

// Check if data is stale (older than cache duration)
export const useChaptersIsStale = (seriesId: string) => {
  return useChaptersStore((state) => {
    const seriesData = state.data[seriesId];
    if (!seriesData?.lastFetched) return true;
    return Date.now() - seriesData.lastFetched > CACHE_DURATION;
  });
};

// Check if we have cached data (regardless of staleness)
export const useHasCachedChapters = (seriesId: string) => {
  return useChaptersStore((state) => {
    const seriesData = state.data[seriesId];
    return seriesData?.chapters.length > 0;
  });
};

// Actions hook with memoization
export const useChaptersActions = () => {
  const fetchChaptersBySeriesId = useChaptersStore(
    (state) => state.fetchChaptersBySeriesId
  );
  const createChapter = useChaptersStore((state) => state.createChapter);
  const updateChapter = useChaptersStore((state) => state.updateChapter);
  const deleteChapter = useChaptersStore((state) => state.deleteChapter);
  const clearError = useChaptersStore((state) => state.clearError);
  const reset = useChaptersStore((state) => state.reset);
  const invalidateCache = useChaptersStore((state) => state.invalidateCache);

  return useMemo(
    () => ({
      fetchChaptersBySeriesId,
      createChapter,
      updateChapter,
      deleteChapter,
      clearError,
      reset,
      invalidateCache,
    }),
    [
      fetchChaptersBySeriesId,
      createChapter,
      updateChapter,
      deleteChapter,
      clearError,
      reset,
      invalidateCache,
    ]
  );
};

// Utility functions for external use
export const invalidateChaptersCache = (seriesId?: string) => {
  const { invalidateCache } = useChaptersStore.getState();
  invalidateCache(seriesId);
};

export const refreshChaptersData = async (seriesId: string) => {
  const { fetchChaptersBySeriesId } = useChaptersStore.getState();
  await fetchChaptersBySeriesId(seriesId);
};

// Get chapter by ID across all series
export const getChapterById = (chapterId: string): Chapter | null => {
  const state = useChaptersStore.getState();

  for (const seriesData of Object.values(state.data)) {
    const chapter = seriesData.chapters.find((ch) => ch.id === chapterId);
    if (chapter) return chapter;
  }

  return null;
};
