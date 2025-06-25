// Text box related types

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
}

export interface TextBoxUpdate {
  boundingBox?: BoundingBox;
  ocrText?: string;
  aiTranslatedText?: string;
  correctedText?: string;
  correctionReason?: string;
}
