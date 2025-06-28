// Page Tab Content Components

import { useState, useEffect, useMemo } from "react";
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
import { chapterService } from "../../services/chapterService";

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
  pages: Page[]; // Add pages prop for page number mapping
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
  pages,
  onSetSelectedPage,
  onSetIsPageDropdownOpen,
  onSetHoveredTMBadge,
  onAddTextBox,
  refreshTrigger,
}: TranslationsTabContentProps) {
  const [textBoxes, setTextBoxes] = useState<TextBoxApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a mapping from page_id to page_number
  const pageIdToNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    pages.forEach((page) => {
      map.set(page.id, page.number);
    });
    return map;
  }, [pages]);

  // Quick edit state
  const [editingTextBoxId, setEditingTextBoxId] = useState<string | null>(null);
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
          chapterId
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
      : textBoxes.filter((tb) => {
          const pageNumber = pageIdToNumberMap.get(tb.page_id);
          return pageNumber ? `Page ${pageNumber}` === selectedPage : false;
        });

  const handleStartQuickEdit = (textBox: TextBoxApiItem) => {
    setEditingTextBoxId(textBox.id);
    setEditingText(textBox.corrected || "");
  };

  const handleCancelQuickEdit = () => {
    setEditingTextBoxId(null);
    setEditingText("");
  };

  const handleSaveQuickEdit = async (textBoxId: string) => {
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
    textBoxId: string,
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

  const handleConfirmDeleteTextBox = async (textBoxId: string) => {
    try {
      await textBoxService.deleteTextBox(textBoxId);
      setTextBoxes((prev) => prev.filter((tb) => tb.id !== textBoxId));
    } catch (err) {
      console.error("Error deleting text box:", err);
      throw err; // Re-throw to let the modal handle the error
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
            <button
              onClick={onAddTextBox}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
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
                    ...pages
                      .sort((a, b) => a.number - b.number)
                      .map((page) => `Page ${page.number}`),
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
                        P.{pageIdToNumberMap.get(textBox.page_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {textBox.image ? (
                        <img
                          src={textBox.image}
                          alt="Cropped text area"
                          className="w-20 h-20 object-contain rounded"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded ">
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
  onSaveNotes?: (notes: string) => Promise<void> | void;
  pages?: Page[];
  chapterId?: string;
  onContextUpdate?: (context: string) => void;
}

export function ContextTabContent({
  activeTab,
  chapterInfo,
  contextNotes = "",
  onSaveNotes,
  pages = [],
  chapterId,
  onContextUpdate,
}: ContextTabContentProps) {
  const [notes, setNotes] = useState(contextNotes);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);

  // Update notes when contextNotes prop changes
  useEffect(() => {
    setNotes(contextNotes);
  }, [contextNotes]);

  const handleSave = async () => {
    if (!onSaveNotes) {
      return;
    }

    setIsSaving(true);
    try {
      // Call the save function and await if it's a promise
      await Promise.resolve(onSaveNotes(notes));

      // Show success feedback
      setSaveComplete(true);
      setTimeout(() => setSaveComplete(false), 2000);
    } catch (error) {
      console.error("❌ Failed to save context notes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!chapterId || !pages.length) {
      console.error("Chapter ID or pages missing for analysis");
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysisRequest = {
        pages: pages
          .filter((page) => {
            // Filter out invalid pages before processing
            const isValid =
              page &&
              typeof page.number === "number" &&
              page.number > 0 &&
              typeof page.image_url === "string" &&
              page.image_url.trim().length > 0;

            if (!isValid) {
              console.warn("❌ Filtering out invalid page:", page);
            }

            return isValid;
          })
          .sort((a, b) => a.number - b.number)
          .map((page) => ({
            page_number: page.number,
            image_url: page.image_url.trim(),
            ocr_context:
              page.context && page.context.trim()
                ? page.context.trim()
                : undefined,
          })),
        translation_info: [
          "Maintain natural Vietnamese flow and readability",
          "Preserve character names and proper nouns",
          "Adapt cultural references appropriately",
        ],
        existing_context:
          chapterInfo?.context && chapterInfo.context.trim()
            ? chapterInfo.context.trim()
            : undefined,
      };

      // Validate request before sending
      if (!analysisRequest.pages.length) {
        throw new Error("No valid pages found for analysis");
      }

      // Validate each page has required fields
      for (const page of analysisRequest.pages) {
        if (!page.page_number || !page.image_url) {
          throw new Error(
            `Invalid page data: page_number=${page.page_number}, image_url=${page.image_url}`
          );
        }
      }

      const result = await chapterService.analyzeChapter(
        chapterId,
        analysisRequest
      );

      // Update the notes with the new context from the analysis
      setNotes(result.chapter_context);

      // Call the context update callback to update parent state
      if (onContextUpdate) {
        onContextUpdate(result.chapter_context);
      }

      // Automatically save the updated context to the backend
      if (onSaveNotes) {
        onSaveNotes(result.chapter_context);
      }

      // Show success feedback
      setAnalysisComplete(true);
      setTimeout(() => setAnalysisComplete(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error("❌ Chapter analysis failed:", error);

      // Log detailed error information
      if (error instanceof Error) {
        console.error("❌ Error message:", error.message);
        console.error("❌ Error stack:", error.stack);
      }

      // If it's a network error, log the response
      if (error && typeof error === "object" && "response" in error) {
        console.error("❌ Response error:", error);
      }

      // You might want to show a toast notification here
    } finally {
      setIsAnalyzing(false);
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <div className="flex items-center gap-3">
                {saveComplete && (
                  <span className="text-sm text-green-600 font-medium">
                    ✅ Saved
                  </span>
                )}
                {analysisComplete && (
                  <span className="text-sm text-blue-600 font-medium">
                    🔄 Updated with analysis
                  </span>
                )}
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Add context notes for this chapter. This can include character motivations, plot points, specific terminology, or tone guidelines for translators and editors..."
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                saveComplete
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <FiRefreshCw className="text-sm animate-spin" />
              ) : saveComplete ? (
                <FiSave className="text-sm" />
              ) : (
                <FiSave className="text-sm" />
              )}
              {isSaving ? "Saving..." : saveComplete ? "Saved!" : "Save Notes"}
            </button>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !chapterId || !pages.length}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                analysisComplete
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              }`}
            >
              {isAnalyzing ? (
                <FiRefreshCw className="text-sm animate-spin" />
              ) : analysisComplete ? (
                <FiSave className="text-sm" />
              ) : (
                <FiZap className="text-sm" />
              )}
              {isAnalyzing
                ? "Analyzing..."
                : analysisComplete
                ? "Analysis Complete!"
                : "Analyze Chapter"}
            </button>
          </div>
        </div>
      </div>
    </TabContent>
  );
}
