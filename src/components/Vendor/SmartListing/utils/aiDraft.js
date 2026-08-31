import { scrubRestrictedText } from "./restrictedClaims";

const PLATFORM_BRAND_RE = /\bierada\b/gi;

export function scrubPlatformBranding(text) {
  return String(text || "")
    .replace(PLATFORM_BRAND_RE, "")
    .replace(/carefully listed for\s+shoppers\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function categoryPathFrom(state) {
  return [state.categoryTitle, state.subCategoryTitle, state.innerSubCategoryTitle]
    .filter(Boolean)
    .join(" › ");
}

export function resolveListingBrand(state, vendorContext = {}) {
  if (state.brandType === "branded" && state.brand?.trim()) {
    return scrubPlatformBranding(state.brand.trim());
  }
  const shop =
    vendorContext.shop_name ||
    vendorContext.shopName ||
    vendorContext.name ||
    state.vendorShopName ||
    "";
  if (shop.trim()) return scrubPlatformBranding(shop.trim());
  const vendorBrand = vendorContext.brand_name || state.vendorBrandName || "";
  if (vendorBrand.trim()) return scrubPlatformBranding(vendorBrand.trim());
  return "";
}

function resolveListingColors(state) {
  return (Array.isArray(state.colorGroups) ? state.colorGroups : [])
    .map((g) => scrubPlatformBranding(g.color_name || g.colorName || ""))
    .filter(Boolean);
}

function stripBrandFromName(name, brand) {
  let n = scrubPlatformBranding(name || "");
  if (!n || !brand?.trim()) return n;
  const b = brand.trim();
  const escaped = b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  n = n.replace(new RegExp(`^${escaped}\\s*[-–—|:]?\\s*`, "i"), "");
  n = n.replace(new RegExp(`\\s*[-–—|:]?\\s*${escaped}$`, "i"), "");
  n = n.replace(new RegExp(`\\b${escaped}\\b`, "gi"), " ");
  return n.replace(/\s{2,}/g, " ").trim();
}

function titleCaseWords(text) {
  return String(text || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function buildDefaultProductName(state) {
  const leaf =
    state.innerSubCategoryTitle ||
    state.subCategoryTitle ||
    state.categoryTitle ||
    "Product";
  const type = titleCaseWords(scrubPlatformBranding(leaf));
  const colors = resolveListingColors(state).map(titleCaseWords);
  if (colors.length === 1) {
    return `${type} - ${colors[0]}`.replace(/\s{2,}/g, " ").trim();
  }
  if (colors.length > 1 && colors.length <= 3) {
    return `${type} (${colors.join(" / ")})`.replace(/\s{2,}/g, " ").trim();
  }
  return type;
}

function polishProductName(name, state, brand) {
  let n = stripBrandFromName(name, brand);
  if (!n) n = buildDefaultProductName(state);
  n = titleCaseWords(n.replace(/\s*[-–—]\s*/g, " - "));
  const colors = resolveListingColors(state).map(titleCaseWords);
  if (colors.length === 1 && !new RegExp(colors[0], "i").test(n)) {
    n = `${n} - ${colors[0]}`;
  } else if (colors.length > 1 && colors.length <= 3) {
    const colorPart = colors.join(" / ");
    if (!colors.some((c) => new RegExp(c, "i").test(n))) {
      n = `${n} (${colorPart})`;
    }
  }
  return scrubRestrictedText(n.replace(/\s{2,}/g, " ").trim());
}

function splitSentences(text) {
  return String(text || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => scrubPlatformBranding(s))
    .filter(Boolean);
}

function ensureShortDescription(text, name, categoryPath) {
  let lines = String(text || "")
    .split(/\n+/)
    .map((s) => scrubPlatformBranding(s))
    .filter(Boolean);
  if (lines.length < 3) {
    const sentences = splitSentences(text);
    if (sentences.length >= 3) lines = sentences;
  }
  const fallbacks = [
    `${name} is designed for shoppers looking for reliable ${categoryPath || "everyday"} products.`,
    `Built with practical quality checks so you know what you are buying before checkout.`,
    `Suitable for regular use — review size, material, and care notes in the full description.`,
    `Packaged securely for dispatch across India with standard seller handling.`,
    `Check specifications and images to confirm fit, finish, and included items.`,
  ];
  let i = 0;
  while (lines.length < 3 && i < fallbacks.length) {
    if (!lines.includes(fallbacks[i])) lines.push(fallbacks[i]);
    i += 1;
  }
  return lines.slice(0, 5).join("\n");
}

function ensureKeyFeatures(features, name, categoryPath) {
  const base = (Array.isArray(features) ? features : [])
    .map((x) => scrubPlatformBranding(x))
    .filter(Boolean);
  const cat = categoryPath || "general";
  const pads = [
    `Designed for everyday ${cat.split(" › ").pop() || "use"}`,
    `Material and finish as shown in listing photos`,
    `Check size / fit guidance on the listing before ordering`,
    `Packaged for safe dispatch across India`,
    `Sold as one unit unless variations are selected`,
    `Inspect contents on delivery and follow care instructions`,
    `Refer to specifications for dimensions and compatibility`,
  ];
  const out = [...base];
  for (const line of pads) {
    if (out.length >= 7) break;
    if (!out.some((x) => x.toLowerCase() === line.toLowerCase())) out.push(line);
  }
  return out.slice(0, 12);
}

function countDescriptionLines(html) {
  const text = String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
  return text.split(/\n+/).map((l) => l.trim()).filter(Boolean).length;
}

function ensureProductDescription(html, name, categoryPath, shortDescription) {
  let body = scrubRestrictedText(scrubPlatformBranding(html || ""));
  if (countDescriptionLines(body) >= 7) return body;

  const intro = splitSentences(shortDescription);
  const paragraphs = [
    `<p>${intro[0] || `${name} is listed under ${categoryPath || "this category"}.`}</p>`,
    `<p>${intro[1] || "Review the specifications, images, and size or fit guidance before you add to cart."}</p>`,
    `<p>${intro[2] || "Everyday use is supported when care and storage instructions are followed."}</p>`,
    `<p>Material, colour, and finish may vary slightly from images due to lighting — always refer to the latest photos on the listing.</p>`,
    `<p>Packaging is designed to protect the product in transit; inspect the outer box on delivery.</p>`,
    `<p>What's included is listed under What's in the Box — accessories shown in lifestyle images may not be part of the sale unless stated.</p>`,
    `<p>For returns or replacements, follow the return window and category policy shown at checkout.</p>`,
    `<p>Contact the seller through order support if you need clarification on compatibility, sizing, or warranty before purchase.</p>`,
  ];
  if (!body || body.length < 40) return paragraphs.join("");
  return `${body}${paragraphs.slice(countDescriptionLines(body)).join("")}`;
}

export function applyListingContentRules(state, vendorContext = {}) {
  const categoryPath = categoryPathFrom(state);
  const brand = resolveListingBrand(state, vendorContext);
  let name = polishProductName(state.name?.trim() || "", state, brand);
  if (!name || PLATFORM_BRAND_RE.test(state.name || "")) {
    name = buildDefaultProductName(state);
  }

  const shortDescription = ensureShortDescription(
    state.shortDescription,
    name,
    categoryPath,
  );
  const keyFeatures = ensureKeyFeatures(state.keyFeatures, name, categoryPath);
  const productDetails = ensureProductDescription(
    state.productDetails,
    name,
    categoryPath,
    shortDescription,
  );
  const generalInfo =
    state.generalInfo && countDescriptionLines(state.generalInfo) >= 3
      ? scrubPlatformBranding(scrubRestrictedText(state.generalInfo))
      : productDetails;

  const metaTitle = scrubPlatformBranding(state.metaTitle || name).slice(0, 60);
  const metaDescription = scrubPlatformBranding(
    state.metaDescription || shortDescription.replace(/\n+/g, " "),
  ).slice(0, 160);
  const metaKeywords = scrubPlatformBranding(
    state.metaKeywords ||
      [brand, categoryPath, name].filter(Boolean).join(", "),
  ).slice(0, 250);

  const tags = (Array.isArray(state.tags) ? state.tags : [])
    .map((t) => scrubPlatformBranding(t))
    .filter(Boolean)
    .slice(0, 12);

  return {
    ...state,
    brand,
    name,
    shortDescription: scrubRestrictedText(shortDescription),
    keyFeatures: keyFeatures.map(scrubRestrictedText),
    benefits: (state.benefits || []).map((b) =>
      scrubRestrictedText(scrubPlatformBranding(b)),
    ),
    productDetails,
    generalInfo,
    metaTitle: scrubRestrictedText(metaTitle),
    metaDescription: scrubRestrictedText(metaDescription),
    metaKeywords: scrubRestrictedText(metaKeywords),
    tags: tags.map(scrubRestrictedText),
  };
}

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

/** Offline / API-failure fallback — usable baseline, no platform brand in listing copy. */
export function localAiDraft(state, vendorContext = {}) {
  const cat = categoryPathFrom(state) || "product";
  const brand = resolveListingBrand(state, vendorContext);
  const name =
    polishProductName(state.name?.trim() || "", state, brand) ||
    buildDefaultProductName(state);

  const keyFeatures = ensureKeyFeatures(
    [
      `${name} for ${cat}`,
      "Quality-checked listing with clear specifications",
      "Images show actual product style and finish",
      state.countryOfOrigin
        ? `Country of origin: ${state.countryOfOrigin}`
        : "Country of origin: India",
      "Packaged for safe dispatch",
      "Read size / dimension notes before ordering",
      "Follow care instructions for longer product life",
    ],
    name,
    cat,
  );

  const benefits = [
    "Value-focused pricing for everyday needs",
    "Clear product details before you buy",
    "Standard seller support on orders",
    "Secure checkout and order tracking",
  ].map(scrubRestrictedText);

  const shortDescription = ensureShortDescription("", name, cat);
  const productDetails = ensureProductDescription("", name, cat, shortDescription);
  const whatsInTheBox = [
    { title: "Main product", details: "1 unit as per listing title" },
    { title: "Packaging", details: "Retail / protective packaging as applicable" },
  ];
  const specifications = [
    { feature: "Category", specification: cat },
    ...(brand ? [{ feature: "Brand", specification: brand }] : []),
    {
      feature: "Country of Origin",
      specification: state.countryOfOrigin || "India",
    },
  ];

  return applyListingContentRules(
    {
      name: scrubRestrictedText(name),
      brand,
      shortDescription,
      countryOfOrigin: state.countryOfOrigin || "India",
      keyFeatures,
      benefits,
      productDetails,
      generalInfo: productDetails,
      whatsInTheBox,
      specifications,
      metaTitle: scrubRestrictedText(name).slice(0, 60),
      metaDescription: scrubRestrictedText(shortDescription.replace(/\n+/g, " ")).slice(
        0,
        160,
      ),
      metaKeywords: [brand, cat, name].filter(Boolean).join(", "),
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
    },
    vendorContext,
  );
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
  shipping: [
    "shipsFrom",
    "shipsTo",
    "deliveryTimeText",
    "warrantyType",
    "warrantyPeriod",
  ],
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
    if (typeof next[key] === "string") {
      next[key] = scrubRestrictedText(scrubPlatformBranding(next[key]));
    }
  }
  if (Array.isArray(next.keyFeatures)) {
    next.keyFeatures = next.keyFeatures.map((x) =>
      scrubRestrictedText(scrubPlatformBranding(x)),
    );
  }
  if (Array.isArray(next.benefits)) {
    next.benefits = next.benefits.map((x) =>
      scrubRestrictedText(scrubPlatformBranding(x)),
    );
  }
  if (Array.isArray(next.tags)) {
    next.tags = next.tags.map((x) =>
      scrubRestrictedText(scrubPlatformBranding(x)),
    );
  }
  if (Array.isArray(next.specifications)) {
    next.specifications = next.specifications.map((row) => ({
      feature: scrubRestrictedText(scrubPlatformBranding(row?.feature || "")),
      specification: scrubRestrictedText(
        scrubPlatformBranding(row?.specification || ""),
      ),
    }));
  }
  if (Array.isArray(next.whatsInTheBox)) {
    next.whatsInTheBox = next.whatsInTheBox.map((row) => ({
      title: scrubRestrictedText(scrubPlatformBranding(row?.title || "")),
      details: scrubRestrictedText(scrubPlatformBranding(row?.details || "")),
    }));
  }
  return next;
}

/**
 * Merge AI draft into state. Skips sections marked dirty unless forceOverwrite.
 */
export function mergeAiDraft(
  state,
  { forceOverwrite = false, draft = null, vendorContext = {} } = {},
) {
  const source = scrubDraftStrings(draft || localAiDraft(state, vendorContext));
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
  return applyListingContentRules(next, vendorContext);
}

/** Payload for POST /api/ai/listing-draft */
export function buildListingAiPayload(state, vendorContext = {}) {
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
    colorNames: resolveListingColors(state),
    vendorShopName:
      vendorContext.shop_name ||
      vendorContext.shopName ||
      vendorContext.name ||
      "",
    vendorBrandName: vendorContext.brand_name || "",
  };
}
