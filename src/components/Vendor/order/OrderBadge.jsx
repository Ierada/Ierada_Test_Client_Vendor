import React from "react";

export const StatusBadge = ({ status }) => {
  const styles = {
    placed: "bg-blue-50 text-blue-700 border-blue-200",
    shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
    intransit: "bg-blue-50 text-blue-700 border-blue-200",
    "out for delivery": "bg-blue-50 text-blue-700 border-blue-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    returned: "bg-amber-50 text-amber-700 border-amber-200",
    "return pending": "bg-orange-50 text-orange-700 border-orange-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    packed: "bg-orange-50 text-orange-700 border-orange-200",
    return: "bg-orange-50 text-orange-700 border-orange-200",
  };

  let label = status;
  if (status === "intransit") label = "In Transit";
  else if (status === "out for delivery") label = "Out for Delivery";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${styles[status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
      {label}
    </span>
  );
};

export const PaymentBadge = ({ type }) => {
  const t = type?.toLowerCase();
  if (t === "cod") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-gray-50 text-gray-500 border-gray-200">
          COD
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-amber-50 text-amber-800 border-amber-200">
          COD
        </span>
      </div>
    );
  }
  if (t === "emi") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-gray-50 text-gray-500 border-gray-200">
        EMI
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-gray-50 text-gray-500 border-gray-200">
      Prepaid
    </span>
  );
};

export const RiskBadge = ({ risk }) => {
  const styles = {
    low: "bg-green-50 text-green-700 border-green-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    high: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[risk] || styles.low}`}>
      {risk}
    </span>
  );
};
