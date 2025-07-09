// Chapter Tab Content Components

import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiUser,
  FiMapPin,
} from "react-icons/fi";
import { BiSolidEdit } from "react-icons/bi";
import { LuBrain, LuTag, LuSword, LuSparkles, LuCircle } from "react-icons/lu";
import {
  EmptyState,
  TabContent,
  ChaptersTableSkeleton,
  TranslationMemoryTableSkeleton,
  AIGlossaryGridSkeleton,
  Pagination,
} from "../common";
import DropdownMenu from "../common/DropdownMenu";
import type {
  Chapter,
  TranslationMemory,
  GlossaryCharacter,
} from "../../types";
import { getSeriesById } from "../../stores/seriesStore";
import { getLanguageLabel } from "../../constants/languages";

// Chapters Tab Content
interface ChaptersTabContentProps {
  activeTab: string;
  chapters: Chapter[];
  seriesId: string;
  onAddChapter?: () => void;
  onEditChapter?: (chapterId: string) => void;
  onDeleteChapter?: (chapterId: string) => void;
  canModify?: boolean;
  isLoading?: boolean;
  pagination?: {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
  };
}

export function ChaptersTabContent({
  activeTab,
  chapters,
  seriesId,
  onAddChapter,
  onEditChapter,
  onDeleteChapter,
  canModify = true,
  isLoading = false,
  pagination,
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
            {canModify && onAddChapter && (
              <button
                onClick={onAddChapter}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <FiPlus className="text-sm" />
                Add Chapter
              </button>
            )}
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
              {isLoading ? (
                <ChaptersTableSkeleton rows={3} />
              ) : (
                chapters.map((chapter) => (
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
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          chapter.status
                        )}`}
                      >
                        {getStatusText(chapter.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {canModify && onEditChapter && (
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
                        )}
                        {canModify && onDeleteChapter && (
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
                        )}
                        {!canModify && (
                          <span className="text-sm text-gray-400 italic">
                            View only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Empty state - only show when not loading and no chapters */}
          {!isLoading && chapters.length === 0 && (
            <EmptyState
              icon="📖"
              title="No chapters found"
              description={
                canModify
                  ? "Add chapters to get started"
                  : "No chapters available"
              }
              action={
                canModify && onAddChapter ? (
                  <button
                    onClick={onAddChapter}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Add First Chapter
                  </button>
                ) : null
              }
            />
          )}

          {/* Pagination */}
          {pagination && (
            <Pagination
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.onPageChange}
              onItemsPerPageChange={pagination.onItemsPerPageChange}
              disabled={isLoading}
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
  onAddEntry?: () => void;
  onEditEntry?: (tmId: string) => void;
  onDeleteEntry?: (tmId: string) => void;
  canModifyTM?: boolean;
  isLoading?: boolean;
  pagination?: {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
  };
}

export function TranslationMemoryTabContent({
  activeTab,
  translationMemoryData,
  openDropdown,
  onSetOpenDropdown,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  canModifyTM = true,
  isLoading = false,
  pagination,
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
            {canModifyTM && onAddEntry && (
              <button
                onClick={onAddEntry}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <FiPlus className="text-sm" />
                Add Entry
              </button>
            )}
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
                <TranslationMemoryTableSkeleton rows={3} />
              ) : translationMemoryData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium mb-2">
                        No translation memory entries
                      </p>
                      <p className="text-sm">
                        {canModifyTM
                          ? "Add your first translation to get started."
                          : "No translation memory entries available."}
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
                      {canModifyTM && onEditEntry && onDeleteEntry ? (
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
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          View only
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Always show but disable when no data */}
        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.onPageChange}
            onItemsPerPageChange={pagination.onItemsPerPageChange}
            disabled={isLoading || pagination.totalItems === 0}
          />
        )}
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
  isLoading?: boolean;
}

export function AIGlossaryTabContent({
  activeTab,
  glossaryData,
  seriesId,
  onRefreshGlossary,
  isRefreshing = false,
  isLoading = false,
}: AIGlossaryTabContentProps) {
  // Get series data to determine language
  const seriesData = seriesId ? getSeriesById(seriesId) : null;
  const seriesLanguage = seriesData?.language || "vietnamese";
  const languageLabel = getLanguageLabel(seriesLanguage);

  return (
    <TabContent activeTab={activeTab} tabId="glossary">
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                AI-Generated Manhwa Terminology
              </h2>
              <p className="text-sm text-gray-600">
                Characters, items, places, terms, and other manhwa-specific
                terminology automatically identified with translations.
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
              {isRefreshing
                ? "Analyzing Terminology..."
                : "Analyze Terminology"}
            </button>
          </div>
        </div>

        <div>
          {isLoading ? (
            <AIGlossaryGridSkeleton cards={6} />
          ) : glossaryData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg font-medium mb-2">
                  No AI glossary entries found
                </p>
                <p className="text-sm">
                  Click "Analyze Terminology" to generate AI-powered glossary
                  entries.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {glossaryData.map((character) => (
                <div
                  key={character.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Term Image with Name Overlay */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center overflow-hidden">
                    <div
                      className={`w-full h-full rounded-lg flex items-center justify-center ${
                        character.category === "character"
                          ? "bg-blue-400"
                          : character.category === "item"
                          ? "bg-orange-400"
                          : character.category === "place"
                          ? "bg-green-400"
                          : character.category === "term"
                          ? "bg-purple-400"
                          : character.category === "other"
                          ? "bg-gray-400"
                          : "bg-gray-400"
                      }`}
                    >
                      {/* Dynamic icon based on category */}
                      {character.category === "character" && (
                        <FiUser className="text-white text-4xl" />
                      )}
                      {character.category === "item" && (
                        <LuSword className="text-white text-4xl" />
                      )}
                      {character.category === "place" && (
                        <FiMapPin className="text-white text-4xl" />
                      )}
                      {character.category === "term" && (
                        <LuSparkles className="text-white text-4xl" />
                      )}
                      {character.category === "other" && (
                        <LuCircle className="text-white text-4xl" />
                      )}
                      {!character.category && (
                        <LuTag className="text-white text-4xl" />
                      )}
                    </div>
                    {/* Term Name Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 flex flex-col justify-end">
                      <h3 className="text-xl font-semibold text-white">
                        {character.name}
                      </h3>
                    </div>
                  </div>

                  {/* Term Info */}
                  <div className="p-4">
                    {/* Category Badge */}
                    {character.category && (
                      <div className="mb-3">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {character.category}
                        </span>
                      </div>
                    )}

                    {/* Dynamic Language Description */}
                    {character.summary && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 mb-1">
                          <LuBrain className="text-xs text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {languageLabel} Description
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {character.summary}
                        </p>
                      </div>
                    )}

                    {/* English Translation */}
                    {character.translatedText && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 mb-1">
                          <LuTag className="text-xs text-gray-500" />
                          <span className="text-xs text-gray-500">
                            English Translation
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {character.translatedText}
                        </p>
                      </div>
                    )}

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
          )}
        </div>
      </div>
    </TabContent>
  );
}
