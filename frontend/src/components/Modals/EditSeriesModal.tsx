import { useState, useEffect } from "react";
import { FiX, FiSave, FiFileText } from "react-icons/fi";
import type { SeriesItem } from "../../types";
import LanguageSelect from "../common/LanguageSelect";
import { DEFAULT_SERIES_LANGUAGE } from "../../constants/languages";

interface EditSeriesModalProps {
  series: SeriesItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    seriesId: string,
    newName: string,
    language?: string
  ) => Promise<void>;
}

export default function EditSeriesModal({
  series,
  isOpen,
  onClose,
  onSave,
}: EditSeriesModalProps) {
  const [seriesName, setSeriesName] = useState("");
  const [language, setLanguage] = useState(DEFAULT_SERIES_LANGUAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update series name and language when series changes
  useEffect(() => {
    if (series) {
      setSeriesName(series.name);
      setLanguage(series.language || DEFAULT_SERIES_LANGUAGE);
      setError(null); // Clear error when series changes
    }
  }, [series]);

  const handleSave = async () => {
    if (!series || !seriesName.trim()) return;

    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      await onSave(series.id, seriesName.trim(), language);
      setError(null); // Clear error on success
      onClose();
    } catch (error) {
      console.error("Error saving series name:", error);
      // Extract error message from the error object
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update series";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null); // Clear error on close
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !isLoading &&
      seriesName.trim() &&
      seriesName.trim() !== series?.name
    ) {
      handleSave();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen || !series) return null;

  const hasChanges =
    seriesName.trim() !== series.name ||
    language !== (series.language || DEFAULT_SERIES_LANGUAGE);
  const isValidName = seriesName.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Series</h2>
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
          {/* Series Info */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full">
              <FiFileText className="text-gray-500 text-xl" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{series.name}</h3>
              <p className="text-sm text-gray-600">
                {series.chapters} chapters
              </p>
            </div>
          </div>

          {/* Series Name Input */}
          <div className="space-y-3 mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Series Name
            </label>
            <input
              type="text"
              value={seriesName}
              onChange={(e) => {
                setSeriesName(e.target.value);
                if (error) setError(null); // Clear error when user starts typing
              }}
              onKeyDown={handleKeyPress}
              placeholder="Enter series name"
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                error
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Language
            </label>
            <LanguageSelect
              value={language}
              onChange={setLanguage}
              disabled={isLoading}
              error={false}
              placeholder="Select series language"
            />
          </div>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Press Enter to save or Escape to cancel
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 min-w-[140px] text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !hasChanges || !isValidName}
            className="flex items-center justify-center gap-2 px-4 py-2 min-w-[140px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiSave className="text-sm" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
