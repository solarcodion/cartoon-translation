// Note: Backend functionality removed - keeping interfaces for UI compatibility

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
  async createPage(pageData: CreatePageData): Promise<PageApiItem> {
    // Backend functionality removed - return mock data for UI compatibility
    throw new Error("Pages functionality has been disabled");
  }

  async createPagesBatch(
    pageData: BatchCreatePageData
  ): Promise<BatchPageUploadResponse> {
    // Backend functionality removed - return mock data for UI compatibility
    throw new Error("Pages functionality has been disabled");
  }

  async getPagesByChapter(
    chapterId: string,
    skip = 0,
    limit = 100
  ): Promise<PageApiItem[]> {
    // Backend functionality removed - return empty array for UI compatibility
    return [];
  }

  async getPageCountByChapter(chapterId: string): Promise<number> {
    // Backend functionality removed - return 0 for UI compatibility
    return 0;
  }

  async getPageById(pageId: string): Promise<PageApiItem> {
    // Backend functionality removed - throw error for UI compatibility
    throw new Error("Pages functionality has been disabled");
  }

  async updatePage(
    pageId: string,
    pageData: UpdatePageData
  ): Promise<PageApiItem> {
    // Backend functionality removed - throw error for UI compatibility
    throw new Error("Pages functionality has been disabled");
  }

  async deletePage(pageId: string): Promise<void> {
    // Backend functionality removed - throw error for UI compatibility
    throw new Error("Pages functionality has been disabled");
  }

  async batchCreatePagesWithAutoTextBoxes(
    data: BatchCreatePageData
  ): Promise<BatchPageUploadResponse> {
    // Backend functionality removed - throw error for UI compatibility
    throw new Error("Pages functionality has been disabled");
  }
}

export const pageService = new PageService();
