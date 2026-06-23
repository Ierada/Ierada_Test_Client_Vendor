import React, { useCallback } from "react";
import ReturnsHeader from "./ReturnsComponents/ReturnsHeader";
import ReturnsCharts from "./ReturnsComponents/ReturnsCharts";
import ReturnsTabs from "./ReturnsComponents/ReturnsTabs";
import ReturnsTable from "./ReturnsComponents/ReturnsTable";
import { useReturnsFlow } from "./ReturnsComponents/useReturnsFlow";

const Returns = () => {
  const f = useReturnsFlow();

  const handleAction = useCallback((actionType, row) => {
    alert(`Action "${actionType}" triggered for item ${row.id}`);
  }, []);

  if (f.loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading Returns & RTO...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] py-6 px-4 md:px-8">
      <ReturnsHeader stats={f.stats} />
      <ReturnsCharts />
      <ReturnsTabs
        activeTab={f.activeTab}
        setActiveTab={f.setActiveTab}
        count={{
          returns: f.returnsData.length,
          rto: f.rtoData.length,
          ndr: f.ndrData.length
        }}
      />
      <ReturnsTable activeTab={f.activeTab} data={f.activeData} onAction={handleAction} />
    </div>
  );
};

export default Returns;
