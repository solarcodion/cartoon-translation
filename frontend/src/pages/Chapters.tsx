import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiFileText } from "react-icons/fi";
import { LuBrain } from "react-icons/lu";
import { MdGTranslate } from "react-icons/md";
import {
  ErrorState,
  BackToSeries,
  NavigationTabs,
  TextSkeleton,
} from "../components/common";

import { CardPageHeader } from "../components/Header/PageHeader";
import AddChapterModal from "../components/Modals/AddChapterModal";
import EditChapterModal from "../components/Modals/EditChapterModal";
import DeleteChapterModal from "../components/Modals/DeleteChapterModal";
import AddTMEntryModal from "../components/Modals/AddTMEntryModal";
import EditTMEntryModal from "../components/Modals/EditTMEntryModal";
import DeleteTMEntryModal from "../components/Modals/DeleteTMEntryModal";
import type { Chapter, SeriesInfo, TranslationMemory } from "../types";
import {
  AIGlossaryTabContent,
  ChaptersTabContent,
  TranslationMemoryTabContent,
} from "../components/Tabs";
import { seriesService } from "../services/seriesService";
import { useAuth } from "../hooks/useAuth";
import { useDashboardSync } from "../hooks/useDashboardSync";
import {
  useChaptersBySeriesId,
  useChaptersLoadingBySeriesId,
  useChaptersErrorBySeriesId,
  useChaptersActions,
  useHasCachedChapters,
  useChaptersIsStale,
  getSeriesById,
  useSeriesActions,
  useTMBySeriesId,
  useTMLoadingBySeriesId,
  useTMErrorBySeriesId,
  useTMActions,
  useHasCachedTM,
  useTMIsStale,
  useGlossaryBySeriesId,
  useGlossaryLoadingBySeriesId,
  useGlossaryRefreshingBySeriesId,
  useGlossaryErrorBySeriesId,
  useAIGlossaryActions,
  useHasCachedGlossary,
  useGlossaryIsStale,
} from "../stores";

export default function Chapters() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { syncAfterChapterCreate, syncAfterChapterDelete } = useDashboardSync();

  // Use chapters store instead of local state
  const chapters = useChaptersBySeriesId(seriesId || "");
  const isChaptersLoading = useChaptersLoadingBySeriesId(seriesId || "");
  const chaptersError = useChaptersErrorBySeriesId(seriesId || "");
  const hasCachedChapters = useHasCachedChapters(seriesId || "");
  const isChaptersStale = useChaptersIsStale(seriesId || "");
  const {
    fetchChaptersBySeriesId,
    createChapter,
    updateChapter,
    deleteChapter,
    clearError,
  } = useChaptersActions();

  // Use series store for series data
  const { fetchSeries, updateSeries } = useSeriesActions();

  // Use TM store for translation memory data
  const translationMemoryData = useTMBySeriesId(seriesId || "");
  const isTMLoading = useTMLoadingBySeriesId(seriesId || "");
  const tmError = useTMErrorBySeriesId(seriesId || "");
  const hasCachedTM = useHasCachedTM(seriesId || "");
  const isTMStale = useTMIsStale(seriesId || "");
  const {
    fetchTMBySeriesId,
    createTMEntry,
    updateTMEntry,
    deleteTMEntry,
    clearError: clearTMError,
  } = useTMActions();

  // Use AI Glossary store for glossary data
  const glossaryData = useGlossaryBySeriesId(seriesId || "");
  const isGlossaryLoading = useGlossaryLoadingBySeriesId(seriesId || "");
  const isGlossaryRefreshing = useGlossaryRefreshingBySeriesId(seriesId || "");
  const glossaryError = useGlossaryErrorBySeriesId(seriesId || "");
  const hasCachedGlossary = useHasCachedGlossary(seriesId || "");
  const isGlossaryStale = useGlossaryIsStale(seriesId || "");
  const {
    fetchGlossaryBySeriesId,
    refreshGlossary,
    clearError: clearGlossaryError,
  } = useAIGlossaryActions();

  // Keep series info as local state
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [isSeriesLoading, setIsSeriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "chapters" | "translation" | "glossary"
  >("chapters");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTMEntryModalOpen, setIsTMEntryModalOpen] = useState(false);
  const [editingTMEntry, setEditingTMEntry] =
    useState<TranslationMemory | null>(null);
  const [isEditTMModalOpen, setIsEditTMModalOpen] = useState(false);
  const [deletingTMEntry, setDeletingTMEntry] =
    useState<TranslationMemory | null>(null);
  const [isDeleteTMModalOpen, setIsDeleteTMModalOpen] = useState(false);

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
    };

    if (openDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdown]);

  // Fetch series info (use store data first, then API if needed)
  const fetchSeriesInfo = useCallback(async () => {
    if (!seriesId) return;

    try {
      setIsSeriesLoading(true);
      setError(null);

      // Try to get series data from store first
      const storeSeriesData = getSeriesById(seriesId);

      if (storeSeriesData) {
        setSeriesInfo({
          id: storeSeriesData.id,
          name: storeSeriesData.name,
          totalChapters: storeSeriesData.chapters,
        });
        setIsSeriesLoading(false);
      } else {
        // Fetch all series to populate store (this will cache the data)
        await fetchSeries();

        // Try store again after fetching
        const updatedStoreData = getSeriesById(seriesId);
        if (updatedStoreData) {
          setSeriesInfo({
            id: updatedStoreData.id,
            name: updatedStoreData.name,
            totalChapters: updatedStoreData.chapters,
          });
        } else {
          // If still not found, fetch individual series
          const seriesData = await seriesService.getSeriesById(seriesId);
          setSeriesInfo({
            id: seriesData.id,
            name: seriesData.title,
            totalChapters: seriesData.total_chapters,
          });
        }
        setIsSeriesLoading(false);
      }
    } catch (err) {
      console.error("Error fetching series info:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setIsSeriesLoading(false);
    }
  }, [seriesId, fetchSeries]);

  // No need for separate fetch functions - using stores now

  useEffect(() => {
    if (seriesId) {
      // Only fetch chapters if we don't have cached data or if it's stale
      if (!hasCachedChapters || isChaptersStale) {
        fetchChaptersBySeriesId(seriesId);
      }

      // Always fetch series info (it's lightweight)
      fetchSeriesInfo();

      // Fetch TM data if we don't have cached data or if it's stale
      if (!hasCachedTM || isTMStale) {
        fetchTMBySeriesId(seriesId);
      }

      // Fetch glossary data if we don't have cached data or if it's stale
      if (!hasCachedGlossary || isGlossaryStale) {
        fetchGlossaryBySeriesId(seriesId);
      }
    } else {
      navigate("/series");
    }
  }, [
    seriesId,
    navigate,
    hasCachedChapters,
    isChaptersStale,
    fetchChaptersBySeriesId,
    fetchSeriesInfo,
    hasCachedTM,
    isTMStale,
    fetchTMBySeriesId,
    hasCachedGlossary,
    isGlossaryStale,
    fetchGlossaryBySeriesId,
    chapters.length,
    translationMemoryData.length,
    glossaryData.length,
  ]);

  const handleAddChapter = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleConfirmAddChapter = async (chapterNumber: number) => {
    if (!seriesId) return;

    try {
      // Create chapter using the store
      await createChapter(seriesId, {
        chapter_number: chapterNumber,
      });

      // Update series info to increment chapter count
      setSeriesInfo((prevInfo) => {
        const newInfo = prevInfo
          ? { ...prevInfo, totalChapters: prevInfo.totalChapters + 1 }
          : prevInfo;

        // Also update the series store
        if (newInfo) {
          updateSeries(seriesId, { total_chapters: newInfo.totalChapters });
        }

        return newInfo;
      });

      // Update dashboard stats in real-time
      const chapterTitle = `Chapter ${chapterNumber}`;
      const seriesName = seriesInfo?.name || "Unknown Series";
      syncAfterChapterCreate(chapterTitle, seriesName);
    } catch (error) {
      console.error("Error adding chapter:", error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleEditChapter = (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (chapter) {
      setEditingChapter(chapter);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingChapter(null);
  };

  const handleSaveChapter = async (
    chapterId: string,
    chapterNumber: number
  ) => {
    try {
      // Update chapter using the store
      await updateChapter(chapterId, {
        chapter_number: chapterNumber,
      });
    } catch (error) {
      console.error("Error updating chapter:", error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleDeleteChapter = (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (chapter) {
      setDeletingChapter(chapter);
      setIsDeleteModalOpen(true);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingChapter(null);
  };

  const handleConfirmDelete = async (chapterId: string) => {
    if (!seriesId) return;

    try {
      // Get chapter info before deletion for dashboard update
      const chapterToDelete = chapters.find((c) => c.id === chapterId);
      const chapterTitle = chapterToDelete
        ? `Chapter ${chapterToDelete.number}`
        : "Unknown Chapter";
      const seriesName = seriesInfo?.name || "Unknown Series";

      // Delete chapter using the store
      await deleteChapter(seriesId, chapterId);

      // Update series info to decrement chapter count
      setSeriesInfo((prevInfo) => {
        const newInfo = prevInfo
          ? {
              ...prevInfo,
              totalChapters: Math.max(0, prevInfo.totalChapters - 1),
            }
          : prevInfo;

        // Also update the series store
        if (newInfo) {
          updateSeries(seriesId, { total_chapters: newInfo.totalChapters });
        }

        return newInfo;
      });

      // Update dashboard stats in real-time
      syncAfterChapterDelete(chapterTitle, seriesName);
    } catch (error) {
      console.error("Error deleting chapter:", error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  // TM Entry Modal Handlers
  const handleAddTMEntry = () => {
    setIsTMEntryModalOpen(true);
  };

  const handleCloseTMEntryModal = () => {
    setIsTMEntryModalOpen(false);
  };

  const handleConfirmAddTMEntry = async (entryData: {
    source: string;
    target: string;
    context?: string;
  }) => {
    try {
      if (!seriesId) {
        throw new Error("Series ID is required");
      }

      // Create TM entry using the store
      await createTMEntry(seriesId, {
        source_text: entryData.source,
        target_text: entryData.target,
        context: entryData.context,
      });
    } catch (error) {
      console.error("Error adding TM entry:", error);
    }
  };

  // TM Entry Edit Handlers
  const handleEditTMEntry = (tmId: string) => {
    const tmEntry = translationMemoryData.find((tm) => tm.id === tmId);
    if (tmEntry) {
      setEditingTMEntry(tmEntry);
      setIsEditTMModalOpen(true);
    }
  };

  const handleCloseEditTMModal = () => {
    setIsEditTMModalOpen(false);
    setEditingTMEntry(null);
  };

  const handleSaveTMEntry = async (
    tmId: string,
    entryData: {
      source: string;
      target: string;
      context?: string;
    }
  ) => {
    try {
      // Update TM entry using the store (tmId is already a UUID string)
      await updateTMEntry(tmId, {
        source_text: entryData.source,
        target_text: entryData.target,
        context: entryData.context,
      });
    } catch (error) {
      console.error("Error updating TM entry:", error);
      throw error;
    }
  };

  // TM Entry Delete Handlers
  const handleDeleteTMEntry = (tmId: string) => {
    const tmEntry = translationMemoryData.find((tm) => tm.id === tmId);
    if (tmEntry) {
      setDeletingTMEntry(tmEntry);
      setIsDeleteTMModalOpen(true);
    }
  };

  const handleCloseDeleteTMModal = () => {
    setIsDeleteTMModalOpen(false);
    setDeletingTMEntry(null);
  };

  const handleConfirmDeleteTMEntry = async (tmId: string) => {
    if (!seriesId) return;

    try {
      // Delete TM entry using the store (tmId is already a UUID string)
      await deleteTMEntry(seriesId, tmId);
    } catch (error) {
      console.error("Error deleting TM entry:", error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  // Glossary Refresh Handler - Using store
  const handleRefreshGlossary = async () => {
    if (!seriesId) return;

    try {
      // Use the store's refresh function which handles all the logic
      await refreshGlossary(seriesId, true); // force refresh
    } catch (error) {
      console.error("❌ Error refreshing glossary:", error);
    }
  };

  // Combine errors from different sources
  const combinedError = error || chaptersError || tmError || glossaryError;
  const combinedLoading = isSeriesLoading || isChaptersLoading;

  if (combinedError) {
    return (
      <div className="space-y-8">
        {/* Back Button */}
        <BackToSeries />

        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Series: Error</h1>
          <p className="text-gray-600">
            Manage chapters, translation memory, and AI-generated glossary for
            this series.
          </p>
        </div>

        <ErrorState
          error={combinedError}
          onRetry={() => {
            if (seriesId) {
              clearError(seriesId);
              clearTMError(seriesId);
              clearGlossaryError(seriesId);
              setError(null);
              fetchChaptersBySeriesId(seriesId);
              fetchSeriesInfo();
              fetchTMBySeriesId(seriesId);
              fetchGlossaryBySeriesId(seriesId);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <BackToSeries />

      {/* Page Header */}
      {seriesInfo?.name ? (
        <CardPageHeader
          title={`Series: ${seriesInfo.name}`}
          subtitle="Manage chapters, translation memory, and AI-generated glossary for this series."
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-900">Series:</span>
              <TextSkeleton size="3xl" width="1/3" className="inline-block" />
            </div>
            <p className="text-gray-600">
              Manage chapters, translation memory, and AI-generated glossary for
              this series.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <NavigationTabs
        tabs={[
          {
            id: "chapters",
            label: "Chapters",
            icon: <FiFileText className="text-sm" />,
          },
          {
            id: "translation",
            label: "Translation Memory",
            icon: <MdGTranslate className="text-sm" />,
          },
          {
            id: "glossary",
            label: "AI Glossary",
            icon: <LuBrain className="text-sm" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) =>
          setActiveTab(tabId as "chapters" | "translation" | "glossary")
        }
      />

      {/* Tab Content */}
      <ChaptersTabContent
        activeTab={activeTab}
        chapters={chapters}
        seriesId={seriesId!}
        onAddChapter={canModify ? handleAddChapter : undefined}
        onEditChapter={canModify ? handleEditChapter : undefined}
        onDeleteChapter={canModify ? handleDeleteChapter : undefined}
        canModify={canModify}
        isLoading={combinedLoading}
      />

      {/* Translation Memory Section */}
      <TranslationMemoryTabContent
        activeTab={activeTab}
        translationMemoryData={translationMemoryData}
        openDropdown={openDropdown}
        onSetOpenDropdown={setOpenDropdown}
        onAddEntry={canModifyTM ? handleAddTMEntry : undefined}
        onEditEntry={canModifyTM ? handleEditTMEntry : undefined}
        onDeleteEntry={canModifyTM ? handleDeleteTMEntry : undefined}
        canModifyTM={canModifyTM}
        isLoading={isTMLoading}
      />

      {/* AI Glossary Section */}
      <AIGlossaryTabContent
        activeTab={activeTab}
        glossaryData={glossaryData}
        seriesId={seriesId}
        onRefreshGlossary={handleRefreshGlossary}
        isRefreshing={isGlossaryRefreshing}
        isLoading={isGlossaryLoading}
      />

      {/* Add Chapter Modal */}
      <AddChapterModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onAdd={handleConfirmAddChapter}
      />

      {/* Edit Chapter Modal */}
      <EditChapterModal
        chapter={editingChapter}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveChapter}
      />

      {/* Delete Chapter Modal */}
      <DeleteChapterModal
        chapter={deletingChapter}
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={handleConfirmDelete}
      />

      {/* Add TM Entry Modal */}
      <AddTMEntryModal
        isOpen={isTMEntryModalOpen}
        onClose={handleCloseTMEntryModal}
        onAdd={handleConfirmAddTMEntry}
      />

      {/* Edit TM Entry Modal */}
      <EditTMEntryModal
        tmEntry={editingTMEntry}
        isOpen={isEditTMModalOpen}
        onClose={handleCloseEditTMModal}
        onSave={handleSaveTMEntry}
      />

      {/* Delete TM Entry Modal */}
      <DeleteTMEntryModal
        tmEntry={deletingTMEntry}
        isOpen={isDeleteTMModalOpen}
        onClose={handleCloseDeleteTMModal}
        onDelete={handleConfirmDeleteTMEntry}
      />
    </div>
  );
}
