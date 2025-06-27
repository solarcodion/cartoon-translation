import { useState } from "react";
import { FiX } from "react-icons/fi";

interface AddSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (seriesName: string) => Promise<void>;
}

export default function AddSeriesModal({
  isOpen,
  onClose,
  onAdd,
}: AddSeriesModalProps) {
  const [seriesName, setSeriesName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!seriesName.trim()) return;

    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      await onAdd(seriesName.trim());
      setSeriesName(""); // Reset form
      setError(null); // Clear error on success
      onClose();
    } catch (error) {
      console.error("Error adding series:", error);
      // Extract error message from the error object
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create series";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSeriesName(""); // Reset form on close
      setError(null); // Clear error on close
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && seriesName.trim() && !isLoading) {
      handleAdd();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Add New Series
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Enter the name for the new series.
            </p>
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
          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label
                htmlFor="seriesName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Name
              </label>
              <input
                id="seriesName"
                type="text"
                value={seriesName}
                onChange={(e) => {
                  setSeriesName(e.target.value);
                  if (error) setError(null); // Clear error when user starts typing
                }}
                placeholder="e.g., Solo Leveling"
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 ${
                  error
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-gray-500"
                }`}
                autoFocus
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 min-w-[120px] text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!seriesName.trim() || isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 min-w-[120px] bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </>
              ) : (
                "Add Series"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
