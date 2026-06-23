import {
  LayoutDashboard,
  ShoppingCart,
  Building2,
  Settings,
  ArrowLeftRight,
  Megaphone,
  Star,
  HelpCircle,
  Youtube,
  Zap,
  Package,
  RotateCcw,
  Map,
  Bell,
  FolderMinus,
  MessageCircleMore,
} from "lucide-react";
import { BsHandbag } from "react-icons/bs";

export const vendorMenuConfig = {
  mainMenuItems: [
    { text: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    {
      text: "Orders",
      icon: BsHandbag,
      path: "/orders",
      subItems: [
        { text: "Order Pipeline", icon: Zap, path: "/orders/pipeline" },
        { text: "Self Ship", icon: Package, path: "/orders/self-ship", badgeColor: "bg-[#FF6012]" },
        { text: "Returns & RTO", icon: RotateCcw, path: "/orders/returns", badgeColor: "bg-[#F04438]" },
        { text: "Logistics Intel", icon: Map, path: "/orders/logistics" },
      ],
    },
    { text: "Products", icon: ShoppingCart, path: "/product" },
    { text: "Bulk Upload", icon: FolderMinus, path: "/bulk-upload" },
    { text: "Invoice/Bill", icon: MessageCircleMore, path: "/invoice" },
    { text: "Profile", icon: Building2, path: "/profile" },
    { text: "Settings", icon: Settings, path: "/settings" },
    { text: "Report", icon: ArrowLeftRight, path: "/report" },
    { text: "Advertising", icon: Megaphone, path: "/ads/history" },
    { text: "Review", icon: Star, path: "/review" },
    { text: "Support", icon: HelpCircle, path: "/support" },
    { text: "Training", icon: Youtube, path: "/training" },
    { text: "Notifications", icon: Bell, path: "/notifications" },
  ],
};
