import React from "react";

const CustomerCell = ({ customer, address }) => {
  const name = customer 
    ? `${customer.customerDetails?.first_name || ""} ${customer.customerDetails?.last_name || ""}`.trim() 
    : "Guest";
  return (
    <div>
      <div className="font-semibold text-gray-950 text-sm">{name}</div>
      <div className="text-xs text-gray-500 mt-0.5">{address?.city || "Mumbai"}</div>
    </div>
  );
};

export default CustomerCell;
