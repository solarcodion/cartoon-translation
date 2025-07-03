import { useState, useEffect } from "react";
import StatsCard from "../components/Dashboard/StatsCard";
import RecentActivity from "../components/Dashboard/RecentActivity";
import PageHeader from "../components/Header/PageHeader";
import {
  FiBookOpen,
  FiBook,
  FiFileText,
  FiMessageSquare,
} from "react-icons/fi";
import type { StatsData, DashboardResponse } from "../types";
import { dashboardService } from "../services/dashboardService";

export default function Homepage() {
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Create stats data from API response - using new dashboard table fields
  const statsData: StatsData[] = dashboardData
    ? [
        {
          title: "Total Series",
          value: dashboardData.total_series.toString(),
          icon: FiBookOpen,
        },
        {
          title: "Chapters in Progress",
          value: dashboardData.progress_chapters.toString(),
          icon: FiBook,
        },
        {
          title: "Pages Processed",
          value: dashboardData.processed_pages.toString(),
          icon: FiFileText,
        },
        {
          title: "Text Boxes Translated",
          value: dashboardData.translated_textbox.toString(),
          icon: FiMessageSquare,
        },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          subtitle="Welcome to the Manhwa Translation Admin Panel."
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          subtitle="Welcome to the Manhwa Translation Admin Panel."
        />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-600">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading dashboard
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to the Manhwa Translation Admin Panel."
      />

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Recent Activity Section */}
      <RecentActivity activities={dashboardData?.recent_activities || []} />
    </div>
  );
}
