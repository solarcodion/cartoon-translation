import StatsCard from "../components/Dashboard/StatsCard";
import RecentActivity from "../components/Dashboard/RecentActivity";
import PageHeader from "../components/Header/PageHeader";
import { statsData } from "../data/mockData";

export default function Homepage() {
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
