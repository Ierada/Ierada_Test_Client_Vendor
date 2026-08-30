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
    if (!g.color_id) return;
    (g.sizes || []).forEach((s, si) => {
      if (!s.size_id) return;
      rows.push({
        color_id: Number(g.color_id),
        size_id: Number(s.size_id),
        grouping_key: String(g.color_id),
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
