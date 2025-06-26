import { useState, useEffect } from "react";
import { FiX, FiSave, FiCheck, FiCopy } from "react-icons/fi";
import { MdGTranslate } from "react-icons/md";
import type { TextBoxApiItem, TextBoxApiUpdate } from "../../types/textbox";
import { translationService } from "../../services/translationService";

interface EditTextBoxModalProps {
  textBox: TextBoxApiItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (textBoxId: string, textBoxData: TextBoxApiUpdate) => Promise<void>;
}

export default function EditTextBoxModal({
  textBox,
  isOpen,
  onClose,
  onSave,
}: EditTextBoxModalProps) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [ocrText, setOcrText] = useState("");
  const [aiTranslatedText, setAiTranslatedText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Copy states
  const [copiedOCR, setCopiedOCR] = useState(false);
  const [copiedAI, setCopiedAI] = useState(false);
  const [copiedCorrected, setCopiedCorrected] = useState(false);

  // Update form fields when textBox changes
  useEffect(() => {
    if (textBox) {
      setX(textBox.x);
      setY(textBox.y);
      setW(textBox.w);
      setH(textBox.h);
      setOcrText(textBox.ocr || "");
      setAiTranslatedText(""); // AI translation not stored in DB, start fresh
      setCorrectedText(textBox.corrected || "");
      setCorrectionReason(textBox.reason || "");
      setIsSuccess(false);
    }
  }, [textBox]);

  const handleSave = async () => {
    if (!textBox) return;

    try {
      setIsLoading(true);

      const updateData: TextBoxApiUpdate = {
        // Position coordinates are read-only, only update text content
        ocr: ocrText.trim() || undefined,
        corrected: correctedText.trim() || undefined,
        reason: correctionReason.trim() || undefined,
      };

      await onSave(textBox.id, updateData);

      setIsSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error updating text box:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslateWithAI = async () => {
    if (!ocrText.trim()) return;

    try {
      setIsTranslating(true);
      console.log("🔄 Starting AI translation...");

      // Call the translation API
      const result = await translationService.quickTranslate(ocrText.trim());

      if (result.translated_text) {
        setAiTranslatedText(result.translated_text);
        console.log("✅ AI translation completed successfully");
      } else {
        console.warn("⚠️ Translation completed but no text returned");
        setAiTranslatedText("Translation completed but no result returned");
      }
    } catch (error) {
      console.error("❌ Error translating with AI:", error);
      // Show user-friendly error message
      setAiTranslatedText("Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyText = async (
    text: string,
    type: "ocr" | "ai" | "corrected"
  ) => {
    try {
      await navigator.clipboard.writeText(text);

      // Set the appropriate copied state
      if (type === "ocr") {
        setCopiedOCR(true);
        setTimeout(() => setCopiedOCR(false), 2000);
      } else if (type === "ai") {
        setCopiedAI(true);
        setTimeout(() => setCopiedAI(false), 2000);
      } else if (type === "corrected") {
        setCopiedCorrected(true);
        setTimeout(() => setCopiedCorrected(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setIsSuccess(false);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen || !textBox) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Text Box
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Modify text box properties and content.
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
        </div>

        {/* Modal Body */}
        <div
          className="flex flex-1 min-h-0"
          onKeyDown={handleKeyPress}
          tabIndex={-1}
        >
          {/* Left Side - Text Box Info */}
          <div className="w-1/3 bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
            <div className="space-y-6">
              {/* Text Box Info */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Text Box Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <span className="font-medium">{textBox.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Page ID:</span>
                    <span className="font-medium">{textBox.page_id}</span>
                  </div>
                  {textBox.tm && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">TM Score:</span>
                      <span className="font-medium text-blue-600">
                        {Math.round(textBox.tm * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bounding Box Info (Read-only) */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Bounding Box (Read-only)
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">X:</span>
                    <span className="ml-2 font-medium">{x}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">Y:</span>
                    <span className="ml-2 font-medium">{y}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">Width:</span>
                    <span className="ml-2 font-medium">{w}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">Height:</span>
                    <span className="ml-2 font-medium">{h}</span>
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              {textBox.image && (
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Text Area Preview
                  </h3>
                  <div className="flex justify-center">
                    <img
                      src={textBox.image}
                      alt="Text box area"
                      className="max-w-full max-h-48 object-contain rounded border border-gray-200 shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Text Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* OCR Text */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900">
                    OCR Text (Editable)
                  </label>
                  <button
                    onClick={() => handleCopyText(ocrText, "ocr")}
                    className={`p-1 transition-colors ${
                      !ocrText
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-400 hover:text-gray-600 cursor-pointer"
                    }`}
                    disabled={!ocrText}
                    title={
                      !ocrText
                        ? "No text to copy"
                        : copiedOCR
                        ? "Copied!"
                        : "Copy text"
                    }
                  >
                    {copiedOCR ? (
                      <FiCheck className="text-sm text-green-500" />
                    ) : (
                      <FiCopy
                        className={`text-sm ${!ocrText ? "text-gray-300" : ""}`}
                      />
                    )}
                  </button>
                </div>
                <textarea
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  placeholder="Text detected by OCR"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-20 text-sm bg-white"
                  disabled={isLoading}
                />
              </div>

              {/* Translate with AI Button */}
              <button
                onClick={handleTranslateWithAI}
                disabled={!ocrText.trim() || isTranslating || isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <MdGTranslate className="text-lg" />
                {isTranslating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Translating...
                  </>
                ) : (
                  "Translate with AI"
                )}
              </button>

              {/* AI Translated Text */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900">
                    AI Translated Text
                  </label>
                  <button
                    onClick={() => handleCopyText(aiTranslatedText, "ai")}
                    className={`p-1 transition-colors ${
                      !aiTranslatedText
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-400 hover:text-gray-600 cursor-pointer"
                    }`}
                    disabled={!aiTranslatedText}
                    title={
                      !aiTranslatedText
                        ? "No text to copy"
                        : copiedAI
                        ? "Copied!"
                        : "Copy text"
                    }
                  >
                    {copiedAI ? (
                      <FiCheck className="text-sm text-green-500" />
                    ) : (
                      <FiCopy
                        className={`text-sm ${
                          !aiTranslatedText ? "text-gray-300" : ""
                        }`}
                      />
                    )}
                  </button>
                </div>
                <textarea
                  value={aiTranslatedText}
                  onChange={(e) => setAiTranslatedText(e.target.value)}
                  placeholder="Translation from AI will appear here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-20 text-sm bg-white"
                  disabled={isLoading}
                />
              </div>

              {/* Corrected Text */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Corrected Text (Final)
                  </label>
                  <button
                    onClick={() => handleCopyText(correctedText, "corrected")}
                    className={`p-1 transition-colors ${
                      !correctedText
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-400 hover:text-gray-600 cursor-pointer"
                    }`}
                    disabled={!correctedText}
                    title={
                      !correctedText
                        ? "No text to copy"
                        : copiedCorrected
                        ? "Copied!"
                        : "Copy text"
                    }
                  >
                    {copiedCorrected ? (
                      <FiCheck className="text-sm text-green-500" />
                    ) : (
                      <FiCopy
                        className={`text-sm ${
                          !correctedText ? "text-gray-300" : ""
                        }`}
                      />
                    )}
                  </button>
                </div>
                <textarea
                  value={correctedText}
                  onChange={(e) => setCorrectedText(e.target.value)}
                  placeholder="Manually refined translation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-20 text-sm bg-white"
                  disabled={isLoading}
                />
              </div>

              {/* Correction Reason */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Correction Reason (Optional)
                </label>
                <input
                  type="text"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g., Grammar, Tone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || isSuccess}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              isSuccess
                ? "bg-green-600 text-white"
                : isLoading
                ? "bg-blue-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : isSuccess ? (
              <>
                <FiCheck className="text-base" />
                Saved!
              </>
            ) : (
              <>
                <FiSave className="text-base" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
