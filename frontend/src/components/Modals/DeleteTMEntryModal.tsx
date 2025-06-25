import { useState } from "react";
import { FiX, FiTrash2, FiAlertTriangle, FiMessageSquare } from "react-icons/fi";
import type { TranslationMemory } from "../../types";

interface DeleteTMEntryModalProps {
  tmEntry: TranslationMemory | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (tmId: string) => Promise<void>;
}

export default function DeleteTMEntryModal({
  tmEntry,
  isOpen,
  onClose,
  onDelete,
}: DeleteTMEntryModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!tmEntry) return;

    try {
      setIsLoading(true);
      await onDelete(tmEntry.id);
      onClose();
    } catch (error) {
      console.error("Error deleting TM entry:", error);
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

  if (!isOpen || !tmEntry) return null;

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
                Delete TM Entry
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
        <div className="p-6" onKeyDown={handleKeyPress} tabIndex={-1}>
          {/* Warning Message */}
          <div className="mb-6">
            <p className="text-gray-900 mb-2">
              Are you sure you want to delete this translation memory entry?
            </p>
            <p className="text-sm text-gray-600">
              This will permanently remove the translation and its usage history.
            </p>
          </div>

          {/* TM Entry Info */}
          <div className="flex items-start gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full mt-1">
              <FiMessageSquare className="text-gray-500 text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Source:</p>
                <p className="text-sm text-gray-900 break-words">{tmEntry.source}</p>
              </div>
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Target:</p>
                <p className="text-sm text-gray-900 break-words">{tmEntry.target}</p>
              </div>
              {tmEntry.context && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">Context:</p>
                  <p className="text-sm text-gray-600 break-words">{tmEntry.context}</p>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Usage: {tmEntry.usage} times</span>
              </div>
            </div>
          </div>

          {/* Warning Box */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="text-yellow-600 text-lg mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  Warning: This action is irreversible
                </h4>
                <p className="text-xs text-yellow-700">
                  Deleting this translation memory entry will permanently remove:
                </p>
                <ul className="text-xs text-yellow-700 mt-1 ml-4 list-disc">
                  <li>The source and target text translations</li>
                  <li>Context information and notes</li>
                  <li>Usage statistics and history</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <FiTrash2 className="text-sm" />
            Delete Entry
          </button>
        </div>
      </div>
    </div>
  );
}
