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
import type { Chapter, SeriesInfo } from "../types";
import { convertApiChapterToLegacy } from "../types/series";
import { translationMemoryData, glossaryData } from "../data/mockData";
import {
  AIGlossaryTabContent,
  ChaptersTabContent,
  TranslationMemoryTabContent,
} from "../components/Tabs";
import { chapterService } from "../services/chapterService";
import { seriesService } from "../services/seriesService";

export default function Chapters() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

      const seriesIdNum = parseInt(seriesId);

      // Fetch series info and chapters from API
      const [seriesData, chaptersData] = await Promise.all([
        seriesService.getSeriesById(seriesIdNum),
        chapterService.getChaptersBySeriesId(seriesIdNum),
      ]);

      // Convert API data to legacy format for compatibility
      const legacyChapters = chaptersData.map(convertApiChapterToLegacy);

      setSeriesInfo({
        id: seriesData.id.toString(),
        name: seriesData.title,
        totalChapters: seriesData.total_chapters,
      });
      setChapters(legacyChapters);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching chapters:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setIsLoading(false);
    }
  }, [seriesId]);

  useEffect(() => {
    if (seriesId) {
      fetchChapters();
    } else {
      navigate("/series");
    }
  }, [seriesId, navigate, fetchChapters]);

  const handleAddChapter = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleConfirmAddChapter = async (chapterNumber: number) => {
    if (!seriesId) return;

    try {
      const seriesIdNum = parseInt(seriesId);

      // Create chapter via API
      const newApiChapter = await chapterService.createChapter(seriesIdNum, {
        chapter_number: chapterNumber,
      });

      // Convert to legacy format and add to list
      const newLegacyChapter = convertApiChapterToLegacy(newApiChapter);
      setChapters((prevChapters) => [...prevChapters, newLegacyChapter]);
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
      const chapterIdNum = parseInt(chapterId);

      // Update chapter via API (only chapter number)
      const updatedApiChapter = await chapterService.updateChapter(
        chapterIdNum,
        {
          chapter_number: chapterNumber,
        }
      );

      // Convert to legacy format and update local state
      const updatedLegacyChapter = convertApiChapterToLegacy(updatedApiChapter);
      setChapters((prevChapters) =>
        prevChapters.map((chapter) =>
          chapter.id === chapterId ? updatedLegacyChapter : chapter
        )
      );
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
      const chapterIdNum = parseInt(chapterId);

      // Delete chapter via API
      await chapterService.deleteChapter(chapterIdNum);

      // Remove the chapter from the local state
      setChapters((prevChapters) =>
        prevChapters.filter((chapter) => chapter.id !== chapterId)
      );
    } catch (error) {
      console.error("Error deleting chapter:", error);
      throw error; // Re-throw to let the modal handle the error
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
        onAddChapter={handleAddChapter}
        onEditChapter={handleEditChapter}
        onDeleteChapter={handleDeleteChapter}
      />

      {/* Translation Memory Section */}
      <TranslationMemoryTabContent
        activeTab={activeTab}
        translationMemoryData={translationMemoryData}
        openDropdown={openDropdown}
        onSetOpenDropdown={setOpenDropdown}
      />

      {/* AI Glossary Section */}
      <AIGlossaryTabContent activeTab={activeTab} glossaryData={glossaryData} />

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
    </div>
  );
}
