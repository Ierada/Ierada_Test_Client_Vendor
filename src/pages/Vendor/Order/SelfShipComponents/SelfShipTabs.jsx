import React from "react";

const SelfShipTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b border-gray-200 mb-6 font-satoshi">
      <button
        onClick={() => setActiveTab("workflow")}
        className={`pb-3.5 px-4 font-bold text-sm transition-colors relative ${
          activeTab === "workflow" ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-gray-700"
        }`}
      >
        Order Workflow
      </button>
      <button
        onClick={() => setActiveTab("upload")}
        className={`pb-3.5 px-4 font-bold text-sm transition-colors relative ${
          activeTab === "upload" ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-gray-700"
        }`}
      >
        Bulk Upload
      </button>
    </div>
  );
};

export default React.memo(SelfShipTabs);
