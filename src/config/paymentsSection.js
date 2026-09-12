import {
  CreditCard,
  FileText,
  LayoutDashboard,
  Percent,
  ScrollText,
} from "lucide-react";

export const VENDOR_PAYMENTS_HUB_PATH = "/payments";

export const VENDOR_PAYMENTS_SECTION_ITEMS = [
  {
    text: "Overview",
    description: "Payment summary and payout status.",
    icon: LayoutDashboard,
    path: "/payments/overview",
  },
  {
    text: "Settlements",
    description: "Settlement cycles and amounts.",
    icon: ScrollText,
    path: "/payments/settlements",
  },
  {
    text: "Transactions",
    description: "Payout transaction history.",
    icon: CreditCard,
    path: "/payments/transactions",
  },
  {
    text: "Payment Advice",
    description: "Download and view payment advice notes.",
    icon: FileText,
    path: "/payments/payment-advice",
  },
  {
    text: "GST & Tax Center",
    description: "GST and tax documents for payouts.",
    icon: Percent,
    path: "/payments/gst-center",
  },
];

export const VENDOR_PAYMENTS_SECTION_PREFIXES = ["/payments"];

export function isVendorPaymentsSectionPath(pathname) {
  const path = pathname || "";
  return path === "/payments" || path.startsWith("/payments/");
}

/** Payment advice detail — hide pills. */
export function isVendorPaymentDetailPath(pathname) {
  return /^\/payments\/payment-advice\/[^/]+$/.test(pathname || "");
}
