import * as XLSX from "xlsx";

export const ORANGE = "#F56C43";
export const NAVY = "#1A2B48";

export const IERADA_FIELDS = [
  { key: "sku", label: "SKU", required: true },
  { key: "brand_type", label: "Brand Type", required: true },
  { key: "brand", label: "Brand Name", required: true },
  { key: "colour", label: "Colour", required: true },
  { key: "size", label: "Size", required: true },
  { key: "mrp", label: "MRP ₹", required: true },
  { key: "selling_price", label: "Selling Price ₹", required: true },
  { key: "stock", label: "Stock", required: true },
  { key: "package_weight", label: "Package Weight (g)", required: true },
  { key: "package_length", label: "Length (cm)", required: true },
  { key: "package_width", label: "Width (cm)", required: true },
  { key: "package_height", label: "Height (cm)", required: true },
  { key: "whats_in_the_box", label: "What's in the Box", required: true },
];

/** Filled by AI / category detect after SKU-image map. Optional on first Excel. */
export const GENERATED_FIELDS = [
  { key: "name", label: "Product Name" },
  { key: "category", label: "Category Level 1" },
  { key: "sub_category", label: "Category Level 2" },
  { key: "inner_sub_category", label: "Inner Subcategory" },
  { key: "hsn_code", label: "HSN Code" },
  { key: "gst", label: "GST %" },
];

export const CUSTOM_ATTR_MAP_FIELDS = [1, 2, 3, 4].flatMap((n) => [
  { key: `attr${n}_name`, label: `Attribute-${n} Name`, required: n === 1 },
  { key: `attr${n}_value`, label: `Attribute-${n} Value`, required: n === 1 },
]);

export const EXTRA_MAP_FIELDS = [
  { key: "parent_sku", label: "Parent SKU", required: false },
  { key: "image_sku", label: "Image SKU", required: false },
  { key: "staged_images", label: "Product Images", required: false },
  { key: "ai_mode", label: "AI Mode (Yes/No)", required: false },
  ...CUSTOM_ATTR_MAP_FIELDS,
];

export const MAP_FIELDS = [...IERADA_FIELDS, ...GENERATED_FIELDS, ...EXTRA_MAP_FIELDS];

export const IGNORE_FIELD = "__ignore__";

export const FIELD_RULES = {
  sku: { rule: "Single listing: one unique SKU per product. Colour × Size: parent SKU on Products (it repeats on Variations). Unique variant SKU per colour — or per colour × size row.", required: true },
  brand_type: { rule: "Branded or Generic.", required: true },
  brand: { rule: "Brand name as listed on IERADA.", required: true },
  colour: { rule: "Single listing: one catalogue colour. Colour × Size: one colour per variation row.", required: true },
  size: { rule: "Single listing: one size only. Colour × Size: one colour row can list sizes as 6,7,8,9, or use one size per row. Kids Fashion: pick an age-group size from the dropdown (6-9 Months, 12-15 Months, 2-2.5 Years).", required: true },
  mrp: { rule: "Numeric value (e.g., 99 or 99.00).", required: true },
  selling_price: { rule: "Numeric value (e.g., 99 or 99.00).", required: true },
  stock: { rule: "Whole number of at least 1.", required: true },
  package_weight: { rule: "Numeric value in grams.", required: true },
  package_length: { rule: "Numeric value in cm.", required: true },
  package_width: { rule: "Numeric value in cm.", required: true },
  package_height: { rule: "Numeric value in cm.", required: true },
  name: { rule: "Optional. AI can generate from the cover image.", aiOptional: true },
  category: { rule: "Optional. AI can detect from the cover image.", aiOptional: true },
  sub_category: { rule: "Optional. AI can detect from the cover image.", aiOptional: true },
  inner_sub_category: { rule: "Optional. AI can detect from the cover image.", aiOptional: true },
  hsn_code: { rule: "Optional. Filled from category after AI.", aiOptional: true },
  gst: { rule: "Optional. Filled from category GST bands.", aiOptional: true },
  short_description: { rule: "Optional. Max 500 characters.", aiOptional: true },
  product_details: { rule: "Optional. AI can generate.", aiOptional: true },
  key_features: { rule: "Optional. AI can generate.", aiOptional: true },
  benefits: { rule: "Optional. AI can generate.", aiOptional: true },
  whats_in_the_box: { rule: "Fill on the first-upload Excel. Pipe-separated. AI does not generate this.", required: true },
  specifications: { rule: "Optional. AI can generate.", aiOptional: true },
  meta_title: { rule: "Optional. AI can generate.", aiOptional: true },
  meta_description: { rule: "Optional. AI can generate.", aiOptional: true },
  tags: { rule: "Optional. AI can generate.", aiOptional: true },
  parent_sku: { rule: "Groups colour/size variants under one product." },
  image_sku: { rule: "Matches uploaded images named {SKU}-1.jpg." },
  staged_images: { rule: "JPG, PNG, WebP (Max 10 images).", needsReview: true },
  ai_mode: { rule: "Optional. Used for auto generation.", aiOptional: true },
  attr1_name: { rule: "Axis name from the Attributes sheet (e.g. Material)." },
  attr1_value: { rule: "Required for Custom. Must match Attribute 1 Values." },
  attr2_name: { rule: "Optional axis name (e.g. Finish)." },
  attr2_value: { rule: "Leave blank if Attribute 2 is unused." },
  attr3_name: { rule: "Optional axis name (e.g. Width)." },
  attr3_value: { rule: "Leave blank if Attribute 3 is unused." },
  attr4_name: { rule: "Optional. Maximum 4 custom attributes." },
  attr4_value: { rule: "Leave blank if Attribute 4 is unused." },
};

const AUTO_IGNORE = /^(extra|extra_column|unused|ignore|n\/?a|not_required)$/i;

export const AI_FIELD_KEYS = [
  "short_description",
  "product_details",
  "key_features",
  "benefits",
  "specifications",
  "meta_title",
  "meta_description",
  "tags",
];

const HEADER_ALIASES = {
  sku: "sku",
  product_name: "name",
  name: "name",
  title: "name",
  brand_type: "brand_type",
  brand: "brand",
  brand_name: "brand",
  category_level_1: "category",
  category: "category",
  category_level_2: "sub_category",
  sub_category: "sub_category",
  subcategory: "sub_category",
  inner_subcategory: "inner_sub_category",
  inner_sub_category: "inner_sub_category",
  colour: "colour",
  color: "colour",
  size_uk: "size",
  uk_size: "size",
  shoe_size: "size",
  product_size: "size",
  free_size: "size",
  hsn_code: "hsn_code",
  hsn: "hsn_code",
  gst: "gst",
  gst_: "gst",
  mrp: "mrp",
  selling_price: "selling_price",
  selling_price_: "selling_price",
  stock: "stock",
  package_weight_g: "package_weight",
  package_weight: "package_weight",
  length_cm: "package_length",
  width_cm: "package_width",
  height_cm: "package_height",
  short_description: "short_description",
  product_details: "product_details",
  key_features: "key_features",
  benefits: "benefits",
  whats_in_the_box: "whats_in_the_box",
  whats_in_box: "whats_in_the_box",
  what_is_in_the_box: "whats_in_the_box",
  in_the_box: "whats_in_the_box",
  specifications: "specifications",
  meta_title: "meta_title",
  meta_description: "meta_description",
  tags: "tags",
  barcode: "barcode",
  parent_sku: "parent_sku",
  parentsku: "parent_sku",
  parent: "parent_sku",
  variant_sku: "sku",
  variantsku: "sku",
  image_sku: "image_sku",
  imagesku: "image_sku",
  attr1_name: "attr1_name",
  attr1_values: "attr1_values",
  attr1_value: "attr1_value",
  attr2_name: "attr2_name",
  attr2_values: "attr2_values",
  attr2_value: "attr2_value",
  attr3_name: "attr3_name",
  attr3_values: "attr3_values",
  attr3_value: "attr3_value",
  attr4_name: "attr4_name",
  attr4_values: "attr4_values",
  attr4_value: "attr4_value",
  attribute_1_name: "attr1_name",
  attribute_1_values: "attr1_values",
  attribute_1_value: "attr1_value",
  attribute_2_name: "attr2_name",
  attribute_2_values: "attr2_values",
  attribute_2_value: "attr2_value",
  attribute_3_name: "attr3_name",
  attribute_3_values: "attr3_values",
  attribute_3_value: "attr3_value",
  attribute_4_name: "attr4_name",
  attribute_4_values: "attr4_values",
  attribute_4_value: "attr4_value",
  country_of_origin: "country_of_origin",
  staged_images: "staged_images",
  images: "staged_images",
  image: "staged_images",
  product_images: "staged_images",
  photos: "staged_images",
  photo: "staged_images",
  ai_mode: "ai_mode",
  aimode: "ai_mode",
  ai_modeyesno: "ai_mode",
};

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif)$/i;
const SLOT_AT_END = /^(.*?)[-_ ]+(10|[1-9]|0[1-9])$/;
const SLOT_ONLY = /^(10|[1-9]|0[1-9])$/;
const GENERIC_DIR =
  /^(?:__macosx|\.|images?|imgs?|photos?|pics?|uploads?|files?|assets?|media|product[\s._-]*images?|download(?:ed)?(?:[\s._-]*images?)?)$/i;

function pathParts(name) {
  return String(name || "")
    .replace(/\\/g, "/")
    .split("/")
    .map((p) => p.trim())
    .filter((p) => p && p !== ".");
}

function cleanStem(stem) {
  return String(stem || "")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function folderSku(parts) {
  for (let i = parts.length - 2; i >= 0; i -= 1) {
    const folder = cleanStem(parts[i]);
    if (!folder || GENERIC_DIR.test(folder)) continue;
    return folder;
  }
  return "";
}

function stripImageExt(name) {
  let stem = String(name || "");
  for (let i = 0; i < 3 && IMAGE_EXT.test(stem); i += 1) {
    stem = stem.replace(IMAGE_EXT, "");
  }
  return cleanStem(stem);
}

function slotNumber(raw) {
  const n = Number(String(raw).replace(/^0+/, "") || raw);
  return n >= 1 && n <= 10 ? n : null;
}

export function parseSkuImageFilename(originalName) {
  const parts = pathParts(originalName);
  const base = parts[parts.length - 1] || "";
  if (!base) return null;
  const stem = stripImageExt(base);
  if (!stem) return { sku: null, order: null, filename: base, ignored: true, stem };

  const fromFolder = folderSku(parts);
  const only = stem.match(SLOT_ONLY);
  if (only) {
    const order = slotNumber(only[1]);
    if (!fromFolder) return { sku: null, order, filename: base, ignored: true, stem };
    return { sku: fromFolder, order, filename: base, ignored: false, stem };
  }

  const match = stem.match(SLOT_AT_END);
  if (match && match[1].trim()) {
    const parsedSku = match[1].trim();
    const order = slotNumber(match[2]);
    // lifeo-sku-373-1.jpg inside Downloaded_Images/ is that SKU.
    // A folder name is the SKU only for files named 1.jpg inside the folder.
    return { sku: parsedSku, order, filename: base, ignored: false, stem };
  }

  if (fromFolder) {
    return { sku: fromFolder, order: null, filename: base, ignored: false, stem };
  }

  if (stem) {
    return { sku: stem, order: null, filename: base, ignored: false, stem };
  }

  return { sku: null, order: null, filename: base, ignored: true, stem };
}

export function normalizeSkuKey(sku) {
  return String(sku || "")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function indexImageFilesBySku(files) {
  const bySku = {};
  Array.from(files || []).forEach((file) => {
    const name = file?.webkitRelativePath || file?.zipPath || file?.name || file?.originalName || "";
    const parsed = parseSkuImageFilename(name);
    if (!parsed?.sku) return;
    if (!bySku[parsed.sku]) bySku[parsed.sku] = [];
    const previewUrl =
      file instanceof File || (typeof Blob !== "undefined" && file instanceof Blob)
        ? URL.createObjectURL(file)
        : file.previewUrl;
    bySku[parsed.sku].push({
      originalName: name,
      filename: name,
      sku: parsed.sku,
      order: parsed.order,
      previewUrl,
      url: file.url,
    });
  });
  Object.values(bySku).forEach((list) => {
    const used = new Set(
      list.map((img) => Number(img.order)).filter((n) => n >= 1 && n <= 10),
    );
    let next = 1;
    list.forEach((img) => {
      const n = Number(img.order);
      if (n >= 1 && n <= 10) return;
      while (used.has(next) && next <= 10) next += 1;
      if (next <= 10) {
        img.order = next;
        used.add(next);
        next += 1;
      }
    });
    list.sort((a, b) => Number(a.order || 99) - Number(b.order || 99));
  });
  return bySku;
}

export function mergeImagesBySku(...maps) {
  const out = {};
  maps.forEach((map) => {
    Object.entries(map || {}).forEach(([sku, list]) => {
      const key =
        Object.keys(out).find((k) => normalizeSkuKey(k) === normalizeSkuKey(sku)) || sku;
      if (!out[key]) out[key] = [];
      (list || []).forEach((img) => {
        const name = String(img.originalName || img.filename || "").toLowerCase();
        const order = Number(img.order);
        const existing = out[key].find((item) => {
          const itemName = String(item.originalName || item.filename || "").toLowerCase();
          if (name && itemName && name === itemName) return true;
          if (!Number.isFinite(order) || order < 1) return false;
          return Number(item.order) === order;
        });
        if (existing) {
          Object.assign(existing, img, {
            previewUrl: existing.previewUrl || img.previewUrl,
            url: existing.url || img.url,
          });
        } else {
          out[key].push({ ...img });
        }
      });
    });
  });
  Object.values(out).forEach((list) => {
    const used = new Set(
      list.map((img) => Number(img.order)).filter((n) => n >= 1 && n <= 10),
    );
    let next = 1;
    list.forEach((img) => {
      const n = Number(img.order);
      if (n >= 1 && n <= 10) return;
      while (used.has(next) && next <= 10) next += 1;
      if (next <= 10) {
        img.order = next;
        used.add(next);
        next += 1;
      }
    });
    list.sort((a, b) => Number(a.order || 99) - Number(b.order || 99));
  });
  return out;
}

/** Server summary first; fall back to locally indexed {SKU}-n files. */
export function stagedImageCount(summary, bySku = {}) {
  const fromSummary = Number(summary?.total_images) || 0;
  if (fromSummary > 0) return fromSummary;
  return Object.values(bySku || {}).reduce(
    (n, list) => n + (Array.isArray(list) ? list.length : 0),
    0,
  );
}

export function imagesForSku(imagesBySku, sku) {
  if (!imagesBySku || !sku) return [];
  const want = normalizeSkuKey(sku);
  if (!want) return [];
  const collected = [];
  const seen = new Set();
  Object.entries(imagesBySku).forEach(([key, list]) => {
    (list || []).forEach((img) => {
      const parsed = parseSkuImageFilename(img.zipPath || img.originalName || img.filename || key);
      const imgSku = parsed?.sku || img.sku || key;
      const keys = imageMatchKeys({
        sku: imgSku,
        order: img.order || parsed?.order,
        stem: parsed?.stem || img.stem,
      });
      if (!keys.includes(want)) return;
      const token = `${String(img.originalName || img.filename || "").toLowerCase()}#${Number(img.order || parsed?.order || 0)}`;
      if (seen.has(token)) return;
      seen.add(token);
      const misreadSlot = normalizeSkuKey(imgSku) !== want;
      collected.push({
        ...img,
        sku: img.sku || key || parsed?.sku,
        order: misreadSlot ? null : img.order || parsed?.order,
      });
    });
  });
  const used = new Set(
    collected.map((img) => Number(img.order)).filter((n) => n >= 1 && n <= 10),
  );
  let next = 1;
  collected.forEach((img) => {
    const n = Number(img.order);
    if (n >= 1 && n <= 10) return;
    while (used.has(next) && next <= 10) next += 1;
    if (next <= 10) {
      img.order = next;
      used.add(next);
      next += 1;
    }
  });
  collected.sort((a, b) => Number(a.order || 99) - Number(b.order || 99));
  return collected;
}

function imageMatchKeys({ sku, order, stem } = {}) {
  const keys = [sku, stem];
  const n = Number(order);
  if (sku && n >= 1 && n <= 10) {
    keys.push(`${sku}-${n}`, `${sku}_${n}`);
  }
  return [...new Set(keys.map((k) => normalizeSkuKey(k)).filter(Boolean))];
}

export function filesForSku(filesBySku, sku) {
  if (!filesBySku || !sku) return {};
  const want = String(sku).trim();
  if (filesBySku[want] && Object.keys(filesBySku[want]).length) return filesBySku[want];
  const lower = normalizeSkuKey(want);
  const key = Object.keys(filesBySku).find((k) => normalizeSkuKey(k) === lower);
  return key ? filesBySku[key] : {};
}

export function wizardImageSrc(img) {
  if (!img) return "";
  if (img.previewUrl) return img.previewUrl;
  if (img.filename) return `/api/bulk-listing-wizard/files/${encodeURIComponent(img.filename)}`;
  const url = String(img.url || "");
  const hit = url.match(/productFiles\/([^/?#]+)$/i);
  if (hit?.[1]) return `/api/bulk-listing-wizard/files/${hit[1]}`;
  return url;
}

export function headerStem(value) {
  return String(value || "")
    .trim()
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[₹()]/g, "")
    .replace(/%/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function normalizeHeader(value) {
  const raw = headerStem(value);
  return HEADER_ALIASES[raw] || raw;
}

export function isSkuSourceHeader(header) {
  const stem = headerStem(header);
  const key = normalizeHeader(header);
  return key === "sku" || stem === "sku" || stem === "variant_sku";
}

export function isMappingImageColumn(map = {}) {
  if (map.ierada === "staged_images") return true;
  const header = String(map.excel || "");
  if (/sku/i.test(header)) return false;
  return /image|photo/i.test(header);
}

function cellStr(value) {
  if (value == null) return "";
  if (typeof value === "object") return String(value.text || value.w || "").trim();
  return String(value).trim();
}

function recordValue(record, aliases) {
  const wantedStems = new Set((aliases || []).map((key) => headerStem(key)));
  const visit = (obj) => {
    if (!obj || typeof obj !== "object") return "";
    for (const alias of aliases || []) {
      const direct = obj[alias];
      if (direct != null && String(direct).trim()) return String(direct).trim();
    }
    for (const [key, value] of Object.entries(obj)) {
      if (key === "raw" || key === "row_id" || key === "excel_row") continue;
      if (wantedStems.has(headerStem(key)) && String(value || "").trim()) {
        return String(value).trim();
      }
    }
    return "";
  };
  return visit(record) || visit(record?.raw) || "";
}

function sheetToRecords(sheet, sheetName) {
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
  const headerRow = (matrix[0] || []).map((h) => cellStr(h)).filter(Boolean);
  if (!headerRow.length) return { sheetName, headers: [], keys: [], rows: [] };
  const keys = headerRow.map(normalizeHeader);
  const rows = matrix.slice(1).map((line, i) => {
    const raw = {};
    headerRow.forEach((header, ci) => {
      raw[header] = cellStr(line[ci]);
    });
    const mapped = {};
    keys.forEach((key, ci) => {
      if (!key) return;
      mapped[key] = cellStr(line[ci]);
    });
    return { row_id: `r_${i + 2}`, excel_row: i + 2, raw, ...mapped };
  }).filter((row) =>
    Object.values(row.raw || {}).some((v) => String(v || "").trim()),
  );
  return { sheetName, headers: headerRow, keys, rows };
}

function findSheet(wb, wanted) {
  const hit = wb.SheetNames.find((n) => n.trim().toLowerCase() === wanted);
  return hit ? sheetToRecords(wb.Sheets[hit], hit) : null;
}

export function detectListingKind(wb) {
  const names = (wb.SheetNames || []).map((n) => n.trim().toLowerCase());
  if (names.includes("attributes") && names.includes("variations")) return "custom";
  if (names.includes("variations")) return "color_size";
  return "single";
}

function indexByParentSku(rows) {
  const out = {};
  (rows || []).forEach((row) => {
    const key = normalizeSkuKey(
      recordValue(row, ["parent_sku", "parentsku", "parent"]) ||
        recordValue(row, ["sku"]),
    );
    if (key) out[key] = row;
  });
  return out;
}

const COLOR_SIZE_HEADERS = [
  "Variant SKU",
  "Parent SKU",
  "Image SKU",
  "Brand Type",
  "Brand Name",
  "Colour",
  "Size",
  "MRP ₹",
  "Selling Price ₹",
  "Stock",
  "Package Weight (g)",
  "Length (cm)",
  "Width (cm)",
  "Height (cm)",
  "What's in the Box",
];

const CUSTOM_BASE_HEADERS = [
  "Variant SKU",
  "Parent SKU",
  "Image SKU",
  "Brand Type",
  "Brand Name",
];

const CUSTOM_TAIL_HEADERS = [
  "MRP ₹",
  "Selling Price ₹",
  "Stock",
  "Package Weight (g)",
  "Length (cm)",
  "Width (cm)",
  "Height (cm)",
  "What's in the Box",
];

function usedCustomAttrIndexes(attrMap, variationRows) {
  return [1, 2, 3, 4].filter((n) => {
    const named = Object.values(attrMap || {}).some((item) => String(item[`attr${n}_name`] || "").trim());
    const valued = (variationRows || []).some((item) => String(item[`attr${n}_value`] || "").trim());
    return named || valued;
  });
}

function customWorkbookHeaders(usedIndexes) {
  const attrHeaders = (usedIndexes || []).flatMap((n) => [`Attribute ${n} Name`, `Attribute ${n} Value`]);
  return [...CUSTOM_BASE_HEADERS, ...attrHeaders, ...CUSTOM_TAIL_HEADERS];
}

function flattenVariationWorkbook(wb, listingKind) {
  const products = findSheet(wb, "products");
  const variations = findSheet(wb, "variations");
  if (!products?.rows.length) throw new Error("No Products sheet found");
  if (!variations?.rows.length) throw new Error("No Variations sheet found");
  const parents = indexByParentSku(products.rows);
  const attributes = listingKind === "custom" ? indexByParentSku(findSheet(wb, "attributes")?.rows || []) : {};
  const usedAttrs = listingKind === "custom" ? usedCustomAttrIndexes(attributes, variations.rows) : [];
  const headers = listingKind === "custom" ? customWorkbookHeaders(usedAttrs) : COLOR_SIZE_HEADERS;
  const rows = variations.rows.map((variant, i) => {
    const parentSku = recordValue(variant, ["parent_sku", "parentsku", "parent"]);
    const parentKey = normalizeSkuKey(parentSku);
    const parent = parents[parentKey] || {};
    const attrs = attributes[parentKey] || {};
    const sku =
      recordValue(variant, ["variant_sku", "variantsku"]) ||
      recordValue(variant, ["sku"]);
    const imageSku = recordValue(variant, ["image_sku", "imagesku"]) || sku;
    const attrRaw = {};
    usedAttrs.forEach((n) => {
      attrRaw[`Attribute ${n} Name`] = attrs[`attr${n}_name`] || "";
      attrRaw[`Attribute ${n} Value`] = variant[`attr${n}_value`] || "";
    });
    return {
      row_id: `v_${i + 2}`,
      excel_row: i + 2,
      listing_kind: listingKind,
      parent_sku: parentSku || parent.parent_sku || parent.sku || "",
      sku,
      image_sku: imageSku,
      brand_type: parent.brand_type || "",
      brand: parent.brand || "",
      colour: variant.colour || "",
      size: variant.size || "",
      mrp: variant.mrp || "",
      selling_price: variant.selling_price || "",
      stock: variant.stock || "",
      barcode: variant.barcode || "",
      package_weight: parent.package_weight || "",
      package_length: parent.package_length || "",
      package_width: parent.package_width || "",
      package_height: parent.package_height || "",
      whats_in_the_box: variant.whats_in_the_box || parent.whats_in_the_box || "",
      attr1_name: attrs.attr1_name || "",
      attr1_value: variant.attr1_value || "",
      attr2_name: attrs.attr2_name || "",
      attr2_value: variant.attr2_value || "",
      attr3_name: attrs.attr3_name || "",
      attr3_value: variant.attr3_value || "",
      attr4_name: attrs.attr4_name || "",
      attr4_value: variant.attr4_value || "",
      raw: {
        ...(parent.raw || {}),
        ...(variant.raw || {}),
        ...attrRaw,
        "Variant SKU": sku,
        "Parent SKU": parentSku || parent.parent_sku || parent.sku || "",
        "Image SKU": imageSku,
      },
    };
  }).filter((row) => String(row.sku || "").trim());
  if (!rows.length) throw new Error("Variations sheet has no SKU rows");
  return {
    listingKind,
    sheetName: variations.sheetName,
    headers,
    keys: headers.map(normalizeHeader),
    rows,
  };
}

export function parseListingWorkbook(fileBuffer) {
  const wb = XLSX.read(fileBuffer, { type: "array" });
  const listingKind = detectListingKind(wb);
  if (listingKind === "color_size" || listingKind === "custom") {
    return flattenVariationWorkbook(wb, listingKind);
  }
  const skip = new Set([
    "guide",
    "image naming",
    "completed (example)",
    "completed listing (step 4)",
    "size catalogue",
    "size names",
    "attributes",
    "variations",
  ]);
  const sheetName =
    wb.SheetNames.find((n) => n.trim().toLowerCase() === "products") ||
    wb.SheetNames.find((n) => !skip.has(n.trim().toLowerCase()));
  if (!sheetName) throw new Error("No Products sheet found");
  const parsed = sheetToRecords(wb.Sheets[sheetName], sheetName);
  if (!parsed.headers.length) throw new Error("Products sheet has no headers");
  return { listingKind: "single", ...parsed };
}

export function rowImageKey(row) {
  return String(row?.image_sku || row?.sku || "").trim();
}

export function isVariationListingKind(kind) {
  return kind === "color_size" || kind === "custom";
}

export function isCustomListingKind(kind) {
  return kind === "custom";
}

export const LISTING_TABLE_SCROLL_AFTER = 15;

export function listingTableScrollClass(itemCount, extra = "") {
  const scroll = Number(itemCount) > LISTING_TABLE_SCROLL_AFTER;
  return [
    extra,
    scroll
      ? "max-h-[32.5rem] overflow-y-auto overflow-x-auto overscroll-contain"
      : "overflow-x-auto overflow-hidden",
  ]
    .filter(Boolean)
    .join(" ");
}

export function listingTableHeadClass(base) {
  return `${base} sticky top-0 z-20`;
}

function customAttrParts(row) {
  return [1, 2, 3, 4].map((n) => ({
    name: String(row?.[`attr${n}_name`] || "").trim(),
    value: String(row?.[`attr${n}_value`] || "").trim(),
  }));
}

export function customAttributeColumns(rows) {
  const names = ["", "", "", ""];
  const used = [false, false, false, false];
  (rows || []).forEach((row) => {
    customAttrParts(row).forEach((attr, i) => {
      if (attr.name && !names[i]) names[i] = attr.name;
      if (attr.name || attr.value) used[i] = true;
    });
  });
  return names
    .map((name, i) => ({
      index: i + 1,
      key: `attr${i + 1}_value`,
      name,
      label: name ? `Attribute-${i + 1} ${name}` : `Attribute-${i + 1}`,
    }))
    .filter((_, i) => used[i]);
}

export function isUnusedCustomAttrHeader(header, rows) {
  const key = normalizeHeader(header);
  const match = key.match(/^attr([1-4])_(name|value)$/);
  if (!match) return false;
  const active = new Set(customAttributeColumns(rows).map((col) => col.index));
  return !active.has(Number(match[1]));
}

export function variantAttrValue(variant, index) {
  const attr = variant?.attrs?.[index - 1];
  if (attr?.value) return attr.value;
  return String(variant?.row?.[`attr${index}_value`] || "").trim();
}

function rowIsCustomVariation(row) {
  if (row?.listing_kind === "custom") return true;
  if (row?.listing_kind === "color_size") return false;
  return Boolean(String(row?.attr1_value || "").trim()) && !String(row?.colour || "").trim();
}

export function variationPreviewGroups(rows) {
  const groups = [];
  const index = new Map();
  (rows || []).forEach((row) => {
    const parent = String(row.parent_sku || "").trim() || `__solo_${row.row_id || row.sku}`;
    if (!index.has(parent)) {
      const group = { parentSku: String(row.parent_sku || "").trim(), title: "", variants: [] };
      index.set(parent, group);
      groups.push(group);
    }
    const group = index.get(parent);
    const sku = String(row.sku || "").trim();
    const imageKey = String(row.image_sku || row.sku || "").trim();
    const custom = rowIsCustomVariation(row);
    const attrs = customAttrParts(row);
    const colour = custom ? "" : String(row.colour || "").trim();
    const mergeKey = custom
      ? `${sku.toLowerCase()}|${attrs.map((item) => item.value.toLowerCase()).join("|")}|${imageKey.toLowerCase()}`
      : `${sku.toLowerCase()}|${colour.toLowerCase()}|${imageKey.toLowerCase()}`;
    let variant = group.variants.find((item) => item.mergeKey === mergeKey);
    if (!variant) {
      variant = { mergeKey, row, sku, colour, imageKey, sizes: [], attrs, rows: [], custom };
      group.variants.push(variant);
    }
    variant.rows.push(row);
    if (!custom) {
      String(row.size || "")
        .split(/[,|]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((size) => {
          if (!variant.sizes.includes(size)) variant.sizes.push(size);
        });
    }
    if (!group.title && String(row.name || "").trim()) group.title = String(row.name).trim();
  });
  groups.forEach((group) => {
    if (!group.title) group.title = group.parentSku || group.variants[0]?.sku || "—";
  });
  return groups;
}

/**
 * Variant / listing SKU keys used on more than one row.
 * Repeated Parent SKU is how Colour × Size groups colours — it is not a duplicate.
 */
export function duplicateSkuKeys(rows) {
  const seen = new Set();
  const dupes = new Set();
  (rows || []).forEach((row) => {
    const key = normalizeSkuKey(row?.sku);
    const parent = normalizeSkuKey(row?.parent_sku);
    if (!key) return;
    // Parent SKU is allowed to repeat. If a row's "SKU" is actually the parent,
    // the parent-equals-variant check reports that — do not call it a duplicate.
    if (parent && key === parent) return;
    if (seen.has(key)) dupes.add(key);
    else seen.add(key);
  });
  return dupes;
}

export function sizeVariantSku(baseSku, sizeLabel, sizeCount = 1) {
  const base = String(baseSku || "").trim();
  if (!base) return "";
  if (Number(sizeCount) <= 1) return base;
  return `${base}-${slugSizeToken(sizeLabel)}`;
}

export function listingErrorLabel(item = {}) {
  const parent = String(item.parentSku || "").trim();
  const variant = String(item.variantSku || "").trim();
  const sku = String(item.sku || "").trim();
  if (parent && variant && normalizeSkuKey(parent) !== normalizeSkuKey(variant)) {
    return `Parent ${parent} · Variant ${variant}`;
  }
  if (variant) return `Variant ${variant}`;
  if (parent) return `Parent ${parent}`;
  return sku || "Listing";
}

/** One entry per parent SKU, so a colour x size sheet lists once, not per row. */
export function groupColorSizeSubmitRows(rows) {
  const groups = [];
  const index = new Map();
  (rows || []).forEach((row) => {
    const parent = String(row.parent_sku || "").trim();
    const key = parent ? normalizeSkuKey(parent) : `__solo_${row.row_id || row.sku}`;
    if (!index.has(key)) {
      const group = { parentSku: parent, rows: [] };
      index.set(key, group);
      groups.push(group);
    }
    index.get(key).rows.push(row);
  });
  return groups;
}

export function excelColumnLetter(index) {
  let n = Number(index) + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export function fieldLabel(key) {
  if (key === IGNORE_FIELD) return "Ignore Column";
  if (!key) return "";
  const hit = MAP_FIELDS.find((f) => f.key === key);
  if (hit) return hit.label;
  if (AI_FIELD_KEYS.includes(key)) {
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return key;
}

export function fieldRule(key) {
  if (!key || key === IGNORE_FIELD) return "Not required";
  return FIELD_RULES[key]?.rule || "Optional";
}

export function isAiOptionalField(key) {
  return Boolean(FIELD_RULES[key]?.aiOptional) || AI_FIELD_KEYS.includes(key);
}

export function isRequiredMapField(key) {
  return Boolean(
    IERADA_FIELDS.find((f) => f.key === key)?.required ||
      CUSTOM_ATTR_MAP_FIELDS.find((f) => f.key === key)?.required,
  );
}

export function deriveMapStatus(map = {}) {
  if (map.ierada === IGNORE_FIELD) return "Ignored";
  if (!map.ierada) return "Unmapped";
  if (FIELD_RULES[map.ierada]?.needsReview) return "Needs Review";
  if (map.confidence === "Low") return "Needs Review";
  return "Mapped";
}

function headerLooksIgnorable(header) {
  const key = normalizeHeader(header);
  return AUTO_IGNORE.test(key) || AUTO_IGNORE.test(String(header || "").trim());
}

function confidenceForHeader(header, fieldKey) {
  const raw = headerStem(header);
  if (FIELD_RULES[fieldKey]?.needsReview) return "Medium";
  if (FIELD_RULES[fieldKey]?.aiOptional) return "Medium";
  if (raw === fieldKey) return "High";
  if (HEADER_ALIASES[raw] === fieldKey) return "High";
  if (raw.includes(fieldKey) || fieldKey.includes(raw)) return "Medium";
  return "Low";
}

export function mappingConfidence(header, fieldKey) {
  if (!fieldKey || fieldKey === IGNORE_FIELD) return "";
  return confidenceForHeader(header, fieldKey);
}

export function refreshMappingConfidence(mapping = []) {
  return (mapping || []).map((map) => {
    const next = {
      ...map,
      confidence: mappingConfidence(map.excel, map.ierada),
    };
    return { ...next, status: deriveMapStatus(next) };
  });
}

export function repairVariationMapping(mapping = []) {
  const rows = (mapping || []).map((map) => ({ ...map }));
  const stemOf = (map) => headerStem(map.excel);

  rows.forEach((map) => {
    const stem = stemOf(map);
    if ((stem === "image_sku" || stem === "parent_sku") && map.ierada === "sku") {
      map.ierada = stem;
      map.confidence = mappingConfidence(map.excel, stem);
    }
  });

  const variant = rows.find((map) => stemOf(map) === "variant_sku");
  if (variant) {
    const otherSku = rows.find((map) => map.ierada === "sku" && stemOf(map) !== "variant_sku");
    if (otherSku) {
      const otherStem = stemOf(otherSku);
      if (otherStem === "image_sku" || otherStem === "parent_sku") {
        otherSku.ierada = otherStem;
        otherSku.confidence = mappingConfidence(otherSku.excel, otherStem);
      } else {
        otherSku.ierada = "";
        otherSku.confidence = "";
      }
    }
    variant.ierada = "sku";
    variant.confidence = mappingConfidence(variant.excel, "sku");
  }

  rows.forEach((map) => {
    const stem = stemOf(map);
    if ((stem === "parent_sku" || stem === "image_sku") && (!map.ierada || map.ierada === IGNORE_FIELD)) {
      map.ierada = stem;
      map.confidence = mappingConfidence(map.excel, stem);
    }
  });

  rows.forEach((map) => {
    const key = normalizeHeader(map.excel);
    if (!/^attr[1-4]_(name|value)$/.test(key)) return;
    if (map.ierada && map.ierada !== IGNORE_FIELD) return;
    map.ierada = key;
    map.confidence = mappingConfidence(map.excel, key);
  });

  return refreshMappingConfidence(rows);
}

export function decorateMapping(headers, mapping = []) {
  return (headers || []).map((header, index) => {
    const map = mapping[index] && mapping[index].excel === header
      ? mapping[index]
      : mapping.find((item) => item.excel === header) || { excel: header, ierada: "", confidence: "" };
    const status = deriveMapStatus(map);
    const key = map.ierada || "";
    return {
      excel: header,
      letter: excelColumnLetter(index),
      ierada: key,
      confidence: status === "Unmapped" || status === "Ignored" ? "" : mappingConfidence(header, key),
      status,
      rule: status === "Unmapped" ? "—" : fieldRule(key),
      required: isRequiredMapField(key) || (!key && isSkuSourceHeader(header)),
      aiOptional: isAiOptionalField(key) || isAiOptionalField(normalizeHeader(header)),
    };
  });
}

export function autoMapColumns(headers) {
  const used = new Set();
  const mapped = (headers || []).map((header) => {
    if (headerLooksIgnorable(header)) {
      return {
        excel: header,
        ierada: IGNORE_FIELD,
        confidence: "",
        status: "Ignored",
      };
    }
    const key = normalizeHeader(header);
    const field = MAP_FIELDS.find((f) => f.key === key);
    const ai = AI_FIELD_KEYS.includes(key);
    if (field && !used.has(field.key)) {
      used.add(field.key);
      const confidence = confidenceForHeader(header, field.key);
      const row = { excel: header, ierada: field.key, confidence };
      return { ...row, status: deriveMapStatus(row) };
    }
    if (ai) {
      const row = { excel: header, ierada: key, confidence: "Medium" };
      return { ...row, status: deriveMapStatus(row) };
    }
    return { excel: header, ierada: "", confidence: "", status: "Unmapped" };
  });
  return repairVariationMapping(mapped);
}

export function applySavedMappingTemplate(headers, template) {
  const auto = autoMapColumns(headers);
  const byHeader = template?.byHeader;
  if (!byHeader || typeof byHeader !== "object") return repairVariationMapping(auto);
  const applied = auto.map((row) => {
    const saved = byHeader[row.excel];
    if (!saved || typeof saved !== "object") return row;
    // A template saved from another sheet must never blank a column the
    // header already maps itself — that silently drops SKU and its images.
    if (!saved.ierada && row.ierada) return row;
    const next = {
      excel: row.excel,
      ierada: saved.ierada || "",
      confidence: mappingConfidence(row.excel, saved.ierada || ""),
    };
    return { ...next, status: deriveMapStatus(next) };
  });
  return repairVariationMapping(applied);
}

export function mappingTemplatePayload(mapping) {
  const byHeader = {};
  (mapping || []).forEach((map) => {
    if (!map?.excel) return;
    byHeader[map.excel] = { ierada: map.ierada || "", confidence: map.confidence || "" };
  });
  return { byHeader, savedAt: new Date().toISOString() };
}

export function applyColumnMap(rows, mapping) {
  return rows.map((row) => {
    const next = { ...row };
    mapping.forEach((map) => {
      if (!map.ierada || map.ierada === IGNORE_FIELD) return;
      const stem = headerStem(map.excel);
      // Parent SKU / Image SKU must never overwrite the variant SKU.
      if (map.ierada === "sku" && (stem === "parent_sku" || stem === "image_sku")) return;
      const incoming = recordValue({ raw: row.raw }, [map.excel]);
      if (incoming) next[map.ierada] = incoming;
    });
    if (!String(next.parent_sku || "").trim()) {
      next.parent_sku = recordValue(next, ["parent_sku", "parentsku", "parent"]);
    }
    if (!String(next.sku || "").trim()) {
      next.sku =
        recordValue(next, ["variant_sku", "variantsku"]) ||
        recordValue(next, ["sku"]);
    }
    if (!String(next.image_sku || "").trim()) {
      next.image_sku = recordValue(next, ["image_sku", "imagesku"]) || next.sku || "";
    }
    return next;
  });
}

export function mappingInsights(mapping, sampleRow = {}) {
  const rows = mapping || [];
  const mapped = rows.filter((m) => deriveMapStatus(m) === "Mapped").length;
  const unmapped = rows.filter((m) => deriveMapStatus(m) === "Unmapped").length;
  const review = rows.filter((m) => deriveMapStatus(m) === "Needs Review").length;
  const ignored = rows.filter((m) => deriveMapStatus(m) === "Ignored").length;
  const mandatory = rows.filter((m) => isRequiredMapField(m.ierada)).length;
  const aiOptional = rows.filter((m) => isAiOptionalField(m.ierada)).length;
  const priceKeys = ["selling_price", "mrp"];
  const priceMapped = rows.find((m) => priceKeys.includes(m.ierada));
  const priceSample = priceMapped
    ? String(sampleRow?.raw?.[priceMapped.excel] ?? sampleRow?.[priceMapped.ierada] ?? "").trim()
    : "";
  const priceOk = priceMapped
    ? priceSample !== "" && Number.isFinite(Number(priceSample.replace(/,/g, "")))
    : false;
  return {
    total: rows.length,
    mapped,
    unmapped,
    review,
    ignored,
    mandatory,
    aiOptional,
    footerUnmapped: unmapped + review,
    warnings: review + (ignored ? 1 : 0),
    footerWarnings: review,
    priceOk,
    extraIgnorable: rows.filter((m) => {
      const status = deriveMapStatus(m);
      if (status === "Ignored") return true;
      return status === "Unmapped" && !isRequiredMapField(normalizeHeader(m.excel));
    }).length,
  };
}

export function buildMappedSampleWorkbook(rows, mapping) {
  const cols = (mapping || []).filter((m) => m.ierada && m.ierada !== IGNORE_FIELD);
  const headers = cols.map((m) => fieldLabel(m.ierada));
  const data = (rows || []).slice(0, 25).map((row) =>
    cols.map((m) => row.raw?.[m.excel] ?? row[m.ierada] ?? ""),
  );
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mapped Sample");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

function toNum(val) {
  if (val === "" || val == null) return NaN;
  const n = Number(String(val).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : NaN;
}

function lookupByNameOrId(list, value, extraMatch) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) {
    const byId = (list || []).find((item) => String(item.id) === raw);
    if (byId) return byId;
  }
  const lower = raw.toLowerCase();
  return (
    (list || []).find((item) => String(item.name || item.title || "").trim().toLowerCase() === lower) ||
    (list || []).find((item) => extraMatch?.(item, lower)) ||
    null
  );
}

function tokenizeHint(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

const HINT_STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "product",
  "image",
  "cover",
  "file",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "sku",
  "size",
  "pack",
  "item",
]);

export function applyCategorySuggestion(row, data, taxonomy) {
  if (!data || !row) return row;
  const cat = lookupByNameOrId(
    taxonomy?.categories,
    data.categoryTitle || data.category || data.category_id,
  );
  const subPool = (taxonomy?.subCategories || []).filter(
    (s) => !cat || String(s.categoryId) === String(cat.id),
  );
  const sub = lookupByNameOrId(
    subPool.length ? subPool : taxonomy?.subCategories,
    data.subCategoryTitle || data.sub_category || data.sub_category_id,
  );
  const innerVal =
    data.innerSubCategoryTitle || data.inner_sub_category || data.inner_sub_category_id;
  let inner = null;
  if (String(innerVal || "").trim()) {
    const innerPool = (taxonomy?.innerSubCategories || []).filter(
      (i) => !sub || String(i.subCategoryId) === String(sub.id),
    );
    inner = lookupByNameOrId(
      innerPool.length ? innerPool : taxonomy?.innerSubCategories,
      innerVal,
    );
  }
  return {
    ...row,
    category: cat?.name || cat?.title || data.categoryTitle || row.category,
    sub_category: sub?.name || sub?.title || data.subCategoryTitle || row.sub_category,
    inner_sub_category:
      inner?.name || inner?.title || data.innerSubCategoryTitle || row.inner_sub_category || "",
  };
}

export function guessTaxonomyFromHints(taxonomy, hints = {}) {
  const tokens = [
    ...tokenizeHint(hints.name),
    ...tokenizeHint(hints.sku),
    ...tokenizeHint(hints.filename),
    ...tokenizeHint(hints.zipPath),
    ...tokenizeHint(hints.notes),
  ].filter((t) => !HINT_STOP.has(t));
  if (!tokens.length) return null;
  const tokenSet = new Set(tokens);
  const scoreName = (name) => {
    const parts = tokenizeHint(name);
    let score = 0;
    parts.forEach((p) => {
      if (tokenSet.has(p)) score += p.length >= 5 ? 4 : 3;
      else if (tokens.some((t) => t.length >= 4 && (p.includes(t) || t.includes(p)))) score += 1;
    });
    return score;
  };
  let best = null;
  let bestScore = 0;
  (taxonomy?.innerSubCategories || []).forEach((inner) => {
    const sub = (taxonomy?.subCategories || []).find(
      (s) => String(s.id) === String(inner.subCategoryId),
    );
    const cat =
      sub &&
      (taxonomy?.categories || []).find((c) => String(c.id) === String(sub.categoryId));
    if (!cat || !sub) return;
    const score = scoreName(inner.name) * 3 + scoreName(sub.name) * 2 + scoreName(cat.name);
    if (score > bestScore) {
      bestScore = score;
      best = { category: cat.name, sub_category: sub.name, inner_sub_category: inner.name };
    }
  });
  (taxonomy?.subCategories || []).forEach((sub) => {
    const cat = (taxonomy?.categories || []).find((c) => String(c.id) === String(sub.categoryId));
    if (!cat) return;
    const score = scoreName(sub.name) * 2 + scoreName(cat.name);
    if (score > bestScore) {
      bestScore = score;
      best = { category: cat.name, sub_category: sub.name, inner_sub_category: "" };
    }
  });
  return bestScore >= 3 ? best : null;
}

const COLOUR_ALIASES = {
  creame: "cream",
  creme: "cream",
  "off white": "white",
  offwhite: "white",
  gray: "grey",
  darkbrown: "dark brown",
  "navy blue": "dark blue",
  navy: "dark blue",
};

function editDistance(a, b) {
  const s = String(a || "");
  const t = String(b || "");
  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const prev = new Array(t.length + 1);
  const cur = new Array(t.length + 1);
  for (let j = 0; j <= t.length; j += 1) prev[j] = j;
  for (let i = 1; i <= s.length; i += 1) {
    cur[0] = i;
    for (let j = 1; j <= t.length; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= t.length; j += 1) prev[j] = cur[j];
  }
  return prev[t.length];
}

function lookupColour(list, value) {
  const direct = lookupByNameOrId(list, value);
  if (direct) return direct;
  const token = normalizeLookupToken(value);
  if (!token || !list?.length) return null;
  const aliased = COLOUR_ALIASES[token] || COLOUR_ALIASES[token.replace(/\s+/g, "")];
  if (aliased) {
    const hit = lookupByNameOrId(list, aliased);
    if (hit) return hit;
  }
  const packed = token.replace(/\s+/g, "");
  const close = list.filter((item) => {
    const name = normalizeLookupToken(item.name || item.title || "");
    const packedName = name.replace(/\s+/g, "");
    if (Math.abs(packedName.length - packed.length) > 1) return false;
    return editDistance(packedName, packed) === 1;
  });
  return close.length === 1 ? close[0] : null;
}

function normalizeLookupToken(value) {
  return String(value || "")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\u00a0/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[_./]+/g, " ")
    .replace(/\s+/g, " ");
}

const SIZE_ALIASES = {
  "free size": "free size",
  freesize: "free size",
  "free-size": "free size",
  "one size": "free size",
  onesize: "free size",
  os: "free size",
  fs: "free size",
  "free sz": "free size",
  standard: "free size",
};

function sizeLookupKeys(value) {
  const norm = normalizeLookupToken(value);
  const packed = norm.replace(/\s+/g, "");
  const keys = new Set([norm, packed]);
  const aliased = SIZE_ALIASES[norm] || SIZE_ALIASES[packed];
  if (aliased) {
    keys.add(aliased);
    keys.add(aliased.replace(/\s+/g, ""));
  }
  const stripped = norm
    .replace(/^(uk|eu|us|ind|size)\s*-?\s*/, "")
    .replace(/\s*-?\s*(uk|eu|us|ind)$/, "")
    .trim();
  if (stripped && stripped !== norm) {
    keys.add(stripped);
    keys.add(stripped.replace(/\s+/g, ""));
    keys.add(`ind-${stripped}`);
    keys.add(`ind ${stripped}`);
  }
  return [...keys].filter(Boolean);
}

/** IND-6 for a bare 6, so a numeric size never reads as a catalogue row id. */
export function indSizeName(value) {
  const raw = String(value || "").trim();
  const bare = raw.match(/^(?:ind)?\s*-?\s*(\d{1,2})$/i);
  return bare ? `IND-${bare[1]}` : "";
}

function lookupSize(list, value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (!list?.length) return { id: null, name: raw, unverified: true };
  const byName = (name) => {
    const want = String(name || "").trim().toLowerCase();
    if (!want) return null;
    return (
      list.find(
        (item) => String(item.name || item.title || "").trim().toLowerCase() === want,
      ) || null
    );
  };
  // Indian sizing is the house standard, so 6 means IND-6 and never row id 6.
  const ind = indSizeName(raw);
  if (ind) {
    const indHit = byName(ind);
    if (indHit) return indHit;
  }
  const exact = byName(raw);
  if (exact) return exact;
  const keys = new Set(sizeLookupKeys(raw));
  const fuzzy = list.find((item) => {
    const nameKeys = sizeLookupKeys(item.name || item.title || "");
    return nameKeys.some((key) => keys.has(key));
  });
  if (fuzzy) return fuzzy;
  // Only now can a number mean a row id, and never for a size we spell IND-n.
  if (!ind && /^\d+$/.test(raw)) {
    return list.find((item) => String(item.id) === raw) || null;
  }
  return null;
}

export function splitColourValues(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];
  return raw
    .split(/\s*[,|;]+\s*|\s+\/\s+/)
    .map((part) => part.replace(/^[☑☐]\s*/, "").trim())
    .filter(Boolean);
}

export function splitSizeValues(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];
  return raw
    .split(/\s*[,|;]+\s*|\s+\/\s+/)
    .map((part) => part.replace(/^[☑☐]\s*/, "").trim())
    .filter(Boolean);
}

export function slugSizeToken(value) {
  const slug = String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^A-Za-z0-9-]/g, "")
    .toUpperCase();
  return slug || "SIZE";
}

export function expandMappedRowsBySize(rows) {
  const out = [];
  (rows || []).forEach((row) => {
    if (row.listing_kind === "color_size" || row.listing_kind === "custom") {
      out.push({ ...row, image_sku: row.image_sku || row.sku });
      return;
    }
    out.push({
      ...row,
      image_sku: row.image_sku || row.sku,
    });
  });
  return out;
}

export function validateListingRow(
  row,
  { taxonomy, colors, sizes, imagesBySku, existingSkus, existingVariationSkus, duplicateSkus, listingKind },
) {
  const errors = [];
  const warnings = [];
  const sku = String(row.sku || "").trim();
  if (!sku) errors.push("SKU is required");
  if (!String(row.brand_type || "").trim()) errors.push("Brand type is required");
  if (!String(row.brand || "").trim()) errors.push("Brand name is required");
  if (!String(row.name || "").trim()) errors.push("Product title was not generated from the cover image");

  const category = lookupByNameOrId(taxonomy.categories, row.category);
  if (!String(row.category || "").trim()) errors.push("Category was not generated from the cover image");
  else if (!category) errors.push("Category not found");
  const subCategory = lookupByNameOrId(
    taxonomy.subCategories.filter((s) => !category || String(s.categoryId) === String(category.id)),
    row.sub_category,
  );
  if (!String(row.sub_category || "").trim()) errors.push("Sub category was not generated from the cover image");
  else if (!subCategory) errors.push("Sub category not found");

  let inner = null;
  if (String(row.inner_sub_category || "").trim()) {
    inner = lookupByNameOrId(
      taxonomy.innerSubCategories.filter(
        (i) => !subCategory || String(i.subCategoryId) === String(subCategory.id),
      ),
      row.inner_sub_category,
    );
    if (!inner) errors.push("Inner subcategory not found");
  }

  const kind = row.listing_kind || listingKind;
  const isCustom = kind === "custom";
  const isColorSize = kind === "color_size";
  const colour = lookupColour(colors, row.colour);
  if (!isCustom) {
    if (!String(row.colour || "").trim()) errors.push("Colour is required");
    else if (!colour) {
      errors.push(`Colour "${String(row.colour).trim()}" is not in the IERADA colour list`);
    }
  }

  const sizeParts = isCustom ? [] : splitSizeValues(row.size);
  const colourParts = isCustom ? [] : splitColourValues(row.colour);
  const resolvedSizes = sizeParts.map((part) => lookupSize(sizes, part));
  const missingSizes = sizeParts.filter((part, i) => !resolvedSizes[i]);
  const size = resolvedSizes.find(Boolean) || null;
  if (!isCustom) {
    if (!sizeParts.length) errors.push("Size is required");
    else if (missingSizes.length) errors.push(`Size not in catalogue: ${missingSizes.join(", ")}`);
    else if (sizeParts.length > 1 && !isColorSize) {
      errors.push("Single listing accepts one size only. Use the Colour × Size template for more than one size.");
    }
    if (colourParts.length > 1) {
      errors.push(
        isColorSize
          ? "Each Colour × Size variation row accepts one colour only. Add another row for the next colour."
          : "Single listing accepts one colour only. Use the Colour × Size template for more than one colour.",
      );
    }
  } else if (!String(row.attr1_value || "").trim()) {
    errors.push("Custom variation value is required");
  }

  if (!String(row.hsn_code || "").trim()) errors.push("HSN code is required");

  const gst = toNum(row.gst);
  if (!Number.isFinite(gst) || gst < 0) errors.push("GST % must be a valid number");

  const mrp = toNum(row.mrp);
  const sell = toNum(row.selling_price);
  if (!Number.isFinite(mrp) || mrp <= 0) errors.push("MRP must be greater than 0");
  if (!Number.isFinite(sell) || sell <= 0) errors.push("Selling price must be greater than 0");
  if (Number.isFinite(mrp) && Number.isFinite(sell) && sell >= mrp) {
    errors.push("Selling price must be less than MRP");
  }

  const stock = toNum(row.stock);
  if (!Number.isInteger(stock) || stock < 1) errors.push("Stock must be a whole number of at least 1");

  ["package_weight", "package_length", "package_width", "package_height"].forEach((key) => {
    const n = toNum(row[key]);
    if (!Number.isFinite(n) || n <= 0) errors.push(`${key.replace(/_/g, " ")} is required`);
  });

  if (!String(row.whats_in_the_box || "").trim()) errors.push("What's in the Box is required");

  const imageKey = rowImageKey(row) || sku;
  const images = imagesForSku(imagesBySku, imageKey);
  if (!images.length) errors.push("Missing images");
  else if (!images.some((img) => Number(img.order) === 1)) errors.push("Missing cover image (SKU-1)");
  else if (images.length < 2) warnings.push("Consider adding more images");

  if (sku && existingSkus?.has(sku.toLowerCase())) errors.push("SKU already exists");
  if (sku && existingVariationSkus?.has(normalizeSkuKey(sku))) {
    errors.push("SKU already used by a variation of another listing — use a unique SKU");
  }

  const skuKey = normalizeSkuKey(sku);
  const parentKey = normalizeSkuKey(row.parent_sku);
  if ((isColorSize || isCustom) && skuKey && parentKey && skuKey === parentKey) {
    errors.push(
      `Variant SKU cannot be the same as the Parent SKU "${row.parent_sku}". The parent SKU is allowed to repeat — put the unique colour SKU in Variant SKU (for example ${row.parent_sku}-BLK)`,
    );
  } else if (skuKey && duplicateSkus?.has(skuKey)) {
    errors.push(
      isColorSize || isCustom
        ? `Variant SKU "${sku}" is used on more than one colour row — each colour needs its own Variant SKU. Repeating the Parent SKU is fine.`
        : `SKU "${sku}" is used on more than one row — every listing needs its own SKU`,
    );
  }

  const short = String(row.short_description || "").trim();
  if (short && short.length < 20) warnings.push("Short description too short");

  return {
    errors,
    warnings,
    colour: colour?.name || row.colour,
    resolved: {
      category,
      subCategory,
      inner,
      colour,
      size,
      sizes: resolvedSizes.filter(Boolean),
      images,
    },
  };
}

export function splitPipe(value) {
  return String(value || "")
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function splitWhatsInTheBox(value) {
  return splitPipe(value).map((part) => {
    const colon = part.indexOf(":");
    if (colon > 0) {
      return {
        title: part.slice(0, colon).trim(),
        details: part.slice(colon + 1).trim(),
      };
    }
    return { title: part, details: "" };
  });
}

export function parseSpecs(value) {
  return splitPipe(value).map((part) => {
    const [feature, ...rest] = part.split(":");
    return {
      feature: (feature || "").trim(),
      specification: rest.join(":").trim(),
    };
  }).filter((s) => s.feature || s.specification);
}

function hasFilledValue(value) {
  if (value === 0 || value === "0") return true;
  return String(value ?? "").trim() !== "";
}

export function rowHasAiCopy(row) {
  return AI_FIELD_KEYS.every((key) => hasFilledValue(row[key]));
}

export function missingAiKeys(row) {
  return ["name", "category", "sub_category", "hsn_code", "gst", ...AI_FIELD_KEYS].filter(
    (key) => !hasFilledValue(row?.[key]),
  );
}

export function rowHasGeneratedListing(row) {
  return Boolean(
    String(row.name || "").trim() &&
      String(row.category || "").trim() &&
      String(row.sub_category || "").trim(),
  );
}

export function mergeGeneratedRows(mapped, generated) {
  if (!generated?.length) return mapped || [];
  return (mapped || []).map((row) => {
    const sku = String(row.sku || "").trim().toLowerCase();
    const imageSku = String(row.image_sku || row.sku || "").trim().toLowerCase();
    const hit = generated.find((item) => {
      if (item.row_id === row.row_id || item.source_row_id === row.row_id) return true;
      const itemSku = String(item.sku || "").trim().toLowerCase();
      const itemImage = String(item.image_sku || item.sku || "").trim().toLowerCase();
      if (sku && itemSku === sku) return true;
      if (imageSku && (itemImage === imageSku || itemSku === imageSku)) return true;
      return false;
    });
    if (!hit) return row;
    return {
      ...row,
      ...hit,
      sku: row.sku,
      size: row.size,
      image_sku: row.image_sku || hit.image_sku || row.sku,
      row_id: row.row_id,
      raw: row.raw || hit.raw,
    };
  });
}

export function rowNeedsAiFill(row) {
  return missingAiKeys(row).length > 0;
}

export function buildCompletedWorkbook(rows) {
  const headers = [
    "SKU",
    "Product Name",
    "Brand Type",
    "Brand Name",
    "Category Level 1",
    "Category Level 2",
    "Inner Subcategory",
    "Colour",
    "Size",
    "HSN Code",
    "GST %",
    "MRP ₹",
    "Selling Price ₹",
    "Stock",
    "Package Weight (g)",
    "Length (cm)",
    "Width (cm)",
    "Height (cm)",
    "Country of Origin",
    "Barcode",
    "Short Description",
    "Product Details",
    "Key Features",
    "Benefits",
    "What's in the Box",
    "Specifications",
    "Meta Title",
    "Meta Description",
    "Tags",
    "Staged Images",
  ];
  const data = rows.map((row) => [
    row.sku,
    row.name,
    row.brand_type,
    row.brand,
    row.category,
    row.sub_category,
    row.inner_sub_category,
    row.colour,
    row.size,
    row.hsn_code,
    row.gst,
    row.mrp,
    row.selling_price,
    row.stock,
    row.package_weight,
    row.package_length,
    row.package_width,
    row.package_height,
    row.country_of_origin || "India",
    row.barcode || "",
    row.short_description || "",
    row.product_details || "",
    row.key_features || "",
    row.benefits || "",
    row.whats_in_the_box || "",
    row.specifications || "",
    row.meta_title || "",
    row.meta_description || "",
    row.tags || "",
    Array.isArray(row.resolved?.images) ? row.resolved.images.length : row.staged_images || "",
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

export function previewAiMode(row) {
  const hasCopy = Boolean(String(row?.short_description || "").trim());
  const hasTitle = Boolean(String(row?.name || "").trim());
  const hasCategory = Boolean(String(row?.category || "").trim());
  return hasCopy && hasTitle && hasCategory ? "No" : "Yes";
}

export function buildPreviewSampleWorkbook(rows, imagesBySku = {}) {
  const headers = [
    "#",
    "Product Name",
    "Brand Name",
    "Category Level 1",
    "Selling Price",
    "SKU",
    "Images",
    "AI Mode",
    "Short Description",
    "Status",
  ];
  const data = (rows || []).map((row, i) => {
    const imgs = imagesForSku(imagesBySku, row.sku);
    return [
      i + 1,
      row.name || "",
      row.brand || "",
      row.category || "",
      row.selling_price || "",
      row.sku || "",
      imgs.length ? `${imgs.length} mapped` : "Missing",
      previewAiMode(row),
      row.short_description || "",
      row.sku ? "Valid" : "Invalid",
    ];
  });
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "File Preview");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

export function downloadBlob(bytes, filename, mime) {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const TEMPLATE_FILES = [
  {
    id: "single",
    name: "Single Products",
    title: "Bulk Product Listing (Single Products)",
    blurb: "One SKU, one colour and one size per row. Kids Fashion: use age-group sizes.",
    file: "IERADA_Bulk_Listing_Single_Products.xlsx",
  },
  {
    id: "color_size",
    name: "Colour × Size",
    title: "Bulk Product Listing (Colour × Size Variations)",
    blurb: "Parent SKU on Products. Variations: one row per colour (sizes can be listed together) or one row per colour × size.",
    file: "IERADA_Bulk_Listing_Color_Size_Variations.xlsx",
  },
  {
    id: "custom",
    name: "Custom Variations",
    title: "Bulk Product Listing (Custom Variations)",
    blurb: "Parent SKU plus up to 4 attributes and combination rows.",
    file: "IERADA_Bulk_Listing_Custom_Variations.xlsx",
  },
];

export function listingTemplate(kind) {
  return TEMPLATE_FILES.find((t) => t.id === kind) || TEMPLATE_FILES[0];
}
