// Series related types

export interface SeriesItem {
  id: string;
  name: string;
  chapters: number;
  language: string;
  created_at: string;
  updated_at: string;
}

// New API-compatible series types
export interface SeriesApiItem {
  id: string;
  title: string;
  total_chapters: number;
  language: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// Helper function to convert API response to legacy format
export function convertApiSeriesToLegacy(apiSeries: SeriesApiItem): SeriesItem {
  return {
    id: apiSeries.id,
    name: apiSeries.title,
    chapters: apiSeries.total_chapters || 0,
    language: apiSeries.language || "korean",
    created_at: apiSeries.created_at,
    updated_at: apiSeries.updated_at,
  };
}

export interface SeriesInfo {
  id: string;
  name: string;
  totalChapters: number;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  status: "draft" | "in_progress" | "translated";
  context: string;
  created_at: string;
  updated_at: string;
}

// New API-compatible chapter types
export interface ChapterApiItem {
  id: string;
  series_id: string;
  chapter_number: number;
  status: "draft" | "in_progress" | "translated";
  page_count: number;
  next_page: number;
  context: string;
  created_at: string;
  updated_at: string;
}

// Helper function to convert API response to legacy format
export function convertApiChapterToLegacy(apiChapter: ChapterApiItem): Chapter {
  return {
    id: apiChapter.id,
    number: apiChapter.chapter_number,
    title: `Chapter ${apiChapter.chapter_number}`, // Generate title from number
    status: apiChapter.status,
    context: apiChapter.context,
    created_at: apiChapter.created_at,
    updated_at: apiChapter.updated_at,
  };
}

export interface ChapterInfo {
  id: string;
  number: number;
  title: string;
  series_name: string;
  total_pages: number;
  next_page: number;
  context: string;
}
