interface RecentActivityProps {
  activities: string[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Recent Activity
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Overview of recent translations and edits.
      </p>

      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between">
              <p className="text-gray-900 text-sm font-medium flex-1 pr-4">
                {activity}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No recent activities found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
