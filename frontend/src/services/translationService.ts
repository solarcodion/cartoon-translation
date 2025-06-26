import { supabase } from "../lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export interface TranslationRequest {
  source_text: string;
  target_language?: string;
  context?: string;
}

export interface EnhancedTranslationRequest {
  source_text: string;
  target_language?: string;
  series_context?: string;
  character_names?: string[];
}

export interface TranslationResponse {
  success: boolean;
  source_text: string;
  translated_text: string;
  target_language: string;
  processing_time?: number;
  model?: string;
  tokens_used?: number;
}

export interface QuickTranslationRequest {
  text: string;
}

export interface QuickTranslationResponse {
  original_text: string;
  translated_text: string;
  target_language: string;
  processing_time?: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

class TranslationService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error("No authentication token available");
    }

    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    };
  }

  /**
   * Translate text using OpenAI GPT
   */
  async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      console.log("🔄 Sending translation request...");
      console.log(`📝 Source text: "${request.source_text}"`);
      console.log(`🌐 Target language: ${request.target_language || "default"}`);

      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/translation/translate`, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Translation failed");
      }

      console.log("✅ Translation completed successfully");
      console.log(`📝 Translated text: "${data.data.translated_text}"`);
      
      return data.data as TranslationResponse;

    } catch (error) {
      console.error("❌ Translation error:", error);
      throw error;
    }
  }

  /**
   * Translate text with enhanced context (series info, character names)
   */
  async translateTextEnhanced(request: EnhancedTranslationRequest): Promise<TranslationResponse> {
    try {
      console.log("🔄 Sending enhanced translation request...");
      console.log(`📝 Source text: "${request.source_text}"`);
      console.log(`🌐 Target language: ${request.target_language || "default"}`);
      console.log(`📚 Series context: ${request.series_context || "none"}`);
      console.log(`👥 Character names: ${request.character_names?.join(", ") || "none"}`);

      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/translation/translate-enhanced`, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Enhanced translation failed");
      }

      console.log("✅ Enhanced translation completed successfully");
      console.log(`📝 Translated text: "${data.data.translated_text}"`);
      
      return data.data as TranslationResponse;

    } catch (error) {
      console.error("❌ Enhanced translation error:", error);
      throw error;
    }
  }

  /**
   * Quick translation for simple text
   */
  async quickTranslate(text: string): Promise<QuickTranslationResponse> {
    try {
      console.log("🔄 Sending quick translation request...");
      console.log(`📝 Text: "${text}"`);

      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/translation/quick-translate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Quick translation failed");
      }

      console.log("✅ Quick translation completed successfully");
      console.log(`📝 Translated text: "${data.data.translated_text}"`);
      
      return data.data as QuickTranslationResponse;

    } catch (error) {
      console.error("❌ Quick translation error:", error);
      throw error;
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<{ languages: string[]; default_language: string }> {
    try {
      console.log("🔄 Fetching supported languages...");

      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/translation/languages`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to get supported languages");
      }

      console.log("✅ Supported languages fetched successfully");
      
      return data.data;

    } catch (error) {
      console.error("❌ Get supported languages error:", error);
      throw error;
    }
  }

  /**
   * Health check for translation service
   */
  async healthCheck(): Promise<any> {
    try {
      console.log("🔄 Checking translation service health...");

      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/translation/health`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      console.log("✅ Translation service health check completed");
      
      return data;

    } catch (error) {
      console.error("❌ Translation service health check error:", error);
      throw error;
    }
  }
}

export const translationService = new TranslationService();
