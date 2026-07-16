import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const OrderPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalOrders = 0,
  pageSize = 10,
  onPageSizeChange,
}) => {
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [pageJumpOpen, setPageJumpOpen] = useState(false);

  if (totalOrders === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalOrders);

  // Build page jump list (max 20 entries shown in dropdown)
  const pageList = Array.from(
    { length: Math.min(totalPages, 20) },
    (_, i) => i + 1,
  );

  return (
    <div className="flex items-center justify-between px-4 py-3.5 bg-white border-t border-gray-100 rounded-b-xl mt-0">
      {/* Left: items per page + range */}
      <div className="flex items-center gap-3">
        {/* Items per page dropdown */}
        <div className="relative">
          <button
            onClick={() => setPageSizeOpen((p) => !p)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {pageSize}
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {pageSizeOpen && (
            <div className="absolute left-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[70px]">
              {PAGE_SIZE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onPageSizeChange?.(s);
                    onPageChange(1);
                    setPageSizeOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 ${
                    s === pageSize
                      ? "text-[#FF6012] font-bold"
                      : "text-gray-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-sm text-gray-500 font-medium">
          Items per page
        </span>

        {/* Separator */}
        <span className="text-gray-300">·</span>

        {/* Range label */}
        <span className="text-sm text-gray-600 font-medium">
          {start}–{end} of {totalOrders} items
        </span>
      </div>

      {/* Right: page jump + prev/next */}
      <div className="flex items-center gap-2">
        {/* Page jump dropdown */}
        <div className="relative">
          <button
            onClick={() => setPageJumpOpen((p) => !p)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors min-w-[48px] justify-between"
          >
            {currentPage}
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {pageJumpOpen && (
            <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[70px] max-h-48 overflow-y-auto">
              {pageList.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    onPageChange(p);
                    setPageJumpOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 ${
                    p === currentPage
                      ? "text-[#FF6012] font-bold"
                      : "text-gray-700"
                  }`}
                >
                  {p}
                </button>
              ))}
              {totalPages > 20 && (
                <p className="px-3 py-1 text-[10px] text-gray-400">
                  … {totalPages} pages total
                </p>
              )}
            </div>
          )}
        </div>

        <span className="text-sm text-gray-500 font-medium">
          of {totalPages} pages
        </span>

        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default OrderPagination;
