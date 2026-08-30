import { getProductById } from "../../../../services/api.product";
import { newStableId, saveLocalDraft } from "./draftStorage";

/**
 * Load a product and seed a Smart Listing local draft for "Duplicate listing".
 * Images are not copied (vendor re-uploads). Returns stableId for navigation.
 */
export async function seedDuplicateListingDraft(productId, { mode = "vendor" } = {}) {
  const res = await getProductById(productId);
  const p = res?.data;
  if (!p) throw new Error("Product not found");

  const listingType =
    p.listing_type === "combo"
      ? "combo"
      : p.variationMode === "custom"
        ? "custom"
        : p.is_variation || p.listing_type === "variation"
          ? "color_size"
          : "single";

  const payload = {
    brandType: p.brand_type || "generic",
    brand: p.brand || "",
    listingType,
    category_id: p.category_id || "",
    sub_category_id: p.sub_category_id || "",
    inner_sub_category_id: p.inner_sub_category_id || "",
    name: p.name ? `${p.name} (Copy)` : "",
    shortDescription: p.short_description || "",
    countryOfOrigin: p.country_of_origin || "India",
    hsn_code: p.hsn_code || "",
    gst: p.gst || 0,
    keyFeatures: Array.isArray(p.key_features) ? p.key_features : [],
    benefits: Array.isArray(p.benefits) ? p.benefits : [],
    productDetails: p.product_details || "",
    generalInfo: p.general_info || "",
    specifications: Array.isArray(p.specifications) ? p.specifications : [],
    whatsInTheBox: Array.isArray(p.whats_in_the_box) ? p.whats_in_the_box : [],
    original_price: p.original_price || "",
    discounted_price: p.discounted_price || "",
    sku: "",
    barcode: "",
    stock: p.stock || "",
    low_stock_threshold: p.low_stock_threshold || 5,
    metaTitle: p.meta_title || "",
    metaDescription: p.meta_description || "",
    metaKeywords: p.meta_keywords || "",
    files: [],
    colorGroups: [],
    customRows: [],
    comboItems: [],
    visibility: "Hidden",
    listing_status: "draft",
    vendor_id: p.vendor_id,
    compliance: p.listing_meta?.compliance || {},
  };

  const stableId = newStableId(mode);
  saveLocalDraft(stableId, {
    payload,
    phase: "review",
    step: "brand",
    reviewSection: "product_info",
  });
  return stableId;
}
