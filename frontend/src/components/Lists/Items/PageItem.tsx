// Individual Page Item Component

import { FiImage, FiTrash2 } from "react-icons/fi";
import { BiSolidEdit } from "react-icons/bi";
import type { Page } from "../../../types";

interface PageItemProps {
  /** Page data to display */
  page: Page;
  /** Callback when edit button is clicked */
  onEdit?: () => void;
  /** Callback when delete button is clicked */
  onDelete?: () => void;
  /** Whether user can modify (edit/delete) pages */
  canModify?: boolean;
}

export default function PageItemRow({
  page,
  onEdit,
  onDelete,
  canModify = true,
}: PageItemProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">{page.number}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center justify-center w-20 h-20 rounded overflow-hidden">
          {page.image_url ? (
            <img
              src={page.image_url}
              alt={`Page ${page.number}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<svg class="text-gray-400 text-lg w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                }
              }}
            />
          ) : (
            <FiImage className="text-gray-400 text-lg" />
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">{page.dimensions}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center gap-2 justify-end">
          {canModify && onEdit && (
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
          )}
          {canModify && onDelete && (
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
          )}
          {!canModify && (
            <span className="text-sm text-gray-400 italic">View only</span>
          )}
        </div>
      </td>
    </tr>
  );
}
