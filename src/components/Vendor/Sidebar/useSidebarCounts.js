import { useState, useEffect } from "react";
import { getSelfShipAccess } from "../../../services/api.order";
import { getNotificationPreview } from "../../../services/api.notification";

export const useSidebarCounts = (user) => {
  const [counts, setCounts] = useState({
    orders: 0,
    selfShip: 0,
    returns: 0,
    notifications: 0,
    selfShipEnabled: false,
  });

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        // Badge counts must never toast. Loading every vendor order here was
        // firing "Unable to reach the server" on Smart Listing after the
        // seller rail started rendering on that page.
        const [notifRes, accessRes] = await Promise.all([
          getNotificationPreview(user.id, { silent: true }).catch(() => null),
          getSelfShipAccess().catch(() => null),
        ]);
        if (cancelled) return;
        const unreadCount = Array.isArray(notifRes?.data) ? notifRes.data.length : 0;
        const selfShipEnabled = Boolean(accessRes?.data?.enabled);
        setCounts((prev) => ({
          ...prev,
          notifications: unreadCount,
          selfShipEnabled,
          selfShip: selfShipEnabled ? prev.selfShip : 0,
        }));
      } catch (e) {
        console.error("Error fetching sidebar counts:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return counts;
};
