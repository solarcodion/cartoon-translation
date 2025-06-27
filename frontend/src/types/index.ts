// Export all types from a central location

// Authentication types
export * from "./auth";

// Dashboard types
export * from "./dashboard";

// Series types
export * from "./series";

// Pages types
export * from "./pages";

// Translation types
export * from "./translation";

// Text box types
export * from "./textbox";

// AI Glossary types (from service)
export type {
  AIGlossaryEntry,
  AIGlossaryCreate,
  AIGlossaryUpdate,
} from "../services/aiGlossaryService";
