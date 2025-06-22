import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiArrowLeft,
  FiFileText,
} from "react-icons/fi";

interface Chapter {
  id: string;
  number: number;
  title: string;
  status: "draft" | "translated" | "published";
  created_at: string;
  updated_at: string;
}

interface SeriesInfo {
  id: string;
  name: string;
  totalChapters: number;
}

export default function Chapters() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch chapters data
  const fetchChapters = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock data for now - replace with actual API call later
      const mockSeriesInfo: SeriesInfo = {
        id: seriesId || "1",
        name:
          seriesId === "1" ? "Solo Leveling" : "The Beginning After The End",
        totalChapters: seriesId === "1" ? 2 : 1,
      };

      const mockChapters: Chapter[] =
        seriesId === "1"
          ? [
              {
                id: "1",
                number: 1,
                title: "The Weakest Hunter",
                status: "published",
                created_at: "2024-01-15T10:00:00Z",
                updated_at: "2024-01-15T10:00:00Z",
              },
              {
                id: "2",
                number: 2,
                title: "The System Awakens",
                status: "translated",
                created_at: "2024-01-16T10:00:00Z",
                updated_at: "2024-01-16T10:00:00Z",
              },
            ]
          : [
              {
                id: "3",
                number: 1,
                title: "Reincarnation",
                status: "draft",
                created_at: "2024-01-17T10:00:00Z",
                updated_at: "2024-01-17T10:00:00Z",
              },
            ];

      // Simulate loading
      setTimeout(() => {
        setSeriesInfo(mockSeriesInfo);
        setChapters(mockChapters);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      console.error("Unexpected error fetching chapters:", err);
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (seriesId) {
      fetchChapters();
    } else {
      navigate("/series");
    }
  }, [seriesId, navigate]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "translated":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/series"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-lg" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Chapters
              </h1>
              <p className="text-gray-600">Loading series...</p>
            </div>
          </div>
          <button
            onClick={handleAddChapter}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
          >
            <FiPlus className="text-sm" />
            <span className="sm:inline">Add Chapter</span>
          </button>
        </div>

        {/* Loading State */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading chapters...</p>
            </div>
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
              to="/series"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-lg" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Chapters
              </h1>
            </div>
          </div>
          <button
            onClick={handleAddChapter}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
          >
            <FiPlus className="text-sm" />
            <span className="sm:inline">Add Chapter</span>
          </button>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchChapters}
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
            to="/series"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-lg" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Chapters
            </h1>
            {seriesInfo && (
              <p className="text-gray-600">
                {seriesInfo.name} • {seriesInfo.totalChapters} chapters
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleAddChapter}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
        >
          <FiPlus className="text-sm" />
          <span className="sm:inline">Add Chapter</span>
        </button>
      </div>

      {/* Chapters Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chapter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chapters.map((chapter) => (
                <tr key={chapter.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                        <FiFileText className="text-gray-500 text-sm" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        Chapter {chapter.number}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{chapter.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        chapter.status
                      )}`}
                    >
                      {chapter.status.charAt(0).toUpperCase() +
                        chapter.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditChapter(chapter.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit chapter"
                      >
                        <FiEdit2 className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chapter.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete chapter"
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
        {chapters.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-2">📄</div>
            <p className="text-gray-600">No chapters found</p>
            <button
              onClick={handleAddChapter}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Chapter
            </button>
          </div>
        )}
      </div>

      {/* Chapters Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <FiFileText className="text-gray-500 text-sm" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Chapter {chapter.number}
                  </h3>
                </div>
                <p className="text-sm text-gray-900 mb-2 truncate">
                  {chapter.title}
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                    chapter.status
                  )}`}
                >
                  {chapter.status.charAt(0).toUpperCase() +
                    chapter.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleEditChapter(chapter.id)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit chapter"
                >
                  <FiEdit2 className="text-base" />
                </button>
                <button
                  onClick={() => handleDeleteChapter(chapter.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete chapter"
                >
                  <FiTrash2 className="text-base" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state - Mobile */}
        {chapters.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-xl mb-2">📄</div>
            <p className="text-gray-600 mb-4">No chapters found</p>
            <button
              onClick={handleAddChapter}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              Add First Chapter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
