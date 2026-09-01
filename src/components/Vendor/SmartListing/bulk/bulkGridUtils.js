import * as XLSX from "xlsx";
import { suggestSku } from "../utils/settlementCalc";
import {
  validateMrpAndSelling,
  validateNonNegativeOptional,
  validateStockQty,
} from "../utils/listingFieldValidation";

/** Soft cap per quick-bulk session (matches template guidance). */
export const BULK_MAX_ROWS = 500;

/** Excel/TSV upload cap — must match server EXCEL_UPLOAD_FILE_SIZE_LIMIT (10 MB). */
export const BULK_EXCEL_MAX_BYTES = 10 * 1024 * 1024;

/** Manual input columns — same basics as single Smart Listing. */
export const BULK_GRID_COLUMNS = [
  { key: "name", label: "Product name", required: true, group: "manual" },
  { key: "audience", label: "Audience", hint: "Men / Women / Kids / Unisex", group: "lookup" },
  { key: "color", label: "Color", hint: "Optional — used in title + AI", group: "manual" },
  { key: "category", label: "Category", required: true, group: "lookup" },
  { key: "sub_category", label: "Sub category", required: true, group: "lookup" },
  { key: "inner_sub_category", label: "Inner sub", hint: "Optional", group: "lookup" },
  { key: "hsn_code", label: "HSN", required: true, group: "manual" },
  { key: "gst", label: "GST %", group: "manual" },
  { key: "original_price", label: "MRP ₹", required: true, group: "manual" },
  { key: "discounted_price", label: "Selling ₹", required: true, group: "manual" },
  { key: "stock", label: "Stock", required: true, group: "manual" },
  { key: "sku", label: "SKU", hint: "Auto if empty", group: "manual" },
  { key: "brand", label: "Brand", hint: "Seller brand — blank = generic", group: "manual" },
  { key: "ai_enabled", label: "AI", hint: "Yes / No", group: "toggle" },
];

export const BULK_PASTE_HEADER = BULK_GRID_COLUMNS.map((c) => c.key).join("\t");

const HEADER_ALIASES = {
  product_name: "name",
  product: "name",
  title: "name",
  category_level_1: "category",
  category_level_2: "sub_category",
  category_level_3: "inner_sub_category",
  subcategory: "sub_category",
  inner_sub: "inner_sub_category",
  mrp: "original_price",
  selling_price: "discounted_price",
  price: "discounted_price",
  selling_price_inr: "discounted_price",
  hsn: "hsn_code",
  gst_percent: "gst",
  gst_pct: "gst",
  brand_name: "brand",
  ai_mode: "ai_enabled",
  ai: "ai_enabled",
  qty: "stock",
  quantity: "stock",
};

function normalizeHeader(cell) {
  const raw = String(cell || "")
    .trim()
    .toLowerCase()
    .replace(/[₹()]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return HEADER_ALIASES[raw] || raw;
}

function parseAiEnabled(val) {
  const s = String(val ?? "").trim().toLowerCase();
  if (!s || s === "yes" || s === "y" || s === "true" || s === "1") return true;
  if (s === "no" || s === "n" || s === "false" || s === "0") return false;
  return true;
}

export function newBulkRow(partial = {}) {
  return {
    row_id: partial.row_id || `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    product_id: partial.product_id || null,
    name: partial.name || "",
    audience: partial.audience || "",
    color: partial.color || "",
    category: partial.category || "",
    sub_category: partial.sub_category || "",
    inner_sub_category: partial.inner_sub_category || "",
    hsn_code: partial.hsn_code || "",
    gst: partial.gst || "",
    original_price: partial.original_price || "",
    discounted_price: partial.discounted_price || "",
    stock: partial.stock || "",
    sku: partial.sku || "",
    brand: partial.brand || "",
    ai_enabled: partial.ai_enabled !== false && partial.ai_enabled !== "no",
    listingType: partial.listingType || "single",
    shortDescription: partial.shortDescription || "",
    keyFeatures: partial.keyFeatures || [],
    productDetails: partial.productDetails || "",
    generalInfo: partial.generalInfo || "",
    specifications: partial.specifications || [],
    whatsInTheBox: partial.whatsInTheBox || [],
    benefits: partial.benefits || [],
    metaTitle: partial.metaTitle || "",
    metaDescription: partial.metaDescription || "",
    metaKeywords: partial.metaKeywords || "",
    tags: partial.tags || [],
    warrantyType: partial.warrantyType || "",
    warrantyPeriod: partial.warrantyPeriod || "",
    shipsFrom: partial.shipsFrom || "",
    shipsTo: partial.shipsTo || "",
    deliveryTimeText: partial.deliveryTimeText || "",
    ai_done: partial.ai_done || false,
    files: partial.files || [],
    mediaLabels: partial.mediaLabels || [],
    errors: partial.errors || {},
    status: partial.status || "pending",
  };
}

export function titleCaseWords(text) {
  return String(text || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function polishBulkName(row) {
  let base =
    row.name?.trim() ||
    row.inner_sub_category?.trim() ||
    row.sub_category?.trim() ||
    row.category?.trim() ||
    "Product";
  base = titleCaseWords(base.replace(/\s*[-–—]\s*/g, " - "));
  const aud = String(row.audience || "").trim();
  if (aud && !new RegExp(`\\b${aud}\\b`, "i").test(base)) {
    base = `${titleCaseWords(aud)} ${base}`;
  }
  const color = String(row.color || "").trim();
  if (color && !new RegExp(color, "i").test(base)) {
    base = `${base} - ${titleCaseWords(color)}`;
  }
  return base.replace(/\s{2,}/g, " ").trim();
}

function matrixToRows(matrix) {
  const lines = (matrix || []).filter((row) =>
    row.some((cell) => String(cell ?? "").trim()),
  );
  if (!lines.length) return [];

  const headerRow = lines[0].map(normalizeHeader);
  const headerKeys = BULK_GRID_COLUMNS.map((c) => c.key);
  const hasHeader = headerRow.some((h) => headerKeys.includes(h));

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const headers = hasHeader ? headerRow : headerKeys;

  return dataLines.slice(0, BULK_MAX_ROWS).map((cells) => {
    const row = newBulkRow();
    headers.forEach((key, i) => {
      if (!headerKeys.includes(key)) return;
      const val = cells[i] ?? "";
      if (key === "ai_enabled") row[key] = parseAiEnabled(val);
      else row[key] = String(val ?? "").trim();
    });
    row.name = polishBulkName(row);
    if (!row.sku?.trim()) row.sku = suggestSku(row.name, row.brand);
    return row;
  });
}

export function parseBulkPaste(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const splitLine = (line) => {
    if (line.includes("\t")) return line.split("\t").map((p) => p.trim());
    return line.split(",").map((p) => p.trim());
  };

  const matrix = lines.map(splitLine);
  return matrixToRows(matrix);
}

export async function parseBulkExcelFile(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  return matrixToRows(matrix);
}

export function resolveCategoryIds(row, taxonomy) {
  const errors = {};
  const catName = String(row.category || "").trim().toLowerCase();
  const subName = String(row.sub_category || "").trim().toLowerCase();
  const innerName = String(row.inner_sub_category || "").trim().toLowerCase();

  const category = taxonomy.categories.find(
    (c) => c.name.trim().toLowerCase() === catName,
  );
  if (!category) errors.category = "Category not found";

  const subCategory = taxonomy.subCategories.find(
    (s) =>
      String(s.categoryId) === String(category?.id) &&
      s.name.trim().toLowerCase() === subName,
  );
  if (!subName) errors.sub_category = "Sub category required";
  else if (!subCategory) errors.sub_category = "Sub category not found";

  let innerSubCategory = null;
  if (innerName) {
    innerSubCategory = taxonomy.innerSubCategories.find(
      (i) =>
        String(i.subCategoryId) === String(subCategory?.id) &&
        i.name.trim().toLowerCase() === innerName,
    );
    if (!innerSubCategory) errors.inner_sub_category = "Inner sub not found";
  }

  return {
    category_id: category?.id || "",
    sub_category_id: subCategory?.id || "",
    inner_sub_category_id: innerSubCategory?.id || "",
    categoryTitle: category?.name || "",
    subCategoryTitle: subCategory?.name || "",
    innerSubCategoryTitle: innerSubCategory?.name || "",
    errors,
  };
}

export function validateBulkRow(row, taxonomy) {
  const errors = {};
  if (!polishBulkName(row)) errors.name = "Product name is required";
  if (!String(row.hsn_code || "").trim()) errors.hsn_code = "HSN code is required";

  Object.assign(errors, validateMrpAndSelling(row.original_price, row.discounted_price));

  const stockErr = validateStockQty(row.stock, "Stock");
  if (stockErr) errors.stock = stockErr;

  const gstErr = validateNonNegativeOptional(row.gst, "GST %");
  if (gstErr) errors.gst = gstErr;

  Object.assign(errors, resolveCategoryIds(row, taxonomy).errors);
  return errors;
}

export function bulkExtraNotes(row) {
  return [
    row.audience && `Audience: ${row.audience}`,
    row.color && `Colour: ${row.color}`,
    row.brand && `Brand: ${row.brand}`,
  ]
    .filter(Boolean)
    .join(". ");
}

export function rowToSmartListingState(row, taxonomy, vendorId) {
  const ids = resolveCategoryIds(row, taxonomy);
  const name = polishBulkName(row);
  const sku = row.sku?.trim() || suggestSku(name, row.brand);
  const color = String(row.color || "").trim();
  return {
    vendor_id: vendorId,
    listingType: "single",
    brandType: row.brand?.trim() ? "branded" : "generic",
    brand: row.brand || "",
    name,
    category_id: String(ids.category_id || ""),
    sub_category_id: String(ids.sub_category_id || ""),
    inner_sub_category_id: ids.inner_sub_category_id
      ? String(ids.inner_sub_category_id)
      : "",
    categoryTitle: ids.categoryTitle,
    subCategoryTitle: ids.subCategoryTitle,
    innerSubCategoryTitle: ids.innerSubCategoryTitle,
    colorGroups: color ? [{ color_name: color }] : [],
    hsn_code: row.hsn_code,
    gst: row.gst || 0,
    original_price: row.original_price,
    discounted_price: row.discounted_price,
    stock: row.stock,
    sku,
    files: row.files || [],
    mediaLabels: row.mediaLabels || [],
    extraNotes: bulkExtraNotes(row),
    visibility: "Hidden",
    listing_status: "draft",
    countryOfOrigin: "India",
    shortDescription: row.shortDescription || "",
    keyFeatures: row.keyFeatures || [],
    productDetails: row.productDetails || "",
    generalInfo: row.generalInfo || "",
    specifications: row.specifications || [],
    whatsInTheBox: row.whatsInTheBox || [],
    benefits: row.benefits || [],
    metaTitle: row.metaTitle || "",
    metaDescription: row.metaDescription || "",
    metaKeywords: row.metaKeywords || "",
    tags: row.tags || [],
    warrantyType: row.warrantyType || "Manufacturer",
    warrantyPeriod: row.warrantyPeriod || "As per brand policy",
    shipsFrom: row.shipsFrom || "India",
    shipsTo: row.shipsTo || "Pan India",
    deliveryTimeText: row.deliveryTimeText || "3–7 business days",
    shipping_charges: 0,
    free_shipping: false,
    platformFee: 0,
  };
}

/** Map merged Smart Listing state back onto a bulk grid row. */
export function applyAiMergeToRow(row, merged) {
  return {
    name: merged.name || polishBulkName(row),
    shortDescription: merged.shortDescription || "",
    keyFeatures: merged.keyFeatures || [],
    productDetails: merged.productDetails || "",
    generalInfo: merged.generalInfo || "",
    specifications: merged.specifications || [],
    whatsInTheBox: merged.whatsInTheBox || [],
    benefits: merged.benefits || [],
    metaTitle: merged.metaTitle || "",
    metaDescription: merged.metaDescription || "",
    metaKeywords: merged.metaKeywords || "",
    tags: merged.tags || [],
    warrantyType: merged.warrantyType || "",
    warrantyPeriod: merged.warrantyPeriod || "",
    shipsFrom: merged.shipsFrom || "",
    shipsTo: merged.shipsTo || "",
    deliveryTimeText: merged.deliveryTimeText || "",
    sku: merged.sku || row.sku,
    ai_done: true,
  };
}

export function downloadCsvTemplate() {
  const sample = [
    BULK_PASTE_HEADER,
    [
      "Cotton Round Neck T-Shirt",
      "Men",
      "Navy Blue",
      "Fashion",
      "Men",
      "T-Shirts",
      "61091000",
      "5",
      "999",
      "599",
      "25",
      "",
      "",
      "Yes",
    ].join("\t"),
  ].join("\n");
  const blob = new Blob([sample], { type: "text/tab-separated-values;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bulk-single-listing-template.tsv";
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadExcelTemplate() {
  const headers = BULK_GRID_COLUMNS.map((c) => c.label);
  const hints = BULK_GRID_COLUMNS.map(
    (c) => c.hint || (c.required ? "Required" : "Optional"),
  );
  const sample = [
    "Cotton Round Neck T-Shirt",
    "Men",
    "Navy Blue",
    "Fashion",
    "Men's Clothing",
    "T-Shirts",
    "61091000",
    "5",
    "999",
    "599",
    "25",
    "",
    "",
    "Yes",
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, hints, sample]);
  ws["!cols"] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  const guide = XLSX.utils.aoa_to_sheet([
    ["Quick bulk — how to use"],
    [""],
    ["1. Fill the Products sheet — one row per product (max 500)."],
    ["2. Category names must match your catalog exactly."],
    ["3. MRP and Selling price must be greater than 0; Selling ≤ MRP."],
    ["4. Stock must be a whole number ≥ 1."],
    ["5. Upload this file in Smart Bulk → then add front photos per row."],
    ["6. Gallery images (up to 5 each): Product → Media Manager first."],
    ["7. AI column: Yes / No — Yes fills descriptions & SEO automatically."],
  ]);
  XLSX.utils.book_append_sheet(wb, guide, "Instructions");
  XLSX.writeFile(wb, "bulk-single-listing-template.xlsx");
}

export function downloadFailedRows(rows, filename = "bulk-create-failed.csv") {
  if (!rows?.length) return;
  const keys = [...BULK_GRID_COLUMNS.map((c) => c.key), "error"];
  const esc = (v) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => esc(r[k] ?? r.errors?.[k] ?? r.error)).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const STORAGE_KEY = "ierada_bulk_grid_session";

export function saveBulkSession(rows, step) {
  try {
    const payload = rows.map((r) => ({
      ...r,
      files: [],
      mediaLabels: r.mediaLabels || [],
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: payload, step, at: Date.now() }));
  } catch {
    /* ignore quota */
  }
}

export function loadBulkSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.rows?.length) return null;
    return {
      step: parsed.step || "fill",
      rows: parsed.rows.map((r) => newBulkRow(r)),
    };
  } catch {
    return null;
  }
}

export function clearBulkSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function columnGroupClass(group) {
  if (group === "manual") return "bg-orange-50 text-orange-900";
  if (group === "lookup") return "bg-sky-50 text-sky-900";
  if (group === "toggle") return "bg-violet-50 text-violet-900";
  return "bg-slate-50 text-slate-700";
}
