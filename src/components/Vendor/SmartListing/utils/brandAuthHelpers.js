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
  if (findApprovedBrand(state?.approvedBrands, state?.brand)) return true;
  return !!state?.brandAuthApproved && !!normalizeBrandName(state?.brand);
}
