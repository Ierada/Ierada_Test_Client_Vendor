import React, { useMemo, useState } from "react";
import { CheckSquare, Plus, Search, Square, Trash2, X } from "lucide-react";
import { getProductById, getProductsByVendorId } from "../../../services/api.product";
import {
  notifyOnFail,
  notifyOnSuccess,
  notifyOnWarning,
} from "../../../utils/notification/toast";
import { inheritComboParentFromItems } from "./utils/comboInherit";

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100/30";

function isListedProduct(p) {
  return (
    String(p?.visibility || "").toLowerCase() === "published" &&
    String(p?.listing_status || "").toLowerCase() === "published"
  );
}

function parseSearchTerms(raw) {
  const text = String(raw || "").trim();
  if (!text) return [];
  if (text.includes(",")) {
    return [
      ...new Set(
        text
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    ];
  }
  return [text];
}

function productListFromResponse(res) {
  if (Array.isArray(res?.data?.products)) return res.data.products;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function thumbOf(p) {
  return (
    (p?.media || [])[0]?.url ||
    p?.image ||
    (p?.ProductImages || [])[0]?.file ||
    ""
  );
}

function stockOf(p) {
  const variations = p?.variations || [];
  if (variations.length > 0) {
    return variations.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  }
  return Number(p?.stock) || 0;
}

function displayProductId(p) {
  return p?.custom_id || p?.sku || (p?.id != null ? String(p.id) : "—");
}

function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `₹${Math.round(v * 100) / 100}`;
}

function patchComboItems(patch, state, next) {
  patch({
    comboItems: next,
    ...inheritComboParentFromItems(next, state),
  });
}

function toComboLine(product) {
  const variations = product.variations || [];
  const stock = stockOf(product);
  return {
    combo_product_id: product.id,
    custom_id: product.custom_id || "",
    name: product.name,
    sku: product.sku || "",
    thumb: thumbOf(product),
    original_price: product.original_price || "",
    discounted_price: product.discounted_price || "",
    category_id: product.category_id || "",
    sub_category_id: product.sub_category_id || "",
    inner_sub_category_id: product.inner_sub_category_id || "",
    categoryTitle: product.Category?.title || product.category?.title || "",
    subCategoryTitle:
      product.SubCategory?.title || product.sub_category?.title || "",
    innerSubCategoryTitle:
      product.InnerSubCategory?.title ||
      product.inner_sub_category?.title ||
      "",
    hsn_code: product.hsn_code || "",
    gst: product.gst ?? "",
    package_weight: product.package_weight || "",
    package_length: product.package_length || "",
    package_width: product.package_width || "",
    package_height: product.package_height || "",
    variation_id: "",
    variations,
    qty: 1,
    available_stock: stock,
    discount_percentage: null,
  };
}

export default function ComboBuilder({ state, patch, vendorId }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState([]);
  const [selectedHitIds, setSelectedHitIds] = useState(() => new Set());
  const [searched, setSearched] = useState(false);
  const [lastTerms, setLastTerms] = useState([]);
  const [missingTerms, setMissingTerms] = useState([]);
  const [busy, setBusy] = useState(false);
  const [addingBusy, setAddingBusy] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const items = state.comboItems || [];
  const parentId = state.productId || state.id || null;
  const addedIds = useMemo(
    () => new Set(items.map((it) => String(it.combo_product_id))),
    [items],
  );

  const stockMin = useMemo(() => {
    if (!items.length) return 0;
    let min = Infinity;
    for (const it of items) {
      const child = Number(it.available_stock);
      const qty = Math.max(1, Number(it.qty) || 1);
      if (!Number.isFinite(child)) continue;
      min = Math.min(min, Math.floor(child / qty));
    }
    return Number.isFinite(min) ? min : 0;
  }, [items]);

  const selectableHits = useMemo(
    () => hits.filter((p) => !addedIds.has(String(p.id))),
    [hits, addedIds],
  );

  const filterEligible = (list) =>
    (list || []).filter((p) => {
      if (!isListedProduct(p)) return false;
      if (String(p.listing_type || "").toLowerCase() === "combo") return false;
      if (parentId && String(p.id) === String(parentId)) return false;
      return true;
    });

  const searchOneTerm = async (term) => {
    const res = await getProductsByVendorId(vendorId, {
      search: term,
      limit: 30,
      visibility: "Published",
      listing_status: "published",
    });
    if (!res || res.status === 0) return [];
    return filterEligible(productListFromResponse(res));
  };

  const termMatchedProduct = (term, product) => {
    const t = String(term || "").trim().toLowerCase();
    if (!t || !product) return false;
    const fields = [
      product.custom_id,
      product.sku,
      product.barcode,
      product.id,
      product.name,
    ]
      .filter((v) => v != null && v !== "")
      .map((v) => String(v).toLowerCase());
    return fields.some((f) => f === t || f.includes(t));
  };

  const runSearch = async () => {
    const terms = parseSearchTerms(q);
    if (!terms.length) {
      notifyOnFail("Enter product name, ID, or SKU (comma-separated for many)");
      return;
    }
    if (!vendorId) {
      notifyOnFail("Vendor account required to search combo products");
      return;
    }
    setBusy(true);
    setSearched(true);
    setLastTerms(terms);
    setMissingTerms([]);
    setSelectedHitIds(new Set());
    try {
      const batches = await Promise.all(terms.map((term) => searchOneTerm(term)));
      const byId = new Map();
      batches.flat().forEach((p) => {
        if (p?.id != null) byId.set(String(p.id), p);
      });
      const merged = [...byId.values()];
      setHits(merged);

      if (terms.length > 1) {
        const missing = terms.filter(
          (term) => !merged.some((p) => termMatchedProduct(term, p)),
        );
        setMissingTerms(missing);
        // Pre-select all newly found (not already in combo)
        setSelectedHitIds(
          new Set(
            merged
              .filter((p) => !addedIds.has(String(p.id)))
              .map((p) => String(p.id)),
          ),
        );
      }
    } catch {
      setHits([]);
    } finally {
      setBusy(false);
    }
  };

  const hydrateProduct = async (p) => {
    const detail = await getProductById(p.id);
    if (detail && detail.status === 0) {
      throw new Error(detail.message || "Could not load product details");
    }
    return detail?.data || p;
  };

  const validateProduct = (product) => {
    if (vendorId && Number(product.vendor_id) !== Number(vendorId)) {
      return "Not in your catalog";
    }
    if (!isListedProduct(product)) return "Not listed";
    if (String(product.listing_type || "").toLowerCase() === "combo") {
      return "Cannot nest combo";
    }
    return null;
  };

  const addProductsFromList = async (products, { clearQuery = false } = {}) => {
    if (!products?.length) {
      notifyOnFail("Select at least one product to add");
      return;
    }
    setAddingBusy(true);
    try {
      let working = [...items];
      const seen = new Set(working.map((it) => String(it.combo_product_id)));
      let added = 0;
      const skipped = [];

      for (const p of products) {
        if (seen.has(String(p.id))) {
          skipped.push(`${displayProductId(p)} (already in combo)`);
          continue;
        }
        setAddingId(p.id);
        try {
          const product = await hydrateProduct(p);
          const err = validateProduct(product);
          if (err) {
            skipped.push(`${displayProductId(p)} (${err})`);
            continue;
          }
          const stock = stockOf(product);
          if (stock <= 0) {
            notifyOnWarning(
              `"${product.name || "Product"}" has 0 stock — combo stock may be 0 until restocked`,
            );
          }
          if (
            !(Number(product.original_price) > 0) ||
            !(Number(product.discounted_price) > 0)
          ) {
            notifyOnWarning(
              `"${product.name || "Product"}" has missing MRP/sale — check bundle pricing in Review`,
            );
          }
          working = [...working, toComboLine(product)];
          seen.add(String(product.id));
          added += 1;
        } catch (e) {
          skipped.push(
            `${displayProductId(p)} (${e?.message || "load failed"})`,
          );
        }
      }

      if (added > 0) {
        patchComboItems(patch, state, working);
        setHits((prev) =>
          prev.filter(
            (h) =>
              !working.some((w) => String(w.combo_product_id) === String(h.id)),
          ),
        );
        setSelectedHitIds(new Set());
        if (clearQuery) setQ("");
        notifyOnSuccess(
          added === 1
            ? "Product added to combo"
            : `${added} products added to combo`,
        );
      }
      if (skipped.length) {
        notifyOnWarning(`Skipped: ${skipped.slice(0, 4).join("; ")}${skipped.length > 4 ? "…" : ""}`);
      }
      if (!added && !skipped.length) {
        notifyOnFail("No products were added");
      }
    } finally {
      setAddingId(null);
      setAddingBusy(false);
    }
  };

  const addProduct = async (p) => {
    await addProductsFromList([p], { clearQuery: true });
  };

  const toggleHit = (id) => {
    const key = String(id);
    setSelectedHitIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAllHits = () => {
    if (
      selectableHits.length &&
      selectableHits.every((p) => selectedHitIds.has(String(p.id)))
    ) {
      setSelectedHitIds(new Set());
      return;
    }
    setSelectedHitIds(new Set(selectableHits.map((p) => String(p.id))));
  };

  const addSelectedHits = async () => {
    const picked = hits.filter((p) => selectedHitIds.has(String(p.id)));
    await addProductsFromList(picked, { clearQuery: lastTerms.length > 1 });
  };

  const updateItem = (idx, partial) => {
    const next = items.map((it, i) => {
      if (i !== idx) return it;
      const merged = { ...it, ...partial };
      if (partial.variation_id !== undefined) {
        const v = (merged.variations || []).find(
          (x) => String(x.id) === String(partial.variation_id),
        );
        if (v) merged.available_stock = Number(v.stock) || 0;
        else if (!partial.variation_id) {
          merged.available_stock = (merged.variations || []).length
            ? (merged.variations || []).reduce(
                (s, x) => s + (Number(x.stock) || 0),
                0,
              )
            : merged.available_stock;
        }
      }
      return merged;
    });
    patchComboItems(patch, state, next);
  };

  const clearSearch = () => {
    setQ("");
    setHits([]);
    setSearched(false);
    setLastTerms([]);
    setMissingTerms([]);
    setSelectedHitIds(new Set());
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Combo builder</h2>
        <p className="text-xs text-gray-500">
          Bundle at least 2 already listed products from this vendor. Singles
          stay live; this combo is an extra listing. Category, HSN, GST, MRP and
          cover inherit from components — no photoshoot or AI.
        </p>
        {vendorId ? (
          <p className="text-xs text-amber-700 mt-1">
            Search by name, Product ID, or SKU. For several at once, paste IDs /
            SKUs separated by commas (example:{" "}
            <span className="font-mono">ID1, ID2, SKU3</span>).
          </p>
        ) : (
          <p className="text-xs text-amber-700 mt-1">
            Your vendor account is required to search component products.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
        <label className="block text-xs font-medium text-gray-700">
          Find products to add
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <textarea
            className={`${inputCls} min-h-[42px] sm:min-h-[42px] resize-y`}
            rows={2}
            placeholder="One name/ID/SKU — or many IDs/SKUs separated by commas…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSearched(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!busy) runSearch();
              }
            }}
            disabled={!vendorId || busy || addingBusy}
          />
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              type="button"
              disabled={busy || addingBusy || !vendorId}
              onClick={runSearch}
              className="px-3 py-2 rounded-lg bg-primary-100 text-white text-sm inline-flex items-center justify-center gap-1 disabled:opacity-50 whitespace-nowrap"
            >
              <Search className="w-4 h-4" /> {busy ? "Searching…" : "Search"}
            </button>
            {(q || hits.length || searched) && (
              <button
                type="button"
                disabled={busy || addingBusy}
                onClick={clearSearch}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm inline-flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>
        {lastTerms.length > 1 ? (
          <p className="text-[11px] text-gray-500">
            Multi-search: {lastTerms.length} terms · {hits.length} match
            {hits.length === 1 ? "" : "es"}
            {missingTerms.length
              ? ` · ${missingTerms.length} not found`
              : ""}
          </p>
        ) : null}
      </div>

      {hits.length ? (
        <div className="border rounded-xl bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b bg-slate-50">
            <button
              type="button"
              className="text-xs text-gray-700 inline-flex items-center gap-1"
              onClick={toggleSelectAllHits}
              disabled={!selectableHits.length || addingBusy}
            >
              {selectableHits.length &&
              selectableHits.every((p) => selectedHitIds.has(String(p.id))) ? (
                <CheckSquare className="w-3.5 h-3.5 text-primary-100" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              Select all ({selectableHits.length})
            </button>
            <button
              type="button"
              disabled={addingBusy || selectedHitIds.size === 0}
              onClick={addSelectedHits}
              className="px-2.5 py-1.5 rounded-lg bg-primary-100 text-white text-xs inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              {addingBusy
                ? "Adding…"
                : `Add selected (${selectedHitIds.size})`}
            </button>
          </div>
          <ul className="divide-y max-h-72 overflow-y-auto">
            {hits.map((p) => {
              const already = addedIds.has(String(p.id));
              const adding = String(addingId) === String(p.id);
              const checked = selectedHitIds.has(String(p.id));
              const thumb = thumbOf(p);
              const cat =
                p.Category?.title ||
                p.category?.title ||
                p.categoryTitle ||
                "";
              return (
                <li
                  key={p.id}
                  className={`flex items-start gap-2 px-3 py-2.5 text-sm ${
                    already ? "opacity-50 bg-slate-50" : "hover:bg-orange-50/40"
                  }`}
                >
                  <button
                    type="button"
                    disabled={already || addingBusy}
                    className="mt-1 shrink-0 disabled:opacity-40"
                    onClick={() => toggleHit(p.id)}
                    aria-label={checked ? "Deselect" : "Select"}
                  >
                    {already || checked ? (
                      <CheckSquare className="w-4 h-4 text-primary-100" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="w-12 h-12 rounded-md object-cover bg-gray-100 shrink-0 border border-gray-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-gray-100 shrink-0 border border-gray-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 leading-snug line-clamp-2">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-mono">
                      {displayProductId(p)}
                      {p.sku && p.sku !== p.custom_id ? ` · SKU ${p.sku}` : ""}
                      {p.id != null ? ` · #${p.id}` : ""}
                    </p>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      {cat ? `${cat} · ` : ""}
                      MRP {money(p.original_price)} · Sale{" "}
                      {money(p.discounted_price)} · Stock {stockOf(p)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={already || adding || addingBusy}
                    className="shrink-0 mt-1 px-2 py-1 rounded-md border border-primary-100/30 text-primary-100 text-xs inline-flex items-center gap-1 disabled:opacity-40"
                    onClick={() => addProduct(p)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {already ? "Added" : adding ? "…" : "Add"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : searched && !busy ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          No listed products found
          {lastTerms.length > 1
            ? ` for ${lastTerms.length} search terms`
            : q.trim()
              ? ` for “${q.trim()}”`
              : ""}
          . Try exact Product ID or SKU.
        </p>
      ) : null}

      {missingTerms.length ? (
        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Not found / not listed:{" "}
          <span className="font-mono">{missingTerms.join(", ")}</span>
        </p>
      ) : null}

      {items.length ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-600 font-medium">
              Combo components ({items.length}
              {items.length < 2 ? " — need 2+" : " · ready"})
            </p>
            <button
              type="button"
              className="text-xs text-primary-100 underline-offset-2 hover:underline"
              onClick={() => {
                document.activeElement?.blur?.();
                clearSearch();
              }}
            >
              Search another product
            </button>
          </div>
          {items.map((it, idx) => (
            <div
              key={`${it.combo_product_id}-${idx}`}
              className="border rounded-xl p-3 grid sm:grid-cols-12 gap-2 items-end bg-slate-50/60"
            >
              <div className="sm:col-span-4 flex gap-2 min-w-0">
                {it.thumb ? (
                  <img
                    src={it.thumb}
                    alt=""
                    className="w-12 h-12 rounded object-cover bg-gray-100 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-100 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{it.name}</p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {it.custom_id || it.sku || `ID ${it.combo_product_id}`}
                    {it.sku && it.custom_id ? ` · SKU ${it.sku}` : ""}
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {it.categoryTitle ? `${it.categoryTitle} · ` : ""}
                    MRP {money(it.original_price)} · Sale{" "}
                    {money(it.discounted_price)} · Avail {it.available_stock}
                  </p>
                </div>
              </div>
              <label className="sm:col-span-3 space-y-1">
                <span className="text-xs text-gray-600">Variant</span>
                <select
                  className={inputCls}
                  value={it.variation_id || ""}
                  onChange={(e) =>
                    updateItem(idx, { variation_id: e.target.value })
                  }
                >
                  <option value="">Parent / any</option>
                  {(it.variations || []).map((v) => (
                    <option key={v.id} value={v.id}>
                      #{v.id}
                      {v.sku ? ` ${v.sku}` : ""} stock {v.stock}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2 space-y-1">
                <span className="text-xs text-gray-600">Qty in combo</span>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={it.qty}
                  onChange={(e) => {
                    const n = Math.max(1, parseInt(e.target.value, 10) || 1);
                    updateItem(idx, { qty: n });
                  }}
                />
              </label>
              <div className="sm:col-span-2 text-xs text-gray-600 pb-2">
                Uses {Math.max(1, Number(it.qty) || 1)} × per sale
              </div>
              <button
                type="button"
                className="sm:col-span-1 p-2 text-red-600 justify-self-end"
                title="Remove from combo"
                onClick={() => {
                  const next = items.filter((_, i) => i !== idx);
                  patchComboItems(patch, state, next);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="text-sm space-y-1 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2">
            <p className="font-medium text-emerald-800">
              Computed combo stock: {stockMin}
            </p>
            <p className="text-xs text-gray-600">
              Bundle MRP {money(state.original_price)} · Sale{" "}
              {money(state.discounted_price)} · HSN {state.hsn_code || "—"} ·{" "}
              {state.categoryTitle || "Category from first product"}
            </p>
            {items.length < 2 ? (
              <p className="text-xs text-amber-800">
                Add one more listed product to continue to Review.
              </p>
            ) : (
              <p className="text-xs text-emerald-800">
                Minimum met — you can open Review, or search another product to
                add more.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center">
          No components yet. Search above and add at least 2 listed products.
        </p>
      )}
    </div>
  );
}
