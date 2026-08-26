import React from "react";

// Orders are only ever created by the customer at checkout — vendors never
// manually create one, so there's no "Create a New Order" action here.
const OrderHeader = () => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-900 font-satoshi">
        Orders Summary
      </h1>
    </div>
  );
};

export default OrderHeader;
