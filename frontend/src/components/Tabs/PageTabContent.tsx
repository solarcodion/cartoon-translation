// Page Tab Content Components

import { useState, useEffect } from "react";
import {
  FiPlus,
  FiTrash2,
  FiImage,
  FiZap,
  FiSave,
  FiChevronDown,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { BiSolidEdit } from "react-icons/bi";
import { TabContent, SectionLoadingSpinner } from "../common";
import { SimplePageHeader } from "../Header/PageHeader";
import { PagesTable } from "../Lists";
import EditTextBoxModal from "../Modals/EditTextBoxModal";
import DeleteTextBoxModal from "../Modals/DeleteTextBoxModal";
import type { Page, ChapterInfo } from "../../types";
import {
  textBoxService,
  type TextBoxApiItem,
} from "../../services/textBoxService";
import type { TextBoxApiUpdate } from "../../types/textbox";

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
  chapterId: string;
  selectedPage: string;
  isPageDropdownOpen: boolean;
  hoveredTMBadge: string | null;
  onSetSelectedPage: (page: string) => void;
  onSetIsPageDropdownOpen: (open: boolean) => void;
  onSetHoveredTMBadge: (id: string | null) => void;
  onAddTextBox: () => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

export function TranslationsTabContent({
  activeTab,
  chapterInfo,
  chapterId,
  selectedPage,
  isPageDropdownOpen,
  hoveredTMBadge,
  onSetSelectedPage,
  onSetIsPageDropdownOpen,
  onSetHoveredTMBadge,
  onAddTextBox,
  refreshTrigger,
}: TranslationsTabContentProps) {
  const [textBoxes, setTextBoxes] = useState<TextBoxApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick edit state
  const [editingTextBoxId, setEditingTextBoxId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTextBox, setSelectedTextBox] = useState<TextBoxApiItem | null>(
    null
  );

  // Fetch text boxes for the chapter
  useEffect(() => {
    const fetchTextBoxes = async () => {
      if (!chapterId) return;

      try {
        setIsLoading(true);
        setError(null);
        const fetchedTextBoxes = await textBoxService.getTextBoxesByChapter(
          parseInt(chapterId)
        );
        setTextBoxes(fetchedTextBoxes);
      } catch (err) {
        console.error("Error fetching text boxes:", err);
        setError("Failed to load text boxes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTextBoxes();
  }, [chapterId, refreshTrigger]); // Add refreshTrigger to dependencies

  // Filter text boxes by selected page
  const filteredTextBoxes =
    selectedPage === "All Pages"
      ? textBoxes
      : textBoxes.filter((tb) => `Page ${tb.page_id}` === selectedPage);

  const handleStartQuickEdit = (textBox: TextBoxApiItem) => {
    setEditingTextBoxId(textBox.id);
    setEditingText(textBox.corrected || "");
  };

  const handleCancelQuickEdit = () => {
    setEditingTextBoxId(null);
    setEditingText("");
  };

  const handleSaveQuickEdit = async (textBoxId: number) => {
    try {
      await textBoxService.updateTextBox(textBoxId, {
        corrected: editingText.trim() || undefined,
      });

      // Update the local state
      setTextBoxes((prev) =>
        prev.map((tb) =>
          tb.id === textBoxId
            ? { ...tb, corrected: editingText.trim() || undefined }
            : tb
        )
      );

      // Exit edit mode
      setEditingTextBoxId(null);
      setEditingText("");
    } catch (err) {
      console.error("Error updating text box:", err);
    }
  };

  // Modal handlers
  const handleOpenEditModal = (textBox: TextBoxApiItem) => {
    setSelectedTextBox(textBox);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTextBox(null);
  };

  const handleSaveTextBoxEdit = async (
    textBoxId: number,
    updateData: TextBoxApiUpdate
  ) => {
    try {
      const updatedTextBox = await textBoxService.updateTextBox(
        textBoxId,
        updateData
      );

      // Update the local state
      setTextBoxes((prev) =>
        prev.map((tb) => (tb.id === textBoxId ? updatedTextBox : tb))
      );
    } catch (err) {
      console.error("Error updating text box:", err);
      throw err; // Re-throw to let the modal handle the error
    }
  };

  const handleOpenDeleteModal = (textBox: TextBoxApiItem) => {
    setSelectedTextBox(textBox);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTextBox(null);
  };

  const handleConfirmDeleteTextBox = async (textBoxId: number) => {
    try {
      await textBoxService.deleteTextBox(textBoxId);
      setTextBoxes((prev) => prev.filter((tb) => tb.id !== textBoxId));
    } catch (err) {
      console.error("Error deleting text box:", err);
      throw err; // Re-throw to let the modal handle the error
    }
  };

  // Function to manually refresh text boxes
  const refreshTextBoxes = async () => {
    if (!chapterId) return;

    try {
      setIsLoading(true);
      setError(null);
      const fetchedTextBoxes = await textBoxService.getTextBoxesByChapter(
        parseInt(chapterId)
      );
      setTextBoxes(fetchedTextBoxes);
    } catch (err) {
      console.error("Error refreshing text boxes:", err);
      setError("Failed to refresh text boxes");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <TabContent activeTab={activeTab} tabId="translations">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Translations for Chapter {chapterInfo?.number}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshTextBoxes}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh text boxes"
              >
                <FiRefreshCw
                  className={`text-sm ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={onAddTextBox}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <FiPlus className="text-sm" />
                Add Text Box
              </button>
            </div>
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
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <SectionLoadingSpinner />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="text-red-600">{error}</div>
                  </td>
                </tr>
              ) : filteredTextBoxes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      {selectedPage === "All Pages"
                        ? "No text boxes found for this chapter"
                        : `No text boxes found for ${selectedPage}`}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTextBoxes.map((textBox) => (
                  <tr key={textBox.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        P.{textBox.page_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {textBox.image ? (
                        <img
                          src={textBox.image}
                          alt="Cropped text area"
                          className="w-12 h-16 object-cover rounded border"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-12 h-16 bg-gray-100 rounded border">
                          <FiImage className="text-gray-400 text-sm" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {textBox.x},{textBox.y},{textBox.w},{textBox.h}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {textBox.ocr ? (
                          textBox.ocr.length > 30 ? (
                            `${textBox.ocr.substring(0, 30)}...`
                          ) : (
                            textBox.ocr
                          )
                        ) : (
                          <span className="text-gray-400 italic">
                            No OCR text
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingTextBoxId === textBox.id ? (
                        <div className="flex items-center gap-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={2}
                            autoFocus
                            placeholder="Enter corrected text..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.ctrlKey) {
                                handleSaveQuickEdit(textBox.id);
                              } else if (e.key === "Escape") {
                                handleCancelQuickEdit();
                              }
                            }}
                          />
                          <button
                            onClick={handleCancelQuickEdit}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-all duration-200 cursor-pointer"
                            title="Cancel (Esc)"
                          >
                            <FiX className="text-sm" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-900">
                          {textBox.corrected ? (
                            textBox.corrected.length > 30 ? (
                              `${textBox.corrected.substring(0, 30)}...`
                            ) : (
                              textBox.corrected
                            )
                          ) : (
                            <span className="text-gray-400 italic">
                              No correction
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {textBox.tm ? (
                        <span
                          className="relative inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border border-blue-500 text-blue-700 bg-blue-50 w-12 cursor-help"
                          onMouseEnter={() =>
                            onSetHoveredTMBadge(`tm-${textBox.id}`)
                          }
                          onMouseLeave={() => onSetHoveredTMBadge(null)}
                        >
                          {Math.round(textBox.tm * 100)}%
                          {hoveredTMBadge === `tm-${textBox.id}` && (
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                              Translation Memory Match
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => {
                            if (editingTextBoxId === textBox.id) {
                              handleSaveQuickEdit(textBox.id);
                            } else {
                              handleStartQuickEdit(textBox);
                            }
                          }}
                          className={`p-2 rounded-full transition-all duration-200 cursor-pointer ${
                            editingTextBoxId === textBox.id
                              ? "text-green-600 hover:text-green-800 hover:bg-green-100"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                          title={
                            editingTextBoxId === textBox.id
                              ? "Save Changes"
                              : "Quick Edit"
                          }
                        >
                          {editingTextBoxId === textBox.id ? (
                            <FiSave className="text-base" />
                          ) : (
                            <FiZap className="text-base" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(textBox)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-all duration-200 cursor-pointer"
                          title="Edit"
                        >
                          <BiSolidEdit className="text-base" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(textBox)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-all duration-200 cursor-pointer"
                          title="Delete"
                        >
                          <FiTrash2 className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Text Box Modal */}
      <EditTextBoxModal
        textBox={selectedTextBox}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveTextBoxEdit}
      />

      {/* Delete Text Box Modal */}
      <DeleteTextBoxModal
        textBox={selectedTextBox}
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={handleConfirmDeleteTextBox}
      />
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
