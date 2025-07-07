// Reusable Pages Table Component

import type { Page } from "../../types";
import { EmptyState, PagesTableSkeleton, Pagination } from "../common";
import { PageItemRow } from "./Items";

interface PagesTableProps {
  /** Array of pages to display */
  pages: Page[];
  /** Callback when edit button is clicked */
  onEditPage?: (pageId: string) => void;
  /** Callback when delete button is clicked */
  onDeletePage?: (pageId: string) => void;
  /** Callback when upload page is clicked */
  onUploadPage?: () => void;
  /** Whether user can modify (edit/delete) pages */
  canModify?: boolean;
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Pagination props */
  pagination?: {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
  };
}

export default function PagesTable({
  pages,
  onEditPage,
  onDeletePage,
  onUploadPage,
  canModify = true,
  isLoading = false,
  pagination,
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
          {isLoading ? (
            <PagesTableSkeleton rows={3} />
          ) : (
            pages.map((page) => (
              <PageItemRow
                key={page.id}
                page={page}
                onEdit={
                  canModify && onEditPage
                    ? () => onEditPage(page.id)
                    : undefined
                }
                onDelete={
                  canModify && onDeletePage
                    ? () => onDeletePage(page.id)
                    : undefined
                }
                canModify={canModify}
              />
            ))
          )}
        </tbody>
      </table>

      {/* Empty state - only show when not loading and no pages */}
      {!isLoading && pages.length === 0 && (
        <EmptyState
          icon="📄"
          title="No pages found"
          description={
            canModify
              ? "Upload pages to begin translation"
              : "No pages available"
          }
          action={
            canModify && onUploadPage ? (
              <button
                onClick={onUploadPage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Upload First Page
              </button>
            ) : null
          }
        />
      )}

      {/* Pagination */}
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.onPageChange}
          onItemsPerPageChange={pagination.onItemsPerPageChange}
          disabled={isLoading}
        />
      )}
    </div>
  );
}
