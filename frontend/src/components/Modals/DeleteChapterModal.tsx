import { useState } from "react";
import { FiX, FiTrash2, FiAlertTriangle, FiFileText } from "react-icons/fi";
import type { Chapter } from "../../types";

interface DeleteChapterModalProps {
  chapter: Chapter | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (chapterId: string) => Promise<void>;
}

export default function DeleteChapterModal({
  chapter,
  isOpen,
  onClose,
  onDelete,
}: DeleteChapterModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!chapter) return;

    try {
      setIsLoading(true);
      await onDelete(chapter.id);
      onClose();
    } catch (error) {
      console.error("Error deleting chapter:", error);
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
    if (e.key === "Enter" && !isLoading) {
      handleDelete();
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
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
              <FiAlertTriangle className="text-red-600 text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Delete Chapter
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                This action cannot be undone.
              </p>
            </div>
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
                Chapter {chapter.number} • {chapter.status}
              </p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="text-red-600 text-lg mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-red-800 font-medium text-sm">
                  Are you sure you want to delete this chapter?
                </h4>
                <p className="text-red-700 text-sm mt-1">
                  This will permanently remove the chapter and all its associated data. 
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Text */}
          <p className="text-gray-600 text-sm">
            Type the chapter number <strong>{chapter.number}</strong> to confirm deletion.
          </p>
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
            onClick={handleDelete}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <FiTrash2 className="text-sm" />
                Delete Chapter
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
