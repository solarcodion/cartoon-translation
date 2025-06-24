// Individual Chapter Item Component

import { FiTrash2 } from "react-icons/fi";
import { BiSolidEdit } from "react-icons/bi";
import type { Chapter } from "../../../types";

interface ChapterItemProps {
  /** Chapter data to display */
  chapter: Chapter;
  /** Callback when chapter item is clicked */
  onClick: () => void;
  /** Callback when edit button is clicked */
  onEdit: () => void;
  /** Callback when delete button is clicked */
  onDelete: () => void;
}

export default function ChapterItemRow({
  chapter,
  onClick,
  onEdit,
  onDelete,
}: ChapterItemProps) {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
      onClick={onClick}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">
          Chapter {chapter.number}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(
            chapter.status
          )}`}
        >
          {chapter.status.charAt(0).toUpperCase() + chapter.status.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            title="Edit chapter"
          >
            <BiSolidEdit className="text-lg" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
            title="Delete chapter"
          >
            <FiTrash2 className="text-lg" />
          </button>
        </div>
      </td>
    </tr>
  );
}
