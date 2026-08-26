import React from "react";
import { Search, Filter } from "lucide-react";

// Vendors can never cancel an order (customer/admin only) and can never force
// a courier-shipped order to "shipped"/"delivered" — those transitions only
// happen through the dedicated booking/POD flows. So status actions only
// appear when every selected order is actually eligible for them.
const getAvailableBulkActions = (selectedOrders = []) => {
  const actions = [];

  if (selectedOrders.length > 0) {
    const allRejectable = selectedOrders.every((o) =>
      ["placed", "accepted"].includes(String(o.order_status || "").toLowerCase()),
    );
    if (allRejectable) {
      actions.push({ label: "Reject Selected", value: "rejected" });
    }

    const allSelfShipDeliverable = selectedOrders.every(
      (o) =>
        String(o.shipping_provider || "").toLowerCase() === "self_ship" &&
        ["shipped", "intransit"].includes(
          String(o.order_status || "").toLowerCase(),
        ),
    );
    if (allSelfShipDeliverable) {
      actions.push({ label: "Mark as Delivered", value: "delivered" });
    }
  }

  actions.push({ label: "Download PDF", value: "export_pdf" });
  actions.push({ label: "Download Excel", value: "export_excel" });
  return actions;
};

const OrderTableHeader = ({
  search,
  setSearch,
  onToggleFilters,
  selectedOrders = [],
  selectedOrderObjects = [],
  onBulkAction,
}) => {
  const bulkActions = getAvailableBulkActions(selectedOrderObjects);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <h2 className="text-lg font-bold text-gray-900 font-satoshi">
        Customer Orders
      </h2>

      <div className="flex items-center gap-2 flex-wrap">
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

        <button
          onClick={onToggleFilters}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>

        {bulkActions.map((a) => {
          const needsSelection = !["export_pdf", "export_excel"].includes(
            a.value,
          );
          const disabled = needsSelection && selectedOrders.length === 0;
          return (
            <button
              key={a.value}
              type="button"
              disabled={disabled}
              onClick={() => onBulkAction?.(a.value)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {a.label}
              {needsSelection && selectedOrders.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#FF6012] text-white text-[9px] font-bold">
                  {selectedOrders.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTableHeader;
