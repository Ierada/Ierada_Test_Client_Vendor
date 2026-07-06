import React from "react";
import { CiImport } from "react-icons/ci";

const OrderHeader = ({ onExport, totalOrders = 0, unshipped = 0 }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 font-satoshi">
          Orders
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalOrders > 0
            ? `${totalOrders} orders${
                unshipped > 0 ? ` · ${unshipped} awaiting shipping` : ""
              }`
            : "Advanced order management with AI fraud detection & SLA monitoring"}
        </p>
      </div>
      <button
        onClick={onExport}
        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors shadow-sm"
      >
        <CiImport className="w-4 h-4 text-gray-500" />
        Export
      </button>
    </div>
  );
};

export default OrderHeader;
