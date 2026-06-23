import React from "react";
import EmptyImg from "/assets/skeleton/empty-orders.svg";

const EmptyOrders = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 py-20 flex flex-col items-center justify-center text-center px-4 shadow-sm">
      <img src={EmptyImg} alt="No data available" className="w-44 h-44 object-contain opacity-75" />
      <h3 className="text-lg font-bold text-gray-900 mt-4">No orders yet?</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-xs leading-relaxed">
        Add products to your store and start selling to see orders here.
      </p>
    </div>
  );
};

export default EmptyOrders;
