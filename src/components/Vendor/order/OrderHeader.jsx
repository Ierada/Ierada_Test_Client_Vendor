import React from "react";
import { Plus } from "lucide-react";

const OrderHeader = ({ onCreateOrder, onExport }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-900 font-satoshi">
        Orders Summary
      </h1>
      <button
        onClick={onCreateOrder}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6012] hover:bg-[#e0500a] text-white text-sm font-bold rounded-full transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Create a New Order
      </button>
    </div>
  );
};

export default OrderHeader;
