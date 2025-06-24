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
import type { Chapter, SeriesInfo } from "../types";
import {
  getSeriesInfo,
  getChapters,
  translationMemoryData,
  glossaryData,
} from "../data/mockData";
import {
  AIGlossaryTabContent,
  ChaptersTabContent,
  TranslationMemoryTabContent,
} from "../components/Tabs";

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
    try {
      setIsLoading(true);
      setError(null);

      // Simulate loading
      setTimeout(() => {
        setSeriesInfo(getSeriesInfo(seriesId || "1"));
        setChapters(getChapters(seriesId || "1"));
        setIsLoading(false);
      }, 500);
    } catch (err) {
      console.error("Unexpected error fetching chapters:", err);
      setError("An unexpected error occurred.");
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
    // TODO: Implement add chapter functionality
    console.log("Add chapter clicked");
  };

  const handleEditChapter = (chapterId: string) => {
    // TODO: Implement edit chapter functionality
    console.log("Edit chapter:", chapterId);
  };

  const handleDeleteChapter = (chapterId: string) => {
    // TODO: Implement delete chapter functionality
    console.log("Delete chapter:", chapterId);
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
    </div>
  );
}
