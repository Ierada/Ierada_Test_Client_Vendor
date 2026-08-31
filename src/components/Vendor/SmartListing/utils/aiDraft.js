import { scrubRestrictedText } from "./restrictedClaims";

/** Prefer inner → sub → category for HSN / GST (tax). Never invent values. */
export function taxFromCategoryTree({
  category,
  subCategory,
  innerSubCategory,
}) {
  const hsn =
    innerSubCategory?.hsn_code ||
    subCategory?.hsn_code ||
    category?.hsn_code ||
    "";
  const gstRaw =
    innerSubCategory?.tax ??
    subCategory?.tax ??
    category?.tax ??
    category?.gst ??
    "";
  const gst = gstRaw === "" || gstRaw == null ? null : Number(gstRaw);
  return {
    hsn_code: hsn ? String(hsn) : "",
    gst: Number.isFinite(gst) ? gst : null,
    source: hsn || gst != null ? "category" : "none",
  };
}

/** Offline / API-failure fallback — keep usable, not marketing-quality. */
export function localAiDraft(state) {
  const cat =
    [state.categoryTitle, state.subCategoryTitle, state.innerSubCategoryTitle]
      .filter(Boolean)
      .join(" › ") || "product";
  const brand = state.brand || (state.brandType === "branded" ? "Brand" : "Ierada");
  const name =
    state.name?.trim() ||
    `${brand} ${state.innerSubCategoryTitle || state.subCategoryTitle || state.categoryTitle || "Product"}`;

  const keyFeatures = [
    `Quality ${cat} for everyday use`,
    "Designed for comfort and durability",
    "Pan-India delivery ready packaging",
    state.countryOfOrigin
      ? `Country of origin: ${state.countryOfOrigin}`
      : "Trusted marketplace listing on IERADA",
  ];

  const benefits = [
    "Value for money",
    "Easy returns as per category policy",
    "Secure checkout on IERADA",
  ];

  const shortDescription = `${name} — carefully listed for IERADA shoppers.`;
  const productDetails = `<p>${name} belongs to ${cat}. Review specifications and update any details before publishing.</p>`;
  const whatsInTheBox = [
    { title: "Main product", details: "1 unit" },
    { title: "Packaging", details: "As shown" },
  ];
  const specifications = [
    { feature: "Category", specification: cat },
    { feature: "Brand", specification: brand },
    {
      feature: "Country of Origin",
      specification: state.countryOfOrigin || "India",
    },
  ];

  return {
    name: scrubRestrictedText(name),
    brand,
    shortDescription: scrubRestrictedText(shortDescription),
    countryOfOrigin: state.countryOfOrigin || "India",
    keyFeatures: keyFeatures.map(scrubRestrictedText),
    benefits: benefits.map(scrubRestrictedText),
    productDetails: scrubRestrictedText(productDetails),
    generalInfo: scrubRestrictedText(productDetails),
    whatsInTheBox,
    specifications,
    metaTitle: scrubRestrictedText(name).slice(0, 60),
    metaDescription: scrubRestrictedText(shortDescription).slice(0, 160),
    metaKeywords: [brand, cat, "IERADA"].join(", "),
    tags: [brand, state.categoryTitle, state.subCategoryTitle]
      .filter(Boolean)
      .slice(0, 8),
    warrantyType: state.warrantyType || "Manufacturer",
    warrantyPeriod: state.warrantyPeriod || "As per brand policy",
    shipsFrom: state.shipsFrom || "India",
    shipsTo: state.shipsTo || "Pan India",
    deliveryTimeText: state.deliveryTimeText || "3–7 business days",
    aiGeneratedSections: [
      "product_info",
      "key_features",
      "description",
      "specifications",
      "whats_in_box",
      "benefits",
      "seo",
      "shipping",
    ],
  };
}

/** Map review section → state keys touched by AI */
const SECTION_FIELDS = {
  product_info: ["name", "brand", "shortDescription", "countryOfOrigin"],
  key_features: ["keyFeatures"],
  description: ["productDetails", "generalInfo"],
  specifications: ["specifications"],
  whats_in_box: ["whatsInTheBox"],
  benefits: ["benefits"],
  seo: ["metaTitle", "metaDescription", "metaKeywords", "tags"],
  shipping: ["shipsFrom", "shipsTo", "deliveryTimeText", "warrantyType", "warrantyPeriod"],
};

function scrubDraftStrings(draft) {
  if (!draft || typeof draft !== "object") return draft;
  const next = { ...draft };
  for (const key of [
    "name",
    "brand",
    "shortDescription",
    "countryOfOrigin",
    "productDetails",
    "generalInfo",
    "metaTitle",
    "metaDescription",
    "metaKeywords",
    "warrantyType",
    "warrantyPeriod",
    "shipsFrom",
    "shipsTo",
    "deliveryTimeText",
  ]) {
    if (typeof next[key] === "string") next[key] = scrubRestrictedText(next[key]);
  }
  if (Array.isArray(next.keyFeatures)) {
    next.keyFeatures = next.keyFeatures.map((x) => scrubRestrictedText(x));
  }
  if (Array.isArray(next.benefits)) {
    next.benefits = next.benefits.map((x) => scrubRestrictedText(x));
  }
  if (Array.isArray(next.tags)) {
    next.tags = next.tags.map((x) => scrubRestrictedText(x));
  }
  if (Array.isArray(next.specifications)) {
    next.specifications = next.specifications.map((row) => ({
      feature: scrubRestrictedText(row?.feature || ""),
      specification: scrubRestrictedText(row?.specification || ""),
    }));
  }
  if (Array.isArray(next.whatsInTheBox)) {
    next.whatsInTheBox = next.whatsInTheBox.map((row) => ({
      title: scrubRestrictedText(row?.title || ""),
      details: scrubRestrictedText(row?.details || ""),
    }));
  }
  return next;
}

/**
 * Merge AI draft into state. Skips sections marked dirty unless forceOverwrite.
 * @param {object} state
 * @param {{ forceOverwrite?: boolean, draft?: object|null }} opts
 */
export function mergeAiDraft(state, { forceOverwrite = false, draft = null } = {}) {
  const source = scrubDraftStrings(draft || localAiDraft(state));
  const dirty = state.dirtySections || {};
  const next = { ...state };
  const applied = [];

  for (const [section, keys] of Object.entries(SECTION_FIELDS)) {
    if (!forceOverwrite && dirty[section]) continue;
    for (const key of keys) {
      if (source[key] !== undefined) next[key] = source[key];
    }
    applied.push(section);
  }

  next.aiGeneratedSections = Array.from(
    new Set([...(state.aiGeneratedSections || []), ...applied]),
  );
  return next;
}

/** Payload for POST /api/ai/listing-draft */
export function buildListingAiPayload(state) {
  return {
    brandType: state.brandType || "",
    brand: state.brand || "",
    name: state.name || "",
    listingType: state.listingType || "single",
    categoryTitle: state.categoryTitle || "",
    subCategoryTitle: state.subCategoryTitle || "",
    innerSubCategoryTitle: state.innerSubCategoryTitle || "",
    countryOfOrigin: state.countryOfOrigin || "India",
    original_price: state.original_price || "",
    discounted_price: state.discounted_price || "",
    mediaLabels: Array.isArray(state.mediaLabels) ? state.mediaLabels : [],
  };
}
