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
import type { Page, ChapterInfo, AIInsights } from "../types";
import { getChapterInfo, mockPages, mockAiInsights } from "../data/mockData";
import AIInsightPanel from "../components/AIInsightPanel";

export default function Pages() {
  const { seriesId, chapterId } = useParams<{
    seriesId: string;
    chapterId: string;
  }>();
  const navigate = useNavigate();
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

      // Simulate loading
      setTimeout(() => {
        setChapterInfo(getChapterInfo(chapterId || "1"));
        setPages(mockPages);
        setAiInsights(mockAiInsights);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      console.error("Unexpected error fetching pages:", err);
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    if (seriesId && chapterId) {
      fetchPages();
    } else {
      navigate("/series");
    }
  }, [seriesId, chapterId, navigate, fetchPages]);

  const handleUploadPage = () => {
    // TODO: Implement upload page functionality
    console.log("Upload page clicked");
  };

  const handleEditPage = (pageId: string) => {
    // TODO: Implement edit page functionality
    console.log("Edit page:", pageId);
  };

  const handleDeletePage = (pageId: string) => {
    // TODO: Implement delete page functionality
    console.log("Delete page:", pageId);
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
            onUploadPage={handleUploadPage}
            onEditPage={handleEditPage}
            onDeletePage={handleDeletePage}
          />

          {/* Translations Tab Content */}
          <TranslationsTabContent
            activeTab={activeTab}
            chapterInfo={chapterInfo}
            selectedPage={selectedPage}
            isPageDropdownOpen={isPageDropdownOpen}
            hoveredTMBadge={hoveredTMBadge}
            onSetSelectedPage={setSelectedPage}
            onSetIsPageDropdownOpen={setIsPageDropdownOpen}
            onSetHoveredTMBadge={setHoveredTMBadge}
          />

          {/* Context Tab Content */}
          <ContextTabContent activeTab={activeTab} chapterInfo={chapterInfo} />
        </div>
      </div>
    </div>
  );
}
