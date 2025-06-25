import { useState } from "react";
import { FiX, FiTrash2, FiAlertTriangle, FiImage } from "react-icons/fi";
import type { Page } from "../../types";

interface DeletePageModalProps {
  page: Page | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (pageId: string) => Promise<void>;
}

export default function DeletePageModal({
  page,
  isOpen,
  onClose,
  onDelete,
}: DeletePageModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const handleDelete = async () => {
    if (!page || confirmationText !== page.number.toString()) return;

    try {
      setIsLoading(true);
      await onDelete(page.id);
      onClose();
      setConfirmationText("");
    } catch (error) {
      console.error("Error deleting page:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setConfirmationText("");
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && confirmationText === page?.number.toString() && !isLoading) {
      handleDelete();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  const isValidConfirmation = confirmationText === page?.number.toString();

  if (!isOpen || !page) return null;

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
                Delete Page
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
          {/* Page Info */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
              {page.image_url ? (
                <img
                  src={page.image_url}
                  alt={`Page ${page.number}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiImage className="text-gray-500 text-xl" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Page {page.number}</h3>
              <p className="text-sm text-gray-600">
                {page.dimensions} • Created {new Date(page.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="text-red-600 text-lg mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-red-800 font-medium text-sm">
                  Are you sure you want to delete this page?
                </h4>
                <p className="text-red-700 text-sm mt-1">
                  This will permanently remove the page and its image file from storage. 
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              Type the page number <strong>{page.number}</strong> to confirm deletion.
            </p>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={page.number.toString()}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
            {confirmationText.length > 0 && !isValidConfirmation && (
              <p className="text-sm text-red-600">
                Please type "{page.number}" to confirm
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!isValidConfirmation || isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <FiTrash2 className="text-sm" />
                Delete Page
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
