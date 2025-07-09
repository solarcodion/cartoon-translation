import { useState, useEffect } from "react";
import { FiX, FiFileText } from "react-icons/fi";
import type { Chapter } from "../../types";

interface EditChapterModalProps {
  chapter: Chapter | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (chapterId: string, chapterNumber: number) => Promise<void>;
}

export default function EditChapterModal({
  chapter,
  isOpen,
  onClose,
  onSave,
}: EditChapterModalProps) {
  const [chapterNumber, setChapterNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Update form when chapter changes
  useEffect(() => {
    if (chapter) {
      setChapterNumber(chapter.number.toString());
      setErrorMessage(null); // Clear error when chapter changes
    }
  }, [chapter]);

  const handleSave = async () => {
    if (!chapter || !chapterNumber.trim()) return;

    const number = parseInt(chapterNumber.trim());
    if (!number || number <= 0) return;

    try {
      setIsLoading(true);
      setErrorMessage(null); // Clear any previous errors
      await onSave(chapter.id, number);
      onClose();
    } catch (error) {
      console.error("Error updating chapter:", error);

      // Extract and set error message for display
      if (error instanceof Error) {
        const message = error.message;

        // Handle specific error cases for duplicate chapters
        if (
          message.includes("duplicate key value violates unique constraint") ||
          message.includes("chapters_series_id_chapter_number_key") ||
          message.includes("already exists") ||
          message.includes("duplicate")
        ) {
          setErrorMessage(
            `Failed to update chapter: A chapter with number '${number}' already exists in this series.`
          );
        } else if (message.includes("constraint")) {
          setErrorMessage(
            `Failed to update chapter: A chapter with number '${number}' already exists in this series.`
          );
        } else {
          setErrorMessage("Failed to update chapter. Please try again.");
        }
      } else {
        setErrorMessage("Failed to update chapter. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && chapterNumber.trim() && !isLoading) {
      handleSave();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen || !chapter) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Chapter
            </h2>
            <p className="text-sm text-gray-600 mt-1">Update chapter number.</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Chapter Info */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full">
              <FiFileText className="text-gray-500 text-xl" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{chapter.title}</h3>
              <p className="text-sm text-gray-600">
                Current: Chapter {chapter.number} • {chapter.status}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Chapter Number Input */}
            <div>
              <label
                htmlFor="chapterNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Chapter No.
              </label>
              <input
                id="chapterNumber"
                type="number"
                min="1"
                step="1"
                value={chapterNumber}
                onChange={(e) => {
                  setChapterNumber(e.target.value);
                  if (errorMessage) setErrorMessage(null); // Clear error when user starts typing
                }}
                onKeyDown={handleKeyPress}
                placeholder="1"
                disabled={isLoading}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  errorMessage ? "border-red-300" : "border-gray-300"
                }`}
                autoFocus
              />
              {errorMessage && (
                <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              !chapterNumber.trim() || isLoading || parseInt(chapterNumber) <= 0
            }
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
