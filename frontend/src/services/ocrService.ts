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
  detected_language?: string;
  language_confidence?: number;
}

export interface OCRWithTranslationResponse {
  success: boolean;
  original_text: string;
  translated_text: string;
  confidence?: number;
  processing_time?: number;
  translation_time?: number;
  total_time?: number;
  detected_language?: string;
  language_confidence?: number;
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

  async extractText(
    imageData: string,
    seriesLanguage?: string
  ): Promise<OCRResponse> {
    try {
      const headers = await this.getAuthHeaders();

      const requestBody: any = {
        image_data: imageData,
      };

      // Add series language for optimization if provided
      if (seriesLanguage) {
        requestBody.series_language = seriesLanguage;
      }

      const response = await fetch(`${API_BASE_URL}/ocr/extract-text`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
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

  async extractTextEnhanced(
    imageData: string,
    seriesLanguage?: string
  ): Promise<OCRResponse> {
    try {
      const headers = await this.getAuthHeaders();

      const requestBody: any = {
        image_data: imageData,
      };

      // Add series language for optimization if provided
      if (seriesLanguage) {
        requestBody.series_language = seriesLanguage;
      }

      const response = await fetch(
        `${API_BASE_URL}/ocr/extract-text-enhanced`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
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

  // OpenAI OCR Methods

  async extractTextWithOpenAI(
    imageData: string,
    seriesLanguage?: string
  ): Promise<OCRResponse> {
    try {
      const headers = await this.getAuthHeaders();

      const requestBody: any = {
        image_data: imageData,
      };

      // Add series language for optimization if provided
      if (seriesLanguage) {
        requestBody.series_language = seriesLanguage;
      }

      const response = await fetch(`${API_BASE_URL}/ocr/openai/extract-text`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
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
      console.error("❌ Error in OpenAI OCR request:", error);
      throw error;
    }
  }

  async detectTextRegionsWithOpenAI(
    imageData: string,
    seriesLanguage?: string
  ): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();

      const requestBody: any = {
        image_data: imageData,
      };

      // Add series language for optimization if provided
      if (seriesLanguage) {
        requestBody.series_language = seriesLanguage;
      }

      const response = await fetch(
        `${API_BASE_URL}/ocr/openai/detect-text-regions`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error("❌ Error in OpenAI text region detection request:", error);
      throw error;
    }
  }

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

  canvasToBase64(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL("image/png");
  }

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

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    });
  }

  cleanBase64Data(dataURL: string): string {
    if (dataURL.startsWith("data:image")) {
      return dataURL.split(",")[1];
    }
    return dataURL;
  }
}

export const ocrService = new OCRService();
