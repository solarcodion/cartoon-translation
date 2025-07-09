// Translation related types

export interface TranslationMemory {
  id: string;
  source: string;
  target: string;
  context: string;
  usage: number;
}

// New API-compatible translation memory types
export interface TranslationMemoryApiItem {
  id: string;
  series_id: string;
  source_text: string;
  target_text: string;
  context: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Helper function to convert API response to legacy format
export function convertApiTMToLegacy(
  apiTM: TranslationMemoryApiItem
): TranslationMemory {
  return {
    id: apiTM.id,
    source: apiTM.source_text,
    target: apiTM.target_text,
    context: apiTM.context || "",
    usage: apiTM.usage_count || 0,
  };
}

export interface GlossaryCharacter {
  id: string;
  name: string;
  originalText?: string; // Original text in series language
  translatedText?: string; // English description
  category?: string; // Term category
  summary: string; // Description in series language
  mentionedChapters: number[];
  status: "Ongoing" | "All";
  image?: string;
  confidence_score?: number;
}
