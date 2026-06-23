import React from "react";
import { getStageDots, getStatusBadge } from "./helpers";

const ReturnsTableRow = ({ activeTab, row, onAction }) => {
  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="p-4 font-bold text-gray-950">{row.id}</td>
      <td className="p-4 font-semibold text-gray-500">{row.orderId}</td>
      <td className="p-4 max-w-[150px] truncate">{row.productName}</td>
      {activeTab === "returns" && (
        <>
          <td className="p-4 text-gray-500">{row.reason}</td>
          <td className="p-4">{getStageDots(row.stage)}</td>
          <td className="p-4">{getStatusBadge(row.status)}</td>
          <td className="p-4 font-bold">₹{row.price?.toLocaleString("en-IN")}</td>
        </>
      )}
      {activeTab === "rto" && (
        <>
          <td className="p-4 text-gray-500">{row.courier}</td>
          <td className="p-4 text-gray-500">{row.reason}</td>
          <td className="p-4">{getStatusBadge(row.status)}</td>
          <td className="p-4 font-bold">₹{row.price?.toLocaleString("en-IN")}</td>
        </>
      )}
      {activeTab === "ndr" && (
        <>
          <td className="p-4 text-gray-500">{row.courier}</td>
          <td className="p-4 text-gray-950 font-bold">{row.attempt}</td>
          <td className="p-4 text-gray-500">{row.reason}</td>
          <td className="p-4 text-gray-500">{row.nextAttempt}</td>
          <td className="p-4">{getStatusBadge(row.status)}</td>
        </>
      )}
      <td className="p-4">
        <div className="flex gap-2">
          <button
            onClick={() => onAction(row.action, row)}
            className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-lg shadow-sm text-[10px]"
          >
            {row.action === "Reschedule/RTO" ? "Reschedule" : (row.action || "View")}
          </button>
          {row.action === "Reschedule/RTO" && (
            <button
              onClick={() => onAction("RTO", row)}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#B42318] border border-red-200 font-bold rounded-lg shadow-sm text-[10px]"
            >
              RTO
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default React.memo(ReturnsTableRow);
