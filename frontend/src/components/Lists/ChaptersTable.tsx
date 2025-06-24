// Reusable Chapters Table Component

import { useNavigate } from "react-router-dom";
import type { Chapter } from "../../types";
import { EmptyState } from "../common";
import { ChapterItemRow } from "./Items";

interface ChaptersTableProps {
  /** Array of chapters to display */
  chapters: Chapter[];
  /** Series ID for navigation */
  seriesId: string;
  /** Callback when edit button is clicked */
  onEditChapter: (chapterId: string) => void;
  /** Callback when delete button is clicked */
  onDeleteChapter: (chapterId: string) => void;
  /** Callback when add chapter is clicked */
  onAddChapter: () => void;
}

export default function ChaptersTable({
  chapters,
  seriesId,
  onEditChapter,
  onDeleteChapter,
  onAddChapter,
}: ChaptersTableProps) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden mx-6 mb-6 mt-2 border border-gray-200 rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              Chapter No.
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              Status
            </th>
            <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {chapters.map((chapter) => (
            <ChapterItemRow
              key={chapter.id}
              chapter={chapter}
              onClick={() =>
                navigate(`/series/${seriesId}/chapters/${chapter.id}/pages`)
              }
              onEdit={() => onEditChapter(chapter.id)}
              onDelete={() => onDeleteChapter(chapter.id)}
            />
          ))}
        </tbody>
      </table>

      {/* Empty state */}
      {chapters.length === 0 && (
        <EmptyState
          icon="📖"
          title="No chapters found"
          description="Add chapters to get started"
          action={
            <button
              onClick={onAddChapter}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Add First Chapter
            </button>
          }
        />
      )}
    </div>
  );
}
