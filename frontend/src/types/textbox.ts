// Text box related types

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Legacy types for compatibility with existing components
export interface TextBox {
  id: string;
  pageId: string;
  pageNumber: number;
  boundingBox: BoundingBox;
  ocrText: string;
  aiTranslatedText?: string;
  correctedText?: string;
  correctionReason?: string;
  created_at: string;
  updated_at: string;
}

export interface TextBoxCreate {
  pageId: string;
  pageNumber: number;
  boundingBox: BoundingBox;
  ocrText: string;
  aiTranslatedText?: string;
  correctedText?: string;
  correctionReason?: string;
  tm?: number;
}

export interface TextBoxUpdate {
  boundingBox?: BoundingBox;
  ocrText?: string;
  aiTranslatedText?: string;
  correctedText?: string;
  correctionReason?: string;
  tm?: number;
}

// API-compatible types that match the database schema
export interface TextBoxApiItem {
  id: string;
  page_id: string;
  image?: string; // URL of the original page image
  x: number;
  y: number;
  w: number;
  h: number;
  ocr?: string;
  corrected?: string;
  tm?: number;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface TextBoxApiCreate {
  page_id: string;
  image?: string; // URL of the original page image
  x: number;
  y: number;
  w: number;
  h: number;
  ocr?: string;
  corrected?: string;
  tm?: number;
  reason?: string;
}

export interface TextBoxApiUpdate {
  image?: string; // URL of the original page image
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  ocr?: string;
  corrected?: string;
  tm?: number;
  reason?: string;
}

// Helper functions to convert between legacy and API formats
export function convertApiTextBoxToLegacy(apiTextBox: TextBoxApiItem): TextBox {
  return {
    id: apiTextBox.id,
    pageId: apiTextBox.page_id,
    pageNumber: 0, // This would need to be fetched separately or included in the API response
    boundingBox: {
      x: apiTextBox.x,
      y: apiTextBox.y,
      width: apiTextBox.w,
      height: apiTextBox.h,
    },
    ocrText: apiTextBox.ocr || "",
    aiTranslatedText: apiTextBox.corrected,
    correctedText: apiTextBox.corrected,
    correctionReason: apiTextBox.reason,
    created_at: apiTextBox.created_at,
    updated_at: apiTextBox.updated_at,
  };
}

export function convertLegacyTextBoxToApi(
  legacyTextBox: TextBoxCreate
): TextBoxApiCreate {
  return {
    page_id: legacyTextBox.pageId,
    // Don't pass croppedImage - let backend fetch page image URL instead
    image: undefined,
    x: legacyTextBox.boundingBox.x,
    y: legacyTextBox.boundingBox.y,
    w: legacyTextBox.boundingBox.width,
    h: legacyTextBox.boundingBox.height,
    ocr: legacyTextBox.ocrText || "",
    corrected: legacyTextBox.correctedText || "",
    reason: legacyTextBox.correctionReason || "",
  };
}
