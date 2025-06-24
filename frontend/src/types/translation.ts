// Translation related types

export interface TranslationMemory {
  id: string;
  source: string;
  target: string;
  context: string;
  usage: number;
}

export interface GlossaryCharacter {
  id: string;
  name: string;
  summary: string;
  mentionedChapters: number[];
  status: "Ongoing" | "All";
  image?: string;
}
