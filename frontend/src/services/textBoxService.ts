import { supabase } from "../lib/supabase";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// API-compatible text box types
export interface TextBoxApiItem {
  id: string;
  page_id: string;
  image?: string;
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

export interface CreateTextBoxData {
  page_id: string;
  image?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  ocr?: string;
  corrected?: string;
  tm?: number;
  reason?: string;
}

export interface UpdateTextBoxData {
  image?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  ocr?: string;
  corrected?: string;
  tm?: number;
  reason?: string;
}

class TextBoxService {
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

  async createTextBox(textBoxData: CreateTextBoxData): Promise<TextBoxApiItem> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/text-boxes/`, {
        method: "POST",
        headers,
        body: JSON.stringify(textBoxData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error("❌ Error creating text box:", error);
      throw error;
    }
  }

  async getTextBoxesByPage(
    pageId: string,
    skip = 0,
    limit = 100
  ): Promise<TextBoxApiItem[]> {
    try {
      const headers = await this.getAuthHeaders();

      const url = new URL(`${API_BASE_URL}/text-boxes/page/${pageId}`);
      url.searchParams.append("skip", skip.toString());
      url.searchParams.append("limit", limit.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error("❌ Error fetching text boxes:", error);
      throw error;
    }
  }

  async getTextBoxesByChapter(
    chapterId: string,
    skip = 0,
    limit = 1000
  ): Promise<TextBoxApiItem[]> {
    try {
      const headers = await this.getAuthHeaders();

      const url = new URL(`${API_BASE_URL}/text-boxes/chapter/${chapterId}`);
      url.searchParams.append("skip", skip.toString());
      url.searchParams.append("limit", limit.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error("❌ Error fetching text boxes:", error);
      throw error;
    }
  }

  async getTextBoxById(textBoxId: string): Promise<TextBoxApiItem> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/text-boxes/${textBoxId}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error("❌ Error fetching text box:", error);
      throw error;
    }
  }

  async updateTextBox(
    textBoxId: string,
    textBoxData: UpdateTextBoxData
  ): Promise<TextBoxApiItem> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/text-boxes/${textBoxId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(textBoxData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("❌ Error updating text box:", error);
      throw error;
    }
  }

  async deleteTextBox(textBoxId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/text-boxes/${textBoxId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }
    } catch (error) {
      console.error("❌ Error deleting text box:", error);
      throw error;
    }
  }
}

export const textBoxService = new TextBoxService();
