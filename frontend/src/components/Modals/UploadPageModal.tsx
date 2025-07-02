import { useState, useRef } from "react";
import { FiX } from "react-icons/fi";
import { ocrService } from "../../services/ocrService";

interface UploadPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], startPageNumber: number) => Promise<void>;
  chapterNumber?: number;
}

export default function UploadPageModal({
  isOpen,
  onClose,
  onUpload,
  chapterNumber,
}: UploadPageModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [startPageNumber, setStartPageNumber] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const startNumber = parseInt(startPageNumber.trim());
    if (selectedFiles.length === 0 || !startNumber || startNumber <= 0) return;

    try {
      setIsLoading(true);
      setIsUploading(true);
      setUploadProgress(0);

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

      await onUpload(selectedFiles, startNumber);

      // Complete the progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Wait a bit to show completion
      setTimeout(() => {
        // Reset form
        setSelectedFiles([]);
        setStartPageNumber("1");
        setUploadProgress(0);
        setIsUploading(false);
        // Clean up preview URLs
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error uploading pages:", error);
      setUploadProgress(0);
      setIsUploading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Reset form on close
      setSelectedFiles([]);
      setStartPageNumber("1");
      // Clean up preview URLs
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validFiles: File[] = [];
      const newPreviewUrls: string[] = [];

      // Validate each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith("image/")) {
          validFiles.push(file);
          newPreviewUrls.push(URL.createObjectURL(file));
        } else {
          alert(
            `File "${file.name}" is not an image. Only image files are allowed.`
          );
        }
      }

      if (validFiles.length > 0) {
        // Clean up previous preview URLs
        previewUrls.forEach((url) => URL.revokeObjectURL(url));

        setSelectedFiles(validFiles);
        setPreviewUrls(newPreviewUrls);
      } else {
        e.target.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    // Clean up the specific preview URL
    URL.revokeObjectURL(previewUrls[index]);

    // Remove the file and preview URL at the specified index
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);

    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviewUrls);

    // Reset file input if no files left
    if (newFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAllImages = () => {
    // Clean up all preview URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    setSelectedFiles([]);
    setPreviewUrls([]);
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
      const validFiles: File[] = [];
      const newPreviewUrls: string[] = [];

      // Validate each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith("image/")) {
          validFiles.push(file);
          newPreviewUrls.push(URL.createObjectURL(file));
        } else {
          alert(
            `File "${file.name}" is not an image. Only image files are allowed.`
          );
        }
      }

      if (validFiles.length > 0) {
        // Clean up previous preview URLs
        previewUrls.forEach((url) => URL.revokeObjectURL(url));

        setSelectedFiles(validFiles);
        setPreviewUrls(newPreviewUrls);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    const startNumber = parseInt(startPageNumber.trim());
    if (
      e.key === "Enter" &&
      selectedFiles.length > 0 &&
      startNumber > 0 &&
      !isLoading
    ) {
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
                  Upload Pages
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
            {/* Info Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Select multiple images to upload. Each image will become a
                separate page starting from the specified page number.
                <br />
                <strong>
                  OCR text extraction will be automatically performed
                </strong>{" "}
                for each image.
              </p>
            </div>

            {/* Start Page Number Input */}
            <div>
              <label
                htmlFor="startPageNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Start Page Number
              </label>
              <div className="relative">
                <input
                  id="startPageNumber"
                  type="number"
                  min="1"
                  step="1"
                  value={startPageNumber}
                  onChange={(e) => setStartPageNumber(e.target.value)}
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
                Images ({selectedFiles.length} selected)
              </label>

              {selectedFiles.length === 0 ? (
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
                    multiple
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
                      Drop your images here, or{" "}
                      <span className="text-blue-500 font-medium">browse</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports: JPG, JPEG, PNG, WebP • Multiple files allowed
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Files Summary */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFiles.length} image
                          {selectedFiles.length !== 1 ? "s" : ""} selected
                        </p>
                        <p className="text-xs text-gray-500">
                          Will create pages{" "}
                          {selectedFiles.length > 1
                            ? `${startPageNumber}-${
                                parseInt(startPageNumber) +
                                selectedFiles.length -
                                1
                              }`
                            : startPageNumber}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveAllImages}
                      disabled={isLoading}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FiX className="text-sm" />
                    </button>
                  </div>

                  {/* Image Previews Grid */}
                  {!isUploading && (
                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="border-2 border-gray-200 rounded-lg p-2 bg-gray-50">
                            <img
                              src={previewUrls[index]}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            disabled={isLoading}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
                          >
                            <FiX className="text-xs" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                            Page {parseInt(startPageNumber) + index}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Uploading & Processing OCR...
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">
                            {Math.round(uploadProgress)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Processing {selectedFiles.length} images with automatic
                        OCR text extraction...
                      </p>
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
              selectedFiles.length === 0 ||
              !startPageNumber.trim() ||
              parseInt(startPageNumber) <= 0 ||
              isLoading
            }
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading & Processing OCR...
              </>
            ) : (
              `Upload ${selectedFiles.length} Page${
                selectedFiles.length !== 1 ? "s" : ""
              } & Run OCR`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
