// Series related types

export interface SeriesItem {
  id: string;
  name: string;
  chapters: number;
  created_at: string;
  updated_at: string;
}

// New API-compatible series types
export interface SeriesApiItem {
  id: number;
  title: string;
  total_chapters: number;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// Helper function to convert API response to legacy format
export function convertApiSeriesToLegacy(apiSeries: SeriesApiItem): SeriesItem {
  return {
    id: apiSeries.id.toString(),
    name: apiSeries.title,
    chapters: apiSeries.total_chapters || 0,
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
  status: "draft" | "translated" | "published";
  created_at: string;
  updated_at: string;
}

export interface ChapterInfo {
  id: string;
  number: number;
  title: string;
  series_name: string;
  total_pages: number;
}
