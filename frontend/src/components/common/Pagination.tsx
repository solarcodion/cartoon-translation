import { useState, useRef, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiChevronDown } from "react-icons/fi";

export interface PaginationProps {
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of items */
  totalItems: number;
  /** Number of items per page */
  itemsPerPage: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when items per page changes */
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  /** Whether pagination is disabled (e.g., during loading) */
  disabled?: boolean;
  /** Maximum number of page buttons to show */
  maxPageButtons?: number;
  /** Available options for items per page */
  itemsPerPageOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  disabled = false,
  maxPageButtons = 7,
  itemsPerPageOptions = [5, 10, 20, 50],
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Always show pagination (removed the early return)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calculate page range to display
  const getPageRange = () => {
    const half = Math.floor(maxPageButtons / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxPageButtons - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxPageButtons) {
      start = Math.max(1, end - maxPageButtons + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const pageRange = getPageRange();
  const showFirstPage = pageRange[0] > 1;
  const showLastPage = pageRange[pageRange.length - 1] < totalPages;
  const showFirstEllipsis = pageRange[0] > 2;
  const showLastEllipsis = pageRange[pageRange.length - 1] < totalPages - 1;

  const handlePageChange = (page: number) => {
    if (disabled || page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    if (disabled || !onItemsPerPageChange) {
      return;
    }
    onItemsPerPageChange(newItemsPerPage);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const buttonClass = (isActive: boolean, isDisabled: boolean) => {
    const baseClass =
      "px-3 py-2 text-sm font-medium rounded-lg transition-colors";

    if (isDisabled) {
      return `${baseClass} text-gray-400 cursor-not-allowed`;
    }

    if (isActive) {
      return `${baseClass} bg-blue-600 text-white`;
    }

    return `${baseClass} text-gray-700 hover:bg-gray-100 cursor-pointer`;
  };

  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-end px-6 py-4 bg-white border-t border-gray-200">
      {/* All pagination items aligned to the right */}
      <div className="flex items-center gap-6">
        {/* Items info */}
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{startItem}</span> to{" "}
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{totalItems}</span> results
        </div>

        {/* Rows per page selector */}
        {onItemsPerPageChange && (
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <span className="font-medium">Rows per page:</span>
            <div className="relative z-50" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                disabled={disabled}
                className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 pr-2 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer min-w-[60px]"
              >
                <span>{itemsPerPage}</span>
                <FiChevronDown
                  className={`w-4 h-4 text-gray-400 ml-2 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Custom dropdown list */}
              {isDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                  {itemsPerPageOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleItemsPerPageChange(option)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-150 ${
                        option === itemsPerPage
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination controls */}
        <div className="flex items-center space-x-1">
          {/* Previous button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={disabled || currentPage === 1 || totalPages === 0}
            className={buttonClass(
              false,
              disabled || currentPage === 1 || totalPages === 0
            )}
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>

          {/* First page */}
          {showFirstPage && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                disabled={disabled}
                className={buttonClass(currentPage === 1, disabled)}
              >
                1
              </button>
              {showFirstEllipsis && (
                <span className="px-2 py-2 text-sm text-gray-500">...</span>
              )}
            </>
          )}

          {/* Page range */}
          {totalPages > 0 &&
            pageRange.map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                disabled={disabled}
                className={buttonClass(currentPage === page, disabled)}
              >
                {page}
              </button>
            ))}

          {/* Show page 1 when no pages */}
          {totalPages === 0 && (
            <button disabled={true} className={buttonClass(true, true)}>
              1
            </button>
          )}

          {/* Last page */}
          {showLastPage && (
            <>
              {showLastEllipsis && (
                <span className="px-2 py-2 text-sm text-gray-500">...</span>
              )}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={disabled}
                className={buttonClass(currentPage === totalPages, disabled)}
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={
              disabled || currentPage === totalPages || totalPages === 0
            }
            className={buttonClass(
              false,
              disabled || currentPage === totalPages || totalPages === 0
            )}
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
