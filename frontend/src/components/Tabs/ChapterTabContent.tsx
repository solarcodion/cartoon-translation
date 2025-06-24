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
      case "published":
        return "bg-green-100 text-green-800";
      case "translated":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "Translated";
      case "translated":
        return "In progress";
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
}

export function TranslationMemoryTabContent({
  activeTab,
  translationMemoryData,
  openDropdown,
  onSetOpenDropdown,
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
                    <span className="text-sm text-gray-900">{entry.usage}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative dropdown-container inline-block">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetOpenDropdown(
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
                              onSetOpenDropdown(null);
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
                              onSetOpenDropdown(null);
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
    </TabContent>
  );
}

// AI Glossary Tab Content
interface AIGlossaryTabContentProps {
  activeTab: string;
  glossaryData: GlossaryCharacter[];
}

export function AIGlossaryTabContent({
  activeTab,
  glossaryData,
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
