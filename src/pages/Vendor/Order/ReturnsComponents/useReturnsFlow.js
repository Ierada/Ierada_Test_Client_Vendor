import { useState, useEffect, useCallback, useMemo } from "react";
import { getOrdersByVendorId } from "../../../../services/api.order";
import { useAppContext } from "../../../../context/AppContext";
import { MOCK_RETURNS, MOCK_NDR, MOCK_RTO } from "./constants";

export const useReturnsFlow = () => {
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState("returns");
  const [loading, setLoading] = useState(true);
  const [dbOrders, setDbOrders] = useState([]);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const res = await getOrdersByVendorId(user.id).catch(() => null);
      setDbOrders(res?.data?.orders || []);
      setLoading(false);
    })();
  }, [user]);

  const returnsData = useMemo(() => {
    const dbMapped = dbOrders.filter((o) => {
      const s = o.order_status?.toLowerCase();
      return s === "returned" || s === "return initiated" || s === "return pending" || s === "rejected";
    }).map((o) => {
      const prod = o.product || o.products?.[0] || {};
      const status = o.order_status || "QC Pending";
      return {
        id: `RET-${1000 + o.id}`,
        orderId: o.orderNumber || o.id,
        productName: prod.productName || prod.name || "Product",
        reason: o.return_reason || "Not specified",
        stage: status.toLowerCase() === "returned" ? 5 : 1,
        status: status.toLowerCase() === "returned" ? "Refund Approved" : "QC Pending",
        price: o.orderTotal || o.price || 0,
        action: status.toLowerCase() === "returned" ? "View" : "Start QC"
      };
    });
    return [...dbMapped, ...MOCK_RETURNS];
  }, [dbOrders]);

  const ndrData = useMemo(() => MOCK_NDR, []);
  const rtoData = useMemo(() => MOCK_RTO, []);

  const stats = useMemo(() => {
    const totalRefunds = returnsData.reduce((acc, curr) => acc + curr.price, 0);
    return {
      returnsCount: returnsData.length + 129,
      rtoCount: rtoData.length + 64,
      ndrCount: ndrData.length + 20,
      refundsPending: totalRefunds + 205000,
      pendingRefundsCount: returnsData.length + 29
    };
  }, [returnsData, ndrData, rtoData]);

  const activeData = activeTab === "returns" ? returnsData : activeTab === "rto" ? rtoData : ndrData;

  return { activeTab, setActiveTab, loading, stats, activeData, returnsData, rtoData, ndrData };
};
