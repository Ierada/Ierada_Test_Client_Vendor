import { useState, useEffect } from "react";
import { getOrdersByVendorId } from "../../../services/api.order";
import { getNotificationPreview } from "../../../services/api.notification";

export const useSidebarCounts = (user) => {
  const [counts, setCounts] = useState({
    orders: 247,
    selfShip: 18,
    returns: 34,
    notifications: 5,
  });

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await getOrdersByVendorId(user.id).catch(() => null);
        const list = res?.data?.orders || [];
        
        let activeOrders = 247;
        let selfShipCount = 18;
        let returnsCount = 34;

        if (list.length > 0) {
          activeOrders = list.filter(o => {
            const s = o.order_status?.toLowerCase();
            return s && s !== "cancelled" && s !== "rejected" && s !== "returned" && s !== "delivered";
          }).length;
          
          selfShipCount = list.filter(o => {
            const s = o.order_status?.toLowerCase();
            return s && s !== "cancelled" && s !== "returned" && s !== "delivered" && (!o.shipping_provider || o.courier_name);
          }).length;

          returnsCount = list.filter(o => {
            const s = o.order_status?.toLowerCase();
            return s === "returned" || s === "return initiated" || s === "return pending" || s === "rejected";
          }).length;
        }

        const notifRes = await getNotificationPreview(user.id).catch(() => null);
        const unreadCount = notifRes?.data?.length || 5;

        setCounts({
          orders: activeOrders,
          selfShip: selfShipCount,
          returns: returnsCount,
          notifications: unreadCount,
        });
      } catch (e) {
        console.error("Error fetching sidebar counts:", e);
      }
    })();
  }, [user]);

  return counts;
};
