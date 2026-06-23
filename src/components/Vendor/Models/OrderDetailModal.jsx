import React from "react";
import { X } from "lucide-react";
import OrderDetail from "../../../pages/Vendor/Order/OrderDetail";

const OrderDetailModal = ({ isOpen, onClose, orderId }) => {
  if (!isOpen || !orderId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl w-full max-w-[1320px] h-[90vh] flex flex-col relative shadow-2xl overflow-hidden">
        {/* Close button in header */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-[1000] p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Close details"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>

        {/* Modal body */}
        <div className="flex-1 min-h-0 flex flex-col">
          <OrderDetail orderId={orderId} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
