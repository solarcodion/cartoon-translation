import { useState, useEffect } from "react";
import { FiX, FiSave, FiCheck } from "react-icons/fi";
import type { TranslationMemory } from "../../types";

interface EditTMEntryModalProps {
  tmEntry: TranslationMemory | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    tmId: string,
    entryData: {
      source: string;
      target: string;
      context?: string;
    }
  ) => Promise<void>;
}

export default function EditTMEntryModal({
  tmEntry,
  isOpen,
  onClose,
  onSave,
}: EditTMEntryModalProps) {
  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Update form fields when tmEntry changes
  useEffect(() => {
    if (tmEntry) {
      setSourceText(tmEntry.source);
      setTargetText(tmEntry.target);
      setContext(tmEntry.context || "");
      setIsSuccess(false);
    }
  }, [tmEntry]);

  const handleSave = async () => {
    if (!tmEntry || !sourceText.trim() || !targetText.trim()) return;

    try {
      setIsLoading(true);
      await onSave(tmEntry.id, {
        source: sourceText.trim(),
        target: targetText.trim(),
        context: context.trim() || undefined,
      });
      
      setIsSuccess(true);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error updating TM entry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setIsSuccess(false);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey && !isLoading) {
      handleSave();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen || !tmEntry) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit TM Entry
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6" onKeyDown={handleKeyPress} tabIndex={-1}>
          {/* Source Text */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Source Text
            </label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter the original text..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-24 text-sm"
              disabled={isLoading || isSuccess}
              autoFocus
            />
          </div>

          {/* Target Text */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Target Text
            </label>
            <textarea
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              placeholder="Enter the translated text..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-24 text-sm"
              disabled={isLoading || isSuccess}
            />
          </div>

          {/* Context (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Context (Optional)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Add context or notes about this translation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-20 text-sm"
              disabled={isLoading || isSuccess}
            />
          </div>

          {/* Usage Count Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Usage Count:</span>
              <span className="text-sm text-gray-600">{tmEntry.usage} times</span>
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
            onClick={handleSave}
            disabled={isLoading || isSuccess || !sourceText.trim() || !targetText.trim()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isSuccess ? (
              <>
                <FiCheck className="text-sm" />
                Updated
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
