import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiPlus,
  FiTrash2,
  FiArrowLeft,
  FiFileText,
  FiRefreshCw,
  FiMoreHorizontal,
} from "react-icons/fi";
import { BiSolidEdit } from "react-icons/bi";
import { LuBrain, LuTag } from "react-icons/lu";
import { MdGTranslate } from "react-icons/md";

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

interface TranslationMemory {
  id: string;
  source: string;
  target: string;
  context: string;
  usage: number;
}

interface GlossaryCharacter {
  id: string;
  name: string;
  summary: string;
  mentionedChapters: number[];
  status: "Ongoing" | "All";
  image?: string;
}

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

  // Sample translation memory data
  const translationMemoryData: TranslationMemory[] = [
    {
      id: "1",
      source: "Level up",
      target: "Nâng cấp",
      context: "System message",
      usage: 15,
    },
    {
      id: "2",
      source: "Shadow Monarch",
      target: "Quân Vương Bóng Tối",
      context: "Title",
      usage: 25,
    },
    {
      id: "3",
      source: "System Message: You have awakened.",
      target: "Thông báo hệ thống: Bạn đã thức tỉnh.",
      context: "System alert",
      usage: 5,
    },
  ];

  // Sample glossary data
  const glossaryData: GlossaryCharacter[] = [
    {
      id: "1",
      name: "Sung Jinwoo",
      summary:
        "The protagonist, initially known as the 'World's Weakest Hunter.' Undergoes a unique reawakening, granting him the ability to level up and grow stronger by completing quests within a mysterious 'System.' Known for his determination and rapid growth. (Updated by AI)",
      mentionedChapters: [1],
      status: "Ongoing",
    },
    {
      id: "2",
      name: "Cha Hae-In",
      summary:
        "An S-rank Hunter and Vice-Guild Master of the Hunters Guild. Possesses a unique ability to smell mana, which often causes her discomfort around other hunters. Known for her exceptional swordsmanship and stoic demeanor. (Updated by AI)",
      mentionedChapters: [45],
      status: "Ongoing",
    },
    {
      id: "3",
      name: "Hunter",
      summary:
        "An individual who has awakened magical abilities and fights monsters in dungeons and gates. (Updated by AI)",
      mentionedChapters: [],
      status: "All",
    },
  ];

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
        <div className="flex items-center gap-2">
          <Link
            to="/series"
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
          >
            <FiArrowLeft className="text-lg" />
            <span className="text-sm">Back to Series List</span>
          </Link>
        </div>

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
      <div className="space-y-8">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Link
            to="/series"
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
          >
            <FiArrowLeft className="text-lg" />
            <span className="text-sm">Back to Series List</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Series: Error</h1>
          <p className="text-gray-600">
            Manage chapters, translation memory, and AI-generated glossary for
            this series.
          </p>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchChapters}
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
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center gap-2">
        <Link
          to="/series"
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
        >
          <FiArrowLeft className="text-lg" />
          <span className="text-sm">Back to Series List</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-2 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          Series: {seriesInfo?.name || "Loading..."}
        </h1>
        <p className="text-gray-600">
          Manage chapters, translation memory, and AI-generated glossary for
          this series.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex w-full">
          <button
            onClick={() => setActiveTab("chapters")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 border-r border-gray-200 cursor-pointer ${
              activeTab === "chapters"
                ? "bg-gray-50 text-gray-900 font-medium"
                : "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            }`}
          >
            <FiFileText className="text-sm" />
            Chapters
          </button>
          <button
            onClick={() => setActiveTab("translation")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 border-r border-gray-200 cursor-pointer ${
              activeTab === "translation"
                ? "bg-gray-50 text-gray-900 font-medium"
                : "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            }`}
          >
            <MdGTranslate className="text-sm" />
            Translation Memory
          </button>
          <button
            onClick={() => setActiveTab("glossary")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 cursor-pointer ${
              activeTab === "glossary"
                ? "bg-gray-50 text-gray-900 font-medium"
                : "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            }`}
          >
            <LuBrain className="text-sm" />
            AI Glossary
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "chapters" && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Chapters</h2>
              <button
                onClick={handleAddChapter}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <FiPlus className="text-sm" />
                Add Chapter
              </button>
            </div>
          </div>

          {/* Chapters Table */}
          <div className="overflow-hidden mx-6 mb-6 mt-2 border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Chapter No.
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {chapters.map((chapter) => (
                  <tr
                    key={chapter.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/series/${seriesId}/chapters/${chapter.id}/pages`
                      )
                    }
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        Chapter {chapter.number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          chapter.status === "published"
                            ? "bg-green-100 text-green-800"
                            : chapter.status === "translated"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {chapter.status === "published"
                          ? "Translated"
                          : chapter.status === "translated"
                          ? "In progress"
                          : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditChapter(chapter.id);
                          }}
                          className="p-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit chapter"
                        >
                          <BiSolidEdit className="text-lg" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteChapter(chapter.id);
                          }}
                          className="p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete chapter"
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty state */}
            {chapters.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-xl mb-2">📄</div>
                <p className="text-gray-600">No chapters found</p>
                <button
                  onClick={handleAddChapter}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Add First Chapter
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Translation Memory Section */}
      {activeTab === "translation" && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Translation Memory
                </h2>
                <p className="text-sm text-gray-600">
                  Series-specific terms and translations.
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <FiPlus className="text-sm" />
                Add Entry
              </button>
            </div>
          </div>

          <div className="overflow-hidden mx-6 mb-6 mt-2 border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Source
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Target
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Context
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Usage
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {translationMemoryData.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {entry.source}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {entry.target}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {entry.context}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {entry.usage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative dropdown-container inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(
                              openDropdown === entry.id ? null : entry.id
                            );
                          }}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 cursor-pointer"
                        >
                          <FiMoreHorizontal className="text-lg" />
                        </button>

                        {openDropdown === entry.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(null);
                                // Handle edit action
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer rounded-t-lg"
                            >
                              <BiSolidEdit className="text-sm" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(null);
                                // Handle delete action
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer rounded-b-lg"
                            >
                              <FiTrash2 className="text-sm" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Glossary Section */}
      {activeTab === "glossary" && (
        <div>
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  AI-Generated Series Glossary
                </h2>
                <p className="text-sm text-gray-600">
                  Characters, terms, and lore automatically identified and
                  summarized by AI.
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <FiRefreshCw className="text-sm" />
                Refresh Glossary
              </button>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {glossaryData.map((character) => (
                <div
                  key={character.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Character Image with Name Overlay */}
                  <div className="relative h-128 bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 text-xl">📷</span>
                    </div>
                    {/* Character Name Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 flex flex-col justify-end">
                      <h3 className="text-xl font-semibold text-white">
                        {character.name}
                      </h3>
                    </div>
                  </div>

                  {/* Character Info */}
                  <div className="p-4">
                    {/* AI Summary */}
                    <div className="mb-3">
                      <div className="flex items-center gap-1 mb-1">
                        <LuBrain className="text-xs text-gray-500" />
                        <span className="text-xs text-gray-500">
                          AI Summary
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {character.summary}
                      </p>
                    </div>

                    {/* Mentioned in Chapters */}
                    <div className="mb-3">
                      <div className="flex items-center gap-1 mb-1">
                        <LuTag className="text-xs text-gray-500" />
                        <span className="text-xs text-gray-500">
                          Mentioned in Chapters
                        </span>
                      </div>
                    </div>

                    {/* Status with Chapter Numbers */}
                    <div className="text-xs bg-gray-100 border border-gray-300 text-gray-600 px-3 py-1 rounded-full inline-block">
                      {character.mentionedChapters.length > 0
                        ? `${character.mentionedChapters.join(", ")}-${
                            character.status
                          }`
                        : character.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
