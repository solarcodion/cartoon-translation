import type { ActivityItem } from "../../types/dashboard";

export default function RecentActivity() {
  // Mock data for recent activities with proper typing
  const activities: ActivityItem[] = [
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Recent Activity
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Overview of recent translations and edits.
      </p>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center justify-between">
            <p className="text-gray-900 text-sm font-medium flex-1 pr-4">
              {activity.action}
            </p>
            <span className="text-gray-500 text-xs font-normal whitespace-nowrap">
              {activity.timestamp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
