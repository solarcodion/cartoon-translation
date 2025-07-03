import { useCallback } from "react";
import {
  incrementDashboardSeries,
  decrementDashboardSeries,
  incrementDashboardProgressChapters,
  decrementDashboardProgressChapters,
  incrementDashboardProcessedPages,
  decrementDashboardProcessedPages,
  incrementDashboardTranslatedTextbox,
  decrementDashboardTranslatedTextbox,
  addDashboardActivity,
} from "../stores/dashboardStore";

/**
 * Custom hook for updating dashboard stats in real-time after operations
 * that affect dashboard statistics
 */
export const useDashboardSync = () => {
  // Series operations
  const syncAfterSeriesCreate = useCallback((seriesName: string) => {
    incrementDashboardSeries();
    addDashboardActivity(`Created series: ${seriesName}`);
    console.log("📊 Dashboard updated: Series created");
  }, []);

  const syncAfterSeriesDelete = useCallback((seriesName: string) => {
    decrementDashboardSeries();
    addDashboardActivity(`Deleted series: ${seriesName}`);
    console.log("📊 Dashboard updated: Series deleted");
  }, []);

  // Chapter operations
  const syncAfterChapterCreate = useCallback(
    (chapterTitle: string, seriesName: string) => {
      incrementDashboardProgressChapters();
      addDashboardActivity(`Created chapter: ${chapterTitle} in ${seriesName}`);
      console.log("📊 Dashboard updated: Chapter created");
    },
    []
  );

  const syncAfterChapterDelete = useCallback(
    (chapterTitle: string, seriesName: string) => {
      decrementDashboardProgressChapters();
      addDashboardActivity(
        `Deleted chapter: ${chapterTitle} from ${seriesName}`
      );
      console.log("📊 Dashboard updated: Chapter deleted");
    },
    []
  );

  const syncAfterChapterStatusChange = useCallback(
    (chapterTitle: string, oldStatus: string, newStatus: string) => {
      if (oldStatus === "in_progress" && newStatus !== "in_progress") {
        decrementDashboardProgressChapters();
      } else if (oldStatus !== "in_progress" && newStatus === "in_progress") {
        incrementDashboardProgressChapters();
      }
      addDashboardActivity(
        `Chapter ${chapterTitle} status changed to ${newStatus}`
      );
      console.log("📊 Dashboard updated: Chapter status changed");
    },
    []
  );

  // Page operations
  const syncAfterPageCreate = useCallback(
    (pageNumber: number, chapterTitle: string) => {
      incrementDashboardProcessedPages();
      addDashboardActivity(`Added page ${pageNumber} to ${chapterTitle}`);
      console.log("📊 Dashboard updated: Page created");
    },
    []
  );

  const syncAfterPageDelete = useCallback(
    (pageNumber: number, chapterTitle: string) => {
      decrementDashboardProcessedPages();
      addDashboardActivity(`Deleted page ${pageNumber} from ${chapterTitle}`);
      console.log("📊 Dashboard updated: Page deleted");
    },
    []
  );

  // Translation operations
  const syncAfterTextboxTranslate = useCallback(
    (pageNumber: number, chapterTitle: string) => {
      incrementDashboardTranslatedTextbox();
      addDashboardActivity(
        `Translated textbox in page ${pageNumber} of ${chapterTitle}`
      );
      console.log("📊 Dashboard updated: Textbox translated");
    },
    []
  );

  const syncAfterTextboxDelete = useCallback(
    (pageNumber: number, chapterTitle: string) => {
      decrementDashboardTranslatedTextbox();
      addDashboardActivity(
        `Deleted translation from page ${pageNumber} of ${chapterTitle}`
      );
      console.log("📊 Dashboard updated: Translation deleted");
    },
    []
  );

  // Generic activity logger
  const addActivity = useCallback((activity: string) => {
    addDashboardActivity(activity);
    console.log(`📊 Dashboard activity added: ${activity}`);
  }, []);

  return {
    // Series operations
    syncAfterSeriesCreate,
    syncAfterSeriesDelete,

    // Chapter operations
    syncAfterChapterCreate,
    syncAfterChapterDelete,
    syncAfterChapterStatusChange,

    // Page operations
    syncAfterPageCreate,
    syncAfterPageDelete,

    // Translation operations
    syncAfterTextboxTranslate,
    syncAfterTextboxDelete,

    // Generic
    addActivity,
  };
};

export default useDashboardSync;
