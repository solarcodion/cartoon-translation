// Individual Page Item Component

import { FiImage, FiTrash2 } from "react-icons/fi";
import { BiSolidEdit } from "react-icons/bi";
import type { Page } from "../../../types";

interface PageItemProps {
  /** Page data to display */
  page: Page;
  /** Callback when edit button is clicked */
  onEdit: () => void;
  /** Callback when delete button is clicked */
  onDelete: () => void;
}

export default function PageItemRow({
  page,
  onEdit,
  onDelete,
}: PageItemProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">
          {page.number}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center justify-center w-16 h-20 bg-gray-100 rounded border">
          <FiImage className="text-gray-400 text-lg" />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">
          {page.dimensions}
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
            title="Edit page"
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
            title="Delete page"
          >
            <FiTrash2 className="text-lg" />
          </button>
        </div>
      </td>
    </tr>
  );
}
