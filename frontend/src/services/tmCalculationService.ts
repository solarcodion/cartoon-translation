import { supabase } from "../lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface TMSuggestion {
  tm_entry: {
    id: string;
    source_text: string;
    target_text: string;
    context: string;
    usage_count: number;
  };
  similarity_score: number;
  quality_label: string;
  quality_color: string;
}

export interface TMCalculationRequest {
  ocr_text: string;
  series_id: string;
  max_suggestions?: number;
}

export interface TMCalculationResponse {
  success: boolean;
  ocr_text: string;
  series_id: string;
  best_score: number;
  quality_label: string;
  quality_color: string;
  suggestions: TMSuggestion[];
  total_suggestions: number;
}

class TMCalculationService {
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

  async calculateTMScore(
    request: TMCalculationRequest
  ): Promise<TMCalculationResponse> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/text-boxes/calculate-tm`, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const data: TMCalculationResponse = await response.json();

      if (!data.success) {
        throw new Error("TM calculation failed");
      }

      return data;
    } catch (error) {
      console.error("TM calculation error:", error);
      throw error;
    }
  }

  /**
   * Get TM quality badge color class for UI display
   */
  getTMQualityBadgeClass(score: number): string {
    if (score >= 0.95) {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (score >= 0.85) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    } else if (score >= 0.75) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else if (score >= 0.60) {
      return "bg-orange-100 text-orange-800 border-orange-200";
    } else if (score >= 0.40) {
      return "bg-red-100 text-red-800 border-red-200";
    } else {
      return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  /**
   * Get TM quality progress bar color class
   */
  getTMProgressBarClass(score: number): string {
    if (score >= 0.95) {
      return "bg-green-500";
    } else if (score >= 0.85) {
      return "bg-blue-500";
    } else if (score >= 0.75) {
      return "bg-yellow-500";
    } else if (score >= 0.60) {
      return "bg-orange-500";
    } else if (score >= 0.40) {
      return "bg-red-500";
    } else {
      return "bg-gray-400";
    }
  }

  /**
   * Format TM score as percentage
   */
  formatTMScore(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  /**
   * Get TM quality label
   */
  getTMQualityLabel(score: number): string {
    if (score >= 0.95) {
      return "Perfect Match";
    } else if (score >= 0.85) {
      return "Excellent Match";
    } else if (score >= 0.75) {
      return "Good Match";
    } else if (score >= 0.60) {
      return "Fair Match";
    } else if (score >= 0.40) {
      return "Partial Match";
    } else if (score >= 0.20) {
      return "Weak Match";
    } else {
      return "No Match";
    }
  }
}

export const tmCalculationService = new TMCalculationService();
export default tmCalculationService;
