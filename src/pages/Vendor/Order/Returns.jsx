import React, { useCallback, useState } from "react";
import ReturnsHeader from "./ReturnsComponents/ReturnsHeader";
import ReturnsCharts from "./ReturnsComponents/ReturnsCharts";
import ReturnsTabs from "./ReturnsComponents/ReturnsTabs";
import ReturnsTable from "./ReturnsComponents/ReturnsTable";
import { useReturnsFlow } from "./ReturnsComponents/useReturnsFlow";
import { createReturnOrReplacement } from "../../../services/api.order";
import { notifyOnFail } from "../../../utils/notification/toast";

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
      if (actionType !== "Approve" && actionType !== "Reject") return;

      setBusyId(row.orderDbId);
      f.setActionError(null);
      try {
        const res = await createReturnOrReplacement(
          row.orderDbId,
          "vendor",
          null,
          actionType === "Reject" ? "reject" : null,
        );
        if (!res || res.status !== 1) {
          notifyOnFail(
            res?.message ||
              "Could not update return. If this is an approval, enable Shadowfax in Admin → Shipping Partners.",
          );
        }
        await f.reload();
      } catch (err) {
        notifyOnFail(
          err?.response?.data?.message ||
            err.message ||
            "Return action failed",
        );
      } finally {
        setBusyId(null);
      }
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
