// Series related types

export interface SeriesItem {
  id: string;
  name: string;
  chapters: number;
  created_at: string;
  updated_at: string;
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
