import React from "react";

const OrderPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalOrders = 0,
  pageSize = 10,
}) => {
  if (totalPages === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalOrders);

  const showingText =
    totalOrders <= pageSize
      ? `Showing ${totalOrders} of ${totalOrders} orders`
      : `Showing ${start}-${end} of ${totalOrders} orders`;

  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPages();

  return (
    <div className="flex items-center justify-between border-t border-gray-150 px-6 py-4 mt-6 bg-white select-none">
      <div>
        <p className="text-sm font-medium text-gray-500">{showingText}</p>
      </div>
      <div>
        <nav className="flex items-center space-x-1.5" aria-label="Pagination">
          {pages.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="w-9 h-9 flex items-center justify-center text-sm font-semibold text-gray-400"
                >
                  ...
                </span>
              );
            }
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#FF6012] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default OrderPagination;
