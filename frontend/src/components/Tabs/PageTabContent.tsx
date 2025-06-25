// Page Tab Content Components

import { useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiImage,
  FiZap,
  FiSave,
  FiChevronDown,
} from "react-icons/fi";
import { BiSolidEdit } from "react-icons/bi";
import { TabContent } from "../common";
import { SimplePageHeader } from "../Header/PageHeader";
import { PagesTable } from "../Lists";
import type { Page, ChapterInfo } from "../../types";

// Pages Tab Content
interface PagesTabContentProps {
  activeTab: string;
  pages: Page[];
  chapterInfo: ChapterInfo | null;
  onUploadPage: () => void;
  onEditPage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
}

export function PagesTabContent({
  activeTab,
  pages,
  chapterInfo,
  onUploadPage,
  onEditPage,
  onDeletePage,
}: PagesTabContentProps) {
  return (
    <TabContent activeTab={activeTab} tabId="pages">
      <>
        {/* Pages for Chapter Header */}
        <div className="mb-4">
          <SimplePageHeader
            title={`Pages for Chapter ${chapterInfo?.number}`}
            action={
              <button
                onClick={onUploadPage}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <FiPlus className="text-sm" />
                Upload Page
              </button>
            }
          />
        </div>

        {/* Pages Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <PagesTable
            pages={pages}
            onEditPage={onEditPage}
            onDeletePage={onDeletePage}
            onUploadPage={onUploadPage}
          />
        </div>
      </>
    </TabContent>
  );
}

// Translations Tab Content
interface TranslationsTabContentProps {
  activeTab: string;
  chapterInfo: ChapterInfo | null;
  selectedPage: string;
  isPageDropdownOpen: boolean;
  hoveredTMBadge: string | null;
  onSetSelectedPage: (page: string) => void;
  onSetIsPageDropdownOpen: (open: boolean) => void;
  onSetHoveredTMBadge: (id: string | null) => void;
}

export function TranslationsTabContent({
  activeTab,
  chapterInfo,
  selectedPage,
  isPageDropdownOpen,
  hoveredTMBadge,
  onSetSelectedPage,
  onSetIsPageDropdownOpen,
  onSetHoveredTMBadge,
}: TranslationsTabContentProps) {
  return (
    <TabContent activeTab={activeTab} tabId="translations">
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
                onClick={() => onSetIsPageDropdownOpen(!isPageDropdownOpen)}
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
                        onSetSelectedPage(page);
                        onSetIsPageDropdownOpen(false);
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
                  <span className="text-sm font-medium text-gray-900">P.1</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center w-12 h-16 bg-gray-100 rounded border">
                    <FiImage className="text-gray-400 text-sm" />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">100,200,300,50</span>
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
                    onMouseEnter={() => onSetHoveredTMBadge("tm-1")}
                    onMouseLeave={() => onSetHoveredTMBadge(null)}
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
              {/* Additional sample rows would go here */}
            </tbody>
          </table>
        </div>
      </div>
    </TabContent>
  );
}

// Context Tab Content
interface ContextTabContentProps {
  activeTab: string;
  chapterInfo: ChapterInfo | null;
  contextNotes?: string;
  onSaveNotes?: (notes: string) => void;
}

export function ContextTabContent({
  activeTab,
  chapterInfo,
  contextNotes = "This chapter introduces the main character and the system. Emphasize the MC's initial weakness and desperation.",
  onSaveNotes,
}: ContextTabContentProps) {
  const [notes, setNotes] = useState(contextNotes);

  const handleSave = () => {
    if (onSaveNotes) {
      onSaveNotes(notes);
    } else {
      console.log("Save notes:", notes);
    }
  };

  return (
    <TabContent activeTab={activeTab} tabId="context">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Context Notes for Chapter {chapterInfo?.number}
              </h2>
              <p className="text-sm text-gray-600">
                Add or edit notes specific to this chapter. This can include
                character motivations, plot points, specific terminology, or
                tone guidelines for translators and editors.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter context notes for this chapter..."
            />
          </div>

          <div className="flex justify-start">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <FiSave className="text-sm" />
              Save Notes
            </button>
          </div>
        </div>
      </div>
    </TabContent>
  );
}
