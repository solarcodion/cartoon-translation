import { supabase } from "../lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface OCRRequest {
  image_data: string;
}

export interface OCRResponse {
  success: boolean;
  text: string;
  confidence?: number;
  processing_time?: number;
  detected_language?: string; // Language code detected by OCR
  language_confidence?: number; // Confidence of language detection
}

export interface OCRWithTranslationResponse {
  success: boolean;
  original_text: string; // Original text from OCR (any supported language)
  translated_text: string; // English translation
  confidence?: number;
  processing_time?: number;
  translation_time?: number;
  total_time?: number;
  detected_language?: string; // Language code detected by OCR
  language_confidence?: number; // Confidence of language detection
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

class OCRService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("No authentication token available");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  /**
   * Extract text from a base64 encoded image using OCR
   */
  async extractText(imageData: string): Promise<OCRResponse> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/ocr/extract-text`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          image_data: imageData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result: OCRResponse = await response.json();

      return result;
    } catch (error) {
      console.error("❌ Error in OCR request:", error);
      throw error;
    }
  }

  /**
   * Extract text from a base64 encoded image using enhanced OCR with preprocessing
   */
  async extractTextEnhanced(imageData: string): Promise<OCRResponse> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${API_BASE_URL}/ocr/extract-text-enhanced`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            image_data: imageData,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result: OCRResponse = await response.json();

      return result;
    } catch (error) {
      console.error("❌ Error in enhanced OCR request:", error);
      throw error;
    }
  }

  /**
   * Extract Vietnamese text from image and translate to English
   */
  async extractTextWithTranslation(
    imageData: string
  ): Promise<OCRWithTranslationResponse> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${API_BASE_URL}/ocr/extract-text-with-translation`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            image_data: imageData,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result: OCRWithTranslationResponse = await response.json();

      return result;
    } catch (error) {
      console.error("❌ Error in OCR with translation request:", error);
      throw error;
    }
  }

  /**
   * Extract Vietnamese text from image using enhanced OCR and translate to English
   */
  async extractTextEnhancedWithTranslation(
    imageData: string
  ): Promise<OCRWithTranslationResponse> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${API_BASE_URL}/ocr/extract-text-enhanced-with-translation`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            image_data: imageData,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result: OCRWithTranslationResponse = await response.json();

      return result;
    } catch (error) {
      console.error(
        "❌ Error in enhanced OCR with translation request:",
        error
      );
      throw error;
    }
  }

  /**
   * Check OCR service health
   */
  async checkHealth(): Promise<ApiResponse> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/ocr/health`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result: ApiResponse = await response.json();

      return result;
    } catch (error) {
      console.error("❌ Error in OCR health check:", error);
      throw error;
    }
  }

  /**
   * Convert canvas to base64 data URL
   */
  canvasToBase64(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL("image/png");
  }

  /**
   * Convert image element to base64 data URL
   */
  imageToBase64(img: HTMLImageElement): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0);

        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Crop image and convert to base64
   */
  async cropImageToBase64(
    img: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Set canvas size to the crop area
        canvas.width = width;
        canvas.height = height;

        // Draw the cropped portion of the image
        ctx.drawImage(
          img,
          x,
          y,
          width,
          height, // Source rectangle
          0,
          0,
          width,
          height // Destination rectangle
        );

        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Clean base64 data by removing data URL prefix
   */
  cleanBase64Data(dataURL: string): string {
    if (dataURL.startsWith("data:image")) {
      return dataURL.split(",")[1];
    }
    return dataURL;
  }
}

// Export singleton instance
export const ocrService = new OCRService();
