// Export all stores from a central location

export {
  useDashboardStore,
  useDashboardData,
  useDashboardLoading,
  useDashboardError,
  useDashboardActions,
  useDashboardIsStale,
  invalidateDashboardCache,
  updateDashboardStats,
  incrementDashboardSeries,
  decrementDashboardSeries,
  incrementDashboardProgressChapters,
  decrementDashboardProgressChapters,
  incrementDashboardProcessedPages,
  decrementDashboardProcessedPages,
  incrementDashboardTranslatedTextbox,
  decrementDashboardTranslatedTextbox,
  addDashboardActivity,
} from "./dashboardStore";
