// Individual Series Item Component

import { Link } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";
import { BiSolidEdit } from "react-icons/bi";
import type { SeriesItem } from "../../../types";

// Language color mapping
const getLanguageColor = (language: string) => {
  const colors = {
    korean: "bg-red-100 text-red-800",
    japanese: "bg-pink-100 text-pink-800",
    chinese: "bg-yellow-100 text-yellow-800",
    vietnamese: "bg-green-100 text-green-800",
    english: "bg-blue-100 text-blue-800",
  };
  return (
    colors[language.toLowerCase() as keyof typeof colors] ||
    "bg-gray-100 text-gray-800"
  );
};

interface SeriesItemProps {
  /** Series data to display */
  series: SeriesItem;
  /** Callback when series item is clicked */
  onClick: () => void;
  /** Callback when edit button is clicked */
  onEdit?: () => void;
  /** Callback when delete button is clicked */
  onDelete?: () => void;
  /** Whether user can modify (edit/delete) series */
  canModify?: boolean;
}

export default function SeriesItemRow({
  series,
  onClick,
  onEdit,
  onDelete,
  canModify = true,
}: SeriesItemProps) {
  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
      onClick={onClick}
    >
      <td className="px-6 py-4">
        <Link
          to={`/series/${series.id}/chapters`}
          className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
        >
          {series.name}
        </Link>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getLanguageColor(
            series.language
          )}`}
        >
          {series.language}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600">
          {series.chapters} chapters
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center gap-2 justify-end">
          {canModify && onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              title="Edit series"
            >
              <BiSolidEdit className="text-lg" />
            </button>
          )}
          {canModify && onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
              title="Delete series"
            >
              <FiTrash2 className="text-lg" />
            </button>
          )}
          {!canModify && (
            <span className="text-sm text-gray-400 italic">View only</span>
          )}
        </div>
      </td>
    </tr>
  );
}
