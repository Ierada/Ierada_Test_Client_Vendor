import React, { useState, useRef } from "react";
import { Search, Filter, Calendar, Share2, ChevronDown } from "lucide-react";

const BULK_ACTIONS = [
  { label: "Mark as Shipped", value: "shipped" },
  { label: "Mark as Delivered", value: "delivered" },
  { label: "Mark as Cancelled", value: "cancelled" },
  { label: "Export Selected", value: "export" },
];

const OrderTableHeader = ({
  search,
  setSearch,
  onToggleFilters,
  selectedOrders = [],
  onBulkAction,
  onExport,
}) => {
  const [bulkOpen, setBulkOpen] = useState(false);
  const bulkRef = useRef(null);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      {/* Title */}
      <h2 className="text-lg font-bold text-gray-900 font-satoshi">
        Customer Orders
      </h2>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-44 pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6012] placeholder:text-gray-400"
          />
        </div>

        {/* Filter button */}
        <button
          onClick={onToggleFilters}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>

        {/* Calendar filter button */}
        <button
          onClick={onToggleFilters}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" />
          Filter
        </button>

        {/* Share / Export */}
        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>

        {/* Bulk Action dropdown */}
        <div className="relative" ref={bulkRef}>
          <button
            onClick={() => setBulkOpen((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors"
          >
            Bulk Action
            {selectedOrders.length > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#FF6012] text-white text-[9px] font-bold">
                {selectedOrders.length}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {bulkOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[170px]">
              {BULK_ACTIONS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => {
                    onBulkAction?.(a.value);
                    setBulkOpen(false);
                  }}
                  disabled={selectedOrders.length === 0 && a.value !== "export"}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTableHeader;
