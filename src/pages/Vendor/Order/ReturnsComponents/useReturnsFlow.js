import { useState, useEffect, useCallback, useMemo } from "react";
import { getOrdersByVendorId } from "../../../../services/api.order";
import { useAppContext } from "../../../../context/AppContext";
import { MOCK_NDR, MOCK_RTO } from "./constants";

const RETURN_STATUSES = new Set([
  "return pending",
  "return initiated",
  "returned",
]);

const stageForStatus = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "returned") return 5;
  if (s === "return initiated") return 3;
  if (s === "return pending") return 1;
  return 1;
};

const labelForStatus = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "returned") return "Returned to warehouse";
  if (s === "return initiated") return "Pickup booked";
  if (s === "return pending") return "Awaiting admin approval";
  return status || "Unknown";
};

const actionForStatus = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "return pending") return "View";
  if (s === "return initiated") return "Track";
  return "View";
};

export const useReturnsFlow = () => {
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState("returns");
  const [loading, setLoading] = useState(true);
  const [dbOrders, setDbOrders] = useState([]);
  const [actionError, setActionError] = useState(null);

  const reload = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getOrdersByVendorId(user.id).catch(() => null);
    setDbOrders(res?.data?.orders || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const returnsData = useMemo(() => {
    return dbOrders
      .filter((o) => RETURN_STATUSES.has((o.order_status || "").toLowerCase()))
      .map((o) => {
        const prod = o.product || o.products?.[0] || {};
        const status = o.order_status || "";
        return {
          id: o.order_number || `RET-${o.id}`,
          orderId: o.order_number || o.id,
          orderDbId: o.id,
          productName: prod.productName || prod.name || "Product",
          reason: o.return_reason || "Not specified",
          stage: stageForStatus(status),
          status: labelForStatus(status),
          rawStatus: status.toLowerCase(),
          price: Number(o.order_total || o.price || 0),
          action: actionForStatus(status),
          returnAwb: o.return_awb || null,
          returnProvider: o.return_shipping_provider || null,
          returnTrackingUrl: o.return_tracking_url || null,
        };
      });
  }, [dbOrders]);

  const ndrData = useMemo(() => MOCK_NDR, []);
  const rtoData = useMemo(() => MOCK_RTO, []);

  const stats = useMemo(() => {
    const pending = returnsData.filter((r) => r.rawStatus === "return pending");
    const totalRefunds = pending.reduce((acc, curr) => acc + curr.price, 0);
    return {
      returnsCount: returnsData.length,
      rtoCount: rtoData.length,
      ndrCount: ndrData.length,
      refundsPending: totalRefunds,
      pendingRefundsCount: pending.length,
    };
  }, [returnsData, ndrData, rtoData]);

  const activeData =
    activeTab === "returns"
      ? returnsData
      : activeTab === "rto"
        ? rtoData
        : ndrData;

  return {
    activeTab,
    setActiveTab,
    loading,
    stats,
    activeData,
    returnsData,
    rtoData,
    ndrData,
    reload,
    actionError,
    setActionError,
  };
};
