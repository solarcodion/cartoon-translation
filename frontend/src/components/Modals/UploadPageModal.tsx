import { useState, useRef } from "react";
import { FiX } from "react-icons/fi";
import { ocrService } from "../../services/ocrService";

interface UploadPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (pageNumber: number, file: File, context?: string) => Promise<void>;
  chapterNumber?: number;
}

export default function UploadPageModal({
  isOpen,
  onClose,
  onUpload,
  chapterNumber,
}: UploadPageModalProps) {
  const [pageNumber, setPageNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const number = parseInt(pageNumber.trim());
    if (!number || number <= 0 || !selectedFile) return;

    try {
      setIsLoading(true);
      setIsUploading(true);
      setUploadProgress(0);

      let extractedContext = "";

      // First, run OCR if we have an image
      if (selectedFile && previewUrl) {
        try {
          setIsProcessingOCR(true);

          // Convert image to base64
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();

          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = previewUrl;
          });

          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const base64Data = canvas.toDataURL("image/jpeg").split(",")[1];

          // Process with OCR
          const ocrResult = await ocrService.extractTextEnhanced(base64Data);

          if (ocrResult.success && ocrResult.text.trim()) {
            extractedContext = ocrResult.text.trim();
            console.log("✅ OCR completed successfully:", extractedContext);
          }
        } catch (ocrError) {
          console.error("❌ OCR processing failed:", ocrError);
          // Continue with upload even if OCR fails
        } finally {
          setIsProcessingOCR(false);
        }
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      await onUpload(number, selectedFile, extractedContext || undefined);

      // Complete the progress
      setUploadProgress(100);

      // Wait a bit to show completion
      setTimeout(() => {
        // Reset form
        setPageNumber("");
        setSelectedFile(null);
        setUploadProgress(0);
        setIsUploading(false);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error uploading page:", error);
      setUploadProgress(0);
      setIsUploading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Reset form on close
      setPageNumber("");
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (images only)
      if (file.type.startsWith("image/")) {
        // Clean up previous preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        // Create new preview URL
        const newPreviewUrl = URL.createObjectURL(file);
        setSelectedFile(file);
        setPreviewUrl(newPreviewUrl);
      } else {
        alert("Please select an image file.");
        e.target.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        // Clean up previous preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        // Create new preview URL
        const newPreviewUrl = URL.createObjectURL(file);
        setSelectedFile(file);
        setPreviewUrl(newPreviewUrl);
      } else {
        alert("Please select an image file.");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && pageNumber.trim() && selectedFile && !isLoading) {
      handleUpload();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Upload New Page for OCR
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Upload an image. The AI will detect text boxes.
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ml-4"
              >
                <FiX className="text-lg" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Page Number Input */}
            <div>
              <label
                htmlFor="pageNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Page No.
              </label>
              <div className="relative">
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image
              </label>

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragOver
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="hidden"
                  />

                  {/* Upload Icon */}
                  <div className="mb-4">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Upload Text */}
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      Drop your image here, or{" "}
                      <span className="text-blue-500 font-medium">browse</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports: JPG, JPEG2000, PNG
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Info */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={isLoading}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FiX className="text-sm" />
                    </button>
                  </div>

                  {/* Image Preview */}
                  {previewUrl && !isUploading && (
                    <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                      <img
                        src={previewUrl}
                        alt="Upload preview"
                        className="max-w-full max-h-48 mx-auto rounded-lg shadow-sm object-contain"
                      />
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Uploading...</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">
                            {Math.round(uploadProgress)}% •{" "}
                            {Math.round((100 - uploadProgress) / 10)} seconds
                            left
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
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
            onClick={handleUpload}
            disabled={
              !pageNumber.trim() ||
              !selectedFile ||
              isLoading ||
              parseInt(pageNumber) <= 0
            }
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isProcessingOCR ? "Processing OCR..." : "Uploading..."}
              </>
            ) : (
              "Upload & Run OCR"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
