import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiPlus,
  FiTrash2,
  FiArrowLeft,
  FiImage,
  FiFileText,
  FiAlertTriangle,
  FiZap,
  FiSave,
  FiChevronDown,
} from "react-icons/fi";
import { BiSolidEdit } from "react-icons/bi";
import { MdGTranslate } from "react-icons/md";
import { LuBrain } from "react-icons/lu";

interface Page {
  id: string;
  number: number;
  image_url: string;
  dimensions: string;
  file_size: string;
  created_at: string;
  updated_at: string;
}

interface ChapterInfo {
  id: string;
  number: number;
  title: string;
  series_name: string;
  total_pages: number;
}

interface AIInsights {
  overall_quality_score: number;
  insights: string[];
}

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

      // Mock data for now - replace with actual API call later
      const mockChapterInfo: ChapterInfo = {
        id: chapterId || "1",
        number: 1,
        title: "Solo Leveling",
        series_name: "Solo Leveling",
        total_pages: 2,
      };

      const mockPages: Page[] = [
        {
          id: "1",
          number: 1,
          image_url: "/placeholder-page.jpg",
          dimensions: "800x1200",
          file_size: "1.2MB",
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          number: 2,
          image_url: "/placeholder-page.jpg",
          dimensions: "750x1150",
          file_size: "1.5MB",
          created_at: "2024-01-15T10:05:00Z",
          updated_at: "2024-01-15T10:05:00Z",
        },
      ];

      const mockAiInsights: AIInsights = {
        overall_quality_score: 92,
        insights: ["Consider standardizing 'gate' vs 'portal' terminology."],
      };

      // Simulate loading
      setTimeout(() => {
        setChapterInfo(mockChapterInfo);
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
        <div className="flex items-center gap-2">
          <Link
            to={`/series/${seriesId}/chapters`}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
          >
            <FiArrowLeft className="text-lg" />
            <span className="text-sm">Back to Chapters List</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Chapter: Loading...
          </h1>
          <p className="text-gray-600">Manage all aspects of this chapter.</p>
        </div>

        {/* Loading State */}
        <div className="bg-white">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading pages...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Link
            to={`/series/${seriesId}/chapters`}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
          >
            <FiArrowLeft className="text-lg" />
            <span className="text-sm">Back to Chapters List</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Chapter: Error</h1>
          <p className="text-gray-600">Manage all aspects of this chapter.</p>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchPages}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-2">
        <Link
          to={`/series/${seriesId}/chapters`}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
        >
          <FiArrowLeft className="text-lg" />
          <span className="text-sm">Back to Chapters List (Solo Leveling)</span>
        </Link>
      </div>

      {/* Header Section with AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Chapter Header - Takes 3/4 of the width */}
        <div className="xl:col-span-3">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
            <div className="flex items-center gap-2 mb-4">
              <LuBrain className="text-lg text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                AI Insights
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Automated quality checks & suggestions.
            </p>

            {aiInsights && (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Overall Quality Score:
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      {aiInsights.overall_quality_score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${aiInsights.overall_quality_score}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <FiAlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      {aiInsights.insights[0]}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Pages Content */}
        <div>
          {/* Navigation Tabs */}
          <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="flex w-full">
              <button
                onClick={() => setActiveTab("pages")}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 border-r border-gray-200 cursor-pointer ${
                  activeTab === "pages"
                    ? "bg-gray-50 text-gray-900 font-medium"
                    : "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                }`}
              >
                <FiImage className="text-sm" />
                Pages
              </button>
              <button
                onClick={() => setActiveTab("translations")}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 border-r border-gray-200 cursor-pointer ${
                  activeTab === "translations"
                    ? "bg-gray-50 text-gray-900 font-medium"
                    : "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                }`}
              >
                <MdGTranslate className="text-sm" />
                Translations
              </button>
              <button
                onClick={() => setActiveTab("context")}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 cursor-pointer ${
                  activeTab === "context"
                    ? "bg-gray-50 text-gray-900 font-medium"
                    : "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                }`}
              >
                <FiFileText className="text-sm" />
                Context
              </button>
            </div>
          </div>

          {/* Pages Tab Content */}
          {activeTab === "pages" && (
            <>
              {/* Pages for Chapter Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pages for Chapter {chapterInfo?.number}
                </h2>
                <button
                  onClick={handleUploadPage}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <FiPlus className="text-sm" />
                  Upload Page
                </button>
              </div>

              {/* Pages Table - Desktop */}
              <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Page No.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Image Preview
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dimensions
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pages.map((page) => (
                        <tr key={page.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {page.number}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center w-16 h-20 bg-gray-100 rounded border">
                              <FiImage className="text-gray-400 text-lg" />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {page.dimensions}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditPage(page.id);
                                }}
                                className="p-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit page"
                              >
                                <BiSolidEdit className="text-lg" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeletePage(page.id);
                                }}
                                className="p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete page"
                              >
                                <FiTrash2 className="text-lg" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty state - Desktop */}
                {pages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-xl mb-2">🖼️</div>
                    <p className="text-gray-600">No pages found</p>
                    <button
                      onClick={handleUploadPage}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Upload First Page
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Translations Tab Content */}
          {activeTab === "translations" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Translations for Chapter {chapterInfo?.number}
                  </h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                    <FiPlus className="text-sm" />
                    Add Text Box
                  </button>
                </div>
              </div>

              {/* Filter Section */}
              <div className="px-6 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    Filter by Page:
                  </span>
                  <div className="relative page-dropdown-container">
                    <button
                      onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
                      className="flex items-center justify-between px-4 py-2 pr-3 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer transition-colors shadow-sm min-w-[120px]"
                    >
                      <span>{selectedPage}</span>
                      <FiChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          isPageDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isPageDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                        {[
                          "All Pages",
                          "Page 1",
                          "Page 2",
                          "Page 3",
                          "Page 4",
                          "Page 5",
                        ].map((page) => (
                          <button
                            key={page}
                            onClick={() => {
                              setSelectedPage(page);
                              setIsPageDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                              selectedPage === page
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-700"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Translations Table */}
              <div className="overflow-hidden mx-6 mb-6 mt-2 border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Page
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        BBox
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        OCR
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Corrected
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TM
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Sample translation rows */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          P.1
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-12 h-16 bg-gray-100 rounded border">
                          <FiImage className="text-gray-400 text-sm" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          100,200,300,50
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          What is this place, Sung Jinw...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          Đây là đâu vậy, Sung Jinwoo?
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="relative inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border border-blue-500 text-blue-700 bg-blue-50 w-12 cursor-help"
                          onMouseEnter={() => setHoveredTMBadge("tm-1")}
                          onMouseLeave={() => setHoveredTMBadge(null)}
                        >
                          85%
                          {hoveredTMBadge === "tm-1" && (
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                              Translation Memory Match
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex flex-col items-end gap-1">
                          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 cursor-pointer">
                            <FiZap className="text-base" />
                          </button>
                          <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-all duration-200 cursor-pointer">
                            <BiSolidEdit className="text-base" />
                          </button>
                          <button className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-all duration-200 cursor-pointer">
                            <FiTrash2 className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          P.1
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-12 h-16 bg-gray-100 rounded border">
                          <FiImage className="text-gray-400 text-sm" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          150,900,400,80
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          I must survive. The Hunter As...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          Tôi phải sống sót. Hiệp hội Thợ săn...
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium text-gray-500 w-12">
                          -
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex flex-col items-end gap-1">
                          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 cursor-pointer">
                            <FiZap className="text-base" />
                          </button>
                          <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-all duration-200 cursor-pointer">
                            <BiSolidEdit className="text-base" />
                          </button>
                          <button className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-all duration-200 cursor-pointer">
                            <FiTrash2 className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          P.2
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-12 h-16 bg-gray-100 rounded border">
                          <FiImage className="text-gray-400 text-sm" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          80,150,250,60
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          System Message: You have a...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          Thông báo hệ thống: Bạn có một...
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="relative inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border border-blue-500 text-blue-700 bg-blue-50 w-12 cursor-help"
                          onMouseEnter={() => setHoveredTMBadge("tm-3")}
                          onMouseLeave={() => setHoveredTMBadge(null)}
                        >
                          100%
                          {hoveredTMBadge === "tm-3" && (
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                              Translation Memory Match
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex flex-col items-end gap-1">
                          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 cursor-pointer">
                            <FiZap className="text-base" />
                          </button>
                          <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-all duration-200 cursor-pointer">
                            <BiSolidEdit className="text-base" />
                          </button>
                          <button className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-all duration-200 cursor-pointer">
                            <FiTrash2 className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Context Tab Content */}
          {activeTab === "context" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Context Notes for Chapter {chapterInfo?.number}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Add or edit notes specific to this chapter. This can
                      include character motivations, plot points, specific
                      terminology, or tone guidelines for translators and
                      editors.
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter context notes for this chapter..."
                    defaultValue="This chapter introduces the main character and the system. Emphasize the MC's initial weakness and desperation."
                  />
                </div>

                <div className="flex justify-start">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                    <FiSave className="text-sm" />
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
