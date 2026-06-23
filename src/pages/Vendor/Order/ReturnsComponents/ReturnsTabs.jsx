import React from "react";

const ReturnsTabs = ({ activeTab, setActiveTab, count }) => {
  const tabs = [
    { id: "returns", label: "Returns", count: count.returns },
    { id: "rto", label: "RTO Orders", count: count.rto },
    { id: "ndr", label: "NDR / Failed Delivery", count: count.ndr }
  ];

  return (
    <div className="flex items-center gap-3 border-b border-gray-200 mb-6 pb-2.5 font-satoshi">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-bold transition-all duration-200 rounded-lg relative ${
            activeTab === tab.id
              ? "bg-[#EEF2F6] text-[#0164CE] shadow-sm"
              : "text-gray-400 hover:text-gray-700"
          }`}
        >
          <span>{tab.label}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            activeTab === tab.id ? "bg-[#0164CE] text-white" : "bg-gray-100 text-gray-500"
          }`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
};

export default React.memo(ReturnsTabs);
