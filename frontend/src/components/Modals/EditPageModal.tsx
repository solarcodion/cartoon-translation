import { useState, useEffect } from "react";
import { FiX, FiImage, FiSave } from "react-icons/fi";
import type { Page } from "../../types";

interface EditPageModalProps {
  page: Page | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (pageId: string, pageData: { page_number?: number }) => Promise<void>;
}

export default function EditPageModal({
  page,
  isOpen,
  onClose,
  onSave,
}: EditPageModalProps) {
  const [pageNumber, setPageNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update form when page changes
  useEffect(() => {
    if (page) {
      setPageNumber(page.number.toString());
    }
  }, [page]);

  const handleSave = async () => {
    if (!page || !pageNumber.trim()) return;

    const number = parseInt(pageNumber.trim());
    if (!number || number <= 0) return;

    try {
      setIsLoading(true);

      const updateData: { page_number?: number } = {};

      // Only include changed fields
      if (number !== page.number) {
        updateData.page_number = number;
      }

      // If no changes, just close the modal
      if (Object.keys(updateData).length === 0) {
        onClose();
        return;
      }

      await onSave(page.id, updateData);
      onClose();
    } catch (error) {
      console.error("Error updating page:", error);
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
    if (e.key === "Enter" && pageNumber.trim() && !isLoading) {
      handleSave();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  const isValidPageNumber =
    pageNumber.trim() && parseInt(pageNumber.trim()) > 0;

  if (!isOpen || !page) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Page</h2>
            <p className="text-sm text-gray-600 mt-1">Update page number.</p>
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
                {page.dimensions} • Created{" "}
                {new Date(page.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Page Number Input */}
            <div>
              <label
                htmlFor="pageNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Page Number
              </label>
              <input
                id="pageNumber"
                type="number"
                min="1"
                step="1"
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="1"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
              />
              {!isValidPageNumber && pageNumber.length > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Page number must be a positive integer
                </p>
              )}
            </div>
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
            onClick={handleSave}
            disabled={!isValidPageNumber || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="text-sm" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
