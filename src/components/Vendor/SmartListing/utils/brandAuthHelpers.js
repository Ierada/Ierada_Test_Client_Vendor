export const NEW_BRAND_AUTH_VALUE = "__new__";

export function normalizeBrandName(name) {
  return String(name || "").replace(/\s+/g, " ").trim();
}

export function brandNameKey(name) {
  return normalizeBrandName(name).toLowerCase();
}

export function safeBrandList(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      id: row?.id,
      name: normalizeBrandName(row?.name || row?.brand_name),
      expiry_date: row?.expiry_date || null,
      status: row?.status || "",
    }))
    .filter((row) => row.name);
}

export function findApprovedBrand(approvedBrands, name) {
  const key = brandNameKey(name);
  if (!key) return null;
  return safeBrandList(approvedBrands).find((row) => brandNameKey(row.name) === key) || null;
}

export function brandAuthSelectValue(state) {
  const brands = safeBrandList(state?.approvedBrands);
  if (state?.brandAuthMode === "new") return NEW_BRAND_AUTH_VALUE;
  if (findApprovedBrand(brands, state?.brand)) return normalizeBrandName(state.brand);
  if (brands.length && !normalizeBrandName(state?.brand)) return "";
  return brands.length ? NEW_BRAND_AUTH_VALUE : "";
}

export function isBrandAuthReadyToContinue(state) {
  if (state?.brandType !== "branded") return true;
  const brand = normalizeBrandName(state?.brand);
  if (!brand) return false;
  if (findApprovedBrand(state?.approvedBrands, brand)) return true;
  return !!(state?.brandAuthFile || state?.brandAuthDocName);
}

export function isBrandAuthApprovedForPublish(state) {
  if (state?.brandType !== "branded") return true;
  return !!findApprovedBrand(state?.approvedBrands, state?.brand);
}

/** This seller's listed product keeps its current brand. A different seller does not inherit it. */
export function isSameListedBrand(state, saved) {
  const live =
    String(state?.listing_status || "").toLowerCase() === "published" ||
    String(state?.visibility || "").toLowerCase() === "published";
  if (!live || !saved) return false;
  if (saved.vendor_id && state?.vendor_id && String(saved.vendor_id) !== String(state.vendor_id)) {
    return false;
  }
  if (String(saved.brandType || "").toLowerCase() !== "branded") return false;
  if (String(state?.brandType || "").toLowerCase() !== "branded") return false;
  const loaded = brandNameKey(saved.brand);
  const current = brandNameKey(state?.brand);
  return !!loaded && loaded === current;
}
