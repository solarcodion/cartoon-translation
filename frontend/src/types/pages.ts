// Pages related types

export interface Page {
  id: string;
  number: number;
  image_url: string;
  dimensions: string;
  file_size: string;
  context?: string;
  created_at: string;
  updated_at: string;
}

export interface AIInsights {
  overall_quality_score: number;
  insights: string[];
}

// API-compatible page types
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

// Converter function from API to legacy format
export function convertApiPageToLegacy(apiPage: PageApiItem): Page {
  const dimensions =
    apiPage.width && apiPage.height
      ? `${apiPage.width}x${apiPage.height}`
      : "Unknown";

  return {
    id: apiPage.id,
    number: apiPage.page_number,
    image_url: apiPage.file_path, // This will be the public URL from the API
    dimensions,
    file_size: "Unknown", // File size not stored in API, could be calculated
    context: apiPage.context,
    created_at: apiPage.created_at,
    updated_at: apiPage.updated_at,
  };
}
