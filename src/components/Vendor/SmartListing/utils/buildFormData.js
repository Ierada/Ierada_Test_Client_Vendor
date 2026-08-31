import { calcSettlement, suggestSku, slugify, TDS_RATE } from "./settlementCalc";
import { buildColorSizeRows } from "./variationHelpers";

function appendFilesAndMedia(fd, state) {
  const allFiles = [];
  const variationMedia = [];

  if (state.listingType === "color_size") {
    (state.colorGroups || []).forEach((g) => {
      if (!g.color_id) return;
      const start = allFiles.length;
      const indices = [];
      (g.media || []).forEach((f) => {
        if (f instanceof File) {
          indices.push(allFiles.length - start);
          allFiles.push(f);
        }
      });
      if (indices.length) {
        variationMedia.push({
          grouping_key: Number(g.color_id),
          file_indices: indices.map((i) => start + i),
        });
      }
    });
    // Optional parent cover images
    (state.files || []).forEach((f) => {
      if (f instanceof File) allFiles.push(f);
    });
    if (state.files?.length) {
      const coverStart = allFiles.length - state.files.filter((f) => f instanceof File).length;
      fd.append(
        "media_indices",
        JSON.stringify(
          state.files
            .map((_, i) => (state.files[i] instanceof File ? coverStart + i : null))
            .filter((x) => x !== null),
        ),
      );
    }
    fd.append("variations", JSON.stringify(buildColorSizeRows(state.colorGroups)));
    fd.append("variation_media", JSON.stringify(variationMedia));
  } else if (state.listingType === "custom") {
    (state.customRows || []).forEach((row) => {
      if (!row.enabled) return;
      const start = allFiles.length;
      const indices = [];
      (row.media || []).forEach((f) => {
        if (f instanceof File) {
          indices.push(allFiles.length - start);
          allFiles.push(f);
        }
      });
      if (indices.length) {
        variationMedia.push({
          grouping_key: String(row.grouping_key),
          file_indices: indices.map((i) => start + i),
        });
      }
    });
    (state.files || []).forEach((f) => {
      if (f instanceof File) allFiles.push(f);
    });
    const variations = (state.customRows || [])
      .filter((r) => r.enabled && r.attributes?.length)
      .map((r, i) => ({
        color_id: null,
        size_id: null,
        attribute_id: r.attributes[0]?.attribute_id
          ? Number(r.attributes[0].attribute_id)
          : null,
        attribute_value: r.attributes[0]?.attribute_value || null,
        attributes: r.attributes.map((a) => ({
          attribute_id: Number(a.attribute_id),
          attribute_value: a.attribute_value,
        })),
        grouping_key: String(r.grouping_key ?? i),
        sequence: i,
        size_sequence: 0,
        stock: r.stock,
        original_price: r.original_price,
        discounted_price: r.discounted_price,
        sku: r.sku,
        barcode: r.barcode || null,
      }));
    fd.append("variations", JSON.stringify(variations));
    fd.append("variation_media", JSON.stringify(variationMedia));
  } else {
    (state.files || []).forEach((f) => {
      if (f instanceof File) allFiles.push(f);
    });
    if (allFiles.length) {
      fd.append(
        "media_indices",
        JSON.stringify(allFiles.map((_, i) => i)),
      );
    }
  }

  if (state.listingType === "combo" && state.comboItems?.length) {
    fd.append(
      "combo_items",
      JSON.stringify(
        state.comboItems.map((c) => ({
          combo_product_id: Number(c.combo_product_id),
          variation_id: c.variation_id ? Number(c.variation_id) : null,
          qty: Math.max(1, Number(c.qty) || 1),
          discount_percentage: c.discount_percentage ?? null,
        })),
      ),
    );
  }

  allFiles.forEach((file) => fd.append("files", file));

  // Labeled slot metadata aligned to final files indices for parent covers
  const mediaMeta = [];
  if (state.listingType === "color_size" || state.listingType === "custom") {
    // cover files appended after variation media — map trailing labels
    const coverStart =
      allFiles.length - (state.files || []).filter((f) => f instanceof File).length;
    (state.files || []).forEach((f, i) => {
      if (!(f instanceof File)) return;
      const lab = (state.mediaLabels || [])[i] || {};
      mediaMeta.push({
        index: coverStart + i,
        label: lab.label || null,
        alt_text: lab.alt_text || null,
      });
    });
  } else {
    (state.files || []).forEach((f, i) => {
      if (!(f instanceof File)) return;
      const lab = (state.mediaLabels || [])[i] || {};
      mediaMeta.push({
        index: i,
        label: lab.label || (i === 0 ? "front" : null),
        alt_text: lab.alt_text || null,
      });
    });
  }
  if (mediaMeta.length) {
    fd.append("media_meta", JSON.stringify(mediaMeta));
  }

  if (state.brandAuthFile instanceof File) {
    fd.append("brand_auth", state.brandAuthFile);
    fd.append("brand_auth_doc_type", state.brandAuthDocType || "authorization_letter");
  }

  return allFiles.length;
}

export function applyAutoListingPolicies(partial, context = {}) {
  const {
    subCategory,
    innerSubCategory,
    defaultReturnWindowDays = 7,
  } = context;
  return {
    ...partial,
    shipsTo: "Pan India",
    deliveryTimeText: "3–7 business days",
    cod_available: true,
    free_shipping: false,
    return_shipping_payer: "seller",
    return_window_days:
      subCategory?.is_returnable === false
        ? 0
        : Number(defaultReturnWindowDays) || 7,
    replacement_allowed:
      innerSubCategory != null
        ? innerSubCategory.replacement_allowed !== false
        : partial.replacement_allowed !== false,
  };
}

export function buildSmartListingFormData(state, { asDraft = false, requestPublish = false } = {}) {
  const fd = new FormData();
  const settlement = calcSettlement({
    mrp: state.original_price,
    sellingPrice: state.discounted_price,
    gstPercent: state.gst,
    shippingCharges: state.shipping_charges,
    platformFee: state.platformFee || 0,
    freeShipping: state.free_shipping,
  });

  const visibility =
    asDraft || requestPublish ? "Hidden" : state.visibility || "Hidden";
  const listing_status = asDraft
    ? "draft"
    : requestPublish
      ? "pending_review"
      : state.listing_status ||
        (visibility === "Published" ? "published" : "hidden");

  const listing_meta = {
    stock_management_mode: state.stock_management_mode || "self",
    allow_backorders: !!state.allow_backorders,
    min_order_qty: Number(state.min_order_qty) || 1,
    product_condition: state.product_condition || "New",
    warranty_type: state.warrantyType || "",
    warranty_period: state.warrantyPeriod || "",
    ships_from: state.shipsFrom || "",
    ships_to: state.shipsTo || "",
    delivery_time_text: state.deliveryTimeText || "",
    cod_available: state.cod_available !== false,
    return_window_days: state.return_window_days ?? null,
    replacement_allowed: state.replacement_allowed !== false,
    return_shipping_payer: state.return_shipping_payer || "seller",
    brand_auth_doc_name: state.brandAuthDocName || null,
    smart_listing: true,
    compliance: {
      fssai_license: state.compliance?.fssai_license || "",
      manufacturer_name: state.compliance?.manufacturer_name || "",
      manufacturer_address: state.compliance?.manufacturer_address || "",
      packer_name: state.compliance?.packer_name || "",
      packer_address: state.compliance?.packer_address || "",
      importer_name: state.compliance?.importer_name || "",
      importer_address: state.compliance?.importer_address || "",
      net_quantity: state.compliance?.net_quantity || "",
      net_quantity_unit: state.compliance?.net_quantity_unit || "",
      sale_unit: state.compliance?.sale_unit || "1 piece",
      bis_isi_number: state.compliance?.bis_isi_number || "",
      wpc_number: state.compliance?.wpc_number || "",
      dangerous_goods: !!state.compliance?.dangerous_goods,
      drug_disclaimer: !!state.compliance?.drug_disclaimer,
    },
    dirty_sections: state.dirtySections || {},
    ai_sections: state.aiGeneratedSections || [],
  };

  const sku = state.sku?.trim() || suggestSku(state.name, state.brand);
  const slug = state.slug?.trim() || slugify(state.name || sku);

  const listingTypeWire =
    state.listingType === "combo"
      ? "combo"
      : state.listingType === "color_size" || state.listingType === "custom"
        ? "variation"
        : "single";

  const fields = {
    name: state.name,
    brand_type: state.brandType || "generic",
    brand: state.brand || "",
    short_description: state.shortDescription || "",
    country_of_origin: state.countryOfOrigin || "",
    key_features: JSON.stringify(state.keyFeatures || []),
    benefits: JSON.stringify(state.benefits || []),
    product_details: state.productDetails || "",
    general_info: state.generalInfo || state.productDetails || "",
    warranty_info:
      state.warranty_info ||
      [state.warrantyType, state.warrantyPeriod].filter(Boolean).join(" — "),
    whats_in_the_box: JSON.stringify(state.whatsInTheBox || []),
    specifications: JSON.stringify(state.specifications || []),
    original_price: state.original_price || 0,
    discounted_price: state.discounted_price || 0,
    tds_amount: settlement.tds,
    bank_settlement_amount: settlement.bankSettlement,
    platform_fee: state.platformFee || 0,
    platform_fee_pct: state.platform_fee_pct || 0,
    sku,
    hsn_code: state.hsn_code || "",
    barcode: state.barcode || "",
    stock: state.stock || 0,
    low_stock_threshold: state.low_stock_threshold || 5,
    free_shipping: state.free_shipping ? "true" : "false",
    shipping_charges: state.shipping_charges || 0,
    package_weight: state.package_weight || 0,
    volumetric_weight: state.volumetric_weight || 0,
    package_length: state.package_length || 0,
    package_width: state.package_width || 0,
    package_height: state.package_height || 0,
    package_depth: state.package_depth || 0,
    gst: state.gst || 0,
    visibility,
    listing_status,
    listing_type: listingTypeWire,
    is_variation:
      state.listingType === "color_size" || state.listingType === "custom"
        ? "true"
        : "false",
    category_id: state.category_id || "",
    sub_category_id: state.sub_category_id || "",
    inner_sub_category_id: state.inner_sub_category_id || "",
    fabric_id: state.fabric_id || "",
    meta_title: state.metaTitle || state.name || "",
    meta_description: state.metaDescription || state.shortDescription || "",
    meta_keywords: state.metaKeywords || "",
    slug,
    tags: JSON.stringify(state.tags || []),
    listing_meta: JSON.stringify(listing_meta),
  };

  if (state.vendor_id) fields.vendor_id = state.vendor_id;

  Object.entries(fields).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.append(k, typeof v === "boolean" ? String(v) : v);
  });

  appendFilesAndMedia(fd, state);

  return { formData: fd, settlement, sku, slug, TDS_RATE };
}
