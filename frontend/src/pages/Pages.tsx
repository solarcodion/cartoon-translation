import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiArrowLeft,
  FiImage,
  FiEye,
  FiDownload,
} from "react-icons/fi";

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

  // Fetch pages data
  const fetchPages = async () => {
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
          dimensions: "800x1200",
          file_size: "1.5MB",
          created_at: "2024-01-15T10:05:00Z",
          updated_at: "2024-01-15T10:05:00Z",
        },
      ];

      const mockAiInsights: AIInsights = {
        overall_quality_score: 92,
        insights: ["Consistent storytelling across all pages, terminology."],
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
  };

  useEffect(() => {
    if (seriesId && chapterId) {
      fetchPages();
    } else {
      navigate("/series");
    }
  }, [seriesId, chapterId, navigate]);

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

  const handleViewPage = (pageId: string) => {
    // TODO: Implement view page functionality
    console.log("View page:", pageId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/series/${seriesId}/chapters`}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-lg" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Pages
              </h1>
            </div>
          </div>
          <button
            onClick={handleUploadPage}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
          >
            <FiPlus className="text-sm" />
            <span className="sm:inline">Upload Page</span>
          </button>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pages...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/series/${seriesId}/chapters`}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-lg" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Pages
              </h1>
            </div>
          </div>
          <button
            onClick={handleUploadPage}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
          >
            <FiPlus className="text-sm" />
            <span className="sm:inline">Upload Page</span>
          </button>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchPages}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={`/series/${seriesId}/chapters`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-lg" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Chapter {chapterInfo?.number} - {chapterInfo?.title}
            </h1>
            {chapterInfo && (
              <p className="text-gray-600">
                {chapterInfo.series_name} • {chapterInfo.total_pages} pages
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleUploadPage}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
        >
          <FiPlus className="text-sm" />
          <span className="sm:inline">Upload Page</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Pages Content - Takes 3/4 of the width on xl screens */}
        <div className="xl:col-span-3">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
            <button className="flex items-center gap-2 px-1 py-2 border-b-2 border-gray-900 text-gray-900 font-medium">
              <FiImage className="text-sm" />
              Pages
            </button>
            <button className="flex items-center gap-2 px-1 py-2 text-gray-500 hover:text-gray-700">
              Translations
            </button>
            <button className="flex items-center gap-2 px-1 py-2 text-gray-500 hover:text-gray-700">
              Contact
            </button>
          </div>

          {/* Pages for Chapter Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Pages for Chapter {chapterInfo?.number}
            </h2>
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
                      Page Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dimensions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pages.map((page) => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {page.number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-16 h-20 bg-gray-100 rounded border">
                          <FiImage className="text-gray-400 text-lg" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {page.dimensions}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewPage(page.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View page"
                          >
                            <FiEye className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleEditPage(page.id)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Edit page"
                          >
                            <FiEdit2 className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeletePage(page.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete page"
                          >
                            <FiTrash2 className="text-sm" />
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
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload First Page
                </button>
              </div>
            )}
          </div>

          {/* Pages Cards - Mobile */}
          <div className="md:hidden space-y-4">
            {pages.map((page) => (
              <div
                key={page.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-16 h-20 bg-gray-100 rounded border flex-shrink-0">
                    <FiImage className="text-gray-400 text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      Page {page.number}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {page.dimensions}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewPage(page.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View page"
                      >
                        <FiEye className="text-base" />
                      </button>
                      <button
                        onClick={() => handleEditPage(page.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit page"
                      >
                        <FiEdit2 className="text-base" />
                      </button>
                      <button
                        onClick={() => handleDeletePage(page.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete page"
                      >
                        <FiTrash2 className="text-base" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty state - Mobile */}
            {pages.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-gray-400 text-xl mb-2">🖼️</div>
                <p className="text-gray-600 mb-4">No pages found</p>
                <button
                  onClick={handleUploadPage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  Upload First Page
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights Panel - Takes 1/4 of the width on xl screens */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              AI Insights
            </h3>

            {aiInsights && (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Overall Quality Score:
                    </span>
                    <span className="text-lg font-semibold text-green-600">
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
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Key Insights:
                  </h4>
                  <ul className="space-y-2">
                    {aiInsights.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-600">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
