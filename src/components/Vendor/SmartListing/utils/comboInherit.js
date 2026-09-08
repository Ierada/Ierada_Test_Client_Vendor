/**
 * Inherit parent listing fields from combo component products
 * (category, HSN/GST, package, bundle MRP/sale, auto title).
 */
export function inheritComboParentFromItems(items = [], state = {}) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    return { stock: "0" };
  }

  const first = list[0] || {};
  const names = list.map((it) => String(it.name || "").trim()).filter(Boolean);
  const autoName =
    names.length === 0
      ? ""
      : names.length === 1
        ? `Combo: ${names[0]}`
        : `Combo: ${names.slice(0, 3).join(" + ")}${names.length > 3 ? "…" : ""}`;

  let mrp = 0;
  let sale = 0;
  let weight = 0;
  for (const it of list) {
    const qty = Math.max(1, Number(it.qty) || 1);
    mrp += (Number(it.original_price) || 0) * qty;
    sale += (Number(it.discounted_price) || 0) * qty;
    weight += (Number(it.package_weight) || 0) * qty;
  }
  // Keep MRP strictly above selling so listing validation does not fail on equal sums
  if (sale > 0 && mrp <= sale) {
    mrp = Math.round((sale + 1) * 100) / 100;
  }

  let minStock = Infinity;
  for (const it of list) {
    const child = Number(it.available_stock);
    const qty = Math.max(1, Number(it.qty) || 1);
    if (!Number.isFinite(child)) continue;
    minStock = Math.min(minStock, Math.floor(child / qty));
  }
  if (!Number.isFinite(minStock)) minStock = 0;

  const keepName =
    state.name &&
    !String(state.name).startsWith("Combo:") &&
    String(state.name).trim().length > 0;

  return {
    name: keepName ? state.name : autoName || state.name || "",
    category_id: first.category_id || state.category_id || "",
    sub_category_id: first.sub_category_id || state.sub_category_id || "",
    inner_sub_category_id:
      first.inner_sub_category_id || state.inner_sub_category_id || "",
    categoryTitle: first.categoryTitle || state.categoryTitle || "",
    subCategoryTitle: first.subCategoryTitle || state.subCategoryTitle || "",
    innerSubCategoryTitle:
      first.innerSubCategoryTitle || state.innerSubCategoryTitle || "",
    hsn_code: first.hsn_code || state.hsn_code || "",
    gst: first.gst != null && first.gst !== "" ? first.gst : state.gst || 0,
    original_price: mrp > 0 ? String(Math.round(mrp * 100) / 100) : state.original_price || "",
    discounted_price:
      sale > 0 ? String(Math.round(sale * 100) / 100) : state.discounted_price || "",
    stock: String(minStock),
    package_weight:
      weight > 0 ? String(weight) : state.package_weight || "100",
    package_length:
      first.package_length || state.package_length || "10",
    package_width: first.package_width || state.package_width || "10",
    package_height: first.package_height || state.package_height || "10",
    shortDescription:
      state.shortDescription ||
      (names.length
        ? `Combo pack including: ${names.join(", ")}.`
        : ""),
    metaTitle: state.metaTitle || (autoName || state.name || "").slice(0, 60),
    metaDescription:
      state.metaDescription ||
      (names.length
        ? `Buy combo: ${names.join(", ")}.`.slice(0, 155)
        : ""),
  };
}
