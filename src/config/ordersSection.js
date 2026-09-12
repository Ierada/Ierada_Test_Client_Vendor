import { List, Package, RotateCcw, Zap } from "lucide-react";

export const VENDOR_ORDERS_HUB_PATH = "/orders";

export const VENDOR_ORDERS_SECTION_ITEMS = [
  {
    text: "All Orders",
    description: "Search, filter, and manage your orders.",
    icon: List,
    path: "/orders/list",
  },
  {
    text: "Order Pipeline",
    description: "Track orders through fulfillment stages.",
    icon: Zap,
    path: "/orders/pipeline",
  },
  {
    text: "Self Ship",
    description: "Pack and ship orders yourself.",
    icon: Package,
    path: "/orders/self-ship",
    requiresSelfShip: true,
  },
  {
    text: "Returns & RTO",
    description: "Returns, RTO, and reverse logistics.",
    icon: RotateCcw,
    path: "/orders/returns",
  },
];

export const VENDOR_ORDERS_SECTION_PREFIXES = ["/orders"];

export function isVendorOrdersSectionPath(pathname) {
  const path = pathname || "";
  return path === "/orders" || path.startsWith("/orders/");
}

/** Order detail — hide section pills for a clean detail view. */
export function isVendorOrderDetailPath(pathname) {
  return /^\/orders\/[^/]+$/.test(pathname || "") &&
    !["list", "pipeline", "self-ship", "returns", "logistics"].includes(
      (pathname || "").split("/")[2] || "",
    );
}

export function filterVendorOrderItems(items, { selfShipEnabled } = {}) {
  return (items || []).filter((item) => {
    if (item.requiresSelfShip && !selfShipEnabled) return false;
    return true;
  });
}
