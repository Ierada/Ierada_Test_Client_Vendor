import {
  LayoutDashboard,
  ShoppingCart,
  Building2,
  Settings,
  ArrowLeftRight,
  HelpCircle,
  Bell,
  Wallet,
  Box,
} from "lucide-react";
import { BsHandbag } from "react-icons/bs";

export const vendorMenuConfig = {
  mainMenuItems: [
    { text: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { text: "Profile", icon: Building2, path: "/profile" },
    {
      text: "Orders",
      icon: BsHandbag,
      path: "/orders",
      sectionPrefixes: ["/orders"],
    },
    { text: "Products", icon: ShoppingCart, path: "/product", sectionPrefixes: ["/product", "/bulk-upload"] },
    { text: "Packaging", icon: Box, path: "/packaging" },
    {
      text: "Payments",
      icon: Wallet,
      path: "/payments",
      sectionPrefixes: ["/payments"],
    },
    { text: "Report", icon: ArrowLeftRight, path: "/report" },
    { text: "Support", icon: HelpCircle, path: "/support" },
    { text: "Notifications", icon: Bell, path: "/notifications" },
    { text: "Settings", icon: Settings, path: "/settings" },
  ],
};
