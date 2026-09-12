import {
  LayoutDashboard,
  ShoppingCart,
  Building2,
  Settings,
  ArrowLeftRight,
  HelpCircle,
  Zap,
  Package,
  RotateCcw,
  Bell,
  Wallet,
  FileText,
  CreditCard,
  ScrollText,
  Percent,
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
      subItems: [
        { text: "Order Pipeline", icon: Zap, path: "/orders/pipeline" },
        {
          text: "Self Ship",
          icon: Package,
          path: "/orders/self-ship",
          badgeColor: "bg-[#FF6012]",
        },
        {
          text: "Returns & RTO",
          icon: RotateCcw,
          path: "/orders/returns",
          badgeColor: "bg-[#F04438]",
        },
      ],
    },
    { text: "Products", icon: ShoppingCart, path: "/product", sectionPrefixes: ["/product", "/bulk-upload"] },
    {
      text: "Payments",
      icon: Wallet,
      path: "/payments",
      subItems: [
        { text: "Overview", icon: LayoutDashboard, path: "/payments" },
        {
          text: "Settlements",
          icon: ScrollText,
          path: "/payments/settlements",
        },
        {
          text: "Transactions",
          icon: CreditCard,
          path: "/payments/transactions",
          badgeColor: "bg-[#FF6012]",
        },
        {
          text: "Payment Advice",
          icon: FileText,
          path: "/payments/payment-advice",
        },
        {
          text: "GST & Tax Center",
          icon: Percent,
          path: "/payments/gst-center",
        },
      ],
    },
    { text: "Report", icon: ArrowLeftRight, path: "/report" },
    { text: "Support", icon: HelpCircle, path: "/support" },
    { text: "Notifications", icon: Bell, path: "/notifications" },
    { text: "Settings", icon: Settings, path: "/settings" },
  ],
};
