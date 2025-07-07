import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useMemo } from "react";
import { textBoxService } from "../services/textBoxService";
import type {
  TextBoxApiItem,
  CreateTextBoxData,
  UpdateTextBoxData,
} from "../services/textBoxService";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Store text boxes data grouped by chapter ID
export interface TextBoxesData {
  [chapterId: string]: {
    textBoxes: TextBoxApiItem[];
    lastFetched: number;
    isLoading: boolean;
    error: string | null;
    // Pagination state
    currentPage: number;
    itemsPerPage: number;
    totalCount: number;
    hasNextPage: boolean;
  };
}

export interface TextBoxesState {
  data: TextBoxesData;
  globalLoading: boolean;
  globalError: string | null;
}

export interface TextBoxesActions {
  fetchTextBoxesByChapterId: (
    chapterId: string,
    page?: number,
    forceRefetch?: boolean
  ) => Promise<void>;
  fetchTextBoxesByPageId: (pageId: string) => Promise<TextBoxApiItem[]>;
  createTextBox: (
    chapterId: string,
    data: CreateTextBoxData
  ) => Promise<TextBoxApiItem>;
  updateTextBox: (
    textBoxId: string,
    data: UpdateTextBoxData
  ) => Promise<TextBoxApiItem>;
  deleteTextBox: (chapterId: string, textBoxId: string) => Promise<void>;
  addTextBoxesToChapter: (
    chapterId: string,
    textBoxes: TextBoxApiItem[]
  ) => void;
  clearChapterTextBoxes: (chapterId: string) => void;
  clearError: (chapterId?: string) => void;
  reset: () => void;
  invalidateCache: (chapterId?: string) => void;
  // Pagination actions
  setPage: (chapterId: string, page: number) => void;
  setItemsPerPage: (chapterId: string, itemsPerPage: number) => void;
  setItemsPerPageAndFetch: (
    chapterId: string,
    itemsPerPage: number
  ) => Promise<void>;
}

export type TextBoxesStore = TextBoxesState & TextBoxesActions;

const initialState: TextBoxesState = {
  data: {},
  globalLoading: false,
  globalError: null,
};

// Default pagination values
const defaultPagination = {
  currentPage: 1,
  itemsPerPage: 10,
  totalCount: 0,
  hasNextPage: false,
};

export const useTextBoxesStore = create<TextBoxesStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchTextBoxesByChapterId: async (
        chapterId: string,
        page?: number,
        forceRefetch = false
      ) => {
        const state = get();
        const chapterData = state.data[chapterId];
        const currentPage = page || chapterData?.currentPage || 1;
        const itemsPerPage = chapterData?.itemsPerPage || 10;

        // Check if data is still fresh (within cache duration) and not forcing refetch
        if (
          !forceRefetch &&
          chapterData?.textBoxes.length > 0 &&
          chapterData.lastFetched &&
          Date.now() - chapterData.lastFetched < CACHE_DURATION &&
          chapterData.currentPage === currentPage
        ) {
          return; // Use cached data
        }

        // Set loading state for this chapter
        set(
          {
            data: {
              ...state.data,
              [chapterId]: {
                textBoxes: chapterData?.textBoxes || [],
                lastFetched: chapterData?.lastFetched || 0,
                isLoading: true,
                error: null,
                currentPage,
                itemsPerPage,
                totalCount: chapterData?.totalCount || 0,
                hasNextPage: chapterData?.hasNextPage || false,
              },
            },
            globalError: null,
          },
          false,
          "textBoxes/fetchStart"
        );

        try {
          const skip = (currentPage - 1) * itemsPerPage;
          const result = await textBoxService.getTextBoxesByChapterPaginated(
            chapterId,
            skip,
            itemsPerPage
          );

          set(
            {
              data: {
                ...get().data,
                [chapterId]: {
                  textBoxes: result.textBoxes,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                  currentPage,
                  itemsPerPage,
                  totalCount: result.totalCount,
                  hasNextPage: result.hasNextPage,
                },
              },
            },
            false,
            "textBoxes/fetchSuccess"
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch text boxes";

          set(
            {
              data: {
                ...get().data,
                [chapterId]: {
                  textBoxes: chapterData?.textBoxes || [],
                  lastFetched: chapterData?.lastFetched || 0,
                  isLoading: false,
                  error: errorMessage,
                  currentPage,
                  itemsPerPage,
                  totalCount: chapterData?.totalCount || 0,
                  hasNextPage: false,
                },
              },
              globalError: errorMessage,
            },
            false,
            "textBoxes/fetchError"
          );
          throw error;
        }
      },

      fetchTextBoxesByPageId: async (pageId: string) => {
        try {
          return await textBoxService.getTextBoxesByPage(pageId);
        } catch (error) {
          console.error("Error fetching text boxes by page:", error);
          throw error;
        }
      },

      createTextBox: async (chapterId: string, data: CreateTextBoxData) => {
        const state = get();
        const chapterData = state.data[chapterId];

        set(
          {
            data: {
              ...state.data,
              [chapterId]: {
                ...chapterData,
                error: null,
              },
            },
            globalError: null,
          },
          false,
          "textBoxes/createStart"
        );

        try {
          const newTextBox = await textBoxService.createTextBox(data);

          // Optimistically update the store
          const currentState = get();
          const currentChapterData = currentState.data[chapterId];
          const updatedTextBoxes = [
            ...(currentChapterData?.textBoxes || []),
            newTextBox,
          ];

          set(
            {
              data: {
                ...currentState.data,
                [chapterId]: {
                  textBoxes: updatedTextBoxes,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                  currentPage: currentChapterData?.currentPage || 1,
                  itemsPerPage: currentChapterData?.itemsPerPage || 10,
                  totalCount: (currentChapterData?.totalCount || 0) + 1,
                  hasNextPage: currentChapterData?.hasNextPage || false,
                },
              },
            },
            false,
            "textBoxes/createSuccess"
          );

          return newTextBox;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to create text box";

          set(
            {
              data: {
                ...get().data,
                [chapterId]: {
                  ...chapterData,
                  error: errorMessage,
                },
              },
              globalError: errorMessage,
            },
            false,
            "textBoxes/createError"
          );
          throw error;
        }
      },

      updateTextBox: async (textBoxId: string, data: UpdateTextBoxData) => {
        // Find which chapter this text box belongs to
        const state = get();
        let targetChapterId = "";
        for (const [chapterId, chapterData] of Object.entries(state.data)) {
          if (chapterData.textBoxes.some((tb) => tb.id === textBoxId)) {
            targetChapterId = chapterId;
            break;
          }
        }

        if (!targetChapterId) {
          throw new Error("Text box not found in any chapter");
        }

        const chapterData = state.data[targetChapterId];

        set(
          {
            data: {
              ...state.data,
              [targetChapterId]: {
                ...chapterData,
                error: null,
              },
            },
            globalError: null,
          },
          false,
          "textBoxes/updateStart"
        );

        try {
          const updatedTextBox = await textBoxService.updateTextBox(
            textBoxId,
            data
          );

          // Optimistically update the store
          const currentState = get();
          const currentChapterData = currentState.data[targetChapterId];
          const updatedTextBoxes = currentChapterData.textBoxes.map((tb) =>
            tb.id === textBoxId ? updatedTextBox : tb
          );

          set(
            {
              data: {
                ...currentState.data,
                [targetChapterId]: {
                  textBoxes: updatedTextBoxes,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                  currentPage: currentChapterData?.currentPage || 1,
                  itemsPerPage: currentChapterData?.itemsPerPage || 10,
                  totalCount: currentChapterData?.totalCount || 0,
                  hasNextPage: currentChapterData?.hasNextPage || false,
                },
              },
            },
            false,
            "textBoxes/updateSuccess"
          );

          return updatedTextBox;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to update text box";

          set(
            {
              data: {
                ...get().data,
                [targetChapterId]: {
                  ...chapterData,
                  error: errorMessage,
                },
              },
              globalError: errorMessage,
            },
            false,
            "textBoxes/updateError"
          );
          throw error;
        }
      },

      deleteTextBox: async (chapterId: string, textBoxId: string) => {
        const state = get();
        const chapterData = state.data[chapterId];

        set(
          {
            data: {
              ...state.data,
              [chapterId]: {
                ...chapterData,
                error: null,
              },
            },
            globalError: null,
          },
          false,
          "textBoxes/deleteStart"
        );

        try {
          await textBoxService.deleteTextBox(textBoxId);

          // Optimistically update the store
          const currentState = get();
          const currentChapterData = currentState.data[chapterId];
          const filteredTextBoxes = currentChapterData.textBoxes.filter(
            (tb) => tb.id !== textBoxId
          );

          set(
            {
              data: {
                ...currentState.data,
                [chapterId]: {
                  textBoxes: filteredTextBoxes,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                  currentPage: currentChapterData?.currentPage || 1,
                  itemsPerPage: currentChapterData?.itemsPerPage || 10,
                  totalCount: Math.max(
                    (currentChapterData?.totalCount || 0) - 1,
                    0
                  ),
                  hasNextPage: currentChapterData?.hasNextPage || false,
                },
              },
            },
            false,
            "textBoxes/deleteSuccess"
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to delete text box";

          set(
            {
              data: {
                ...get().data,
                [chapterId]: {
                  ...chapterData,
                  error: errorMessage,
                },
              },
              globalError: errorMessage,
            },
            false,
            "textBoxes/deleteError"
          );
          throw error;
        }
      },

      clearChapterTextBoxes: (chapterId: string) => {
        const state = get();
        const chapterData = state.data[chapterId];

        if (chapterData) {
          set(
            {
              data: {
                ...state.data,
                [chapterId]: {
                  textBoxes: [],
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                  currentPage: 1,
                  itemsPerPage: chapterData.itemsPerPage || 10,
                  totalCount: 0,
                  hasNextPage: false,
                },
              },
            },
            false,
            "textBoxes/clearChapter"
          );
        }
      },

      clearError: (chapterId?: string) => {
        if (chapterId) {
          const state = get();
          const chapterData = state.data[chapterId];
          if (chapterData) {
            set(
              {
                data: {
                  ...state.data,
                  [chapterId]: {
                    ...chapterData,
                    error: null,
                  },
                },
              },
              false,
              "textBoxes/clearError"
            );
          }
        } else {
          set({ globalError: null }, false, "textBoxes/clearGlobalError");
        }
      },

      reset: () => {
        set(initialState, false, "textBoxes/reset");
      },

      addTextBoxesToChapter: (
        chapterId: string,
        textBoxes: TextBoxApiItem[]
      ) => {
        const state = get();
        const currentChapterData = state.data[chapterId];

        // Merge new text boxes with existing ones, avoiding duplicates
        const existingTextBoxes = currentChapterData?.textBoxes || [];
        const existingIds = new Set(existingTextBoxes.map((tb) => tb.id));
        const newTextBoxes = textBoxes.filter((tb) => !existingIds.has(tb.id));
        const allTextBoxes = [...existingTextBoxes, ...newTextBoxes];

        set(
          {
            data: {
              ...state.data,
              [chapterId]: {
                textBoxes: allTextBoxes,
                lastFetched: Date.now(),
                isLoading: false,
                error: null,
                currentPage: currentChapterData?.currentPage || 1,
                itemsPerPage: currentChapterData?.itemsPerPage || 10,
                totalCount: allTextBoxes.length,
                hasNextPage: false, // Since we're adding all text boxes, there's no next page
              },
            },
          },
          false,
          "textBoxes/addTextBoxesToChapter"
        );
      },

      invalidateCache: (chapterId?: string) => {
        if (chapterId) {
          const state = get();
          const chapterData = state.data[chapterId];
          if (chapterData) {
            set(
              {
                data: {
                  ...state.data,
                  [chapterId]: {
                    ...chapterData,
                    lastFetched: 0,
                  },
                },
              },
              false,
              "textBoxes/invalidateCache"
            );
          }
        } else {
          const state = get();
          const updatedData: TextBoxesData = {};
          for (const [chapterId, chapterData] of Object.entries(state.data)) {
            updatedData[chapterId] = {
              ...chapterData,
              lastFetched: 0,
            };
          }
          set(
            {
              data: updatedData,
            },
            false,
            "textBoxes/invalidateAllCache"
          );
        }
      },

      // Pagination actions
      setPage: (chapterId: string, page: number) => {
        const state = get();
        const chapterData = state.data[chapterId];
        if (chapterData) {
          set(
            {
              data: {
                ...state.data,
                [chapterId]: {
                  ...chapterData,
                  currentPage: page,
                },
              },
            },
            false,
            "textBoxes/setPage"
          );
        }
      },

      setItemsPerPage: (chapterId: string, itemsPerPage: number) => {
        const state = get();
        const chapterData = state.data[chapterId];
        if (chapterData) {
          set(
            {
              data: {
                ...state.data,
                [chapterId]: {
                  ...chapterData,
                  itemsPerPage,
                  currentPage: 1, // Reset to first page when changing items per page
                },
              },
            },
            false,
            "textBoxes/setItemsPerPage"
          );
        }
      },

      setItemsPerPageAndFetch: async (
        chapterId: string,
        itemsPerPage: number
      ) => {
        const { setItemsPerPage, fetchTextBoxesByChapterId } = get();
        setItemsPerPage(chapterId, itemsPerPage);
        await fetchTextBoxesByChapterId(chapterId, 1, true);
      },
    }),
    {
      name: "textBoxes-store",
    }
  )
);

// Cached selectors to prevent infinite loops
const emptyTextBoxes: TextBoxApiItem[] = [];
const selectTextBoxesByChapterId =
  (chapterId: string) => (state: TextBoxesStore) =>
    state.data[chapterId]?.textBoxes || emptyTextBoxes;

const selectLoadingByChapterId =
  (chapterId: string) => (state: TextBoxesStore) =>
    state.data[chapterId]?.isLoading || false;

const selectErrorByChapterId = (chapterId: string) => (state: TextBoxesStore) =>
  state.data[chapterId]?.error || null;

const selectGlobalLoading = (state: TextBoxesStore) => state.globalLoading;
const selectGlobalError = (state: TextBoxesStore) => state.globalError;

// Selector hooks for better performance
export const useTextBoxesByChapterId = (chapterId: string) =>
  useTextBoxesStore(selectTextBoxesByChapterId(chapterId));

export const useTextBoxesLoadingByChapterId = (chapterId: string) =>
  useTextBoxesStore(selectLoadingByChapterId(chapterId));

export const useTextBoxesErrorByChapterId = (chapterId: string) =>
  useTextBoxesStore(selectErrorByChapterId(chapterId));

export const useTextBoxesGlobalLoading = () =>
  useTextBoxesStore(selectGlobalLoading);

export const useTextBoxesGlobalError = () =>
  useTextBoxesStore(selectGlobalError);

// Check if data is stale (older than cache duration)
export const useTextBoxesIsStale = (chapterId: string) => {
  return useTextBoxesStore((state) => {
    const chapterData = state.data[chapterId];
    if (!chapterData?.lastFetched) return true;
    return Date.now() - chapterData.lastFetched > CACHE_DURATION;
  });
};

// Check if we have cached data for a chapter
export const useHasCachedTextBoxes = (chapterId: string) => {
  return useTextBoxesStore((state) => {
    const chapterData = state.data[chapterId];
    return Boolean(chapterData?.textBoxes.length);
  });
};

// Pagination selectors (removed unused selectPaginationByChapterId)

// Pagination hook with individual value selectors to avoid object recreation
export const useTextBoxesPagination = (chapterId: string) => {
  const currentPage = useTextBoxesStore(
    (state) => state.data[chapterId]?.currentPage || 1
  );
  const itemsPerPage = useTextBoxesStore(
    (state) => state.data[chapterId]?.itemsPerPage || 10
  );
  const totalCount = useTextBoxesStore(
    (state) => state.data[chapterId]?.totalCount || 0
  );
  const hasNextPage = useTextBoxesStore(
    (state) => state.data[chapterId]?.hasNextPage || false
  );

  return useMemo(
    () => ({
      currentPage,
      itemsPerPage,
      totalCount,
      hasNextPage,
    }),
    [currentPage, itemsPerPage, totalCount, hasNextPage]
  );
};

// Actions hook for better performance
export const useTextBoxesActions = () => {
  const fetchTextBoxesByChapterId = useTextBoxesStore(
    (state) => state.fetchTextBoxesByChapterId
  );
  const fetchTextBoxesByPageId = useTextBoxesStore(
    (state) => state.fetchTextBoxesByPageId
  );
  const createTextBox = useTextBoxesStore((state) => state.createTextBox);
  const updateTextBox = useTextBoxesStore((state) => state.updateTextBox);
  const deleteTextBox = useTextBoxesStore((state) => state.deleteTextBox);
  const addTextBoxesToChapter = useTextBoxesStore(
    (state) => state.addTextBoxesToChapter
  );
  const clearChapterTextBoxes = useTextBoxesStore(
    (state) => state.clearChapterTextBoxes
  );
  const clearError = useTextBoxesStore((state) => state.clearError);
  const reset = useTextBoxesStore((state) => state.reset);
  const invalidateCache = useTextBoxesStore((state) => state.invalidateCache);
  const setPage = useTextBoxesStore((state) => state.setPage);
  const setItemsPerPage = useTextBoxesStore((state) => state.setItemsPerPage);
  const setItemsPerPageAndFetch = useTextBoxesStore(
    (state) => state.setItemsPerPageAndFetch
  );

  return useMemo(
    () => ({
      fetchTextBoxesByChapterId,
      fetchTextBoxesByPageId,
      createTextBox,
      updateTextBox,
      deleteTextBox,
      addTextBoxesToChapter,
      clearChapterTextBoxes,
      clearError,
      reset,
      invalidateCache,
      setPage,
      setItemsPerPage,
      setItemsPerPageAndFetch,
    }),
    [
      fetchTextBoxesByChapterId,
      fetchTextBoxesByPageId,
      createTextBox,
      updateTextBox,
      deleteTextBox,
      addTextBoxesToChapter,
      clearChapterTextBoxes,
      clearError,
      reset,
      invalidateCache,
      setPage,
      setItemsPerPage,
      setItemsPerPageAndFetch,
    ]
  );
};

// Utility functions for external use
export const invalidateTextBoxesCache = (chapterId?: string) => {
  const { invalidateCache } = useTextBoxesStore.getState();
  invalidateCache(chapterId);
};

export const refreshTextBoxesData = async (chapterId: string) => {
  const { fetchTextBoxesByChapterId } = useTextBoxesStore.getState();
  await fetchTextBoxesByChapterId(chapterId);
};

// Get text box by ID from store
export const getTextBoxById = (textBoxId: string): TextBoxApiItem | null => {
  const state = useTextBoxesStore.getState();
  for (const chapterData of Object.values(state.data)) {
    const textBox = chapterData.textBoxes.find((tb) => tb.id === textBoxId);
    if (textBox) return textBox;
  }
  return null;
};

// Get text boxes count for a chapter
export const getTextBoxesCountByChapterId = (chapterId: string): number => {
  const state = useTextBoxesStore.getState();
  return state.data[chapterId]?.textBoxes.length || 0;
};
