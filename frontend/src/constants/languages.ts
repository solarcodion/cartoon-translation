// Language constants for series and OCR configuration

export interface LanguageOption {
  value: string;
  label: string;
  flag?: string;
}

export const SERIES_LANGUAGES: LanguageOption[] = [
  { value: "vietnamese", label: "Vietnamese", flag: "🇻🇳" },
  { value: "english", label: "English", flag: "🇺🇸" },
  { value: "chinese", label: "Chinese", flag: "🇨🇳" },
  { value: "korean", label: "Korean", flag: "🇰🇷" },
  { value: "japanese", label: "Japanese", flag: "🇯🇵" },
];

export const DEFAULT_SERIES_LANGUAGE = "vietnamese";

// Helper function to get language label by value
export function getLanguageLabel(value: string): string {
  const language = SERIES_LANGUAGES.find((lang) => lang.value === value);
  return language?.label || value;
}

// Helper function to get language option by value
export function getLanguageOption(value: string): LanguageOption | undefined {
  return SERIES_LANGUAGES.find((lang) => lang.value === value);
}
