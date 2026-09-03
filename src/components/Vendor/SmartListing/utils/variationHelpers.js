"use strict";

/**
 * Cartesian helper for custom attrs (max 4).
 * attrs: [{ attribute_id, name, values: string[] }]
 */
export function cartesianCustomRows(attrs) {
  const active = (attrs || []).filter((a) => a.attribute_id && (a.values || []).length);
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
              attribute_id: Number(attr.attribute_id),
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

export function suggestVariantSku(baseSku, parts) {
  const base = String(baseSku || "SKU")
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 24);
  const suffix = (parts || [])
    .map((p) =>
      String(p || "")
        .replace(/\s+/g, "")
        .toUpperCase()
        .slice(0, 8),
    )
    .filter(Boolean)
    .join("-");
  return suffix ? `${base}-${suffix}` : base;
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
  return query;
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
      color_id: existing.color_id || existing.color?.id || "",
      color_name: existing.color_name || existing.color?.name || "",
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

/**
 * Auto-select category sizes into an empty Color × Size matrix.
 * Returns colorGroups, or null when listing type / existing size_ids block it.
 */
export function prefillColorGroupsFromCategorySizes(sizes, state, meta) {
  if (state?.listingType !== "color_size") return null;
  if (hasRealSizeRow(state.colorGroups)) return null;

  const split = splitContextualSizes(sizes, meta, state);
  let toUse = split.contextual;
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

/** Copy parent MRP/sell/stock onto size rows that still have those fields empty. */
export function applyParentDefaultsToEmptySizeRows(colorGroups, state) {
  const groups = colorGroups || [];
  let changed = false;
  const next = groups.map((g) => ({
    ...g,
    sizes: (g.sizes || []).map((s) => {
      if (!(s.size_id || s.size?.id)) return s;
      const row = { ...s };
      if (emptyPrice(row.original_price) && !emptyPrice(state.original_price)) {
        row.original_price = state.original_price;
        changed = true;
      }
      if (emptyPrice(row.discounted_price) && !emptyPrice(state.discounted_price)) {
        row.discounted_price = state.discounted_price;
        changed = true;
      }
      if (emptyPrice(row.stock) && !emptyPrice(state.stock)) {
        row.stock = state.stock;
        changed = true;
      }
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
