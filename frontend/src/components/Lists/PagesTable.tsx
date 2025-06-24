// Reusable Pages Table Component

import type { Page } from "../../types";
import { EmptyState } from "../common";
import { PageItemRow } from "./Items";

interface PagesTableProps {
  /** Array of pages to display */
  pages: Page[];
  /** Callback when edit button is clicked */
  onEditPage: (pageId: string) => void;
  /** Callback when delete button is clicked */
  onDeletePage: (pageId: string) => void;
  /** Callback when upload page is clicked */
  onUploadPage: () => void;
}

export default function PagesTable({
  pages,
  onEditPage,
  onDeletePage,
  onUploadPage,
}: PagesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Page
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Preview
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dimensions
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pages.map((page) => (
            <PageItemRow
              key={page.id}
              page={page}
              onEdit={() => onEditPage(page.id)}
              onDelete={() => onDeletePage(page.id)}
            />
          ))}
        </tbody>
      </table>

      {/* Empty state */}
      {pages.length === 0 && (
        <EmptyState
          icon="📄"
          title="No pages found"
          description="Upload pages to begin translation"
          action={
            <button
              onClick={onUploadPage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Upload First Page
            </button>
          }
        />
      )}
    </div>
  );
}
