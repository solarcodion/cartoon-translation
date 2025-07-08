import { supabase } from "../lib/supabase";

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
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL || "/api"}/pages`;

  async createPage(pageData: CreatePageData): Promise<PageApiItem> {
    try {
      const formData = new FormData();
      formData.append("file", pageData.file);
      formData.append("page_number", pageData.page_number.toString());

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${this.baseUrl}/chapter/${pageData.chapter_id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
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
      const formData = new FormData();

      // Add all files
      pageData.files.forEach((file) => {
        formData.append("files", file);
      });

      formData.append(
        "start_page_number",
        pageData.start_page_number.toString()
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${this.baseUrl}/chapter/${pageData.chapter_id}/batch`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
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

      return await response.json();
    } catch (error) {
      console.error("Error creating pages batch:", error);
      throw error;
    }
  }

  async getPagesByChapter(
    chapterId: string,
    skip = 0,
    limit = 100
  ): Promise<PageApiItem[]> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${this.baseUrl}/chapter/${chapterId}?skip=${skip}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${this.baseUrl}/chapter/${chapterId}/count`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      return result.count;
    } catch (error) {
      console.error("Error getting page count:", error);
      throw error;
    }
  }

  async getPageById(pageId: string): Promise<PageApiItem> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(`${this.baseUrl}/${pageId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(`${this.baseUrl}/${pageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(`${this.baseUrl}/${pageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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
      const formData = new FormData();

      // Add all files
      data.files.forEach((file) => {
        formData.append("files", file);
      });

      formData.append("start_page_number", data.start_page_number.toString());

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${this.baseUrl}/chapter/${data.chapter_id}/batch-with-auto-textboxes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
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

      return await response.json();
    } catch (error) {
      console.error("Error creating pages with auto text boxes:", error);
      throw error;
    }
  }
}

export const pageService = new PageService();
