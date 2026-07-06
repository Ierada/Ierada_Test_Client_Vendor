import React from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { FiFilter } from "react-icons/fi";

const TABS = [
  "All",
  "Placed",
  "Shipped",
  "In Transit",
  "Delivered",
  "Cancelled",
  "Returned",
];

// Count orders belonging to each tab (mirrors filteredOrders logic in Order.jsx)
const countForTab = (orders, tab) => {
  if (!orders?.length) return 0;
  if (tab === "All") return orders.length;
  return orders.filter((o) => {
    const s = (o.order_status || "").toLowerCase();
    if (tab === "Placed") return s === "placed" || s === "pending";
    if (tab === "Shipped") return s === "shipped" || s === "packed";
    if (tab === "In Transit")
      return (
        s === "intransit" || s === "in transit" || s === "out for delivery"
      );
    if (tab === "Delivered") return s === "delivered";
    if (tab === "Cancelled") return s === "cancelled" || s === "rejected";
    if (tab === "Returned")
      return s === "returned" || s === "return" || s === "return pending";
    return false;
  }).length;
};

const OrderFilterTabs = ({
  activeTab,
  setActiveTab,
  search,
  setSearch,
  onToggleFilters,
  orders = [],
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 font-satoshi">
      {/* Search input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders, products, customers..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Tab pills */}
        <div className="flex flex-wrap gap-1 bg-gray-100/60 p-1 rounded-lg border border-gray-100">
          {TABS.map((tab) => {
            const isActive =
              activeTab.toLowerCase() === tab.toLowerCase() ||
              (activeTab === "" && tab === "All");
            const count = countForTab(orders, tab);

            return (
              <button
                key={tab}
                onClick={() => {
                  if (tab === "Returned") {
                    navigate("/orders/returns");
                  } else {
                    setActiveTab(tab === "All" ? "" : tab.toLowerCase());
                  }
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab}
                {count > 0 && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                      isActive
                        ? "bg-gray-100 text-gray-700"
                        : "bg-gray-200/70 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* More Filters button */}
        <button
          onClick={onToggleFilters}
          className="flex items-center gap-2 px-3.5 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 text-xs font-semibold transition-colors"
        >
          <FiFilter className="w-3.5 h-3.5" />
          More Filters
        </button>
      </div>
    </div>
  );
};

export default OrderFilterTabs;
