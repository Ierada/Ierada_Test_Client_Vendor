import { getProductById } from "../../../../services/api.product";

function parseMaybeJson(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function resolveListingType(p) {
  if (p.listing_type === "combo") return "combo";
  if (p.variationMode === "custom" || p.listing_type === "custom") return "custom";
  if (
    p.variationMode === "color_size" ||
    p.listing_type === "color_size" ||
    p.listing_type === "variation" ||
    p.is_variation
  ) {
    return "color_size";
  }
  return "single";
}

function hydrateColorGroups(variations) {
  return (variations || []).map((g) => ({
    color_id: g.color_id || "",
    color_name: g.color?.name || g.color_name || "",
    media: [],
    existingMedia: g.media || [],
    sizes: (g.sizes || []).map((s) => ({
      size_id: s.size_id || "",
      stock: s.stock ?? "",
      original_price: s.original_price ?? "",
      discounted_price: s.discounted_price ?? "",
      sku: s.sku || "",
      barcode: s.barcode || "",
    })),
  }));
}

function hydrateCustomRows(variations) {
  return (variations || []).map((r, i) => ({
    grouping_key: r.grouping_key ?? String(i),
    attributes: r.attributes || [],
    stock: r.stock ?? "",
    original_price: r.original_price ?? "",
    discounted_price: r.discounted_price ?? "",
    sku: r.sku || "",
    barcode: r.barcode || "",
    media: [],
    existingMedia: r.media || [],
    enabled: true,
  }));
}

/**
 * Load an existing product into Smart Listing state (edit / resume).
 * Existing images stay on the product; new Files are only needed when replacing media.
 */
export async function hydrateSmartListingFromProduct(productId) {
  const res = await getProductById(productId);
  const p = res?.data;
  if (!p) throw new Error("Product not found");

  const meta = parseMaybeJson(p.listing_meta, {}) || {};
  const listingType = resolveListingType(p);
  const variations = Array.isArray(p.variations) ? p.variations : [];

  return {
    productId: p.id,
    vendor_id: p.vendor_id,
    brandType: p.brand_type || "generic",
    brand: p.brand || "",
    listingType,
    category_id: p.category_id || "",
    sub_category_id: p.sub_category_id || "",
    inner_sub_category_id: p.inner_sub_category_id || "",
    name: p.name || "",
    shortDescription: p.short_description || "",
    countryOfOrigin: p.country_of_origin || "India",
    hsn_code: p.hsn_code || "",
    gst: p.gst || 0,
    keyFeatures: parseMaybeJson(p.key_features, []) || [],
    benefits: parseMaybeJson(p.benefits, []) || [],
    productDetails: p.product_details || "",
    generalInfo: p.general_info || "",
    specifications: parseMaybeJson(p.specifications, []) || [],
    whatsInTheBox: parseMaybeJson(p.whats_in_the_box, []) || [],
    original_price: p.original_price || "",
    discounted_price: p.discounted_price || "",
    sku: p.sku || "",
    barcode: p.barcode || "",
    stock: p.stock || "",
    low_stock_threshold: p.low_stock_threshold || 5,
    stock_management_mode: meta.stock_management_mode || "self",
    allow_backorders: !!meta.allow_backorders,
    min_order_qty: meta.min_order_qty || 1,
    product_condition: meta.product_condition || "New",
    warrantyType: meta.warranty_type || "",
    warrantyPeriod: meta.warranty_period || "",
    warranty_info: p.warranty_info || "",
    package_weight: p.package_weight || "",
    package_length: p.package_length || "",
    package_width: p.package_width || "",
    package_height: p.package_height || "",
    volumetric_weight: p.volumetric_weight || 0,
    shipping_charges: p.shipping_charges || 0,
    free_shipping: !!p.free_shipping,
    shipsFrom: meta.ships_from || "",
    shipsTo: meta.ships_to || "Pan India",
    deliveryTimeText: meta.delivery_time_text || "3–7 business days",
    cod_available: meta.cod_available !== false,
    return_window_days: meta.return_window_days ?? 7,
    replacement_allowed: meta.replacement_allowed !== false,
    return_shipping_payer: meta.return_shipping_payer || "seller",
    metaTitle: p.meta_title || p.meta?.title || "",
    metaDescription: p.meta_description || p.meta?.description || "",
    metaKeywords: p.meta_keywords || "",
    tags: parseMaybeJson(p.tags, []) || [],
    visibility: p.visibility || "Hidden",
    listing_status: p.listing_status || "draft",
    compliance: meta.compliance || {},
    files: [],
    mediaLabels: [],
    colorGroups: listingType === "color_size" ? hydrateColorGroups(variations) : [],
    customRows: listingType === "custom" ? hydrateCustomRows(variations) : [],
    comboItems: Array.isArray(p.comboItems) ? p.comboItems : [],
    existingMedia: p.media || p.ProductImages || p.product_images || p.images || [],
    sizeChartUrl: p.size_chart_image || p.inner_subcategory?.size_chart_image || null,
  };
}
