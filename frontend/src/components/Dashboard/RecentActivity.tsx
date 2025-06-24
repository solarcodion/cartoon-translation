import { recentActivities } from "../../data/mockData";

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Recent Activity
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Overview of recent translations and edits.
      </p>

      <div className="space-y-4">
        {recentActivities.map((activity) => (
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
