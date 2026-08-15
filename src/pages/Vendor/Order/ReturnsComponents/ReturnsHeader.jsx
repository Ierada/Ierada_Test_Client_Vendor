import React from "react";
import { AlertCircle } from "lucide-react";

const ReturnsHeader = ({ stats }) => {
  return (
    <div className="mb-6 font-satoshi">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-950">Returns & RTO Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Approve customer returns to book a Shadowfax reverse pickup. Off = no courier booking.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-800 px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Returns ship via Shadowfax</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Open Returns", val: stats.returnsCount },
          { label: "RTO Orders", val: stats.rtoCount },
          { label: "NDR Active", val: stats.ndrCount },
          { label: "Awaiting Approval", val: stats.pendingRefundsCount, sub: `${stats.pendingRefundsCount} orders` }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-2xl font-bold text-gray-950">{item.val}</span>
              {item.trend && <span className={`text-xs font-bold ${item.color}`}>{item.trend}</span>}
              {item.sub && <span className="text-xs font-bold text-gray-400">{item.sub}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(ReturnsHeader);
