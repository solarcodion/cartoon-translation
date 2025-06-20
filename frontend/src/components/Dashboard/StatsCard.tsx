import type { StatsData } from "../../types/dashboard";

type StatsCardProps = Omit<StatsData, "id">;

export default function StatsCard({
  title,
  value,
  icon: Icon,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-gray-500">
          <Icon className="text-2xl" />
        </div>
      </div>
    </div>
  );
}
