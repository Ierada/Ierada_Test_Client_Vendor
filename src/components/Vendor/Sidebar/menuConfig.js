import {
  LayoutDashboard,
  ShoppingCart,
  Building2,
  Settings,
  ArrowLeftRight,
  HelpCircle,
  Bell,
  Wallet,
} from "lucide-react";
import { BsHandbag } from "react-icons/bs";
import { VENDOR_ORDERS_SECTION_PREFIXES } from "../../../config/ordersSection";
import { VENDOR_PAYMENTS_SECTION_PREFIXES } from "../../../config/paymentsSection";

export const vendorMenuConfig = {
  mainMenuItems: [
    { text: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { text: "Profile", icon: Building2, path: "/profile" },
    {
      text: "Orders",
      icon: BsHandbag,
      path: "/orders",
      sectionPrefixes: VENDOR_ORDERS_SECTION_PREFIXES,
    },
    {
      text: "Products",
      icon: ShoppingCart,
      path: "/product",
      sectionPrefixes: ["/product", "/bulk-upload"],
    },
    {
      text: "Payments",
      icon: Wallet,
      path: "/payments",
      sectionPrefixes: VENDOR_PAYMENTS_SECTION_PREFIXES,
    },
    { text: "Report", icon: ArrowLeftRight, path: "/report" },
    { text: "Support", icon: HelpCircle, path: "/support" },
    { text: "Notifications", icon: Bell, path: "/notifications" },
    { text: "Settings", icon: Settings, path: "/settings" },
  ],
};
