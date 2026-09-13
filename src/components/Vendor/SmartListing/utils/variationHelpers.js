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
  let candidate = tokens.length
    ? `${base}-${tokens.join("-")}`
    : `${base}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
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

const FREE_SIZE_NAME_RE = /Free Size|One Size|^OS$|Universal|Free size/i;

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

export function hasRealSizeRow(colorGroups) {
  return (colorGroups || []).some((g) =>
    (g.sizes || []).some((s) => s.size_id || s.size?.id),
  );
}

export function sizeQueryFromListing(state) {
  const query = {};
  if (state?.category_id) query.categoryId = state.category_id;
  if (state?.sub_category_id) query.subCategoryId = state.sub_category_id;
  if (state?.inner_sub_category_id) {
    query.innerSubCategoryId = state.inner_sub_category_id;
  }
  const sizeType = inferSizeTypeFromListing(state);
  if (sizeType && sizeType !== "general") query.type = sizeType;
  return query;
}

/** Best-effort size_type for catalog filter / quick-add from category labels. */
export function inferSizeTypeFromListing(state) {
  const blob = [
    state?.category_name,
    state?.category?.title,
    state?.category?.name,
    state?.sub_category_name,
    state?.subCategory?.title,
    state?.inner_sub_category_name,
    state?.innerSubCategory?.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/shoe|footwear|sneaker|boot|sandal|slipper|loafer/.test(blob)) {
    return "footwear";
  }
  if (
    /apparel|cloth|fashion|shirt|pant|dress|kurta|saree|t[\s-]?shirt|jeans|top|wear/.test(
      blob,
    )
  ) {
    return "clothing";
  }
  return "general";
}

function sizeMatchesLevel(s, field, nested, want) {
  return String(s?.[field] || s?.[nested]?.id || "") === want;
}

function sizesTiedToCategory(sizes, state) {
  const inner = String(state?.inner_sub_category_id || "");
  const sub = String(state?.sub_category_id || "");
  const cat = String(state?.category_id || "");
  const list = sizes || [];
  if (inner) {
    const hit = list.filter((s) =>
      sizeMatchesLevel(s, "inner_sub_cat_id", "innerSubCategory", inner),
    );
    if (hit.length) return hit;
  }
  if (sub) {
    const hit = list.filter((s) =>
      sizeMatchesLevel(s, "sub_cat_id", "subCategory", sub),
    );
    if (hit.length) return hit;
  }
  if (cat) {
    const hit = list.filter((s) => sizeMatchesLevel(s, "cat_id", "category", cat));
    if (hit.length) return hit;
  }
  return [];
}

/** Split /size/get payload: contextual (inner→sub→cat) vs the rest of the catalog. */
export function splitContextualSizes(apiData, meta, state = {}) {
  const list = Array.isArray(apiData) ? apiData : [];
  const totalAll = Number(meta?.totalAll);
  const totalContextual = Number(meta?.totalContextual);
  let all = list;
  let contextual = [];

  if (
    Number.isFinite(totalAll) &&
    totalAll >= 0 &&
    Number.isFinite(totalContextual) &&
    totalContextual > 0 &&
    list.length >= totalAll
  ) {
    all = list.slice(0, totalAll);
    contextual = uniqueSizesById(
      list.slice(totalAll, totalAll + totalContextual),
    );
  }

  const allUnique = uniqueSizesById(all.length ? all : list);
  if (!contextual.length) {
    contextual = sizesTiedToCategory(allUnique, state);
  }

  const ctxIds = new Set(contextual.map((s) => String(s.id)));
  const rest = allUnique.filter((s) => !ctxIds.has(String(s.id)));
  return {
    all: allUnique,
    contextual,
    rest,
    totalContextual: contextual.length,
  };
}

function findFreeSizeFallback(sizes) {
  return (sizes || []).find((s) =>
    FREE_SIZE_NAME_RE.test(String(s?.name || "").trim()),
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

export function prefillColorGroupsFromCategorySizes(sizes, state, meta) {
  if (state?.listingType !== "color_size") return null;
  if (hasRealSizeRow(state.colorGroups)) return null;

  const split = splitContextualSizes(sizes, meta, state);
  const selected = listingSizeIds(state);
  let toUse = split.contextual;
  if (selected.length) {
    const byId = new Map(split.all.map((s) => [String(s.id), s]));
    const picked = selected.map((id) => byId.get(id)).filter(Boolean);
    if (picked.length) toUse = picked;
  }
  if (!toUse.length) {
    const fallback = findFreeSizeFallback(split.all);
    if (fallback) toUse = [fallback];
    else return null;
  }
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

export function sizePickerOptions(split) {
  const contextual = split?.contextual || [];
  const rest = split?.rest || [];
  const ctxHint = contextual.length ? "This category" : undefined;
  const otherHint = contextual.length ? "Other" : undefined;
  return [
    ...contextual.map((z) => ({ id: z.id, label: z.name, hint: ctxHint })),
    ...rest.map((z) => ({ id: z.id, label: z.name, hint: otherHint })),
  ];
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
