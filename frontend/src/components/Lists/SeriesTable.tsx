// Reusable Series Table Component

import type { SeriesItem } from "../../types";
import { NoSeriesFound } from "../common";
import { SeriesItemRow } from "./Items";

interface SeriesTableProps {
  /** Array of series to display */
  series: SeriesItem[];
  /** Callback when series item is clicked */
  onSeriesClick: (seriesId: string) => void;
  /** Callback when edit button is clicked */
  onEditSeries: (seriesId: string) => void;
  /** Callback when delete button is clicked */
  onDeleteSeries: (seriesId: string) => void;
}

export default function SeriesTable({
  series,
  onSeriesClick,
  onEditSeries,
  onDeleteSeries,
}: SeriesTableProps) {
  return (
    <div className="bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              Series Name
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              Chapters
            </th>
            <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {series.map((seriesItem) => (
            <SeriesItemRow
              key={seriesItem.id}
              series={seriesItem}
              onClick={() => onSeriesClick(seriesItem.id)}
              onEdit={() => onEditSeries(seriesItem.id)}
              onDelete={() => onDeleteSeries(seriesItem.id)}
            />
          ))}
        </tbody>
      </table>

      {/* Empty state */}
      {series.length === 0 && <NoSeriesFound />}
    </div>
  );
}
