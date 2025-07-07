import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useMemo } from "react";
import { pageService } from "../services/pageService";
import type { Page } from "../types";
import type {
  CreatePageData,
  BatchCreatePageData,
  BatchPageUploadResponse,
} from "../services/pageService";
import { convertApiPageToLegacy } from "../types/pages";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Store pages data grouped by chapter ID
export interface PagesData {
  [chapterId: string]: {
    pages: Page[];
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

export interface PagesState {
  data: PagesData;
  globalLoading: boolean;
  globalError: string | null;
}

export interface PagesActions {
  fetchPagesByChapterId: (
    chapterId: string,
    page?: number,
    force?: boolean
  ) => Promise<void>;
  createPage: (chapterId: string, data: CreatePageData) => Promise<Page>;
  batchCreatePages: (
    chapterId: string,
    data: BatchCreatePageData
  ) => Promise<BatchPageUploadResponse>;
  batchCreatePagesWithAutoTextBoxes: (
    chapterId: string,
    data: BatchCreatePageData
  ) => Promise<BatchPageUploadResponse>;
  updatePage: (pageId: string, data: Partial<CreatePageData>) => Promise<Page>;
  deletePage: (chapterId: string, pageId: string) => Promise<void>;
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

export type PagesStore = PagesState & PagesActions;

const initialState: PagesState = {
  data: {},
  globalLoading: false,
  globalError: null,
};

export const usePagesStore = create<PagesStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchPagesByChapterId: async (
        chapterId: string,
        page = 1,
        force = false
      ) => {
        const state = get();
        const chapterData = state.data[chapterId];

        // Initialize pagination defaults if not set
        const currentPage = page || chapterData?.currentPage || 1;
        const itemsPerPage = chapterData?.itemsPerPage || 10;

        // Check if data is still fresh (within cache duration) and for the same page
        if (
          !force &&
          chapterData?.pages.length > 0 &&
          chapterData.lastFetched &&
          Date.now() - chapterData.lastFetched < CACHE_DURATION &&
          chapterData.currentPage === currentPage &&
          chapterData.itemsPerPage === itemsPerPage
        ) {
          return; // Use cached data
        }

        // Set loading state for this chapter
        set(
          {
            data: {
              ...state.data,
              [chapterId]: {
                pages: chapterData?.pages || [],
                lastFetched: chapterData?.lastFetched || 0,
                isLoading: true,
                error: null,
                currentPage: currentPage,
                itemsPerPage: itemsPerPage,
                totalCount: chapterData?.totalCount || 0,
                hasNextPage: chapterData?.hasNextPage || false,
              },
            },
            globalError: null,
          },
          false,
          "pages/fetchStart"
        );

        try {
          // Calculate skip value for pagination
          const skip = (currentPage - 1) * itemsPerPage;

          // Fetch pages with pagination and total count
          const [apiPages, totalCount] = await Promise.all([
            pageService.getPagesByChapter(chapterId, skip, itemsPerPage),
            pageService.getPageCountByChapter(chapterId),
          ]);
          const legacyPages = apiPages.map(convertApiPageToLegacy);

          // Sort pages by page number in ascending order
          const sortedPages = legacyPages.sort((a, b) => a.number - b.number);

          // Calculate if there's a next page
          const hasNextPage = skip + apiPages.length < totalCount;

          set(
            {
              data: {
                ...get().data,
                [chapterId]: {
                  pages: sortedPages,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                  currentPage: currentPage,
                  itemsPerPage: itemsPerPage,
                  totalCount: totalCount,
                  hasNextPage: hasNextPage,
                },
              },
            },
            false,
            "pages/fetchSuccess"
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch pages";

          set(
            {
              data: {
                ...get().data,
                [chapterId]: {
                  pages: chapterData?.pages || [],
                  lastFetched: chapterData?.lastFetched || 0,
                  isLoading: false,
                  error: errorMessage,
                  currentPage: currentPage,
                  itemsPerPage: itemsPerPage,
                  totalCount: chapterData?.totalCount || 0,
                  hasNextPage: chapterData?.hasNextPage || false,
                },
              },
              globalError: errorMessage,
            },
            false,
            "pages/fetchError"
          );
          throw error;
        }
      },

      createPage: async (chapterId: string, data: CreatePageData) => {
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
          "pages/createStart"
        );

        try {
          const apiPage = await pageService.createPage(data);
          const newPage = convertApiPageToLegacy(apiPage);

          // Optimistically update the store
          const currentState = get();
          const currentChapterData = currentState.data[chapterId];
          const updatedPages = [...(currentChapterData?.pages || []), newPage];
          const sortedPages = updatedPages.sort((a, b) => a.number - b.number);

          set(
            {
              data: {
                ...currentState.data,
                [chapterId]: {
                  pages: sortedPages,
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
            "pages/createSuccess"
          );

          return newPage;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to create page";

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
            "pages/createError"
          );
          throw error;
        }
      },

      batchCreatePages: async (
        chapterId: string,
        data: BatchCreatePageData
      ) => {
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
          "pages/batchCreateStart"
        );

        try {
          const response = await pageService.createPagesBatch(data);
          const newPages = response.pages.map(convertApiPageToLegacy);

          // Optimistically update the store
          const currentState = get();
          const currentChapterData = currentState.data[chapterId];
          const updatedPages = [
            ...(currentChapterData?.pages || []),
            ...newPages,
          ];
          const sortedPages = updatedPages.sort((a, b) => a.number - b.number);

          set(
            {
              data: {
                ...currentState.data,
                [chapterId]: {
                  pages: sortedPages,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                },
              },
            },
            false,
            "pages/batchCreateSuccess"
          );

          return response;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to batch create pages";

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
            "pages/batchCreateError"
          );
          throw error;
        }
      },

      batchCreatePagesWithAutoTextBoxes: async (
        chapterId: string,
        data: BatchCreatePageData
      ) => {
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
          "pages/batchCreateWithAutoTextBoxesStart"
        );

        try {
          const response = await pageService.batchCreatePagesWithAutoTextBoxes(
            data
          );
          const newPages = response.pages.map(convertApiPageToLegacy);

          // Optimistically update the store
          const currentState = get();
          const currentChapterData = currentState.data[chapterId];
          const updatedPages = [
            ...(currentChapterData?.pages || []),
            ...newPages,
          ];
          const sortedPages = updatedPages.sort((a, b) => a.number - b.number);

          set(
            {
              data: {
                ...currentState.data,
                [chapterId]: {
                  pages: sortedPages,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                },
              },
            },
            false,
            "pages/batchCreateWithAutoTextBoxesSuccess"
          );

          // Fetch and update text boxes for the chapter since auto text boxes were created
          try {
            const { textBoxService } = await import(
              "../services/textBoxService"
            );
            const { useTextBoxesStore } = await import("./textBoxesStore");

            const textBoxes = await textBoxService.getTextBoxesByChapter(
              chapterId
            );
            const { addTextBoxesToChapter } = useTextBoxesStore.getState();
            addTextBoxesToChapter(chapterId, textBoxes);
          } catch (textBoxError) {
            console.warn(
              "Failed to update text boxes store after auto creation:",
              textBoxError
            );
            // Don't fail the page creation if text box store update fails
          }

          return response;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to batch create pages with auto text boxes";

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
            "pages/batchCreateWithAutoTextBoxesError"
          );
          throw error;
        }
      },

      updatePage: async (pageId: string, data: Partial<CreatePageData>) => {
        // Find which chapter this page belongs to
        const state = get();
        let targetChapterId = "";
        for (const [chapterId, chapterData] of Object.entries(state.data)) {
          if (chapterData.pages.some((page) => page.id === pageId)) {
            targetChapterId = chapterId;
            break;
          }
        }

        if (!targetChapterId) {
          throw new Error("Page not found in any chapter");
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
          "pages/updateStart"
        );

        try {
          const apiPage = await pageService.updatePage(pageId, data);
          const updatedPage = convertApiPageToLegacy(apiPage);

          // Optimistically update the store
          const currentState = get();
          const currentChapterData = currentState.data[targetChapterId];
          const updatedPages = currentChapterData.pages.map((page) =>
            page.id === pageId ? updatedPage : page
          );
          const sortedPages = updatedPages.sort((a, b) => a.number - b.number);

          set(
            {
              data: {
                ...currentState.data,
                [targetChapterId]: {
                  pages: sortedPages,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                },
              },
            },
            false,
            "pages/updateSuccess"
          );

          return updatedPage;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to update page";

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
            "pages/updateError"
          );
          throw error;
        }
      },

      deletePage: async (chapterId: string, pageId: string) => {
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
          "pages/deleteStart"
        );

        try {
          await pageService.deletePage(pageId);

          // Optimistically update the store
          const currentState = get();
          const currentChapterData = currentState.data[chapterId];
          const filteredPages = currentChapterData.pages.filter(
            (page) => page.id !== pageId
          );

          set(
            {
              data: {
                ...currentState.data,
                [chapterId]: {
                  pages: filteredPages,
                  lastFetched: Date.now(),
                  isLoading: false,
                  error: null,
                },
              },
            },
            false,
            "pages/deleteSuccess"
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to delete page";

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
            "pages/deleteError"
          );
          throw error;
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
              "pages/clearError"
            );
          }
        } else {
          set({ globalError: null }, false, "pages/clearGlobalError");
        }
      },

      reset: () => {
        set(initialState, false, "pages/reset");
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
              "pages/invalidateCache"
            );
          }
        } else {
          const state = get();
          const updatedData: PagesData = {};
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
            "pages/invalidateAllCache"
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
            "pages/setPage"
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
                  itemsPerPage: itemsPerPage,
                  currentPage: 1, // Reset to first page when changing items per page
                },
              },
            },
            false,
            "pages/setItemsPerPage"
          );
        }
      },

      setItemsPerPageAndFetch: async (
        chapterId: string,
        itemsPerPage: number
      ) => {
        const state = get();
        const chapterData = state.data[chapterId];

        if (chapterData) {
          // Update the state first
          set(
            {
              data: {
                ...state.data,
                [chapterId]: {
                  ...chapterData,
                  itemsPerPage: itemsPerPage,
                  currentPage: 1, // Reset to first page when changing items per page
                },
              },
            },
            false,
            "pages/setItemsPerPageAndFetch"
          );

          // Then fetch with the new settings
          const { fetchPagesByChapterId } = get();
          await fetchPagesByChapterId(chapterId, 1, true);
        }
      },
    }),
    {
      name: "pages-store",
    }
  )
);

// Cached selectors to prevent infinite loops
const emptyPages: Page[] = [];
const selectPagesByChapterId = (chapterId: string) => (state: PagesStore) =>
  state.data[chapterId]?.pages || emptyPages;

const selectLoadingByChapterId = (chapterId: string) => (state: PagesStore) =>
  state.data[chapterId]?.isLoading || false;

const selectErrorByChapterId = (chapterId: string) => (state: PagesStore) =>
  state.data[chapterId]?.error || null;

const selectGlobalLoading = (state: PagesStore) => state.globalLoading;
const selectGlobalError = (state: PagesStore) => state.globalError;

// Pagination selectors
const defaultPagination = {
  currentPage: 1,
  itemsPerPage: 10,
  totalCount: 0,
  hasNextPage: false,
};

const selectPaginationByChapterId =
  (chapterId: string) => (state: PagesStore) => {
    const chapterData = state.data[chapterId];
    if (!chapterData) return defaultPagination;

    return {
      currentPage: chapterData.currentPage || 1,
      itemsPerPage: chapterData.itemsPerPage || 10,
      totalCount: chapterData.totalCount || 0,
      hasNextPage: chapterData.hasNextPage || false,
    };
  };

// Selector hooks for better performance
export const usePagesByChapterId = (chapterId: string) =>
  usePagesStore(selectPagesByChapterId(chapterId));

export const usePagesLoadingByChapterId = (chapterId: string) =>
  usePagesStore(selectLoadingByChapterId(chapterId));

export const usePagesErrorByChapterId = (chapterId: string) =>
  usePagesStore(selectErrorByChapterId(chapterId));

export const usePagesGlobalLoading = () => usePagesStore(selectGlobalLoading);

export const usePagesGlobalError = () => usePagesStore(selectGlobalError);

// Pagination hook with individual value selectors to avoid object recreation
export const usePagesPagination = (chapterId: string) => {
  const currentPage = usePagesStore(
    (state) => state.data[chapterId]?.currentPage || 1
  );
  const itemsPerPage = usePagesStore(
    (state) => state.data[chapterId]?.itemsPerPage || 10
  );
  const totalCount = usePagesStore(
    (state) => state.data[chapterId]?.totalCount || 0
  );
  const hasNextPage = usePagesStore(
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

// Check if data is stale (older than cache duration)
export const usePagesIsStale = (chapterId: string) => {
  return usePagesStore((state) => {
    const chapterData = state.data[chapterId];
    if (!chapterData?.lastFetched) return true;
    return Date.now() - chapterData.lastFetched > CACHE_DURATION;
  });
};

// Check if we have cached data for a chapter
export const useHasCachedPages = (chapterId: string) => {
  return usePagesStore((state) => {
    const chapterData = state.data[chapterId];
    return Boolean(chapterData?.pages.length);
  });
};

// Actions hook for better performance
export const usePagesActions = () => {
  const fetchPagesByChapterId = usePagesStore(
    (state) => state.fetchPagesByChapterId
  );
  const createPage = usePagesStore((state) => state.createPage);
  const batchCreatePages = usePagesStore((state) => state.batchCreatePages);
  const batchCreatePagesWithAutoTextBoxes = usePagesStore(
    (state) => state.batchCreatePagesWithAutoTextBoxes
  );
  const updatePage = usePagesStore((state) => state.updatePage);
  const deletePage = usePagesStore((state) => state.deletePage);
  const clearError = usePagesStore((state) => state.clearError);
  const reset = usePagesStore((state) => state.reset);
  const invalidateCache = usePagesStore((state) => state.invalidateCache);
  const setPage = usePagesStore((state) => state.setPage);
  const setItemsPerPage = usePagesStore((state) => state.setItemsPerPage);
  const setItemsPerPageAndFetch = usePagesStore(
    (state) => state.setItemsPerPageAndFetch
  );

  return useMemo(
    () => ({
      fetchPagesByChapterId,
      createPage,
      batchCreatePages,
      batchCreatePagesWithAutoTextBoxes,
      updatePage,
      deletePage,
      clearError,
      reset,
      invalidateCache,
      setPage,
      setItemsPerPage,
      setItemsPerPageAndFetch,
    }),
    [
      fetchPagesByChapterId,
      createPage,
      batchCreatePages,
      batchCreatePagesWithAutoTextBoxes,
      updatePage,
      deletePage,
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
export const invalidatePagesCache = (chapterId?: string) => {
  const { invalidateCache } = usePagesStore.getState();
  invalidateCache(chapterId);
};

export const refreshPagesData = async (chapterId: string) => {
  const { fetchPagesByChapterId } = usePagesStore.getState();
  await fetchPagesByChapterId(chapterId);
};

// Get page by ID from store
export const getPageById = (pageId: string): Page | null => {
  const state = usePagesStore.getState();
  for (const chapterData of Object.values(state.data)) {
    const page = chapterData.pages.find((p) => p.id === pageId);
    if (page) return page;
  }
  return null;
};

// Get pages count for a chapter
export const getPagesCountByChapterId = (chapterId: string): number => {
  const state = usePagesStore.getState();
  return state.data[chapterId]?.pages.length || 0;
};
