// Centralized mock data for all pages and components

import {
  FiBookOpen,
  FiBook,
  FiFileText,
  FiMessageSquare,
} from "react-icons/fi";
import type {
  StatsData,
  ActivityItem,
  SeriesItem,
  SeriesInfo,
  Chapter,
  ChapterInfo,
  Page,
  AIInsights,
  TranslationMemory,
  GlossaryCharacter,
} from "../types";

// Dashboard Stats Data
export const statsData: StatsData[] = [
  {
    title: "Total Series",
    value: "3",
    icon: FiBookOpen,
  },
  {
    title: "Chapters in Progress",
    value: "1",
    icon: FiBook,
  },
  {
    title: "Pages Processed",
    value: "3",
    icon: FiFileText,
  },
  {
    title: "Text Boxes Translated",
    value: "3",
    icon: FiMessageSquare,
  },
];

// Recent Activity Data
export const recentActivities: ActivityItem[] = [
  {
    id: 1,
    action: "User 'translator_one' translated Chapter 2 of Solo Leveling.",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    action: "New Series 'Omniscient Reader's Viewpoint' added.",
    timestamp: "5 hours ago",
  },
];

// Series Data
export const mockSeries: SeriesItem[] = [
  {
    id: "1",
    name: "Solo Leveling",
    chapters: 2,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "The Beginning After The End",
    chapters: 1,
    created_at: "2024-01-16T10:00:00Z",
    updated_at: "2024-01-16T10:00:00Z",
  },
];

// Series Info Data
export const getSeriesInfo = (seriesId: string): SeriesInfo => ({
  id: seriesId,
  name: seriesId === "1" ? "Solo Leveling" : "The Beginning After The End",
  totalChapters: seriesId === "1" ? 2 : 1,
});

// Chapters Data
export const getChapters = (seriesId: string): Chapter[] => {
  if (seriesId === "1") {
    return [
      {
        id: "1",
        number: 1,
        title: "The Weakest Hunter",
        status: "published",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
      },
      {
        id: "2",
        number: 2,
        title: "The System Awakens",
        status: "translated",
        created_at: "2024-01-16T10:00:00Z",
        updated_at: "2024-01-16T10:00:00Z",
      },
    ];
  } else {
    return [
      {
        id: "3",
        number: 1,
        title: "Reincarnation",
        status: "draft",
        created_at: "2024-01-17T10:00:00Z",
        updated_at: "2024-01-17T10:00:00Z",
      },
    ];
  }
};

// Chapter Info Data
export const getChapterInfo = (chapterId: string): ChapterInfo => ({
  id: chapterId,
  number: 1,
  title: "Solo Leveling",
  series_name: "Solo Leveling",
  total_pages: 2,
});

// Pages Data
export const mockPages: Page[] = [
  {
    id: "1",
    number: 1,
    image_url: "/placeholder-page.jpg",
    dimensions: "800x1200",
    file_size: "1.2MB",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    number: 2,
    image_url: "/placeholder-page.jpg",
    dimensions: "750x1150",
    file_size: "1.5MB",
    created_at: "2024-01-15T10:05:00Z",
    updated_at: "2024-01-15T10:05:00Z",
  },
];

// AI Insights Data
export const mockAiInsights: AIInsights = {
  overall_quality_score: 92,
  insights: ["Consider standardizing 'gate' vs 'portal' terminology."],
};

// Mock Users Data
export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "admin" | "editor" | "translator";
  created_at: string;
  updated_at: string;
}

export const mockUsers: MockUser[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@manhwatrans.com",
    avatar: null,
    role: "admin",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:00:00Z",
  },
  {
    id: "2",
    name: "Editor One",
    email: "editor1@manhwatrans.com",
    avatar: null,
    role: "editor",
    created_at: "2024-01-02T10:00:00Z",
    updated_at: "2024-01-02T10:00:00Z",
  },
  {
    id: "3",
    name: "Translator One",
    email: "translator1@manhwatrans.com",
    avatar: null,
    role: "translator",
    created_at: "2024-01-03T10:00:00Z",
    updated_at: "2024-01-03T10:00:00Z",
  },
  {
    id: "4",
    name: "Translator Two",
    email: "translator2@manhwatrans.com",
    avatar: null,
    role: "translator",
    created_at: "2024-01-04T10:00:00Z",
    updated_at: "2024-01-04T10:00:00Z",
  },
];

// Translation Memory Data
export const translationMemoryData: TranslationMemory[] = [
  {
    id: "1",
    source: "Level up",
    target: "Nâng cấp",
    context: "System message",
    usage: 15,
  },
  {
    id: "2",
    source: "Shadow Monarch",
    target: "Quân Vương Bóng Tối",
    context: "Title",
    usage: 25,
  },
  {
    id: "3",
    source: "System Message: You have awakened.",
    target: "Thông báo hệ thống: Bạn đã thức tỉnh.",
    context: "System alert",
    usage: 5,
  },
];

// Glossary Characters Data
export const glossaryData: GlossaryCharacter[] = [
  {
    id: "1",
    name: "Sung Jinwoo",
    summary:
      "The protagonist, initially known as the 'World's Weakest Hunter.' Undergoes a unique reawakening, granting him the ability to level up and grow stronger by completing quests within a mysterious 'System.' Known for his determination and rapid growth. (Updated by AI)",
    mentionedChapters: [1],
    status: "Ongoing",
  },
  {
    id: "2",
    name: "Cha Hae-In",
    summary:
      "An S-rank Hunter and Vice-Guild Master of the Hunters Guild. Possesses a unique ability to smell mana, which often causes her discomfort around other hunters. Known for her exceptional swordsmanship and stoic demeanor. (Updated by AI)",
    mentionedChapters: [45],
    status: "Ongoing",
  },
  {
    id: "3",
    name: "Go Gunhee",
    summary:
      "The Chairman of the Korean Hunters Association. A wise and experienced leader who recognizes Jinwoo's potential early on. Known for his strategic mind and dedication to protecting Korea from dungeon threats. (Updated by AI)",
    mentionedChapters: [12, 23],
    status: "All",
  },
];
