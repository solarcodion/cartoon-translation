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

        // Check if we need to fetch (force, no data, or stale data)
        const now = Date.now();
        const isStale =
          !chapterData?.lastFetched ||
          now - chapterData.lastFetched > CACHE_DURATION;

        if (
          !force &&
          chapterData?.pages &&
          !isStale &&
          chapterData.currentPage === currentPage
        ) {
          return; // Use cached data
        }

        // Set loading state
        set({
          data: {
            ...state.data,
            [chapterId]: {
              ...chapterData,
              isLoading: true,
              error: null,
              currentPage: currentPage,
              itemsPerPage: itemsPerPage,
              totalCount: 0,
              hasNextPage: false,
            },
          },
          globalError: null,
        });

        try {
          // Calculate skip for pagination
          const skip = (currentPage - 1) * itemsPerPage;

          // Fetch pages from API
          const pages = await pageService.getPagesByChapter(
            chapterId,
            skip,
            itemsPerPage
          );
          const legacyPages = pages.map(convertApiPageToLegacy);

          // Get total count
          const totalCount = await pageService.getPageCountByChapter(chapterId);
          const hasNextPage = skip + pages.length < totalCount;

          // Update state with fetched data
          set({
            data: {
              ...get().data,
              [chapterId]: {
                pages: legacyPages,
                lastFetched: Date.now(),
                isLoading: false,
                error: null,
                currentPage: currentPage,
                itemsPerPage: itemsPerPage,
                totalCount: totalCount,
                hasNextPage: hasNextPage,
              },
            },
          });
        } catch (error) {
          console.error("Error fetching pages:", error);
          set({
            data: {
              ...get().data,
              [chapterId]: {
                ...get().data[chapterId],
                isLoading: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to fetch pages",
              },
            },
          });
        }
      },

      createPage: async (chapterId: string, data: CreatePageData) => {
        try {
          const apiPage = await pageService.createPage(data);
          const legacyPage = convertApiPageToLegacy(apiPage);

          // Update the store with the new page
          const state = get();
          const chapterData = state.data[chapterId];
          if (chapterData) {
            const updatedPages = [
              ...(chapterData.pages || []),
              legacyPage,
            ].sort((a, b) => a.number - b.number);

            set({
              data: {
                ...state.data,
                [chapterId]: {
                  ...chapterData,
                  pages: updatedPages,
                  totalCount: (chapterData.totalCount || 0) + 1,
                },
              },
            });
          }

          return legacyPage;
        } catch (error) {
          console.error("Error creating page:", error);
          throw error;
        }
      },

      batchCreatePages: async (
        chapterId: string,
        data: BatchCreatePageData
      ) => {
        try {
          const result = await pageService.createPagesBatch(data);

          // Update the store with new pages
          if (result.success && result.pages.length > 0) {
            const state = get();
            const chapterData = state.data[chapterId];
            if (chapterData) {
              const newLegacyPages = result.pages.map(convertApiPageToLegacy);
              const updatedPages = [
                ...(chapterData.pages || []),
                ...newLegacyPages,
              ].sort((a, b) => a.number - b.number);

              set({
                data: {
                  ...state.data,
                  [chapterId]: {
                    ...chapterData,
                    pages: updatedPages,
                    totalCount:
                      (chapterData.totalCount || 0) + result.pages.length,
                  },
                },
              });
            }
          }

          return result;
        } catch (error) {
          console.error("Error creating pages batch:", error);
          throw error;
        }
      },

      batchCreatePagesWithAutoTextBoxes: async (
        chapterId: string,
        data: BatchCreatePageData
      ) => {
        try {
          const result = await pageService.batchCreatePagesWithAutoTextBoxes(
            data
          );

          // Update the store with new pages
          if (result.success && result.pages.length > 0) {
            const state = get();
            const chapterData = state.data[chapterId];
            if (chapterData) {
              const newLegacyPages = result.pages.map(convertApiPageToLegacy);
              const updatedPages = [
                ...(chapterData.pages || []),
                ...newLegacyPages,
              ].sort((a, b) => a.number - b.number);

              set({
                data: {
                  ...state.data,
                  [chapterId]: {
                    ...chapterData,
                    pages: updatedPages,
                    totalCount:
                      (chapterData.totalCount || 0) + result.pages.length,
                  },
                },
              });
            }
          }

          return result;
        } catch (error) {
          console.error("Error creating pages with auto text boxes:", error);
          throw error;
        }
      },

      updatePage: async (pageId: string, data: Partial<CreatePageData>) => {
        try {
          const updateData = {
            page_number: data.page_number,
            file_name: data.file?.name,
            width: data.width,
            height: data.height,
          };

          const apiPage = await pageService.updatePage(pageId, updateData);
          const legacyPage = convertApiPageToLegacy(apiPage);

          // Update the store
          const state = get();
          Object.keys(state.data).forEach((chapterId) => {
            const chapterData = state.data[chapterId];
            if (chapterData && chapterData.pages) {
              const pageIndex = chapterData.pages.findIndex(
                (p) => p.id === pageId
              );
              if (pageIndex !== -1) {
                const updatedPages = [...chapterData.pages];
                updatedPages[pageIndex] = legacyPage;

                set({
                  data: {
                    ...state.data,
                    [chapterId]: {
                      ...chapterData,
                      pages: updatedPages.sort((a, b) => a.number - b.number),
                    },
                  },
                });
              }
            }
          });

          return legacyPage;
        } catch (error) {
          console.error("Error updating page:", error);
          throw error;
        }
      },

      deletePage: async (chapterId: string, pageId: string) => {
        try {
          await pageService.deletePage(pageId);

          // Update the store
          const state = get();
          const chapterData = state.data[chapterId];
          if (chapterData && chapterData.pages) {
            const updatedPages = chapterData.pages.filter(
              (p) => p.id !== pageId
            );

            set({
              data: {
                ...state.data,
                [chapterId]: {
                  ...chapterData,
                  pages: updatedPages,
                  totalCount: Math.max(0, (chapterData.totalCount || 0) - 1),
                },
              },
            });
          }
        } catch (error) {
          console.error("Error deleting page:", error);
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
    return Boolean(chapterData?.pages?.length);
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
    if (chapterData.pages) {
      const page = chapterData.pages.find((p) => p.id === pageId);
      if (page) return page;
    }
  }
  return null;
};

// Get pages count for a chapter
export const getPagesCountByChapterId = (chapterId: string): number => {
  const state = usePagesStore.getState();
  return state.data[chapterId]?.pages?.length || 0;
};
