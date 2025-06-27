import StatsCard from "../components/Dashboard/StatsCard";
import RecentActivity from "../components/Dashboard/RecentActivity";
import PageHeader from "../components/Header/PageHeader";
import {
  FiBookOpen,
  FiBook,
  FiFileText,
  FiMessageSquare,
} from "react-icons/fi";
import type { StatsData } from "../types";

export default function Homepage() {
  // Dashboard Stats Data - moved inline since mockData was removed
  const statsData: StatsData[] = [
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
      <RecentActivity />
    </div>
  );
}
