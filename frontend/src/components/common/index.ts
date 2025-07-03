// Export all UI components from a central location

export { default as LoadingSpinner } from "./LoadingSpinner";
export {
  PageLoadingSpinner,
  SectionLoadingSpinner,
  InlineLoadingSpinner,
} from "./LoadingSpinner";

export { default as EmptyState } from "./EmptyState";
export {
  NoUsersFound,
  NoSeriesFound,
  NoChaptersFound,
  NoPagesFound,
  NoDataFound,
} from "./EmptyState";

export { default as ErrorState } from "./ErrorState";
export { NetworkError, LoadingError, UnexpectedError } from "./ErrorState";

export { default as Skeleton } from "./Skeleton";
export {
  TextSkeleton,
  AvatarSkeleton,
  CardSkeleton,
  ButtonSkeleton,
  TableSkeleton,
} from "./Skeleton";

// Page skeletons are available but not exported by default
// Only dashboard uses skeleton loading
// export {
//   SeriesPageSkeleton,
//   ChaptersPageSkeleton,
//   PagesPageSkeleton,
//   UsersPageSkeleton,
//   ListPageSkeleton,
// } from "./PageSkeletons";

export {
  BackButton,
  BackToSeries,
  BackToChapters,
  BackToPages,
  BackToUsers,
  BackIconButton,
} from "./Buttons";

export { default as NavigationTabs } from "./Tabs/NavigationTabs";
export { TabContent } from "./Tabs/NavigationTabs";
export type { TabItem } from "./Tabs/NavigationTabs";

export {
  ChaptersTabContent,
  TranslationMemoryTabContent,
  AIGlossaryTabContent,
  PagesTabContent,
  TranslationsTabContent,
  ContextTabContent,
} from "../Tabs";
