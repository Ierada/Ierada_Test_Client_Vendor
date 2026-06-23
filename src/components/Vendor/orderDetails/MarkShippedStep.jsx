import React from "react";
import { Truck, Check, FileText, Printer } from "lucide-react";

const MarkShippedStep = ({ orderData }) => {
  const { id, product, customer, orderInfo } = orderData;
  const statusItems = [
    { label: "Packed", icon: Check, color: "text-green-500 bg-green-50 border-green-200" },
    { label: "Invoiced", icon: FileText, color: "text-green-500 bg-green-50 border-green-200" },
    { label: "Labelled", icon: Printer, color: "text-green-500 bg-green-50 border-green-200" },
    { label: "Shipped", icon: Truck, color: "text-[#FF6012] bg-[#FFF0E6] border-[#FFE0CC]" }
  ];

  return (
    <div className="flex flex-col items-center text-center w-full max-w-[500px] mx-auto p-6 bg-white border border-gray-100 rounded-2xl shadow-sm font-inter">
      <div className="w-16 h-16 rounded-full bg-green-50 text-[#00B560] flex items-center justify-center mb-4">
        <Truck className="w-8 h-8 stroke-[2.5]" />
      </div>
      <h2 className="font-bold text-gray-900 text-lg mb-1">Ready to Ship!</h2>
      <p className="text-gray-400 text-xs leading-relaxed max-w-[340px] mb-6">
        Invoice and shipping label have been generated. Click "Mark as Shipped" to update the order status and notify the customer.
      </p>
      <div className="w-full bg-[#F9FAFC] border border-gray-100 rounded-xl p-4 text-[11px] text-left mb-6 flex flex-col gap-2">
        <h3 className="font-bold text-gray-900 border-b pb-1.5 mb-1.5">Order Summary</h3>
        <div className="flex justify-between">
          <span className="text-gray-400">Order</span>
          <span className="font-bold text-gray-950">#{id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Product</span>
          <span className="font-bold text-gray-950 truncate max-w-[200px]">{product.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Customer</span>
          <span className="font-bold text-gray-950">{customer.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Amount</span>
          <span className="font-bold text-gray-950">{orderInfo.price}</span>
        </div>
      </div>
      <div className="flex justify-center items-center gap-6 text-[10px] font-semibold">
        {statusItems.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${item.color}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <span className={idx === 3 ? "text-[#FF6012]" : "text-green-600"}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(MarkShippedStep);
