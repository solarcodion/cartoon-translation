import { supabase } from "../lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface PageApiItem {
  id: string;
  chapter_id: string;
  page_number: number;
  file_path: string;
  file_name: string;
  width?: number;
  height?: number;
  context?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePageData {
  chapter_id: string;
  page_number: number;
  file: File;
  width?: number;
  height?: number;
  context?: string;
}

export interface BatchCreatePageData {
  chapter_id: string;
  files: File[];
  start_page_number: number;
}

export interface BatchPageUploadResponse {
  success: boolean;
  message: string;
  pages: PageApiItem[];
  total_uploaded: number;
  failed_uploads: string[];
}

export interface UpdatePageData {
  page_number?: number;
  file_name?: string;
  width?: number;
  height?: number;
  context?: string;
}

class PageService {
  private async getAuthHeaders() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("No authentication token available");
    }
    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  async createPage(pageData: CreatePageData): Promise<PageApiItem> {
    try {
      const headers = await this.getAuthHeaders();

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("chapter_id", pageData.chapter_id);
      formData.append("page_number", pageData.page_number.toString());
      formData.append("file", pageData.file);

      if (pageData.width) {
        formData.append("width", pageData.width.toString());
      }
      if (pageData.height) {
        formData.append("height", pageData.height.toString());
      }
      if (pageData.context) {
        formData.append("context", pageData.context);
      }

      const response = await fetch(`${API_BASE_URL}/pages/`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating page:", error);
      throw error;
    }
  }

  async createPagesBatch(
    pageData: BatchCreatePageData
  ): Promise<BatchPageUploadResponse> {
    try {
      const headers = await this.getAuthHeaders();

      // Create FormData for multiple file upload
      const formData = new FormData();
      formData.append("chapter_id", pageData.chapter_id);
      formData.append(
        "start_page_number",
        pageData.start_page_number.toString()
      );

      // Append all files
      pageData.files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`${API_BASE_URL}/pages/batch`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error batch uploading pages:", error);
      throw error;
    }
  }

  async getPagesByChapter(
    chapterId: string,
    skip = 0,
    limit = 100
  ): Promise<PageApiItem[]> {
    try {
      const headers = await this.getAuthHeaders();

      const url = new URL(`${API_BASE_URL}/pages/chapter/${chapterId}`);
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

      return await response.json();
    } catch (error) {
      console.error("Error fetching pages:", error);
      throw error;
    }
  }

  async getPageCountByChapter(chapterId: string): Promise<number> {
    try {
      const headers = await this.getAuthHeaders();

      const url = new URL(`${API_BASE_URL}/pages/chapter/${chapterId}/count`);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        // If count endpoint doesn't exist, fall back to getting all pages
        const allPages = await this.getPagesByChapter(chapterId, 0, 1000);
        return allPages.length;
      }

      const result = await response.json();
      return result.count || 0;
    } catch (error) {
      console.error("Error fetching page count:", error);
      // Fall back to getting all pages
      try {
        const allPages = await this.getPagesByChapter(chapterId, 0, 1000);
        return allPages.length;
      } catch (fallbackError) {
        console.error("Error in fallback page count:", fallbackError);
        return 0;
      }
    }
  }

  async getPageById(pageId: string): Promise<PageApiItem> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/pages/${pageId}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching page:", error);
      throw error;
    }
  }

  async updatePage(
    pageId: string,
    pageData: UpdatePageData
  ): Promise<PageApiItem> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/pages/${pageId}`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pageData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating page:", error);
      throw error;
    }
  }

  async deletePage(pageId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/pages/${pageId}`, {
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
      console.error("Error deleting page:", error);
      throw error;
    }
  }

  async batchCreatePagesWithAutoTextBoxes(
    data: BatchCreatePageData
  ): Promise<BatchPageUploadResponse> {
    try {
      const headers = await this.getAuthHeaders();

      const formData = new FormData();
      formData.append("chapter_id", data.chapter_id);
      formData.append("start_page_number", data.start_page_number.toString());

      // Add all files
      data.files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(
        `${API_BASE_URL}/pages/batch-upload-with-auto-textboxes`,
        {
          method: "POST",
          headers: {
            ...headers,
            // Don't set Content-Type for FormData, let browser set it with boundary
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result: BatchPageUploadResponse = await response.json();
      return result;
    } catch (error) {
      console.error("Error batch creating pages with auto text boxes:", error);
      throw error;
    }
  }
}

export const pageService = new PageService();
