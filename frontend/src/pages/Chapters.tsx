import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiFileText } from "react-icons/fi";
import { LuBrain } from "react-icons/lu";
import { MdGTranslate } from "react-icons/md";
import {
  SectionLoadingSpinner,
  ErrorState,
  BackToSeries,
  NavigationTabs,
} from "../components/common";

import { CardPageHeader } from "../components/Header/PageHeader";
import AddChapterModal from "../components/Modals/AddChapterModal";
import EditChapterModal from "../components/Modals/EditChapterModal";
import DeleteChapterModal from "../components/Modals/DeleteChapterModal";
import AddTMEntryModal from "../components/Modals/AddTMEntryModal";
import EditTMEntryModal from "../components/Modals/EditTMEntryModal";
import DeleteTMEntryModal from "../components/Modals/DeleteTMEntryModal";
import type {
  Chapter,
  SeriesInfo,
  TranslationMemory,
  GlossaryCharacter,
} from "../types";
import { convertApiChapterToLegacy } from "../types/series";
import { convertApiTMToLegacy } from "../types/translation";
import {
  AIGlossaryTabContent,
  ChaptersTabContent,
  TranslationMemoryTabContent,
} from "../components/Tabs";
import { chapterService } from "../services/chapterService";
import { seriesService } from "../services/seriesService";
import { translationMemoryService } from "../services/translationMemoryService";
import { peopleAnalysisService } from "../services/peopleAnalysisService";
import { aiGlossaryService } from "../services/aiGlossaryService";
import { useAuth } from "../hooks/useAuth";

export default function Chapters() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [translationMemoryData, setTranslationMemoryData] = useState<
    TranslationMemory[]
  >([]);
  const [glossaryData, setGlossaryData] = useState<GlossaryCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTMLoading, setIsTMLoading] = useState(false);
  const [isGlossaryRefreshing, setIsGlossaryRefreshing] = useState(false);
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

  // Fetch chapters data
  const fetchChapters = useCallback(async () => {
    if (!seriesId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch series info and chapters from API
      const [seriesData, chaptersData] = await Promise.all([
        seriesService.getSeriesById(seriesId),
        chapterService.getChaptersBySeriesId(seriesId),
      ]);

      // Convert API data to legacy format for compatibility
      const legacyChapters = chaptersData.map(convertApiChapterToLegacy);

      // Sort chapters by chapter number in ascending order
      const sortedChapters = legacyChapters.sort((a, b) => a.number - b.number);

      setSeriesInfo({
        id: seriesData.id,
        name: seriesData.title,
        totalChapters: seriesData.total_chapters,
      });
      setChapters(sortedChapters);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching chapters:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setIsLoading(false);
    }
  }, [seriesId]);

  // Fetch translation memory data
  const fetchTranslationMemory = useCallback(async () => {
    if (!seriesId) return;

    try {
      setIsTMLoading(true);

      // Fetch TM data from API
      const tmData = await translationMemoryService.getTMEntries(seriesId);

      // Convert API data to legacy format for compatibility
      const legacyTMData = tmData.map(convertApiTMToLegacy);

      setTranslationMemoryData(legacyTMData);
      setIsTMLoading(false);
    } catch (err) {
      console.error("Error fetching translation memory:", err);
      // Don't set main error state for TM fetch failures
      setIsTMLoading(false);
    }
  }, [seriesId]);

  // Fetch AI glossary data
  const fetchGlossaryData = useCallback(async () => {
    if (!seriesId) return;

    try {
      const entries = await aiGlossaryService.getGlossaryBySeriesId(seriesId);
      const glossaryCharacters =
        aiGlossaryService.convertToGlossaryCharacters(entries);

      setGlossaryData(glossaryCharacters);
    } catch (error) {
      console.error("❌ Error fetching AI glossary data:", error);
      setGlossaryData([]);
    }
  }, [seriesId]);

  useEffect(() => {
    if (seriesId) {
      fetchChapters();
      fetchTranslationMemory();
      fetchGlossaryData();
    } else {
      navigate("/series");
    }
  }, [
    seriesId,
    navigate,
    fetchChapters,
    fetchTranslationMemory,
    fetchGlossaryData,
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
      // Create chapter via API
      const newApiChapter = await chapterService.createChapter(seriesId, {
        chapter_number: chapterNumber,
      });

      // Convert to legacy format and add to list, then sort by chapter number
      const newLegacyChapter = convertApiChapterToLegacy(newApiChapter);
      setChapters((prevChapters) => {
        const updatedChapters = [newLegacyChapter, ...prevChapters];
        return updatedChapters.sort((a, b) => a.number - b.number);
      });

      // Update series info to increment chapter count
      setSeriesInfo((prevInfo) =>
        prevInfo
          ? { ...prevInfo, totalChapters: prevInfo.totalChapters + 1 }
          : prevInfo
      );
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
      // Update chapter via API (only chapter number)
      const updatedApiChapter = await chapterService.updateChapter(chapterId, {
        chapter_number: chapterNumber,
      });

      // Convert to legacy format and update local state, then sort by chapter number
      const updatedLegacyChapter = convertApiChapterToLegacy(updatedApiChapter);
      setChapters((prevChapters) => {
        const updatedChapters = prevChapters.map((chapter) =>
          chapter.id === chapterId ? updatedLegacyChapter : chapter
        );
        return updatedChapters.sort((a, b) => a.number - b.number);
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
    try {
      // Delete chapter via API
      await chapterService.deleteChapter(chapterId);

      // Remove the chapter from the local state
      setChapters((prevChapters) =>
        prevChapters.filter((chapter) => chapter.id !== chapterId)
      );

      // Update series info to decrement chapter count
      setSeriesInfo((prevInfo) =>
        prevInfo
          ? {
              ...prevInfo,
              totalChapters: Math.max(0, prevInfo.totalChapters - 1),
            }
          : prevInfo
      );
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

      // Create TM entry using the service
      await translationMemoryService.createTMEntry(seriesId, {
        source_text: entryData.source,
        target_text: entryData.target,
        context: entryData.context,
      });

      await fetchTranslationMemory();
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
      // Update TM entry using the service (tmId is already a UUID string)
      await translationMemoryService.updateTMEntry(tmId, {
        source_text: entryData.source,
        target_text: entryData.target,
        context: entryData.context,
      });

      await fetchTranslationMemory();
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
    try {
      // Delete TM entry using the service (tmId is already a UUID string)
      await translationMemoryService.deleteTMEntry(tmId);

      // Refresh translation memory data to remove the deleted entry
      await fetchTranslationMemory();
    } catch (error) {
      console.error("Error deleting TM entry:", error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  // Glossary Refresh Handler - Updated to use terminology analysis
  const handleRefreshGlossary = async () => {
    if (!seriesId) return;

    try {
      setIsGlossaryRefreshing(true);

      // Analyze terminology in the series (this will save to database automatically)
      const result = await peopleAnalysisService.analyzeTerminologyInSeries(
        seriesId,
        true // force refresh
      );

      if (result.success) {
        // Fetch the updated data from database
        await fetchGlossaryData();
      } else {
        throw new Error("Terminology analysis failed");
      }
    } catch (error) {
      console.error("❌ Error refreshing glossary:", error);

      // Try to fetch existing data from database as fallback
      try {
        await fetchGlossaryData();
      } catch (dbError) {
        console.error("❌ Error loading fallback data:", dbError);
        // Create minimal fallback data
        const fallbackPeople =
          peopleAnalysisService.createFallbackPeople(seriesId);
        const enhancedFallback =
          peopleAnalysisService.enhancePeopleWithAvatars(fallbackPeople);
        setGlossaryData(
          peopleAnalysisService.convertToGlossaryCharacters(enhancedFallback)
        );
      }
    } finally {
      setIsGlossaryRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Back Button */}
        <BackToSeries />

        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Series: Loading...
          </h1>
          <p className="text-gray-600">
            Manage chapters, translation memory, and AI-generated glossary for
            this series.
          </p>
        </div>

        {/* Loading State */}
        <div className="bg-white">
          <SectionLoadingSpinner text="Loading chapters..." />
        </div>
      </div>
    );
  }

  if (error) {
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

        <ErrorState error={error} onRetry={fetchChapters} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <BackToSeries />

      {/* Page Header */}
      <CardPageHeader
        title={`Series: ${seriesInfo?.name || "Loading..."}`}
        subtitle="Manage chapters, translation memory, and AI-generated glossary for this series."
      />

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
