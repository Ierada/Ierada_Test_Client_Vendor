import { scrubRestrictedText } from "./restrictedClaims";
import { fileToSuggestPayload } from "./fileToSuggestPayload";
import { inferLocalSizeChart, sellerSizeChartPayload } from "./sizeChart";
import { listingCoverPreviewSrc, resolveMediaUrl } from "./listingMediaCache";

const PLATFORM_BRAND_RE = /\bierada\b/gi;
const IERADA_SEO_SUFFIX = " | Ierada";
const DEVANAGARI_RE = /[\u0900-\u097F]+/g;
const JUNK_BRAND_RE = /^(vendor|admin|seller|shop|n\/a|na|unknown)$/i;

export function scrubPlatformBranding(text) {
  return String(text || "")
    .replace(PLATFORM_BRAND_RE, "")
    .replace(DEVANAGARI_RE, "")
    .replace(/carefully listed for\s+shoppers\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,&])/g, "$1")
    .trim();
}

function withIeradaSeoSuffix(text, maxLength) {
  const stripped = String(text || "")
    .replace(/\s*\|\s*ierada\s*$/i, "")
    .replace(/[|\s]+$/g, "")
    .trim();
  const budget = Math.max(0, maxLength - IERADA_SEO_SUFFIX.length);
  const body = stripped.slice(0, budget).trim();
  return `${body}${IERADA_SEO_SUFFIX}`;
}

function categoryPathFrom(state) {
  return [state.categoryTitle, state.subCategoryTitle, state.innerSubCategoryTitle]
    .filter(Boolean)
    .join(" › ");
}

function isUsableBrandValue(value) {
  const s = String(value || "").trim();
  return Boolean(s) && !JUNK_BRAND_RE.test(s);
}

export function resolveListingBrand(state, vendorContext = {}) {
  if (state.brandType === "branded" && isUsableBrandValue(state.brand)) {
    return scrubPlatformBranding(state.brand.trim());
  }
  const shop =
    vendorContext.shop_name ||
    vendorContext.shopName ||
    state.vendorShopName ||
    "";
  if (isUsableBrandValue(shop)) return scrubPlatformBranding(shop.trim());
  const vendorBrand = vendorContext.brand_name || state.vendorBrandName || "";
  if (isUsableBrandValue(vendorBrand)) return scrubPlatformBranding(vendorBrand.trim());
  if (isUsableBrandValue(state.brand)) return scrubPlatformBranding(state.brand.trim());
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
  n = n.replace(/\s{2,}/g, " ").trim();
  const fallback = buildDefaultProductName(state);
  const looksGeneric =
    n.length < 28 || n.toLowerCase() === String(fallback).toLowerCase();
  if (looksGeneric) {
    const colors = resolveListingColors(state);
    if (colors.length === 1 && !new RegExp(colors[0], "i").test(n)) {
      n = `${n} - ${colors[0]}`;
    } else if (colors.length > 1 && colors.length <= 3) {
      const colorPart = colors.join(" / ");
      if (!colors.some((c) => new RegExp(c, "i").test(n))) {
        n = `${n} (${colorPart})`;
      }
    }
  }
  return scrubRestrictedText(n);
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

function isOriginBoilerplate(text) {
  return /\bmade\s+in\s+india\b|\bcountry\s+of\s+origin\b/i.test(String(text || ""));
}

function isAsShownPlaceholder(text) {
  return /\bas\s+shown\s+in\s+(the\s+)?(images?|photos?|listing)\b/i.test(
    String(text || ""),
  );
}

function ensureKeyFeatures(features, name, categoryPath) {
  const base = (Array.isArray(features) ? features : [])
    .map((x) => scrubPlatformBranding(x))
    .filter((x) => x && !isOriginBoilerplate(x) && !isAsShownPlaceholder(x));
  const cat = categoryPath || "general";
  if (base.length >= 5) return base.slice(0, 12);
  const pads = [
    `Designed for everyday ${cat.split(" › ").pop() || "use"}`,
    `Check size / fit guidance on the listing before ordering`,
    `Packed for dispatch across India`,
    `Sold as listed unless a variation is selected`,
    `Inspect contents on delivery and follow care instructions`,
    `Refer to specifications for material and compatibility`,
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

  const metaTitle = withIeradaSeoSuffix(
    scrubPlatformBranding(state.metaTitle || name),
    60,
  );
  const metaDescription = withIeradaSeoSuffix(
    scrubPlatformBranding(
      state.metaDescription || shortDescription.replace(/\n+/g, " "),
    ),
    155,
  );
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
      "Packed for safe dispatch",
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
  const whatsInTheBox = [];
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
      sizeChart: inferLocalSizeChart(state),
      aiGeneratedSections: [
        "product_info",
        "key_features",
        "description",
        "specifications",
        "benefits",
        "seo",
        "shipping",
        "size_chart",
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
  // whats_in_box is manual — never merge from AI
  benefits: ["benefits"],
  seo: ["metaTitle", "metaDescription", "metaKeywords", "tags"],
  shipping: [
    "shipsFrom",
    "shipsTo",
    "deliveryTimeText",
    "warrantyType",
    "warrantyPeriod",
  ],
  size_chart: ["sizeChart"],
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
    next.keyFeatures = next.keyFeatures
      .map((x) => scrubRestrictedText(scrubPlatformBranding(x)))
      .filter((x) => x && !isOriginBoilerplate(x) && !isAsShownPlaceholder(x));
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
    next.specifications = next.specifications.map((row) => {
      const specification = scrubRestrictedText(
        scrubPlatformBranding(row?.specification || ""),
      );
      return {
        feature: scrubRestrictedText(scrubPlatformBranding(row?.feature || "")),
        specification: isAsShownPlaceholder(specification) ? "" : specification,
      };
    });
  }
  // Never keep AI-invented box contents from a stale draft payload
  if (Array.isArray(next.whatsInTheBox)) {
    delete next.whatsInTheBox;
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

function isAi3dLabel(label) {
  const value = typeof label === "string" ? label : label?.label;
  return String(value || "").toLowerCase() === "ai_3d";
}

function isListingPhoto(file) {
  return (
    file instanceof File ||
    (typeof Blob !== "undefined" && file instanceof Blob)
  );
}

function mediaLabelAt(labels, index) {
  const label = labels?.[index];
  return typeof label === "string" ? label : label?.label;
}

/** Prefer front slot, else first real photo (skip AI 3D shots). */
export function firstListingImageFile(state) {
  const files = state.files || [];
  const labels = state.mediaLabels || [];
  const frontIdx = labels.findIndex(
    (_, i) => mediaLabelAt(labels, i) === "front" && isListingPhoto(files[i] || files[i]?.file),
  );
  if (frontIdx >= 0) {
    return isListingPhoto(files[frontIdx]) ? files[frontIdx] : files[frontIdx]?.file;
  }
  for (let i = 0; i < files.length; i += 1) {
    if (isAi3dLabel(labels[i])) continue;
    if (isListingPhoto(files[i])) return files[i];
    if (isListingPhoto(files[i]?.file)) return files[i].file;
  }
  for (const g of state.colorGroups || []) {
    for (const m of g.media || []) {
      if (isListingPhoto(m)) return m;
      if (isListingPhoto(m?.file)) return m.file;
    }
  }
  return null;
}

function firstListingImageUrl(state) {
  const existing = Array.isArray(state.existingMedia) ? state.existingMedia : [];
  const front = existing.find((m) => m?.url && m.label === "front" && !isAi3dLabel(m));
  const any = existing.find((m) => m?.url && !isAi3dLabel(m));
  if (front?.url) return resolveMediaUrl(front.url);
  if (any?.url) return resolveMediaUrl(any.url);
  const cover = listingCoverPreviewSrc(state);
  if (cover && !cover.startsWith("blob:")) return cover;
  return "";
}

async function fileFromImageUrl(url) {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("listing photo fetch failed");
  const blob = await res.blob();
  const type = blob.type.startsWith("image/") ? blob.type : "image/jpeg";
  return new File([blob], "listing-photo.jpg", { type });
}

export async function resolveListingImageFile(state) {
  const photo = firstListingImageFile(state);
  if (photo instanceof File) return photo;
  if (photo && typeof Blob !== "undefined" && photo instanceof Blob) {
    return new File([photo], "listing-photo.jpg", { type: photo.type || "image/jpeg" });
  }
  const url = firstListingImageUrl(state);
  if (!url) return null;
  try {
    return await fileFromImageUrl(url);
  } catch {
    return null;
  }
}

function mediaLabelNames(state) {
  return (Array.isArray(state.mediaLabels) ? state.mediaLabels : [])
    .map((l) => (typeof l === "string" ? l : l?.label || l?.alt_text || ""))
    .filter(Boolean);
}

function sizeNamesFromState(state) {
  const fromGroups = (state.colorGroups || [])
    .flatMap((g) =>
      (g.sizes || []).map((s) => s.size_name || s.sizeName || s.label || ""),
    )
    .map((x) => String(x).trim())
    .filter(Boolean);
  const fromLabels = (Array.isArray(state.size_labels) ? state.size_labels : [])
    .map((x) => String(x).trim())
    .filter(Boolean);
  return [...new Set([...fromGroups, ...fromLabels])];
}

function customAttributeLines(state) {
  return (state.customRows || [])
    .filter((r) => r.enabled)
    .map((r) =>
      (r.attributes || [])
        .map((a) => a.value || a.label || "")
        .filter(Boolean)
        .join(" / "),
    )
    .filter(Boolean);
}

function comboItemNames(state) {
  return (state.comboItems || [])
    .map((i) => i.name || i.title || i.product_name || "")
    .filter(Boolean);
}

/** Payload for POST /api/ai/listing-draft (includes compressed front photo when present). */
export async function buildListingAiPayload(state, vendorContext = {}) {
  const payload = {
    brandType: state.brandType || "",
    brand: state.brand || "",
    name: state.name || "",
    listingType: state.listingType || "single",
    category_id: state.category_id || "",
    sub_category_id: state.sub_category_id || "",
    inner_sub_category_id: state.inner_sub_category_id || "",
    categoryTitle: state.categoryTitle || "",
    subCategoryTitle: state.subCategoryTitle || "",
    innerSubCategoryTitle: state.innerSubCategoryTitle || "",
    countryOfOrigin: state.countryOfOrigin || "India",
    product_condition: state.product_condition || "",
    hsn_code: state.hsn_code || "",
    gst: state.gst ?? "",
    original_price: state.original_price || "",
    discounted_price: state.discounted_price || "",
    package_length: state.package_length || "",
    package_width: state.package_width || "",
    package_height: state.package_height || "",
    package_weight: state.package_weight || "",
    extraNotes: state.extraNotes || "",
    mediaLabels: mediaLabelNames(state),
    colorNames: resolveListingColors(state),
    sizeNames: sizeNamesFromState(state),
    ...sellerSizeChartPayload(state),
    customAttributes: customAttributeLines(state),
    comboItemNames: comboItemNames(state),
    vendorShopName:
      vendorContext.shop_name ||
      vendorContext.shopName ||
      state.vendorShopName ||
      "",
    vendorBrandName: vendorContext.brand_name || state.vendorBrandName || "",
  };

  const file = await resolveListingImageFile(state);
  if (file) {
    try {
      const img = await fileToSuggestPayload(file);
      payload.image_base64 = img.image_base64;
      payload.mime_type = img.mime_type;
    } catch {
      /* text-only draft if photo cannot be compressed */
    }
  }
  return payload;
}
