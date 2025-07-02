import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiImage, FiFileText } from "react-icons/fi";
import { MdGTranslate } from "react-icons/md";

import {
  SectionLoadingSpinner,
  ErrorState,
  BackToChapters,
  NavigationTabs,
  PagesTabContent,
  TranslationsTabContent,
  ContextTabContent,
} from "../components/common";
import type {
  Page,
  ChapterInfo,
  AIInsights,
  TextBoxCreate,
  BatchPageUploadResponse,
} from "../types";
import { pageService } from "../services/pageService";
import { textBoxService } from "../services/textBoxService";
import { chapterService } from "../services/chapterService";
import { convertApiPageToLegacy } from "../types/pages";
import { convertLegacyTextBoxToApi } from "../types/textbox";
import AIInsightPanel from "../components/AIInsightPanel";
import UploadPageModal from "../components/Modals/UploadPageModal";
import EditPageModal from "../components/Modals/EditPageModal";
import DeletePageModal from "../components/Modals/DeletePageModal";
import AddTextBoxModal from "../components/Modals/AddTextBoxModal";
import { useAuth } from "../hooks/useAuth";

export default function Pages() {
  const { seriesId, chapterId } = useParams<{
    seriesId: string;
    chapterId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [chapterInfo, setChapterInfo] = useState<ChapterInfo | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Fetch pages data
  const fetchPages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!chapterId || !seriesId) {
        setError("Chapter ID or Series ID is missing");
        setIsLoading(false);
        return;
      }

      // Fetch real chapter data from API
      const chapterData = await chapterService.getChapterById(chapterId);

      // Convert to ChapterInfo format
      const chapterInfo: ChapterInfo = {
        id: chapterData.id,
        number: chapterData.chapter_number,
        title: `Chapter ${chapterData.chapter_number}`,
        series_name: "Loading...", // We'll need to fetch series name separately if needed
        total_pages: chapterData.page_count,
        context: chapterData.context,
      };

      setChapterInfo(chapterInfo);
      // Set default AI insights since mockData was removed
      setAiInsights({
        overall_quality_score: 92,
        insights: ["Consider standardizing 'gate' vs 'portal' terminology."],
      });

      // Fetch real pages data from API
      const apiPages = await pageService.getPagesByChapter(chapterId);
      const convertedPages = apiPages.map(convertApiPageToLegacy);
      setPages(convertedPages);

      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching pages:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setIsLoading(false);
    }
  }, [chapterId, seriesId]);

  useEffect(() => {
    if (seriesId && chapterId) {
      fetchPages();
    } else {
      navigate("/series");
    }
  }, [seriesId, chapterId, navigate, fetchPages]);

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

      // Upload all files in batch
      const result = await pageService.createPagesBatch({
        chapter_id: chapterId,
        files,
        start_page_number: startPageNumber,
      });

      if (result.success) {
        // Convert to frontend format and add to list
        const newPages = result.pages.map(convertApiPageToLegacy);
        setPages((prev) =>
          [...prev, ...newPages].sort((a, b) => a.number - b.number)
        );
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
      // Update via API
      await pageService.updatePage(pageId, pageData);

      // Update local state
      setPages((prev) =>
        prev.map((page) =>
          page.id === pageId
            ? {
                ...page,
                number: pageData.page_number ?? page.number,
              }
            : page
        )
      );

      // Refresh the page list to get updated data
      await fetchPages();

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
      // Convert legacy format to API format
      const apiTextBoxData = convertLegacyTextBoxToApi(
        textBoxData,
        croppedImage
      );

      // Create the text box via API
      await textBoxService.createTextBox(apiTextBoxData);

      // Close the modal
      setIsAddTextBoxModalOpen(false);

      // Switch to translations tab to show the new text box
      setActiveTab("translations");

      // Trigger refresh of text boxes list
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("❌ Error adding text box:", error);
      throw error;
    }
  };

  const handleConfirmDeletePage = async (pageId: string) => {
    try {
      // Delete from API (pageId is already a UUID string)
      await pageService.deletePage(pageId);

      // Remove from local state
      setPages((prev) => prev.filter((page) => page.id !== pageId));
    } catch (error) {
      console.error("Error deleting page:", error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Back Button */}
        <BackToChapters seriesId={seriesId!} />

        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Chapter: Loading...
          </h1>
          <p className="text-gray-600">Manage all aspects of this chapter.</p>
        </div>

        {/* Loading State */}
        <div className="bg-white">
          <SectionLoadingSpinner text="Loading pages..." />
        </div>
      </div>
    );
  }

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

        <ErrorState error={error} onRetry={fetchPages} />
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
            <h1 className="text-3xl font-bold text-gray-900">
              Chapter {chapterInfo?.number} - {chapterInfo?.title}
            </h1>
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
          />

          {/* Translations Tab Content */}
          <TranslationsTabContent
            activeTab={activeTab}
            chapterInfo={chapterInfo}
            chapterId={chapterId || ""}
            selectedPage={selectedPage}
            isPageDropdownOpen={isPageDropdownOpen}
            hoveredTMBadge={hoveredTMBadge}
            pages={pages}
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
            pages={pages}
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
      <AddTextBoxModal
        isOpen={isAddTextBoxModalOpen}
        onClose={handleCloseAddTextBoxModal}
        onAdd={handleConfirmAddTextBox}
        pages={pages}
      />
    </div>
  );
}
