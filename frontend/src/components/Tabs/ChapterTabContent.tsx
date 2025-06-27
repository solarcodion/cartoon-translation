// Chapter Tab Content Components

import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiMoreHorizontal,
} from "react-icons/fi";
import { BiSolidEdit } from "react-icons/bi";
import { LuBrain, LuTag } from "react-icons/lu";
import { EmptyState, TabContent } from "../common";
import DropdownMenu from "../common/DropdownMenu";
import type {
  Chapter,
  TranslationMemory,
  GlossaryCharacter,
} from "../../types";

// Chapters Tab Content
interface ChaptersTabContentProps {
  activeTab: string;
  chapters: Chapter[];
  seriesId: string;
  onAddChapter: () => void;
  onEditChapter: (chapterId: string) => void;
  onDeleteChapter: (chapterId: string) => void;
}

export function ChaptersTabContent({
  activeTab,
  chapters,
  seriesId,
  onAddChapter,
  onEditChapter,
  onDeleteChapter,
}: ChaptersTabContentProps) {
  const navigate = useNavigate();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "translated":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "translated":
        return "Translated";
      case "in_progress":
        return "In Progress";
      case "draft":
        return "Draft";
      default:
        return "Draft";
    }
  };

  return (
    <TabContent activeTab={activeTab} tabId="chapters">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Chapters</h2>
            <button
              onClick={onAddChapter}
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
                    navigate(`/series/${seriesId}/chapters/${chapter.id}/pages`)
                  }
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      Chapter {chapter.number}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        chapter.status
                      )}`}
                    >
                      {getStatusText(chapter.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEditChapter(chapter.id);
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
                          onDeleteChapter(chapter.id);
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
            <EmptyState
              icon="📖"
              title="No chapters found"
              description="Add chapters to get started"
              action={
                <button
                  onClick={onAddChapter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Add First Chapter
                </button>
              }
            />
          )}
        </div>
      </div>
    </TabContent>
  );
}

// Translation Memory Tab Content
interface TranslationMemoryTabContentProps {
  activeTab: string;
  translationMemoryData: TranslationMemory[];
  openDropdown: string | null;
  onSetOpenDropdown: (id: string | null) => void;
  onAddEntry: () => void;
  onEditEntry: (tmId: string) => void;
  onDeleteEntry: (tmId: string) => void;
  isLoading?: boolean;
}

export function TranslationMemoryTabContent({
  activeTab,
  translationMemoryData,
  openDropdown,
  onSetOpenDropdown,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  isLoading = false,
}: TranslationMemoryTabContentProps) {
  return (
    <TabContent activeTab={activeTab} tabId="translation">
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
            <button
              onClick={onAddEntry}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <FiPlus className="text-sm" />
              Add Entry
            </button>
          </div>
        </div>

        <div className="overflow-x-auto mx-6 mb-6 mt-2 border border-gray-200 rounded-lg">
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
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mr-3"></div>
                      <span className="text-gray-600">
                        Loading translation memory...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : translationMemoryData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium mb-2">
                        No translation memory entries
                      </p>
                      <p className="text-sm">
                        Add your first translation to get started.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                translationMemoryData.map((entry) => (
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
                      <DropdownMenu
                        items={[
                          {
                            label: "Edit",
                            icon: <BiSolidEdit className="text-sm" />,
                            onClick: () => onEditEntry(entry.id),
                            className: "text-gray-700",
                          },
                          {
                            label: "Delete",
                            icon: <FiTrash2 className="text-sm" />,
                            onClick: () => onDeleteEntry(entry.id),
                            className: "text-red-600 hover:bg-red-50",
                          },
                        ]}
                        isOpen={openDropdown === entry.id}
                        onToggle={() =>
                          onSetOpenDropdown(
                            openDropdown === entry.id ? null : entry.id
                          )
                        }
                        onClose={() => onSetOpenDropdown(null)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </TabContent>
  );
}

// AI Glossary Tab Content
interface AIGlossaryTabContentProps {
  activeTab: string;
  glossaryData: GlossaryCharacter[];
  seriesId?: string;
  onRefreshGlossary?: () => void;
  isRefreshing?: boolean;
}

export function AIGlossaryTabContent({
  activeTab,
  glossaryData,
  seriesId,
  onRefreshGlossary,
  isRefreshing = false,
}: AIGlossaryTabContentProps) {
  return (
    <TabContent activeTab={activeTab} tabId="glossary">
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
            <button
              onClick={onRefreshGlossary}
              disabled={isRefreshing || !seriesId}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw
                className={`text-sm ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Analyzing..." : "Refresh Glossary"}
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
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center overflow-hidden">
                  {character.image ? (
                    <img
                      src={character.image}
                      alt={character.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center ${
                      character.image ? "hidden" : ""
                    }`}
                  >
                    <span className="text-gray-600 text-xl">👤</span>
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
                      <span className="text-xs text-gray-500">AI Summary</span>
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
    </TabContent>
  );
}
