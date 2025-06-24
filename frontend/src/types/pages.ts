// Pages related types

export interface Page {
  id: string;
  number: number;
  image_url: string;
  dimensions: string;
  file_size: string;
  created_at: string;
  updated_at: string;
}

export interface AIInsights {
  overall_quality_score: number;
  insights: string[];
}
