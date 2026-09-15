"use strict";

/**
 * Cartesian helper for custom attrs.
 * attrs: [{ attribute_id, name, values: string[] }]
 */
export function cartesianCustomRows(attrs) {
  const active = (attrs || []).filter((a) => (a.attribute_id || a.name) && (a.values || []).length);
  if (!active.length) return [];
  let rows = [{}];
  for (const attr of active) {
    const next = [];
    for (const row of rows) {
      for (const value of attr.values) {
        next.push({
          ...row,
          attributes: [
            ...(row.attributes || []),
            {
              attribute_id: attr.attribute_id ? Number(attr.attribute_id) : null,
              attribute_name: attr.name || "",
              attribute_value: String(value).trim(),
            },
          ],
        });
      }
    }
    rows = next;
  }
  return rows.map((r, i) => ({
    ...r,
    grouping_key: String(i),
    stock: "",
    original_price: "",
    discounted_price: "",
    sku: "",
    barcode: "",
    media: [],
    enabled: true,
  }));
}

export function buildColorSizeRows(colorGroups) {
  const rows = [];
  (colorGroups || []).forEach((g, gi) => {
    const colorId = g.color_id || g.color?.id;
    if (!colorId) return;
    (g.sizes || []).forEach((s, si) => {
      const sizeId = s.size_id || s.size?.id;
      if (!sizeId) return;
      if (s.enabled === false || s.status === "out_of_stock") return;
      rows.push({
        color_id: Number(colorId),
        size_id: Number(sizeId),
        grouping_key: String(colorId),
        sequence: gi,
        size_sequence: si,
        stock: s.stock,
        original_price: s.original_price,
        discounted_price: s.discounted_price,
        sku: s.sku,
        barcode: s.barcode || null,
      });
    });
  });
  return rows;
}

function normalizeSkuBase(baseSku) {
  return (
    String(baseSku || "SKU")
      .replace(/\s+/g, "")
      .replace(/[^A-Z0-9-]/gi, "")
      .toUpperCase()
      .slice(0, 16) || "SKU"
  );
}

export function buildUniqueSku(baseSku, parts = [], taken = new Set()) {
  const base = normalizeSkuBase(baseSku);
  const tokens = (parts || []).map((p) => skuToken(p, 6)).filter(Boolean);
  const entropy = Math.random().toString(36).slice(2, 6).toUpperCase();
  let candidate = tokens.length
    ? `${base}-${tokens.join("-")}-${entropy}`
    : `${base}-${Date.now().toString(36).slice(-4).toUpperCase()}${entropy}`;
  if (!taken.has(candidate)) {
    taken.add(candidate);
    return candidate;
  }
  let n = 2;
  while (taken.has(`${candidate}-${n}`)) n += 1;
  const unique = `${candidate}-${n}`;
  taken.add(unique);
  return unique;
}

export function suggestVariantSku(baseSku, parts, taken = new Set()) {
  return buildUniqueSku(baseSku, parts, taken);
}

export const UNAVAILABLE_FOR_CATEGORY_HINT = "Not available for this category";
export const EMPTY_ATTRIBUTE_CATALOG_MESSAGE =
  "No Size or Colour values apply to this category yet. Add them in Admin → Attributes for this category.";

export function listingAttributeQuery(state) {
  const query = {};
  if (state?.category_id) {
    query.categoryId = state.category_id;
    query.cat_id = state.category_id;
  }
  if (state?.sub_category_id) {
    query.subCategoryId = state.sub_category_id;
    query.sub_cat_id = state.sub_category_id;
  }
  if (state?.inner_sub_category_id) {
    query.innerSubCategoryId = state.inner_sub_category_id;
    query.inner_sub_cat_id = state.inner_sub_category_id;
  }
  return query;
}

export function listingCategoryPathKey(state) {
  return [
    state?.category_id || "",
    state?.sub_category_id || "",
    state?.inner_sub_category_id || "",
  ].join("|");
}

export function uniqueSizesById(sizes) {
  const out = [];
  const seen = new Set();
  for (const s of sizes || []) {
    if (s?.id == null || s.id === "") continue;
    const key = String(s.id);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export function uniqueByNameKeepFirst(list, nameKey = "name") {
  const seen = new Set();
  const out = [];
  for (const row of list || []) {
    const key = String(row?.[nameKey] || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function uniqueByNamePreferIds(list, preferIds = [], nameKey = "name") {
  const prefer = new Set((preferIds || []).map(String).filter(Boolean));
  const sorted = [...(list || [])].sort((a, b) => {
    const ap = prefer.has(String(a.id)) ? 0 : 1;
    const bp = prefer.has(String(b.id)) ? 0 : 1;
    return ap - bp;
  });
  return uniqueByNameKeepFirst(sorted, nameKey);
}

function catalogAllowNames(attr) {
  const raw = attr?.values || attr?.option_values || [];
  return new Set(
    raw
      .map((v) => String(v?.value || v?.name || v || "").trim().toLowerCase())
      .filter(Boolean),
  );
}

export function catalogValueNames(attr) {
  return [...catalogAllowNames(attr)];
}

export function colorAndSizeFromCatalog(catalog = []) {
  const seen = new Set();
  const unique = [];
  for (const attr of catalog || []) {
    if (attr?.id == null || seen.has(attr.id)) continue;
    seen.add(attr.id);
    unique.push(attr);
  }
  return {
    colorAttr: unique.find((a) => /colou?r/i.test(a.name || "")),
    sizeAttr: unique.find((a) => /^sizes?$/i.test(a.name || "")),
  };
}

function markCatalogAvailability(list, allowNames, selectedIds) {
  const selected = new Set((selectedIds || []).map(String).filter(Boolean));
  return (list || []).map((row) => {
    const name = String(row?.name || "").trim().toLowerCase();
    const inCatalog = allowNames.has(name);
    const keptLegacy = selected.has(String(row?.id)) && !inCatalog;
    return {
      ...row,
      unavailableForCategory: keptLegacy,
    };
  });
}

export function filterMastersByCatalog({
  colors = [],
  sizes = [],
  catalog = [],
  selectedColorIds = [],
  selectedSizeIds = [],
}) {
  const { colorAttr, sizeAttr } = colorAndSizeFromCatalog(catalog);
  const colorAllow = catalogAllowNames(colorAttr);
  const sizeAllow = catalogAllowNames(sizeAttr);
  const selectedC = new Set((selectedColorIds || []).map(String).filter(Boolean));
  const selectedS = new Set((selectedSizeIds || []).map(String).filter(Boolean));
  const filteredColors = uniqueByNamePreferIds(
    markCatalogAvailability(
      (colors || []).filter((c) => {
        const id = String(c.id);
        const name = String(c.name || "").trim().toLowerCase();
        if (selectedC.has(id)) return true;
        return colorAllow.has(name);
      }),
      colorAllow,
      selectedColorIds,
    ),
    selectedColorIds,
  );
  const filteredSizes = uniqueByNamePreferIds(
    markCatalogAvailability(
      (sizes || []).filter((s) => {
        const id = String(s.id);
        const name = String(s.name || "").trim().toLowerCase();
        if (selectedS.has(id)) return true;
        return sizeAllow.has(name);
      }),
      sizeAllow,
      selectedSizeIds,
    ),
    selectedSizeIds,
  );
  const contextual = uniqueSizesById(
    filteredSizes.filter((s) => !s.unavailableForCategory),
  );
  const rest = uniqueSizesById(
    filteredSizes.filter((s) => s.unavailableForCategory),
  );
  return {
    colors: filteredColors,
    sizeSplit: {
      all: uniqueSizesById(filteredSizes),
      contextual,
      rest,
      totalContextual: contextual.length,
    },
    allowedColorIds: filteredColors
      .filter((c) => !c.unavailableForCategory)
      .map((c) => c.id),
    allowedSizeIds: contextual.map((s) => s.id),
    colorAttr,
    sizeAttr,
  };
}

export function hasRealSizeRow(colorGroups) {
  return (colorGroups || []).some((g) =>
    (g.sizes || []).some((s) => s.size_id || s.size?.id),
  );
}

function emptyPrice(val) {
  return val === "" || val == null;
}

function buildPrefillColorGroups(sizeList, state) {
  const existing = (state.colorGroups && state.colorGroups[0]) || {};
  const defaults = {
    original_price: state.original_price ?? "",
    discounted_price: state.discounted_price ?? "",
    stock: state.stock ?? "",
  };
  return [
    {
      color_id: existing.color_id || existing.color?.id || state.color_id || "",
      color_name: existing.color_name || existing.color?.name || state.color_name || "",
      media: existing.media || [],
      existingMedia: existing.existingMedia || [],
      sizes: sizeList.map((z) => ({
        size_id: z.id,
        size: { id: z.id, name: z.name },
        stock: defaults.stock,
        original_price: defaults.original_price,
        discounted_price: defaults.discounted_price,
        sku: "",
        barcode: "",
      })),
    },
  ];
}

export function listingSizeIds(state) {
  const fromList = Array.isArray(state?.size_ids) ? state.size_ids : [];
  if (fromList.length) return fromList.map((id) => String(id)).filter(Boolean);
  if (state?.size_id) return [String(state.size_id)];
  return [];
}

/** Keep / seed Color × Size rows from the sizes picked under MRP. */
export function applySelectedSizeIdsToColorGroups(colorGroups, sizeIds, state = {}) {
  const ids = (sizeIds || []).map((id) => String(id)).filter(Boolean);
  if (!ids.length) return colorGroups;
  const defaults = {
    original_price: state.original_price ?? "",
    discounted_price: state.discounted_price ?? "",
    stock: state.stock ?? "",
  };
  const groups =
    colorGroups?.length
      ? colorGroups
      : [
          {
            color_id: state.color_id || "",
            color_name: state.color_name || "",
            media: [],
            existingMedia: [],
            sizes: [],
          },
        ];
  return groups.map((g) => {
    const byId = new Map(
      (g.sizes || []).map((s) => [String(s.size_id || s.size?.id || ""), s]),
    );
    return {
      ...g,
      sizes: ids.map((id) => {
        const existing = byId.get(id);
        if (existing) return existing;
        return {
          size_id: id,
          stock: defaults.stock,
          original_price: defaults.original_price,
          discounted_price: defaults.discounted_price,
          sku: "",
          barcode: "",
        };
      }),
    };
  });
}

export function prefillColorGroupsFromCategorySizes(sizes, state) {
  if (state?.listingType !== "color_size") return null;
  if (hasRealSizeRow(state.colorGroups)) return null;

  const list = uniqueSizesById(sizes).filter((s) => !s.unavailableForCategory);
  const selected = listingSizeIds(state);
  let toUse = list;
  if (selected.length) {
    const byId = new Map(list.map((s) => [String(s.id), s]));
    const picked = selected.map((id) => byId.get(String(id))).filter(Boolean);
    if (picked.length) toUse = picked;
  }
  if (!toUse.length) return null;
  return buildPrefillColorGroups(toUse, state);
}

/** Map AI size names (S, M, Free Size) onto catalog IDs. Empty matrix only. */
export function prefillColorGroupsFromSuggestedNames(names, sizes, state) {
  if (state?.listingType !== "color_size") return null;
  if (hasRealSizeRow(state.colorGroups)) return null;
  const byName = new Map(
    uniqueSizesById(sizes).map((s) => [
      String(s.name || "").trim().toLowerCase(),
      s,
    ]),
  );
  const matched = [];
  const seen = new Set();
  for (const n of names || []) {
    const key = String(n || "").trim().toLowerCase();
    if (!key) continue;
    const hit = byName.get(key);
    if (hit && !seen.has(String(hit.id))) {
      seen.add(String(hit.id));
      matched.push(hit);
    }
  }
  if (!matched.length) return null;
  return buildPrefillColorGroups(matched, state);
}

/**
 * A row still carries the parent default when it is empty or still holds the
 * previous default. Typing "1000" fires once per keystroke, so rows must keep
 * following the parent instead of freezing on the first character.
 */
function stillOnParentDefault(rowValue, previousValue) {
  if (emptyPrice(rowValue)) return true;
  if (emptyPrice(previousValue)) return false;
  return String(rowValue) === String(previousValue);
}

/** Copy parent MRP/sell/stock onto size rows that still carry the parent default. */
export function applyParentDefaultsToEmptySizeRows(colorGroups, state, previous = {}) {
  const groups = colorGroups || [];
  let changed = false;
  const apply = (row, key) => {
    const value = state[key];
    if (emptyPrice(value)) return;
    if (String(row[key] ?? "") === String(value)) return;
    if (!stillOnParentDefault(row[key], previous[key])) return;
    row[key] = value;
    changed = true;
  };
  const next = groups.map((g) => ({
    ...g,
    sizes: (g.sizes || []).map((s) => {
      if (!(s.size_id || s.size?.id)) return s;
      const row = { ...s };
      apply(row, "original_price");
      apply(row, "discounted_price");
      apply(row, "stock");
      return row;
    }),
  }));
  return changed ? next : null;
}

export function sizePickerOptions(split, keepIds = []) {
  const contextual = split?.contextual || [];
  const rest = split?.rest || [];
  const keep = new Set((keepIds || []).map(String).filter(Boolean));
  const byId = new Map([...contextual, ...rest].map((z) => [String(z.id), z]));
  const ctxIds = new Set(contextual.map((z) => String(z.id)));
  const usedName = new Set();
  const out = [];
  const push = (z, unavailable) => {
    if (!z) return;
    const nameKey = String(z.name || "").trim().toLowerCase();
    out.push({
      id: z.id,
      label: z.name,
      hint: unavailable ? UNAVAILABLE_FOR_CATEGORY_HINT : undefined,
      unavailable: Boolean(unavailable),
    });
    if (nameKey) usedName.add(nameKey);
  };
  for (const id of keep) {
    const z = byId.get(String(id));
    if (!z) continue;
    push(z, !ctxIds.has(String(id)));
  }
  for (const z of contextual) {
    if (keep.has(String(z.id))) continue;
    const nameKey = String(z.name || "").trim().toLowerCase();
    if (!nameKey || usedName.has(nameKey)) continue;
    usedName.add(nameKey);
    out.push({ id: z.id, label: z.name });
  }
  return out;
}

export function colorPickerOptions(colors = []) {
  return (colors || []).map((c) => ({
    id: c.id,
    label: c.name,
    hint: c.unavailableForCategory ? UNAVAILABLE_FOR_CATEGORY_HINT : undefined,
    unavailable: Boolean(c.unavailableForCategory),
  }));
}

export function pruneColorSizeStateToAllowed(state, allowedColorIds, allowedSizeIds) {
  const allowC = new Set((allowedColorIds || []).map(String).filter(Boolean));
  const allowS = new Set((allowedSizeIds || []).map(String).filter(Boolean));
  const dropped = [];

  const prevSizeIds = listingSizeIds(state);
  const nextSizeIds = prevSizeIds.filter((id) => allowS.has(String(id)));
  prevSizeIds
    .filter((id) => !allowS.has(String(id)))
    .forEach(() => dropped.push("size"));

  const prevColorIds = [
    ...selectedVariationColorIds(state),
    state?.color_id ? String(state.color_id) : "",
  ].filter(Boolean);
  const uniquePrevColors = [...new Set(prevColorIds.map(String))];
  const nextColorIds = uniquePrevColors.filter((id) => allowC.has(String(id)));
  uniquePrevColors
    .filter((id) => !allowC.has(String(id)))
    .forEach(() => dropped.push("colour"));

  let colorGroups = state?.colorGroups;
  if (Array.isArray(colorGroups) && colorGroups.length) {
    colorGroups = colorGroups
      .map((g) => {
        const cid = String(g.color_id || g.color?.id || "");
        if (cid && !allowC.has(cid)) {
          dropped.push(g.color_name || g.color?.name || "colour");
          return null;
        }
        const sizes = (g.sizes || []).filter((s) => {
          const sid = String(s.size_id || s.size?.id || "");
          if (!sid) return true;
          if (!allowS.has(sid)) {
            dropped.push("size");
            return false;
          }
          return true;
        });
        return { ...g, sizes };
      })
      .filter(Boolean);
  }

  let availability = state?.colorSizeAvailability;
  if (availability && typeof availability === "object") {
    const next = {};
    Object.entries(availability).forEach(([cid, ids]) => {
      if (!allowC.has(String(cid))) return;
      next[cid] = (ids || []).filter((id) => allowS.has(String(id)));
    });
    availability = next;
  }

  if (!dropped.length) return null;

  const remainingName =
    (colorGroups || []).find((g) => g.color_name)?.color_name ||
    state?.color_name ||
    "";

  return {
    dropped,
    patch: {
      size_ids: nextSizeIds,
      size_id: nextSizeIds[0] || "",
      color_ids: nextColorIds,
      color_id: nextColorIds[0] || "",
      color_name: nextColorIds.length ? remainingName : "",
      ...(Array.isArray(colorGroups) ? { colorGroups } : {}),
      ...(availability && typeof availability === "object"
        ? { colorSizeAvailability: availability }
        : {}),
    },
  };
}

export function catalogValuesForAttr(attr, catalog) {
  const found =
    (catalog || []).find((c) => String(c.id) === String(attr?.attribute_id)) ||
    (catalog || []).find(
      (c) =>
        String(c.name || "").toLowerCase() ===
        String(attr?.name || "").toLowerCase(),
    );
  const raw = found?.option_values || (found?.values || []).map((v) => v.value || v.name);
  const seen = new Set();
  const out = [];
  for (const item of raw || []) {
    const name = String(item || "").trim();
    const key = name.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function pruneCustomAttrsToCatalog(attrs, catalog, { dropInvalid = false } = {}) {
  const dropped = [];
  const next = (attrs || []).map((attr) => {
    const found =
      (catalog || []).find((c) => String(c.id) === String(attr?.attribute_id)) ||
      (catalog || []).find(
        (c) =>
          String(c.name || "").toLowerCase() ===
          String(attr?.name || "").toLowerCase(),
      );
    const current = customAttrValues(attr);
    if (!found) {
      if (!dropInvalid) return attr;
      if (current.length) dropped.push(...current);
      return { ...attr, attribute_id: "", name: "", values: [], valuesText: "" };
    }
    const allowed = new Set(catalogValuesForAttr(attr, catalog).map((v) => v.toLowerCase()));
    const values = current.filter((v) => allowed.has(v.toLowerCase()));
    const lost = current.filter((v) => !allowed.has(v.toLowerCase()));
    if (!dropInvalid) return attr;
    lost.forEach((v) => dropped.push(v));
    return { ...attr, values, valuesText: values.join(", ") };
  });
  return { attrs: next, dropped };
}

const COLOR_SKU_SHORT = {
  black: "BLK",
  white: "WHT",
  blue: "BLU",
  navy: "NVY",
  olive: "OLV",
  green: "GRN",
  red: "RED",
  pink: "PNK",
  grey: "GRY",
  gray: "GRY",
  yellow: "YLW",
  beige: "BGE",
  brown: "BRN",
  orange: "ORG",
  purple: "PPL",
  maroon: "MRN",
};

function skuToken(name, max = 3) {
  const raw = String(name || "").trim();
  const mapped = COLOR_SKU_SHORT[raw.toLowerCase()];
  if (mapped) return mapped;
  const compact = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!compact) return "";
  if (compact.length <= max) return compact;
  return compact.slice(0, max);
}

export function suggestColorSizeSku(baseSku, colorName, sizeName, taken = new Set()) {
  return buildUniqueSku(baseSku, [colorName, sizeName], taken);
}

function groupColorId(g) {
  return g?.color_id || g?.color?.id || "";
}

function rowSizeId(s) {
  return s?.size_id || s?.size?.id || "";
}

function rowEnabled(s) {
  return s?.enabled !== false && s?.status !== "out_of_stock";
}

export function sizeIdsFromColorGroups(colorGroups) {
  const ids = [];
  const seen = new Set();
  for (const g of colorGroups || []) {
    for (const s of g.sizes || []) {
      const id = String(rowSizeId(s));
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/** Color×size image bucket key, aligned with Variant Images by Color order. */
export function colorSizeMediaKey(colorId, sizeId) {
  return `${String(colorId)}:${String(sizeId)}`;
}

export function parseColorSizeMediaKey(key) {
  const raw = String(key || "");
  const sep = raw.indexOf(":");
  if (sep <= 0) return { colorId: "", sizeId: raw };
  return { colorId: raw.slice(0, sep), sizeId: raw.slice(sep + 1) };
}

export function availableSizeIdsForColor(colorId, sizeIds, availability) {
  const ids = (sizeIds || []).map(String).filter(Boolean);
  const key = String(colorId || "");
  if (!key) return [];
  const picked = availability?.[key];
  if (!Array.isArray(picked)) return [];
  if (!picked.length) return [];
  const allow = new Set(picked.map(String));
  const listed = ids.filter((id) => allow.has(id));
  return listed.length ? listed : picked.map(String).filter(Boolean);
}

export function unionSizeIdsFromAvailability(availability, colorIds = []) {
  const ids = [];
  const seen = new Set();
  const keys = (colorIds || []).length
    ? colorIds.map(String)
    : Object.keys(availability || {});
  for (const key of keys) {
    for (const id of availability?.[String(key)] || []) {
      const sid = String(id || "");
      if (!sid || seen.has(sid)) continue;
      seen.add(sid);
      ids.push(sid);
    }
  }
  return ids;
}

/**
 * Category Size picker is the default for the first color.
 * Later colors stay empty until sizes are added on the variations step.
 * A color that already has a list keeps it, including an empty one the seller
 * cleared on the variations step.
 */
export function seedFirstColorSizesFromListing(availability, colorIds, sizeIds) {
  const first = String(colorIds?.[0] || "");
  const sizes = (sizeIds || []).map(String).filter(Boolean);
  if (!first || !sizes.length) return availability || {};
  if (Array.isArray(availability?.[first])) return availability || {};
  return { ...(availability || {}), [first]: [...sizes] };
}

/**
 * Category Size picker is the master size list. The first color mirrors it and
 * every other color drops sizes that are no longer listed, so a stale pick can
 * never leak back into the Size field as an extra size.
 */
export function applyListingSizeIdsToAvailability(availability, colorIds, sizeIds) {
  const ids = (sizeIds || []).map(String).filter(Boolean);
  const first = String(colorIds?.[0] || "");
  const allow = new Set(ids);
  const next = {};
  let changed = false;
  for (const [key, value] of Object.entries(availability || {})) {
    const listed = (Array.isArray(value) ? value : []).map(String).filter(Boolean);
    const kept = listed.filter((id) => allow.has(id));
    next[key] = kept;
    if (kept.length !== listed.length) changed = true;
  }
  if (first && ids.length) {
    const current = next[first] || [];
    if (current.length !== ids.length || ids.some((id, i) => current[i] !== id)) {
      next[first] = [...ids];
      changed = true;
    }
  }
  return changed ? next : availability || {};
}

/** New colors start with no sizes — each color gets sizes only when they are added for that color. */
export function withDefaultColorAvailability(availability, colorIds, _sizeIds) {
  const next = { ...(availability || {}) };
  let changed = false;
  for (const colorId of colorIds || []) {
    const key = String(colorId);
    if (!key) continue;
    if (!Array.isArray(next[key])) {
      next[key] = [];
      changed = true;
    }
  }
  return changed ? next : availability || {};
}

export function toggleColorSizeAvailability(availability, colorId, sizeId, sizeIds) {
  const current = availableSizeIdsForColor(colorId, sizeIds, availability);
  const sid = String(sizeId);
  const next = current.includes(sid) ? current.filter((id) => id !== sid) : [...current, sid];
  return {
    ...(availability || {}),
    [String(colorId)]: next,
  };
}

export function sizeMediaGroupingKey(key) {
  const raw = String(key || "");
  if (!raw) return "";
  if (raw.includes(":")) {
    const { colorId, sizeId } = parseColorSizeMediaKey(raw);
    if (colorId && sizeId) return `size:${colorId}:${sizeId}`;
  }
  return `sizes:${raw}`;
}

/** Persist prefilled matrix sizes onto the category Size picker. */
export function listingPatchFromPrefillGroups(groups, state = {}) {
  if (!groups) return {};
  const existing = listingSizeIds(state);
  const size_ids = existing.length ? existing : sizeIdsFromColorGroups(groups);
  const fromGroups = (groups || [])
    .map((g) => String(g?.color_id || g?.color?.id || ""))
    .filter(Boolean);
  const color_ids = fromGroups.length
    ? [...new Set(fromGroups)]
    : selectedVariationColorIds({ ...state, colorGroups: groups });
  return {
    colorGroups: groups,
    size_ids,
    size_id: size_ids[0] || state.size_id || "",
    color_ids,
    color_id: color_ids[0] || state.color_id || "",
  };
}

export function selectedVariationColorIds(state) {
  const fromList = Array.isArray(state?.color_ids)
    ? state.color_ids.map((id) => String(id || "")).filter(Boolean)
    : [];
  if (fromList.length) return [...new Set(fromList)];
  const ids = [];
  if (state?.color_id) ids.push(String(state.color_id));
  for (const g of state?.colorGroups || []) {
    const id = groupColorId(g);
    if (id) ids.push(String(id));
  }
  return [...new Set(ids.filter(Boolean).map(String))];
}

export function selectedVariationSizeIds(state) {
  const fromList = listingSizeIds(state);
  if (fromList.length) return fromList;
  const fromGroups = [];
  const seen = new Set();
  for (const g of state?.colorGroups || []) {
    for (const s of g.sizes || []) {
      const id = String(rowSizeId(s));
      if (!id || seen.has(id)) continue;
      seen.add(id);
      fromGroups.push(id);
    }
  }
  return fromGroups;
}

/**
 * Cartesian Color × Size into colorGroups, keeping existing media / row values.
 */
export function generateColorSizeCombinations({
  colorIds = [],
  sizeIds = [],
  sizesByColor = {},
  existingGroups = [],
  colors = [],
  sizes = [],
  defaults = {},
  baseSku = "SKU",
} = {}) {
  const idsC = colorIds.map((id) => String(id)).filter(Boolean);
  const idsS = sizeIds.map((id) => String(id)).filter(Boolean);
  if (!idsC.length) return [];

  const byColor = new Map(
    (existingGroups || [])
      .filter((g) => groupColorId(g))
      .map((g) => [String(groupColorId(g)), g]),
  );
  const colorById = new Map((colors || []).map((c) => [String(c.id), c]));
  const sizeById = new Map((sizes || []).map((z) => [String(z.id), z]));

  const colorless = (existingGroups || []).find((g) => !groupColorId(g));
  const taken = new Set();

  return idsC.map((colorId, colorIndex) => {
    const prev = byColor.get(colorId) || (colorIndex === 0 ? colorless : null) || {};
    const color = colorById.get(colorId);
    const colorName = color?.name || prev.color_name || prev.color?.name || "";
    const prevBySize = new Map(
      (prev.sizes || [])
        .filter((s) => rowSizeId(s))
        .map((s) => [String(rowSizeId(s)), s]),
    );
    const sizeList = (
      sizesByColor?.[colorId] ||
      sizesByColor?.[String(colorId)] ||
      idsS
    )
      .map(String)
      .filter(Boolean);
    return {
      color_id: colorId,
      color_name: colorName,
      color_code: color?.code || prev.color_code || prev.color?.code || "",
      media: prev.media || [],
      existingMedia: prev.existingMedia || [],
      usesPrimaryCoverDefault: !!prev.usesPrimaryCoverDefault,
      primaryCoverFingerprint: prev.primaryCoverFingerprint || "",
      sizes: sizeList.map((sizeId) => {
        const existing = prevBySize.get(sizeId);
        const size = sizeById.get(sizeId);
        const sizeName = size?.name || existing?.size?.name || "";
        const keep = String(existing?.sku || "").trim();
        const sku =
          keep && !taken.has(keep)
            ? (taken.add(keep), keep)
            : suggestColorSizeSku(baseSku, colorName, sizeName || sizeId, taken);
        if (existing) {
          return {
            ...existing,
            size_id: sizeId,
            size: { id: sizeId, name: sizeName },
            sku,
            status: existing.status || (rowEnabled(existing) ? "in_stock" : "out_of_stock"),
          };
        }
        return {
          size_id: sizeId,
          size: { id: sizeId, name: sizeName },
          stock: defaults.stock ?? "",
          original_price: defaults.original_price ?? "",
          discounted_price: defaults.discounted_price ?? "",
          sku,
          barcode: "",
          status: "in_stock",
          enabled: true,
        };
      }),
    };
  });
}

export function flattenColorSizeVariants(colorGroups = []) {
  const rows = [];
  (colorGroups || []).forEach((g, gi) => {
    (g.sizes || []).forEach((s, si) => {
      if (!rowSizeId(s)) return;
      rows.push({ gi, si, group: g, size: s });
    });
  });
  return rows;
}

export function combinationSignature(colorGroups = []) {
  return (colorGroups || [])
    .map((g) => {
      const cid = String(groupColorId(g) || "");
      const name = String(g.color_name || g.color?.name || "");
      const sizes = (g.sizes || [])
        .map((s) => `${rowSizeId(s) || ""}:${String(s.sku || "")}`)
        .join(",");
      return `${cid}:${name}:${sizes}`;
    })
    .join("|");
}

/**
 * Reorder flattened variant rows. Same-color drags move sizes;
 * cross-color drags move the whole color group.
 */
export function reorderFlattenedVariants(colorGroups, fromIndex, toIndex) {
  const groups = colorGroups || [];
  const rows = flattenColorSizeVariants(groups);
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= rows.length ||
    toIndex >= rows.length
  ) {
    return groups;
  }
  const from = rows[fromIndex];
  const to = rows[toIndex];
  if (from.gi === to.gi) {
    return groups.map((g, i) => {
      if (i !== from.gi) return g;
      const sizes = [...(g.sizes || [])];
      const [moved] = sizes.splice(from.si, 1);
      if (!moved) return g;
      sizes.splice(to.si, 0, moved);
      return { ...g, sizes };
    });
  }
  const next = [...groups];
  const [movedGroup] = next.splice(from.gi, 1);
  if (!movedGroup) return groups;
  next.splice(to.gi, 0, movedGroup);
  return next;
}

export function patchColorGroupSize(colorGroups, gi, si, partial) {
  return (colorGroups || []).map((g, i) => {
    if (i !== gi) return g;
    return {
      ...g,
      sizes: (g.sizes || []).map((s, j) => (j === si ? { ...s, ...partial } : s)),
    };
  });
}

export function variationListingStats(state, calcYouEarn) {
  const rows = flattenColorSizeVariants(state?.colorGroups).filter((r) => rowEnabled(r.size));
  const sells = rows
    .map((r) => Number(r.size.discounted_price))
    .filter((n) => Number.isFinite(n) && n > 0);
  const mrps = rows
    .map((r) => Number(r.size.original_price))
    .filter((n) => Number.isFinite(n) && n > 0);
  const stocks = rows
    .map((r) => Number(r.size.stock))
    .filter((n) => Number.isFinite(n) && n >= 0);
  const colorIds = new Set(
    (state?.colorGroups || []).map((g) => String(groupColorId(g) || "")).filter(Boolean),
  );
  const sizeIds = new Set(
    rows.map((r) => String(rowSizeId(r.size))).filter(Boolean),
  );
  const totalStock = stocks.reduce((a, b) => a + b, 0);
  let youEarnTotal = 0;
  if (typeof calcYouEarn === "function") {
    for (const r of rows) {
      const unit = Number(calcYouEarn(r.size)) || 0;
      const qty = Number(r.size.stock);
      youEarnTotal += unit * (Number.isFinite(qty) && qty > 0 ? qty : 0);
    }
  }
  return {
    colorCount: colorIds.size,
    sizeCount: sizeIds.size,
    variantCount: rows.length,
    totalStock,
    baseMrp: mrps.length ? Math.max(...mrps) : Number(state?.original_price) || 0,
    minSell: sells.length ? Math.min(...sells) : Number(state?.discounted_price) || 0,
    maxSell: sells.length ? Math.max(...sells) : Number(state?.discounted_price) || 0,
    youEarnTotal: Math.round(youEarnTotal * 100) / 100,
    generated: rows.length > 0,
  };
}

export function customAttrValues(attr) {
  if (Array.isArray(attr?.values) && attr.values.length) {
    return attr.values.map((v) => String(v || "").trim()).filter(Boolean);
  }
  return String(attr?.valuesText || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function customRowKey(row) {
  return (row?.attributes || [])
    .map((a) => `${a.attribute_name || ""}:${a.attribute_value || ""}`)
    .join("|");
}

export function customValueMediaKey(attrName, value) {
  return `${String(attrName || "").trim()}::${String(value || "").trim()}`;
}

export function deriveCustomAttrsFromRows(rows) {
  const map = new Map();
  for (const row of rows || []) {
    for (const a of row.attributes || []) {
      const name = String(a.attribute_name || "").trim();
      const id = a.attribute_id || "";
      const key = String(id || name);
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          attribute_id: id || "",
          name,
          values: [],
          valuesText: "",
        });
      }
      const bucket = map.get(key);
      const val = String(a.attribute_value || "").trim();
      if (val && !bucket.values.some((v) => v.toLowerCase() === val.toLowerCase())) {
        bucket.values.push(val);
      }
    }
  }
  return [...map.values()].map((a) => ({
    ...a,
    valuesText: a.values.join(", "),
  }));
}

export function customListingStats(state, calcYouEarn) {
  const rows = (state?.customRows || []).filter((r) => r.enabled !== false && r.attributes?.length);
  const sells = rows
    .map((r) => Number(r.discounted_price))
    .filter((n) => Number.isFinite(n) && n > 0);
  const mrps = rows
    .map((r) => Number(r.original_price))
    .filter((n) => Number.isFinite(n) && n > 0);
  const stocks = rows
    .map((r) => Number(r.stock))
    .filter((n) => Number.isFinite(n) && n >= 0);
  const totalStock = stocks.reduce((a, b) => a + b, 0);
  let youEarnTotal = 0;
  if (typeof calcYouEarn === "function") {
    for (const r of rows) {
      const unit = Number(calcYouEarn(r)) || 0;
      const qty = Number(r.stock);
      youEarnTotal += unit * (Number.isFinite(qty) && qty > 0 ? qty : 0);
    }
  }
  return {
    variantCount: rows.length,
    totalStock,
    baseMrp: mrps.length ? Math.max(...mrps) : Number(state?.original_price) || 0,
    minSell: sells.length ? Math.min(...sells) : Number(state?.discounted_price) || 0,
    maxSell: sells.length ? Math.max(...sells) : Number(state?.discounted_price) || 0,
    youEarnTotal: Math.round(youEarnTotal * 100) / 100,
    generated: rows.length > 0,
  };
}
