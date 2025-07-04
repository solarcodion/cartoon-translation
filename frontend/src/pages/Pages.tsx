import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiImage, FiFileText } from "react-icons/fi";
import { MdGTranslate } from "react-icons/md";

import {
  ErrorState,
  BackToChapters,
  NavigationTabs,
  PagesTabContent,
  TranslationsTabContent,
  ContextTabContent,
  TextSkeleton,
} from "../components/common";
import type { Page, ChapterInfo, AIInsights, TextBoxCreate } from "../types";

import { chapterService } from "../services/chapterService";
import { convertApiPageToLegacy } from "../types/pages";
import { convertLegacyTextBoxToApi } from "../types/textbox";
import AIInsightPanel from "../components/AIInsightPanel";
import UploadPageModal from "../components/Modals/UploadPageModal";
import EditPageModal from "../components/Modals/EditPageModal";
import DeletePageModal from "../components/Modals/DeletePageModal";
import { useAuth } from "../hooks/useAuth";
import { useDashboardSync } from "../hooks/useDashboardSync";
import {
  getChapterById,
  usePagesByChapterId,
  usePagesLoadingByChapterId,
  usePagesErrorByChapterId,
  usePagesActions,
  useHasCachedPages,
  usePagesIsStale,
  useTextBoxesActions,
} from "../stores";
import TextBoxModal from "../components/Modals/TextBoxModal";

export default function Pages() {
  const { seriesId, chapterId } = useParams<{
    seriesId: string;
    chapterId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    syncAfterPageCreate,
    syncAfterPageDelete,
    syncAfterTextboxTranslate,
  } = useDashboardSync();

  // Use pages store
  const pages = usePagesByChapterId(chapterId || "");
  const isPagesLoading = usePagesLoadingByChapterId(chapterId || "");
  const pagesError = usePagesErrorByChapterId(chapterId || "");
  const hasCachedPages = useHasCachedPages(chapterId || "");
  const isPagesStale = usePagesIsStale(chapterId || "");
  const {
    fetchPagesByChapterId,
    batchCreatePages,
    batchCreatePagesWithAutoTextBoxes,
    updatePage,
    deletePage,
  } = usePagesActions();

  // Use text boxes store actions
  const { createTextBox: createTextBoxInStore } = useTextBoxesActions();

  const [chapterInfo, setChapterInfo] = useState<ChapterInfo | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isSeriesLoading, setIsSeriesLoading] = useState(false);
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "pages" | "translations" | "context"
  >("pages");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<string>("All Pages");
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const [hoveredTMBadge, setHoveredTMBadge] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPage, setDeletingPage] = useState<Page | null>(null);
  const [isAddTextBoxModalOpen, setIsAddTextBoxModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check if user can perform admin/editor actions
  const canModify = user?.role === "admin" || user?.role === "editor";

  // Check if user can modify TM (only admin and translator can modify TM)
  const canModifyTM = user?.role === "admin" || user?.role === "translator";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setOpenDropdown(null);
      }
      if (!target.closest(".page-dropdown-container")) {
        setIsPageDropdownOpen(false);
      }
    };

    if (openDropdown || isPageDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdown, isPageDropdownOpen]);

  // Fetch chapter info (separate from pages which are handled by store)
  const fetchChapterInfo = useCallback(async () => {
    try {
      setIsSeriesLoading(true);
      setSeriesError(null);

      if (!chapterId || !seriesId) {
        setSeriesError("Chapter ID or Series ID is missing");
        setIsSeriesLoading(false);
        return;
      }

      // Try to get chapter data from store first, then fall back to API
      let chapterData;
      const storeChapter = getChapterById(chapterId);

      if (storeChapter) {
        // Use data from store
        chapterData = {
          id: storeChapter.id,
          chapter_number: storeChapter.number,
          page_count: pages.length, // Use pages from store
          context: storeChapter.context,
        };
      } else {
        // Fall back to API
        chapterData = await chapterService.getChapterById(chapterId);
      }

      // Convert to ChapterInfo format
      const chapterInfo: ChapterInfo = {
        id: chapterData.id,
        number: chapterData.chapter_number,
        title: `Chapter ${chapterData.chapter_number}`,
        series_name: "Loading...", // We'll need to fetch series name separately if needed
        total_pages: chapterData.page_count || pages.length,
        context: chapterData.context,
      };

      setChapterInfo(chapterInfo);
      // Set default AI insights since mockData was removed
      setAiInsights({
        overall_quality_score: 92,
        insights: ["Consider standardizing 'gate' vs 'portal' terminology."],
      });

      setIsSeriesLoading(false);
    } catch (err) {
      console.error("Error fetching chapter info:", err);
      setSeriesError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setIsSeriesLoading(false);
    }
  }, [chapterId, seriesId, pages.length]);

  useEffect(() => {
    if (seriesId && chapterId) {
      // Fetch pages using store if we don't have cached data or if it's stale
      if (!hasCachedPages || isPagesStale) {
        console.log(
          `🔄 Fetching pages for chapter ${chapterId} - hasCached: ${hasCachedPages}, isStale: ${isPagesStale}`
        );
        fetchPagesByChapterId(chapterId);
      } else {
        console.log(
          `✅ Using cached pages for chapter ${chapterId} - ${pages.length} pages available`
        );
      }

      // Always fetch chapter info (it's lightweight)
      fetchChapterInfo();
    } else {
      navigate("/series");
    }
  }, [
    seriesId,
    chapterId,
    navigate,
    hasCachedPages,
    isPagesStale,
    fetchPagesByChapterId,
    fetchChapterInfo,
    pages.length,
  ]);

  const handleUploadPage = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleConfirmUpload = async (
    files: File[],
    startPageNumber: number
  ) => {
    try {
      if (!chapterId) {
        throw new Error("Chapter ID is required");
      }

      // Upload all files in batch using store
      const result = await batchCreatePages(chapterId, {
        chapter_id: chapterId,
        files,
        start_page_number: startPageNumber,
      });

      if (result.success) {
        // Update dashboard stats for each successfully uploaded page
        const chapterTitle =
          chapterInfo?.title || `Chapter ${chapterInfo?.number || "Unknown"}`;
        const newPages = result.pages.map(convertApiPageToLegacy);
        newPages.forEach((page) => {
          syncAfterPageCreate(page.number, chapterTitle);
        });
      }

      // Show any failed uploads
      if (result.failed_uploads.length > 0) {
        console.warn("Some uploads failed:", result.failed_uploads);
      }
    } catch (error) {
      console.error("Error uploading pages:", error);
      throw error;
    }
  };

  const handleConfirmUploadWithAutoTextBoxes = async (
    files: File[],
    startPageNumber: number
  ) => {
    try {
      if (!chapterId) {
        throw new Error("Chapter ID is required");
      }

      // Upload all files in batch with auto text box creation using store
      const result = await batchCreatePagesWithAutoTextBoxes(chapterId, {
        chapter_id: chapterId,
        files,
        start_page_number: startPageNumber,
      });

      if (result.success) {
        // Update dashboard stats for each successfully uploaded page
        const chapterTitle =
          chapterInfo?.title || `Chapter ${chapterInfo?.number || "Unknown"}`;
        const newPages = result.pages.map(convertApiPageToLegacy);
        newPages.forEach((page) => {
          syncAfterPageCreate(page.number, chapterTitle);
        });
      }

      // Show any failed uploads
      if (result.failed_uploads.length > 0) {
        console.warn("Some uploads failed:", result.failed_uploads);
      }
    } catch (error) {
      console.error("Error uploading pages with auto text boxes:", error);
      throw error;
    }
  };

  const handleEditPage = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (page) {
      setEditingPage(page);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPage(null);
  };

  const handleSavePageEdit = async (
    pageId: string,
    pageData: { page_number?: number }
  ) => {
    try {
      // Update via store (which will handle API call and state update)
      await updatePage(pageId, pageData);

      // Chapter analysis is now manual via the Analyze button in Context tab
    } catch (error) {
      console.error("Error updating page:", error);
      throw error;
    }
  };

  const handleDeletePage = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (page) {
      setDeletingPage(page);
      setIsDeleteModalOpen(true);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingPage(null);
  };

  const handleAddTextBox = () => {
    setIsAddTextBoxModalOpen(true);
  };

  // Handle saving chapter context
  const handleSaveContext = async (context: string) => {
    try {
      if (!chapterId) {
        console.error("Chapter ID is missing");
        return;
      }

      await chapterService.updateChapter(chapterId, { context });

      // Update local state
      setChapterInfo((prev) => (prev ? { ...prev, context } : null));
    } catch (err) {
      console.error("Error saving chapter context:", err);
      // You might want to show a toast notification here
    }
  };

  const handleCloseAddTextBoxModal = () => {
    setIsAddTextBoxModalOpen(false);
  };

  const handleConfirmAddTextBox = async (
    textBoxData: TextBoxCreate,
    croppedImage?: string
  ) => {
    try {
      if (!chapterId) {
        throw new Error("Chapter ID is required");
      }

      // Convert legacy format to API format
      const apiTextBoxData = convertLegacyTextBoxToApi(
        textBoxData,
        croppedImage
      );

      // Create the text box via store
      await createTextBoxInStore(chapterId, apiTextBoxData);

      // Close the modal
      setIsAddTextBoxModalOpen(false);

      // Switch to translations tab to show the new text box
      setActiveTab("translations");

      // Trigger refresh of text boxes list
      setRefreshTrigger((prev) => prev + 1);

      // Update dashboard stats if textbox has translation
      if (textBoxData.correctedText && textBoxData.correctedText.trim()) {
        const pageNumber = textBoxData.pageNumber || 0;
        const chapterTitle =
          chapterInfo?.title || `Chapter ${chapterInfo?.number || "Unknown"}`;
        syncAfterTextboxTranslate(pageNumber, chapterTitle);
      }
    } catch (error) {
      console.error("❌ Error adding text box:", error);
      throw error;
    }
  };

  const handleConfirmDeletePage = async (pageId: string) => {
    try {
      // Get page info before deletion for dashboard update
      const pageToDelete = pages.find((p) => p.id === pageId);
      const pageNumber = pageToDelete?.number || 0;
      const chapterTitle =
        chapterInfo?.title || `Chapter ${chapterInfo?.number || "Unknown"}`;

      // Delete via store (which will handle API call and state update)
      if (!chapterId) {
        throw new Error("Chapter ID is required");
      }
      await deletePage(chapterId, pageId);

      // Update dashboard stats in real-time
      syncAfterPageDelete(pageNumber, chapterTitle);
    } catch (error) {
      console.error("Error deleting page:", error);
      throw error;
    }
  };

  // Combine loading states
  const isLoading = isPagesLoading || isSeriesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <BackToChapters seriesId={seriesId!} />

        {/* Header Section with AI Insights */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chapter Header - Takes 3/4 of the width */}
          <div className="xl:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-full">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  Chapter
                </span>
                <TextSkeleton size="3xl" width="1/3" className="inline-block" />
              </div>
              <p className="text-gray-600 mt-2">
                Manage all aspects of this chapter.
              </p>
            </div>
          </div>

          {/* AI Insights Panel - Takes 1/4 of the width */}
          <div className="xl:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-full">
              <TextSkeleton size="lg" width="3/4" className="mb-4" />
              <div className="space-y-3">
                <TextSkeleton size="sm" width="full" />
                <TextSkeleton size="sm" width="2/3" />
                <TextSkeleton size="sm" width="3/4" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div>
          {/* Navigation Tabs */}
          <NavigationTabs
            tabs={[
              {
                id: "pages",
                label: "Pages",
                icon: <FiImage className="text-sm" />,
              },
              {
                id: "translations",
                label: "Translations",
                icon: <MdGTranslate className="text-sm" />,
              },
              {
                id: "context",
                label: "Context",
                icon: <FiFileText className="text-sm" />,
              },
            ]}
            activeTab={activeTab}
            onTabChange={(tabId) =>
              setActiveTab(tabId as "pages" | "translations" | "context")
            }
            className="mb-6"
          />

          {/* Tab Content with Skeleton Loading */}
          <PagesTabContent
            activeTab={activeTab}
            pages={[]}
            chapterInfo={null}
            onUploadPage={canModify ? handleUploadPage : undefined}
            onEditPage={canModify ? handleEditPage : undefined}
            onDeletePage={canModify ? handleDeletePage : undefined}
            canModify={canModify}
            isLoading={true}
          />

          <TranslationsTabContent
            activeTab={activeTab}
            chapterInfo={null}
            chapterId={chapterId || ""}
            selectedPage={selectedPage}
            isPageDropdownOpen={isPageDropdownOpen}
            hoveredTMBadge={hoveredTMBadge}
            onSetSelectedPage={setSelectedPage}
            onSetIsPageDropdownOpen={setIsPageDropdownOpen}
            onSetHoveredTMBadge={setHoveredTMBadge}
            onAddTextBox={canModifyTM ? handleAddTextBox : undefined}
            canModifyTM={canModifyTM}
            refreshTrigger={refreshTrigger}
          />

          <ContextTabContent
            activeTab={activeTab}
            chapterInfo={null}
            contextNotes=""
            onSaveNotes={canModifyTM ? handleSaveContext : undefined}
            canModifyTM={canModifyTM}
            chapterId={chapterId}
            onContextUpdate={async (context) => {
              setChapterInfo((prev) => (prev ? { ...prev, context } : null));
            }}
          />
        </div>
      </div>
    );
  }

  // Combine error states
  const error = pagesError || seriesError;

  if (error) {
    return (
      <div className="space-y-8">
        {/* Back Button */}
        <BackToChapters seriesId={seriesId!} />

        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Chapter: Error</h1>
          <p className="text-gray-600">Manage all aspects of this chapter.</p>
        </div>

        <ErrorState
          error={error}
          onRetry={() => {
            if (chapterId) {
              fetchPagesByChapterId(chapterId);
              fetchChapterInfo();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <BackToChapters seriesId={seriesId!} />

      {/* Header Section with AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chapter Header - Takes 3/4 of the width */}
        <div className="xl:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-full">
            {chapterInfo ? (
              <h1 className="text-3xl font-bold text-gray-900">
                Chapter {chapterInfo.number} - {chapterInfo.title}
              </h1>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  Chapter
                </span>
                <TextSkeleton size="3xl" width="1/3" className="inline-block" />
                <span className="text-3xl font-bold text-gray-900">-</span>
                <TextSkeleton size="3xl" width="1/2" className="inline-block" />
              </div>
            )}
            <p className="text-gray-600 mt-2">
              Manage all aspects of this chapter.
            </p>
          </div>
        </div>

        {/* AI Insights Panel - Takes 1/4 of the width */}
        <div className="xl:col-span-1">
          <AIInsightPanel aiInsights={aiInsights} />
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Pages Content */}
        <div>
          {/* Navigation Tabs */}
          <NavigationTabs
            tabs={[
              {
                id: "pages",
                label: "Pages",
                icon: <FiImage className="text-sm" />,
              },
              {
                id: "translations",
                label: "Translations",
                icon: <MdGTranslate className="text-sm" />,
              },
              {
                id: "context",
                label: "Context",
                icon: <FiFileText className="text-sm" />,
              },
            ]}
            activeTab={activeTab}
            onTabChange={(tabId) =>
              setActiveTab(tabId as "pages" | "translations" | "context")
            }
            className="mb-6"
          />

          {/* Pages Tab Content */}
          <PagesTabContent
            activeTab={activeTab}
            pages={pages}
            chapterInfo={chapterInfo}
            onUploadPage={canModify ? handleUploadPage : undefined}
            onEditPage={canModify ? handleEditPage : undefined}
            onDeletePage={canModify ? handleDeletePage : undefined}
            canModify={canModify}
            isLoading={isLoading}
          />

          {/* Translations Tab Content */}
          <TranslationsTabContent
            activeTab={activeTab}
            chapterInfo={chapterInfo}
            chapterId={chapterId || ""}
            selectedPage={selectedPage}
            isPageDropdownOpen={isPageDropdownOpen}
            hoveredTMBadge={hoveredTMBadge}
            onSetSelectedPage={setSelectedPage}
            onSetIsPageDropdownOpen={setIsPageDropdownOpen}
            onSetHoveredTMBadge={setHoveredTMBadge}
            onAddTextBox={canModifyTM ? handleAddTextBox : undefined}
            canModifyTM={canModifyTM}
            refreshTrigger={refreshTrigger}
          />

          {/* Context Tab Content */}
          <ContextTabContent
            activeTab={activeTab}
            chapterInfo={chapterInfo}
            contextNotes={chapterInfo?.context || ""}
            onSaveNotes={canModifyTM ? handleSaveContext : undefined}
            canModifyTM={canModifyTM}
            chapterId={chapterId}
            onContextUpdate={async (context) => {
              // Update local chapter info state immediately
              setChapterInfo((prev) => (prev ? { ...prev, context } : null));

              // Refresh chapter info from backend to ensure we have the latest data
              try {
                if (chapterId) {
                  const updatedChapterData =
                    await chapterService.getChapterById(chapterId);
                  if (updatedChapterData) {
                    // Update only the context from the API response
                    setChapterInfo((prev) =>
                      prev
                        ? { ...prev, context: updatedChapterData.context }
                        : null
                    );
                  }
                }
              } catch (error) {
                console.error("❌ Failed to refresh chapter context:", error);
              }
            }}
          />
        </div>
      </div>

      {/* Upload Page Modal */}
      <UploadPageModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        onUpload={handleConfirmUpload}
        onUploadWithAutoTextBoxes={handleConfirmUploadWithAutoTextBoxes}
        chapterNumber={chapterInfo?.number}
      />

      {/* Edit Page Modal */}
      <EditPageModal
        page={editingPage}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSavePageEdit}
      />

      {/* Delete Page Modal */}
      <DeletePageModal
        page={deletingPage}
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={handleConfirmDeletePage}
      />

      {/* Add Text Box Modal */}
      <TextBoxModal
        isOpen={isAddTextBoxModalOpen}
        onClose={handleCloseAddTextBoxModal}
        onAdd={handleConfirmAddTextBox}
        pages={pages}
      />
    </div>
  );
}
