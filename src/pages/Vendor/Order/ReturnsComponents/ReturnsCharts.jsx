import React from "react";

const ReturnsCharts = () => {
  const reasons = [
    { name: "Damaged", val: 34, w: "w-[75%]" },
    { name: "Wrong Item", val: 28, w: "w-[62%]" },
    { name: "Not as Desc", val: 22, w: "w-[48%]" },
    { name: "Changed Mind", val: 17, w: "w-[37%]" },
    { name: "Defective", val: 12, w: "w-[26%]" },
    { name: "Others", val: 9, w: "w-[19%]" }
  ];
  const days = [
    { label: "Mon", h: "h-[18px]" },
    { label: "Tue", h: "h-[26px]" },
    { label: "Wed", h: "h-[14px]" },
    { label: "Thu", h: "h-[32px]" },
    { label: "Fri", h: "h-[36px]" },
    { label: "Sat", h: "h-[29px]" },
    { label: "Sun", h: "h-[22px]" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 font-satoshi">
      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Returns vs RTO — Weekly Trend</h3>
        <div className="flex items-end justify-between h-40 px-2 pb-2 border-b border-gray-100">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2 w-full">
              <div className={`w-6 bg-red-500 rounded-t-md transition-all duration-500 ${d.h}`} />
              <span className="text-[10px] text-gray-400 font-bold">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Return Reasons Breakdown</h3>
        <div className="space-y-3">
          {reasons.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-4 text-xs font-semibold">
              <span className="text-gray-500 w-24 truncate">{r.name}</span>
              <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className={`bg-orange-500 h-full rounded-full ${r.w}`} />
              </div>
              <span className="text-gray-900 w-6 text-right">{r.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ReturnsCharts);
