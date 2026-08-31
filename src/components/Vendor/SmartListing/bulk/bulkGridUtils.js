import { suggestSku } from "../utils/settlementCalc";

export const BULK_GRID_COLUMNS = [
  { key: "name", label: "Product name", required: true },
  { key: "audience", label: "Audience", hint: "Men / Women / Kids" },
  { key: "color", label: "Color", hint: "Optional" },
  { key: "category", label: "Category", required: true },
  { key: "sub_category", label: "Sub category", required: true },
  { key: "inner_sub_category", label: "Inner sub", hint: "Optional" },
  { key: "hsn_code", label: "HSN", required: true },
  { key: "gst", label: "GST %" },
  { key: "original_price", label: "MRP ₹", required: true },
  { key: "discounted_price", label: "Selling ₹", required: true },
  { key: "stock", label: "Stock", required: true },
  { key: "sku", label: "SKU", hint: "Auto if empty" },
  { key: "brand", label: "Brand", hint: "Optional" },
];

export const BULK_PASTE_HEADER = BULK_GRID_COLUMNS.map((c) => c.key).join("\t");

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
    listingType: partial.listingType || "single",
    shortDescription: partial.shortDescription || "",
    keyFeatures: partial.keyFeatures || [],
    productDetails: partial.productDetails || "",
    specifications: partial.specifications || [],
    whatsInTheBox: partial.whatsInTheBox || [],
    benefits: partial.benefits || [],
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

  const first = splitLine(lines[0]).map((h) => h.toLowerCase());
  const headerKeys = BULK_GRID_COLUMNS.map((c) => c.key);
  const hasHeader = first.some((h) => headerKeys.includes(h));
  const start = hasHeader ? 1 : 0;

  return lines.slice(start).map((line) => {
    const parts = splitLine(line);
    const row = newBulkRow();
    if (hasHeader) {
      first.forEach((key, i) => {
        if (headerKeys.includes(key)) row[key] = parts[i] ?? "";
      });
    } else {
      headerKeys.forEach((key, i) => {
        row[key] = parts[i] ?? "";
      });
    }
    row.name = polishBulkName(row);
    if (!row.sku?.trim()) row.sku = suggestSku(row.name, row.brand);
    return row;
  });
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
  if (!polishBulkName(row)) errors.name = "Name required";
  if (!String(row.hsn_code || "").trim()) errors.hsn_code = "HSN required";
  if (!Number(row.discounted_price) || Number(row.discounted_price) <= 0) {
    errors.discounted_price = "Selling price required";
  }
  if (!Number(row.original_price) || Number(row.original_price) <= 0) {
    errors.original_price = "MRP required";
  }
  if (Number(row.discounted_price) > Number(row.original_price)) {
    errors.discounted_price = "Selling price cannot exceed MRP";
  }
  if (row.stock === "" || Number(row.stock) < 0) errors.stock = "Stock required";
  Object.assign(errors, resolveCategoryIds(row, taxonomy).errors);
  return errors;
}

export function rowToSmartListingState(row, taxonomy, vendorId) {
  const ids = resolveCategoryIds(row, taxonomy);
  const name = polishBulkName(row);
  const sku = row.sku?.trim() || suggestSku(name, row.brand);
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
    hsn_code: row.hsn_code,
    gst: row.gst || 0,
    original_price: row.original_price,
    discounted_price: row.discounted_price,
    stock: row.stock,
    sku,
    files: row.files || [],
    mediaLabels: row.mediaLabels || [],
    visibility: "Hidden",
    listing_status: "draft",
    countryOfOrigin: "India",
    shortDescription: row.shortDescription || "",
    keyFeatures: row.keyFeatures || [],
    productDetails: row.productDetails || "",
    specifications: row.specifications || [],
    whatsInTheBox: row.whatsInTheBox || [],
    benefits: row.benefits || [],
    shipping_charges: 0,
    free_shipping: false,
    platformFee: 0,
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
    ].join("\t"),
  ].join("\n");
  const blob = new Blob([sample], { type: "text/tab-separated-values;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bulk-listing-template.tsv";
  a.click();
  URL.revokeObjectURL(url);
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
