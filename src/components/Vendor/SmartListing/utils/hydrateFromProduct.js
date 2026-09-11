import { getProductById } from "../../../../services/api.product";
import {
  colorSizeMediaKey,
  deriveCustomAttrsFromRows,
  selectedVariationColorIds,
} from "./variationHelpers";
import { listingTypeKey } from "./listingMediaByType";

const PHOTO_SLOT_IDS = [
  "front",
  "back",
  "side",
  "lifestyle",
  "packaging",
  "extra1",
  "extra2",
  "extra3",
];

function parseMaybeJson(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

/**
 * Prefer explicit listing_type. Never trust variationMode alone — API used to
 * default variationMode to "color_size" even for single products.
 */
function resolveListingType(p) {
  const lt = String(p.listing_type || "").toLowerCase();
  if (lt === "combo") return "combo";
  if (lt === "single") return "single";
  if (lt === "custom") return "custom";
  if (lt === "color_size" || lt === "variation") {
    return p.variationMode === "custom" ? "custom" : "color_size";
  }
  if (p.is_variation) {
    return p.variationMode === "custom" ? "custom" : "color_size";
  }
  return "single";
}

function normalizeExistingMedia(list) {
  return (Array.isArray(list) ? list : [])
    .map((m) => {
      if (!m) return null;
      const url = m.url || m.file || (typeof m === "string" ? m : "");
      if (!url) return null;
      return {
        id: m.id || null,
        url,
        type: m.type || "image",
        label: m.label || null,
        alt_text: m.alt_text || m.alt || null,
      };
    })
    .filter(Boolean);
}

/** Align server media into labeled slots for the photo boxes UI. */
function mediaLabelsFromExisting(existingMedia) {
  const slots = PHOTO_SLOT_IDS;
  const used = new Set();
  const labels = [];
  const ordered = [];

  (existingMedia || []).forEach((m, i) => {
    let slot = m.label && slots.includes(m.label) ? m.label : null;
    if (!slot || used.has(slot)) {
      slot = slots.find((s) => !used.has(s)) || `extra${i}`;
    }
    used.add(slot);
    ordered.push({ ...m, label: slot });
    labels.push({
      label: slot,
      alt_text: m.alt_text || "",
    });
  });

  return { existingMedia: ordered, mediaLabels: labels };
}

function hydrateColorGroups(variations, variantStatus = {}) {
  return (variations || []).map((g) => ({
    color_id: g.color_id || g.color?.id || "",
    color_name: g.color?.name || g.color_name || "",
    media: [],
    existingMedia: normalizeExistingMedia(g.media),
    sizes: (g.sizes || []).map((s) => {
      const colorId = g.color_id || g.color?.id || "";
      const sizeId = s.size_id || s.size?.id || "";
      const metaStatus = variantStatus?.[`${colorId}:${sizeId}`];
      const status =
        s.status ||
        metaStatus ||
        (s.enabled === false ? "out_of_stock" : "in_stock");
      return {
        size_id: sizeId,
        size: s.size || { id: sizeId, name: s.size?.name || "" },
        stock: s.stock ?? "",
        original_price: s.original_price ?? "",
        discounted_price: s.discounted_price ?? "",
        sku: s.sku || "",
        barcode: s.barcode || "",
        status,
        enabled: s.enabled !== false && status !== "out_of_stock",
      };
    }),
  }));
}

function hydrateSizeMedia(raw) {
  const out = {};
  (Array.isArray(raw) ? raw : []).forEach((s) => {
    const sizeId = s?.size_id != null && s.size_id !== "" ? String(s.size_id) : "";
    const colorId = s?.color_id != null && s.color_id !== "" ? String(s.color_id) : "";
    const key = colorId && sizeId ? colorSizeMediaKey(colorId, sizeId) : colorId || sizeId;
    if (!key) return;
    out[key] = {
      media: [],
      existingMedia: normalizeExistingMedia(s.existing || s.existingMedia || s.media),
    };
  });
  return out;
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
    existingMedia: normalizeExistingMedia(r.media),
    enabled: r.enabled !== false,
  }));
}

function hydrateCustomValueMedia(raw) {
  const out = {};
  (Array.isArray(raw) ? raw : []).forEach((item) => {
    const key = item?.key;
    if (!key) return;
    out[key] = {
      media: [],
      existingMedia: normalizeExistingMedia(item.existing || item.existingMedia || item.media),
    };
  });
  return out;
}

function hydrateCustomAttrs(meta, rows) {
  if (Array.isArray(meta?.custom_attrs) && meta.custom_attrs.length) {
    return meta.custom_attrs.map((a) => {
      const values = Array.isArray(a.values) ? a.values.filter(Boolean) : [];
      return {
        attribute_id: a.attribute_id || "",
        name: a.name || "",
        values,
        valuesText: values.join(", "),
      };
    });
  }
  return deriveCustomAttrsFromRows(rows);
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
  const rawMedia = normalizeExistingMedia(
    p.media || p.ProductImages || p.product_images || p.images || [],
  );
  const { existingMedia, mediaLabels } = mediaLabelsFromExisting(rawMedia);
  const customRows = listingType === "custom" ? hydrateCustomRows(variations) : [];

  return {
    productId: p.id,
    vendor_id: p.vendor_id,
    brandType: p.brand_type || "generic",
    brand: p.brand || "",
    listingType: listingType === "combo" ? "single" : listingType,
    isCombo:
      (listingType === "combo" || listingType === "single") &&
      (listingType === "combo" || !!meta.is_combo),
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
    size_id: meta.size_id || "",
    size_ids: Array.isArray(meta.size_ids)
      ? meta.size_ids.map(String)
      : meta.size_id
        ? [String(meta.size_id)]
        : [],
    color_id: meta.color_id || "",
    color_ids: selectedVariationColorIds({
      color_ids: Array.isArray(meta.color_ids) ? meta.color_ids.map(String) : [],
      color_id: meta.color_id || "",
      colorGroups: listingType === "color_size" ? hydrateColorGroups(variations, meta.variant_status) : [],
    }),
    color_name: meta.color_name || "",
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
    mediaLabels,
    deleteMediaIds: [],
    mediaByListingType: {
      ...(meta.media_by_listing_type && typeof meta.media_by_listing_type === "object"
        ? meta.media_by_listing_type
        : {}),
      [listingTypeKey(listingType)]: {
        files: [],
        mediaLabels,
        existingMedia,
        deleteMediaIds: [],
        coverPreviewUrl: "",
      },
    },
    colorGroups: listingType === "color_size" ? hydrateColorGroups(variations, meta.variant_status) : [],
    sizeMedia: listingType === "color_size" ? hydrateSizeMedia(meta.size_media) : {},
    colorSizeAvailability:
      listingType === "color_size" && meta.color_size_availability && typeof meta.color_size_availability === "object"
        ? meta.color_size_availability
        : {},
    customRows,
    customAttrs: listingType === "custom" ? hydrateCustomAttrs(meta, customRows) : [],
    customValueMedia: listingType === "custom" ? hydrateCustomValueMedia(meta.custom_value_media) : {},
    comboItems: Array.isArray(p.comboItems) ? p.comboItems : [],
    existingMedia,
    sizeChartUrl: p.size_chart_image || p.inner_subcategory?.size_chart_image || null,
    sizeChart: meta.sizeChart || {
      applicable: false,
      status: "not_applicable",
      measurementType: "",
      unit: "",
      columns: [],
      rows: [],
      note: "",
    },
    size_labels: Array.isArray(meta.size_labels) ? meta.size_labels : [],
  };
}
