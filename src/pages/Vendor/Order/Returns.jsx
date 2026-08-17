import React, { useCallback, useState } from "react";
import ReturnsHeader from "./ReturnsComponents/ReturnsHeader";
import ReturnsCharts from "./ReturnsComponents/ReturnsCharts";
import ReturnsTabs from "./ReturnsComponents/ReturnsTabs";
import ReturnsTable from "./ReturnsComponents/ReturnsTable";
import { useReturnsFlow } from "./ReturnsComponents/useReturnsFlow";

const Returns = () => {
  const f = useReturnsFlow();
  const [busyId, setBusyId] = useState(null);

  const handleAction = useCallback(
    async (actionType, row) => {
      if (!row?.orderDbId) return;
      if (actionType === "Track" || actionType === "View") {
        if (row.returnTrackingUrl) {
          window.open(row.returnTrackingUrl, "_blank", "noopener,noreferrer");
        }
        return;
      }
      return;
    },
    [f],
  );

  if (f.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading Returns & RTO...
      </div>
    );
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
          ndr: f.ndrData.length,
        }}
      />
      <ReturnsTable
        activeTab={f.activeTab}
        data={f.activeData}
        onAction={handleAction}
        busyId={busyId}
      />
    </div>
  );
};

export default Returns;
