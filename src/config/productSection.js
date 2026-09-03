import { List, PlusCircle, FolderMinus, Image } from "lucide-react";

export const VENDOR_PRODUCT_HUB_PATH = "/product";

export const VENDOR_PRODUCT_SECTION_ITEMS = [
  {
    text: "Product List",
    description: "Your listings, drafts, and stock.",
    icon: List,
    path: "/product/list",
  },
  {
    text: "Add Product",
    description: "Create a listing with Smart Listing.",
    icon: PlusCircle,
    path: "/product/add",
  },
  {
    text: "Bulk Manager",
    description: "Smart Bulk, Excel, update, and export.",
    icon: FolderMinus,
    path: "/bulk-upload",
  },
  {
    text: "Media Manager",
    description: "Upload listing images first.",
    icon: Image,
    path: "/bulk-upload/media",
  },
];

export function isVendorProductWizardPath(pathname) {
  return /^\/product\/(add|edit|add-classic|edit-classic)(\/|$)/.test(
    pathname || "",
  );
}

export function isVendorProductSectionPath(pathname) {
  const path = pathname || "";
  return path.startsWith("/product") || path.startsWith("/bulk-upload");
}
