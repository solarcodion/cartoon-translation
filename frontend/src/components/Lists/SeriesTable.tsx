// Reusable Series Table Component

import type { SeriesItem } from "../../types";
import { NoSeriesFound, SeriesTableSkeleton } from "../common";
import { SeriesItemRow } from "./Items";

interface SeriesTableProps {
  /** Array of series to display */
  series: SeriesItem[];
  /** Callback when series item is clicked */
  onSeriesClick: (seriesId: string) => void;
  /** Callback when edit button is clicked */
  onEditSeries?: (seriesId: string) => void;
  /** Callback when delete button is clicked */
  onDeleteSeries?: (seriesId: string) => void;
  /** Whether user can modify (edit/delete) series */
  canModify?: boolean;
  /** Whether data is currently loading */
  isLoading?: boolean;
}

export default function SeriesTable({
  series,
  onSeriesClick,
  onEditSeries,
  onDeleteSeries,
  canModify = true,
  isLoading = false,
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
              Language
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
          {isLoading ? (
            <SeriesTableSkeleton rows={3} />
          ) : (
            series.map((seriesItem) => (
              <SeriesItemRow
                key={seriesItem.id}
                series={seriesItem}
                onClick={() => onSeriesClick(seriesItem.id)}
                onEdit={
                  canModify && onEditSeries
                    ? () => onEditSeries(seriesItem.id)
                    : undefined
                }
                onDelete={
                  canModify && onDeleteSeries
                    ? () => onDeleteSeries(seriesItem.id)
                    : undefined
                }
                canModify={canModify}
              />
            ))
          )}
        </tbody>
      </table>

      {/* Empty state - only show when not loading and no series */}
      {!isLoading && series.length === 0 && <NoSeriesFound />}
    </div>
  );
}
