import { useState, useEffect, useCallback } from "react";
import { getOrdersByVendorId } from "../../../../services/api.order";
import { useAppContext } from "../../../../context/AppContext";
import { SELF_SHIP_STAGES, INITIAL_ORDERS } from "./constants";

export const useSelfShipFlow = (mapDbOrderToSelfShip) => {
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState("workflow");
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [loading, setLoading] = useState(true);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [labelOrderData, setLabelOrderData] = useState(null);
  const [courierName, setCourierName] = useState("BlueDart");
  const [awbNumber, setAwbNumber] = useState("");

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const res = await getOrdersByVendorId(user.id).catch(() => null);
      const list = res?.data?.orders || [];
      setOrders(list.length > 0 ? list.map(mapDbOrderToSelfShip) : INITIAL_ORDERS);
      setLoading(false);
    })();
  }, [user, mapDbOrderToSelfShip]);

  const handleNextStep = useCallback((order) => {
    setOrders((prev) => prev.map((o) => {
      if (o.id !== order.id) return o;
      if (o.activeIndex === 3) {
        setCurrentOrder(o);
        setCourierName(o.courier || "BlueDart");
        setAwbNumber("");
        setShowCourierModal(true);
        return o;
      }
      return { ...o, activeIndex: Math.min(o.activeIndex + 1, SELF_SHIP_STAGES.length - 1) };
    }));
  }, []);

  const saveCourierDetails = useCallback(() => {
    if (!awbNumber.trim()) return alert("Please enter a valid AWB Tracking Number");
    setOrders((prev) => prev.map((o) => o.id === currentOrder.id ? { ...o, courier: courierName, trackingId: awbNumber, activeIndex: 5 } : o));
    setShowCourierModal(false);
    setCurrentOrder(null);
  }, [awbNumber, courierName, currentOrder]);

  const handleViewLabel = useCallback((order) => {
    setLabelOrderData(order);
    setShowLabelModal(true);
  }, []);

  return {
    activeTab, setActiveTab, orders, setOrders, loading,
    showCourierModal, setShowCourierModal, currentOrder, setCurrentOrder,
    showLabelModal, setShowLabelModal, labelOrderData, setLabelOrderData,
    courierName, setCourierName, awbNumber, setAwbNumber,
    handleNextStep, saveCourierDetails, handleViewLabel
  };
};
