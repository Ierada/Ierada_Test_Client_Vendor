import React from "react";
import { Upload, Plus } from "lucide-react";

const SelfShipHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-950 font-satoshi">Self Ship Management</h1>
        <p className="text-sm text-gray-500 mt-1 font-satoshi">
          Manage your own-courier shipments with full logistics control
        </p>
      </div>
      <div className="flex items-center gap-3 self-start md:self-auto font-satoshi">
        <button className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
          <Upload className="w-4 h-4 text-gray-500" />
          Bulk Upload AWB
        </button>
        <button className="px-4 py-2 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-orange-600 transition-colors shadow-sm flex items-center gap-1.5">
          <Plus className="w-4.5 h-4.5" />
          New Self-Ship Order
        </button>
      </div>
    </div>
  );
};

export default React.memo(SelfShipHeader);
