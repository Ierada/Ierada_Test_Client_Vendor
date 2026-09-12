import {
  BarChart3,
  CloudUpload,
  Image,
  Layers,
  PlusCircle,
} from "lucide-react";

export const VENDOR_PRODUCT_HUB_PATH = "/product";

export const VENDOR_PRODUCT_SECTION_ITEMS = [
  {
    text: "Product List",
    description: "View, search, filter and edit all your product listings.",
    icon: Layers,
    path: "/product/list",
  },
  {
    text: "Add Product",
    description: "Create a new product listing with AI-assisted form.",
    icon: PlusCircle,
    path: "/product/add",
  },
  {
    text: "Bulk Manager",
    description: "Upload, update, export products in bulk (Excel).",
    icon: CloudUpload,
    path: "/bulk-upload",
  },
  {
    text: "Media Manager",
    description: "Manage product images, videos and documents.",
    icon: Image,
    path: "/bulk-upload/media",
  },
];

/** Hub-only card — not added to the horizontal pills strip. */
export const VENDOR_PRODUCT_HUB_INSIGHTS_ITEM = {
  text: "Product Insights",
  description: "Track performance, top products and improvement opportunities.",
  icon: BarChart3,
  path: "/report",
  badge: "New",
  arrowFilled: true,
};

export function isVendorProductWizardPath(pathname) {
  return /^\/product\/(add|edit|add-classic|edit-classic)(\/|$)/.test(
    pathname || "",
  );
}

/** Full-canvas Smart Listing (no vendor chrome) — excludes classic forms. */
export function isSmartListingCanvasPath(pathname) {
  return /^\/product\/(add|edit)(\/|$)/.test(pathname || "") &&
    !/classic/.test(pathname || "");
}

export function isVendorProductSectionPath(pathname) {
  const path = pathname || "";
  return path.startsWith("/product") || path.startsWith("/bulk-upload");
}
