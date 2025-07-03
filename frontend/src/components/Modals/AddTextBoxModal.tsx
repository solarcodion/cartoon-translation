import { useState, useRef, useEffect, useCallback } from "react";
import {
  FiX,
  FiCopy,
  FiZoomIn,
  FiZoomOut,
  FiMaximize2,
  FiChevronDown,
  FiCheck,
  FiMousePointer,
  FiTrash2,
  FiCrop,
} from "react-icons/fi";
import { MdGTranslate } from "react-icons/md";
import type { Page, TextBoxCreate, BoundingBox } from "../../types";
import { ocrService } from "../../services/ocrService";
import { translationService } from "../../services/translationService";

interface AddTextBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (textBoxData: TextBoxCreate, croppedImage?: string) => Promise<void>;
  pages: Page[];
  selectedPageId?: string;
}

export default function AddTextBoxModal({
  isOpen,
  onClose,
  onAdd,
  pages,
  selectedPageId,
}: AddTextBoxModalProps) {
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [boundingBox, setBoundingBox] = useState<BoundingBox>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [ocrText, setOcrText] = useState("");
  const [aiTranslatedText, setAiTranslatedText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Copy button states
  const [copiedOCR, setCopiedOCR] = useState(false);
  const [copiedAI, setCopiedAI] = useState(false);
  const [copiedCorrected, setCopiedCorrected] = useState(false);

  // Custom dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Drag selection mode
  const [isDragSelectionMode, setIsDragSelectionMode] = useState(false);
  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });

  // Cropped image state
  const [isCropped, setIsCropped] = useState(false);
  const [croppedImageData, setCroppedImageData] = useState<string>("");
  // Pan and drag state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Bounding box drag state
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [boxDragStart, setBoxDragStart] = useState({ x: 0, y: 0 });
  const [boxDragStartPos, setBoxDragStartPos] = useState({ x: 0, y: 0 });

  // Bounding box resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>("");
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [resizeStartBox, setResizeStartBox] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Helper function to convert mouse coordinates to image coordinates
  const getImageCoordinatesFromMouse = useCallback((e: React.MouseEvent) => {
    if (!imageRef.current || !imageContainerRef.current) return null;

    const img = imageRef.current;

    // Get the actual image element's bounding rect (after transforms)
    const imgRect = img.getBoundingClientRect();

    // Calculate mouse position relative to the transformed image
    const mouseX = e.clientX - imgRect.left;
    const mouseY = e.clientY - imgRect.top;

    // Calculate the actual displayed image dimensions
    const imgAspectRatio = img.naturalWidth / img.naturalHeight;
    const imgDisplayWidth = imgRect.width;
    const imgDisplayHeight = imgRect.height;

    // The image might be letterboxed/pillarboxed within its container
    let actualImageWidth, actualImageHeight, offsetX, offsetY;

    if (imgAspectRatio > imgDisplayWidth / imgDisplayHeight) {
      // Image is wider - letterboxed (black bars on top/bottom)
      actualImageWidth = imgDisplayWidth;
      actualImageHeight = imgDisplayWidth / imgAspectRatio;
      offsetX = 0;
      offsetY = (imgDisplayHeight - actualImageHeight) / 2;
    } else {
      // Image is taller - pillarboxed (black bars on left/right)
      actualImageHeight = imgDisplayHeight;
      actualImageWidth = imgDisplayHeight * imgAspectRatio;
      offsetX = (imgDisplayWidth - actualImageWidth) / 2;
      offsetY = 0;
    }

    // Calculate mouse position relative to the actual image content
    const imageMouseX = mouseX - offsetX;
    const imageMouseY = mouseY - offsetY;

    // Convert to image natural coordinates
    const scaleX = img.naturalWidth / actualImageWidth;
    const scaleY = img.naturalHeight / actualImageHeight;

    const imageX = Math.max(
      0,
      Math.min(img.naturalWidth, imageMouseX * scaleX)
    );
    const imageY = Math.max(
      0,
      Math.min(img.naturalHeight, imageMouseY * scaleY)
    );

    return { x: imageX, y: imageY };
  }, []);

  // Zoom and pan handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prevZoom) => Math.max(0.1, Math.min(5, prevZoom + delta)));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0 && !isDraggingBox && !isResizing) {
        if (isDragSelectionMode && imageRef.current) {
          // Drag selection mode - start selecting area
          const imageCoords = getImageCoordinatesFromMouse(e);
          if (imageCoords) {
            setIsSelectingArea(true);
            setSelectionStart({ x: imageCoords.x, y: imageCoords.y });
            setSelectionEnd({ x: imageCoords.x, y: imageCoords.y });
          }
        } else {
          // Normal pan mode
          setIsDragging(true);
          setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
      }
    },
    [
      pan,
      isDraggingBox,
      isResizing,
      isDragSelectionMode,
      getImageCoordinatesFromMouse,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      } else if (isSelectingArea && imageRef.current) {
        // Update selection area
        const imageCoords = getImageCoordinatesFromMouse(e);
        if (imageCoords) {
          setSelectionEnd({ x: imageCoords.x, y: imageCoords.y });
        }
      }
    },
    [isDragging, dragStart, isSelectingArea, getImageCoordinatesFromMouse]
  );

  const handleMouseUp = useCallback(() => {
    if (isSelectingArea) {
      // Finalize selection and create bounding box
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);

      const width = maxX - minX;
      const height = maxY - minY;

      // Only create bounding box if area is large enough
      if (width > 5 && height > 5) {
        setBoundingBox({
          x: Math.round(minX),
          y: Math.round(minY),
          width: Math.round(width),
          height: Math.round(height),
        });
      }

      setIsSelectingArea(false);
    }

    setIsDragging(false);
    setIsDraggingBox(false);
    setIsResizing(false);
    setResizeHandle("");
  }, [isSelectingArea, selectionStart, selectionEnd]);

  const resetZoomAndPan = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Handle drag selection mode toggle
  const handleToggleDragSelection = useCallback(() => {
    setIsDragSelectionMode(!isDragSelectionMode);
  }, [isDragSelectionMode]);

  // Handle clear area position
  const handleClearArea = useCallback(() => {
    setBoundingBox({ x: 0, y: 0, width: 0, height: 0 });
    setIsDragSelectionMode(false);
    setIsCropped(false);
    setCroppedImageData("");
  }, []);

  // Handle crop image
  const handleCropImage = useCallback(async () => {
    if (
      !selectedPage ||
      !imageRef.current ||
      boundingBox.width === 0 ||
      boundingBox.height === 0
    ) {
      return;
    }

    try {
      setIsProcessingOCR(true);

      // Create a canvas to crop the image
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Set canvas size to the bounding box size
      canvas.width = boundingBox.width;
      canvas.height = boundingBox.height;

      // Create a new image element to load the original image
      const originalImg = new Image();
      originalImg.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        originalImg.onload = resolve;
        originalImg.onerror = reject;
        originalImg.src = selectedPage.image_url;
      });

      // Draw the cropped portion of the image
      ctx.drawImage(
        originalImg,
        boundingBox.x, // source x
        boundingBox.y, // source y
        boundingBox.width, // source width
        boundingBox.height, // source height
        0, // destination x
        0, // destination y
        boundingBox.width, // destination width
        boundingBox.height // destination height
      );

      // Convert canvas to data URL
      const croppedDataUrl = canvas.toDataURL("image/png");
      setIsCropped(true);
      setCroppedImageData(croppedDataUrl);

      // Process with OCR
      try {
        const ocrResult = await ocrService.extractText(croppedDataUrl);

        if (ocrResult.success && ocrResult.text.trim()) {
          setOcrText(ocrResult.text.trim());
        } else {
          console.log("⚠️ OCR completed but no text was detected");
        }
      } catch (ocrError) {
        console.error("❌ OCR processing failed:", ocrError);
      }
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessingOCR(false);
    }
  }, [selectedPage, boundingBox]);

  // Bounding box drag handlers
  const handleBoxMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingBox(true);
      setBoxDragStart({ x: e.clientX, y: e.clientY });
      setBoxDragStartPos({ x: boundingBox.x, y: boundingBox.y });
    },
    [boundingBox.x, boundingBox.y]
  );

  const handleBoxMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingBox || !imageRef.current) return;

      const img = imageRef.current;
      const imgRect = img.getBoundingClientRect();

      // Calculate mouse movement in screen coordinates
      const deltaX = e.clientX - boxDragStart.x;
      const deltaY = e.clientY - boxDragStart.y;

      // Convert screen movement to image coordinates
      // Since the image is scaled, we need to account for the current scale
      const currentScale = imgRect.width / img.naturalWidth;
      const imageDeltaX = deltaX / currentScale;
      const imageDeltaY = deltaY / currentScale;

      // Calculate new position
      const newX = Math.max(
        0,
        Math.min(
          img.naturalWidth - boundingBox.width,
          boxDragStartPos.x + imageDeltaX
        )
      );
      const newY = Math.max(
        0,
        Math.min(
          img.naturalHeight - boundingBox.height,
          boxDragStartPos.y + imageDeltaY
        )
      );

      setBoundingBox((prev) => ({
        ...prev,
        x: Math.round(newX),
        y: Math.round(newY),
      }));
    },
    [
      isDraggingBox,
      boxDragStart,
      boxDragStartPos,
      boundingBox.width,
      boundingBox.height,
    ]
  );

  // Resize handlers
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeHandle(handle);
      setResizeStart({ x: e.clientX, y: e.clientY });
      setResizeStartBox({ ...boundingBox });
    },
    [boundingBox]
  );

  const handleResizeMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !imageRef.current) return;

      const img = imageRef.current;
      const imgRect = img.getBoundingClientRect();

      // Calculate mouse movement in screen coordinates
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      // Convert screen movement to image coordinates
      const currentScale = imgRect.width / img.naturalWidth;
      const imageDeltaX = deltaX / currentScale;
      const imageDeltaY = deltaY / currentScale;

      const newBox = { ...resizeStartBox };

      // Handle different resize directions
      switch (resizeHandle) {
        case "nw": // Top-left
          newBox.x = Math.max(0, resizeStartBox.x + imageDeltaX);
          newBox.y = Math.max(0, resizeStartBox.y + imageDeltaY);
          newBox.width = Math.max(10, resizeStartBox.width - imageDeltaX);
          newBox.height = Math.max(10, resizeStartBox.height - imageDeltaY);
          break;
        case "n": // Top
          newBox.y = Math.max(0, resizeStartBox.y + imageDeltaY);
          newBox.height = Math.max(10, resizeStartBox.height - imageDeltaY);
          break;
        case "ne": // Top-right
          newBox.y = Math.max(0, resizeStartBox.y + imageDeltaY);
          newBox.width = Math.max(10, resizeStartBox.width + imageDeltaX);
          newBox.height = Math.max(10, resizeStartBox.height - imageDeltaY);
          break;
        case "w": // Left
          newBox.x = Math.max(0, resizeStartBox.x + imageDeltaX);
          newBox.width = Math.max(10, resizeStartBox.width - imageDeltaX);
          break;
        case "e": // Right
          newBox.width = Math.max(10, resizeStartBox.width + imageDeltaX);
          break;
        case "sw": // Bottom-left
          newBox.x = Math.max(0, resizeStartBox.x + imageDeltaX);
          newBox.width = Math.max(10, resizeStartBox.width - imageDeltaX);
          newBox.height = Math.max(10, resizeStartBox.height + imageDeltaY);
          break;
        case "s": // Bottom
          newBox.height = Math.max(10, resizeStartBox.height + imageDeltaY);
          break;
        case "se": // Bottom-right
          newBox.width = Math.max(10, resizeStartBox.width + imageDeltaX);
          newBox.height = Math.max(10, resizeStartBox.height + imageDeltaY);
          break;
      }

      // Ensure the box stays within image bounds
      if (newBox.x + newBox.width > img.naturalWidth) {
        newBox.width = img.naturalWidth - newBox.x;
      }
      if (newBox.y + newBox.height > img.naturalHeight) {
        newBox.height = img.naturalHeight - newBox.y;
      }

      setBoundingBox({
        x: Math.round(newBox.x),
        y: Math.round(newBox.y),
        width: Math.round(newBox.width),
        height: Math.round(newBox.height),
      });
    },
    [isResizing, resizeHandle, resizeStart, resizeStartBox]
  );

  // Calculate bounding box overlay position and size (relative to image)
  const getBoundingBoxStyle = useCallback(() => {
    if (
      !selectedPage ||
      !imageRef.current ||
      boundingBox.width === 0 ||
      boundingBox.height === 0
    ) {
      return { display: "none" };
    }

    const img = imageRef.current;

    // Since the overlay is now inside the scaled container, we can use
    // the image's natural dimensions directly as percentages
    const leftPercent = (boundingBox.x / img.naturalWidth) * 100;
    const topPercent = (boundingBox.y / img.naturalHeight) * 100;
    const widthPercent = (boundingBox.width / img.naturalWidth) * 100;
    const heightPercent = (boundingBox.height / img.naturalHeight) * 100;

    return {
      position: "absolute" as const,
      left: `${leftPercent}%`,
      top: `${topPercent}%`,
      width: `${widthPercent}%`,
      height: `${heightPercent}%`,
      border: "2px solid #ef4444",
      zIndex: 10,
      pointerEvents: "auto" as const,
    };
  }, [selectedPage, boundingBox]);

  // Calculate selection overlay style (relative to image)
  const getSelectionOverlayStyle = useCallback(() => {
    if (!isSelectingArea || !imageRef.current) {
      return { display: "none" };
    }

    const img = imageRef.current;

    // Calculate selection area in image coordinates
    const minX = Math.min(selectionStart.x, selectionEnd.x);
    const minY = Math.min(selectionStart.y, selectionEnd.y);
    const maxX = Math.max(selectionStart.x, selectionEnd.x);
    const maxY = Math.max(selectionStart.y, selectionEnd.y);

    // Convert to percentages relative to image natural dimensions
    const leftPercent = (minX / img.naturalWidth) * 100;
    const topPercent = (minY / img.naturalHeight) * 100;
    const widthPercent = ((maxX - minX) / img.naturalWidth) * 100;
    const heightPercent = ((maxY - minY) / img.naturalHeight) * 100;

    return {
      position: "absolute" as const,
      left: `${leftPercent}%`,
      top: `${topPercent}%`,
      width: `${widthPercent}%`,
      height: `${heightPercent}%`,
      border: "2px dashed #3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      zIndex: 15,
      pointerEvents: "none" as const,
    };
  }, [isSelectingArea, selectionStart, selectionEnd]);

  // Initialize selected page
  useEffect(() => {
    if (isOpen && pages.length > 0) {
      const page = selectedPageId
        ? pages.find((p) => p.id === selectedPageId) || pages[0]
        : pages[0];
      setSelectedPage(page);
    }
  }, [isOpen, pages, selectedPageId]);

  // Update bounding box overlay when input values change
  useEffect(() => {
    // This effect ensures the overlay updates when input values change
    // The getBoundingBoxStyle function will be called during render
  }, [boundingBox]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Add event listeners for bounding box dragging
  useEffect(() => {
    if (isDraggingBox) {
      document.addEventListener("mousemove", handleBoxMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleBoxMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDraggingBox, handleBoxMouseMove, handleMouseUp]);

  // Add event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleResizeMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleResizeMouseMove, handleMouseUp]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setBoundingBox({ x: 0, y: 0, width: 0, height: 0 });
      setOcrText("");
      setAiTranslatedText("");
      setCorrectedText("");
      setCorrectionReason("");
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsCropped(false);
      setCroppedImageData("");
    }
  }, [isOpen]);

  // Reset zoom and pan when page changes
  useEffect(() => {
    if (selectedPage) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [selectedPage]);

  const handleAdd = async () => {
    if (!selectedPage || !ocrText.trim()) return;

    try {
      setIsLoading(true);
      await onAdd(
        {
          pageId: selectedPage.id,
          pageNumber: selectedPage.number,
          boundingBox,
          ocrText: ocrText.trim(),
          aiTranslatedText: aiTranslatedText.trim() || undefined,
          correctedText: correctedText.trim() || undefined,
          correctionReason: correctionReason.trim() || undefined,
        },
        croppedImageData || undefined
      );
      onClose();
    } catch (error) {
      console.error("Error adding text box:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslateWithAI = async () => {
    if (!ocrText.trim()) return;

    try {
      setIsTranslating(true);

      // Call the translation API
      const result = await translationService.quickTranslate(ocrText.trim());

      if (result.translated_text) {
        setAiTranslatedText(result.translated_text);
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
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Text Box
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manually define a text area. Use zoom/pan for precision.
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
          {/* Left Side - Image Area */}
          <div className="flex-1 bg-gray-100 relative overflow-hidden">
            {selectedPage ? (
              <div
                ref={imageContainerRef}
                className={`w-full h-full flex items-center justify-center p-4 ${
                  isDragSelectionMode
                    ? "cursor-crosshair"
                    : "cursor-grab active:cursor-grabbing"
                }`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  cursor: isDragSelectionMode
                    ? "crosshair"
                    : isDragging
                    ? "grabbing"
                    : "grab",
                }}
              >
                <div
                  className="relative bg-white rounded-lg shadow-sm overflow-hidden"
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                    transformOrigin: "center center",
                    transition: isDragging ? "none" : "transform 0.1s ease-out",
                  }}
                >
                  <img
                    ref={imageRef}
                    src={selectedPage.image_url}
                    alt={`Page ${selectedPage.number}`}
                    className="max-w-full max-h-full object-contain select-none"
                    draggable={false}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 pointer-events-none"
                  />

                  {/* Bounding Box Overlay */}
                  {boundingBox.width > 0 && boundingBox.height > 0 && (
                    <div
                      style={getBoundingBoxStyle()}
                      className={`border-2 border-red-500 transition-colors hover:bg-red-500/20 ${
                        isDraggingBox || isResizing
                          ? "bg-red-500/10 border-red-600 cursor-grabbing"
                          : "bg-red-500/10 cursor-move"
                      }`}
                      onMouseDown={handleBoxMouseDown}
                    >
                      {/* Corner Handles */}
                      <div
                        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-nw-resize hover:bg-blue-600 transition-colors"
                        onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
                      ></div>
                      <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-n-resize hover:bg-blue-600 transition-colors"
                        onMouseDown={(e) => handleResizeMouseDown(e, "n")}
                      ></div>
                      <div
                        className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-ne-resize hover:bg-blue-600 transition-colors"
                        onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
                      ></div>
                      <div
                        className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-w-resize hover:bg-blue-600 transition-colors"
                        onMouseDown={(e) => handleResizeMouseDown(e, "w")}
                      ></div>
                      <div
                        className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-e-resize hover:bg-blue-600 transition-colors"
                        onMouseDown={(e) => handleResizeMouseDown(e, "e")}
                      ></div>
                      <div
                        className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-sw-resize hover:bg-blue-600 transition-colors"
                        onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
                      ></div>
                      <div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-s-resize hover:bg-blue-600 transition-colors"
                        onMouseDown={(e) => handleResizeMouseDown(e, "s")}
                      ></div>
                      <div
                        className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-se-resize hover:bg-blue-600 transition-colors"
                        onMouseDown={(e) => handleResizeMouseDown(e, "se")}
                      ></div>
                    </div>
                  )}

                  {/* Selection Overlay */}
                  {isSelectingArea && (
                    <div
                      style={getSelectionOverlayStyle()}
                      className="border-2 border-dashed border-blue-500 bg-blue-500/10"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📷</div>
                  <p>No image selected</p>
                </div>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <button
                onClick={() => setZoom(Math.max(0.1, zoom - 0.25))}
                className="p-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                title="Zoom Out"
              >
                <FiZoomOut className="text-sm" />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[4rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(5, zoom + 0.25))}
                className="p-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                title="Zoom In"
              >
                <FiZoomIn className="text-sm" />
              </button>
              <button
                onClick={resetZoomAndPan}
                className="p-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                title="Reset Zoom & Pan"
              >
                <FiMaximize2 className="text-sm" />
              </button>
            </div>

            {/* Instructions */}
            <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded-lg">
              <div>🖱️ Scroll to zoom</div>
              <div>✋ Drag to pan</div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Page Selector */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Page
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-left flex items-center justify-between hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span
                      className={
                        selectedPage ? "text-gray-900" : "text-gray-500"
                      }
                    >
                      {selectedPage
                        ? `Page ${selectedPage.number} (${selectedPage.dimensions})`
                        : "Select a page"}
                    </span>
                    <FiChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {pages.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No pages available
                        </div>
                      ) : (
                        pages.map((page) => (
                          <button
                            key={page.id}
                            type="button"
                            onClick={() => {
                              setSelectedPage(page);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>
                              Page {page.number} ({page.dimensions})
                            </span>
                            {selectedPage?.id === page.id && (
                              <FiCheck className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bounding Box */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Bounding Box (x, y, w, h) - Original Dims
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      X
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={boundingBox.x}
                      onChange={(e) =>
                        setBoundingBox((prev) => ({
                          ...prev,
                          x: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Y
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={boundingBox.y}
                      onChange={(e) =>
                        setBoundingBox((prev) => ({
                          ...prev,
                          y: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={boundingBox.width}
                      onChange={(e) =>
                        setBoundingBox((prev) => ({
                          ...prev,
                          width: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={boundingBox.height}
                      onChange={(e) =>
                        setBoundingBox((prev) => ({
                          ...prev,
                          height: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleToggleDragSelection}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      isDragSelectionMode
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                    disabled={isLoading}
                    title="Toggle drag selection mode"
                  >
                    <FiMousePointer className="w-4 h-4" />
                    {isDragSelectionMode ? "Exit Drag Mode" : "Select Area"}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearArea}
                    className="px-4 py-2 text-sm rounded-lg border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-2"
                    disabled={
                      isLoading ||
                      (boundingBox.width === 0 && boundingBox.height === 0)
                    }
                    title="Clear area position"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Clear Area
                  </button>
                </div>

                {/* Crop Button - Separate Line */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleCropImage}
                    className={`w-full px-4 py-2 text-sm rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      isCropped
                        ? "border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
                        : "border-green-300 bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                    disabled={
                      isLoading ||
                      isProcessingOCR ||
                      (boundingBox.width === 0 && boundingBox.height === 0)
                    }
                    title={
                      isProcessingOCR
                        ? "Processing OCR..."
                        : isCropped
                        ? "Re-crop image and extract text"
                        : "Crop image and extract text"
                    }
                  >
                    {isProcessingOCR ? (
                      <>
                        <div className="w-4 h-4 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
                        Processing OCR...
                      </>
                    ) : (
                      <>
                        <FiCrop className="w-4 h-4" />
                        {isCropped ? "Re-crop & OCR" : "Crop & OCR"}
                      </>
                    )}
                  </button>
                </div>
              </div>

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
            onClick={handleAdd}
            disabled={!selectedPage || !ocrText.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save Text Box"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
