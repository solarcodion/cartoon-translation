import { Skeleton } from "../common/Skeleton";
import {
  FiBookOpen,
  FiBook,
  FiFileText,
  FiMessageSquare,
} from "react-icons/fi";

// Stats Card Skeleton - only skeleton for dynamic data values
export function StatsCardSkeleton({
  title,
  icon,
}: {
  title?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          {/* Static title */}
          <p className="text-sm font-medium text-gray-600 mb-1">
            {title || "Loading..."}
          </p>
          {/* Only the data value is skeleton */}
          <Skeleton className="h-10 w-16 rounded" />
        </div>
        <div className="text-gray-500 text-2xl">
          {/* Static icon */}
          {icon || <Skeleton className="w-6 h-6 rounded" />}
        </div>
      </div>
    </div>
  );
}

// Recent Activity Skeleton - only skeleton for dynamic activity data
export function RecentActivitySkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Static headers */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Recent Activity
      </h2>
      <p className="text-gray-600 mb-6">
        Latest actions and updates in the system.
      </p>

      {/* Only activity items are skeleton (dynamic data) */}
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            {/* Only the activity text content is skeleton */}
            <Skeleton
              className={`h-4 ${
                index % 3 === 0 ? "w-full" : index % 3 === 1 ? "w-3/4" : "w-5/6"
              } rounded`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Complete Dashboard Skeleton - only data sections
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header - keep static text, only skeleton for dynamic parts */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to the Manhwa Translation Admin Panel.
        </p>
      </div>

      {/* Stats Cards Grid - only skeleton for data values */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCardSkeleton title="Total Series" icon={<FiBookOpen />} />
        <StatsCardSkeleton title="In Progress Chapters" icon={<FiBook />} />
        <StatsCardSkeleton title="Processed Pages" icon={<FiFileText />} />
        <StatsCardSkeleton
          title="Translated Textboxes"
          icon={<FiMessageSquare />}
        />
      </div>

      {/* Recent Activity Section */}
      <RecentActivitySkeleton />
    </div>
  );
}

export default DashboardSkeleton;
