import { useState } from "react";
import { FiX, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import type { TextBoxApiItem } from "../../types/textbox";

interface DeleteTextBoxModalProps {
  textBox: TextBoxApiItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (textBoxId: string) => Promise<void>;
}

export default function DeleteTextBoxModal({
  textBox,
  isOpen,
  onClose,
  onDelete,
}: DeleteTextBoxModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!textBox) return;

    try {
      setIsLoading(true);
      await onDelete(textBox.id);
      onClose();
    } catch (error) {
      console.error("Error deleting text box:", error);
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

  if (!isOpen || !textBox) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        onKeyDown={handleKeyPress}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <FiAlertTriangle className="text-red-600 text-xl" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Delete Text Box
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            disabled={isLoading}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this text box? This action cannot be
            undone.
          </p>

          {/* Text Box Preview */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Text Box Details
            </h3>

            <div className="space-y-3">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">ID:</span>
                  <span className="ml-2 font-medium">{textBox.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Page ID:</span>
                  <span className="ml-2 font-medium">{textBox.page_id}</span>
                </div>
              </div>

              {/* Bounding Box */}
              <div>
                <span className="text-gray-600 text-sm">Bounding Box:</span>
                <span className="ml-2 text-sm font-medium">
                  {textBox.x},{textBox.y},{textBox.w},{textBox.h}
                </span>
              </div>

              {/* Image Preview */}
              {textBox.image && (
                <div>
                  <span className="text-gray-600 text-sm block mb-2">
                    Image Preview:
                  </span>
                  <img
                    src={textBox.image}
                    alt="Text box area"
                    className="w-20 h-24 object-cover rounded border"
                  />
                </div>
              )}

              {/* OCR Text */}
              {textBox.ocr && (
                <div>
                  <span className="text-gray-600 text-sm">OCR Text:</span>
                  <div className="mt-1 p-2 bg-white border border-gray-200 rounded text-sm">
                    {textBox.ocr.length > 100
                      ? `${textBox.ocr.substring(0, 100)}...`
                      : textBox.ocr}
                  </div>
                </div>
              )}

              {/* Corrected Text */}
              {textBox.corrected && (
                <div>
                  <span className="text-gray-600 text-sm">Corrected Text:</span>
                  <div className="mt-1 p-2 bg-white border border-gray-200 rounded text-sm">
                    {textBox.corrected.length > 100
                      ? `${textBox.corrected.substring(0, 100)}...`
                      : textBox.corrected}
                  </div>
                </div>
              )}

              {/* Translation Memory Score */}
              {textBox.tm && (
                <div>
                  <span className="text-gray-600 text-sm">TM Score:</span>
                  <span className="ml-2 text-sm font-medium text-blue-600">
                    {Math.round(textBox.tm * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="text-red-500 text-lg mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-red-800 font-medium text-sm">Warning</h4>
                <p className="text-red-700 text-sm mt-1">
                  This will permanently delete the text box and all its
                  associated data including OCR text, corrections, and
                  translation memory references.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              isLoading
                ? "bg-red-400 text-white cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <FiTrash2 className="text-base" />
                Delete Text Box
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
