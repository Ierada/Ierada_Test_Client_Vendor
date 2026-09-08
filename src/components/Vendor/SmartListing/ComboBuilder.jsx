import React, { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { getProductById, getProductsByVendorId } from "../../../services/api.product";
import { notifyOnFail } from "../../../utils/notification/toast";

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100/30";

function isListedProduct(p) {
  return (
    String(p?.visibility || "").toLowerCase() === "published" &&
    String(p?.listing_status || "").toLowerCase() === "published"
  );
}

export default function ComboBuilder({ state, patch, vendorId }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
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

  const runSearch = async () => {
    const term = q.trim();
    if (!term) {
      notifyOnFail("Enter product name, ID, or SKU to search");
      return;
    }
    if (!vendorId) {
      notifyOnFail("Vendor account required before searching combo products");
      return;
    }
    setBusy(true);
    setSearched(true);
    try {
      const res = await getProductsByVendorId(vendorId, {
        search: term,
        limit: 30,
        visibility: "Published",
        listing_status: "published",
      });
      const rows = (res?.data || []).filter((p) => {
        if (!isListedProduct(p)) return false;
        if (String(p.listing_type || "").toLowerCase() === "combo") return false;
        if (parentId && String(p.id) === String(parentId)) return false;
        return true;
      });
      setHits(rows);
    } catch {
      notifyOnFail("Search failed");
      setHits([]);
    } finally {
      setBusy(false);
    }
  };

  const addProduct = async (p) => {
    if (vendorId && Number(p.vendor_id) !== Number(vendorId)) {
      notifyOnFail("Only your products can be added to a combo");
      return;
    }
    if (!isListedProduct(p)) {
      notifyOnFail("Only listed (published) products can be added to a combo");
      return;
    }
    if (addedIds.has(String(p.id))) {
      notifyOnFail("Product already in this combo");
      return;
    }
    try {
      const detail = await getProductById(p.id);
      const product = detail?.data || p;
      if (vendorId && Number(product.vendor_id) !== Number(vendorId)) {
        notifyOnFail("Only your products can be added to a combo");
        return;
      }
      if (!isListedProduct(product)) {
        notifyOnFail("Only listed (published) products can be added to a combo");
        return;
      }
      if (String(product.listing_type || "").toLowerCase() === "combo") {
        notifyOnFail("Cannot nest another combo inside a combo");
        return;
      }
      const variations = product.variations || [];
      const stock =
        variations.length > 0
          ? variations.reduce((s, v) => s + (Number(v.stock) || 0), 0)
          : Number(product.stock) || 0;
      const next = [
        ...items,
        {
          combo_product_id: product.id,
          name: product.name,
          sku: product.sku || "",
          variation_id: "",
          variations,
          qty: 1,
          available_stock: stock,
          discount_percentage: null,
        },
      ];
      patch({
        comboItems: next,
        stock: String(
          Math.min(
            ...next.map((it) => {
              const child = Number(it.available_stock) || 0;
              const qty = Math.max(1, Number(it.qty) || 1);
              return Math.floor(child / qty);
            }),
          ) || 0,
        ),
      });
      setHits((prev) => prev.filter((h) => String(h.id) !== String(product.id)));
      setQ("");
    } catch {
      notifyOnFail("Could not add product to combo");
    }
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
            ? (merged.variations || []).reduce((s, x) => s + (Number(x.stock) || 0), 0)
            : merged.available_stock;
        }
      }
      return merged;
    });
    const minStock = next.length
      ? Math.min(
          ...next.map((it) => {
            const child = Number(it.available_stock) || 0;
            const qty = Math.max(1, Number(it.qty) || 1);
            return Math.floor(child / qty);
          }),
        )
      : 0;
    patch({ comboItems: next, stock: String(minStock) });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Combo builder</h2>
        <p className="text-xs text-gray-500">
          Bundle your listed products only. Parent stock = min(floor(component
          stock ÷ qty)). Tax uses parent HSN/GST only.
          <span className="block mt-1 text-amber-700">
            Search by product name, product ID, or SKU — listed products only.
          </span>
        </p>
      </div>

      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder="Search by name, product ID, or SKU…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSearched(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          disabled={!vendorId}
        />
        <button
          type="button"
          disabled={busy || !vendorId}
          onClick={runSearch}
          className="px-3 rounded-lg bg-primary-100 text-white text-sm inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Search className="w-4 h-4" /> {busy ? "…" : "Search"}
        </button>
      </div>

      {hits.length ? (
        <ul className="border rounded-xl divide-y max-h-56 overflow-y-auto bg-white">
          {hits.slice(0, 20).map((p) => {
            const already = addedIds.has(String(p.id));
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{p.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    ID {p.id}
                    {p.sku ? ` · SKU ${p.sku}` : ""}
                    {p.custom_id ? ` · ${p.custom_id}` : ""}
                    {" · "}stock{" "}
                    {Array.isArray(p.variations) && p.variations.length
                      ? p.variations.reduce((s, v) => s + (Number(v.stock) || 0), 0)
                      : Number(p.stock) || 0}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={already}
                  className="shrink-0 text-primary-100 inline-flex items-center gap-1 text-xs disabled:opacity-40"
                  onClick={() => addProduct(p)}
                >
                  <Plus className="w-3.5 h-3.5" /> {already ? "Added" : "Add"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : searched && !busy ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          No listed products found for “{q.trim()}”. Try name, exact product ID, or SKU.
        </p>
      ) : null}

      {items.length ? (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div
              key={`${it.combo_product_id}-${idx}`}
              className="border rounded-xl p-3 grid sm:grid-cols-12 gap-2 items-end bg-slate-50/60"
            >
              <div className="sm:col-span-4">
                <p className="text-sm font-medium truncate">{it.name}</p>
                <p className="text-[11px] text-gray-500">
                  ID {it.combo_product_id}
                  {it.sku ? ` · SKU ${it.sku}` : ""} · Avail: {it.available_stock}
                </p>
              </div>
              <label className="sm:col-span-3 space-y-1">
                <span className="text-xs text-gray-600">Variant</span>
                <select
                  className={inputCls}
                  value={it.variation_id || ""}
                  onChange={(e) => updateItem(idx, { variation_id: e.target.value })}
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
                <span className="text-xs text-gray-600">Qty</span>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={it.qty}
                  onChange={(e) => updateItem(idx, { qty: e.target.value })}
                />
              </label>
              <div className="sm:col-span-2 text-xs text-gray-600">
                Uses {Math.max(1, Number(it.qty) || 1)} × per sale
              </div>
              <button
                type="button"
                className="sm:col-span-1 p-2 text-red-600"
                onClick={() => {
                  const next = items.filter((_, i) => i !== idx);
                  const min =
                    next.length === 0
                      ? 0
                      : Math.min(
                          ...next.map((it) => {
                            const child = Number(it.available_stock) || 0;
                            const qty = Math.max(1, Number(it.qty) || 1);
                            return Math.floor(child / qty);
                          }),
                        );
                  patch({ comboItems: next, stock: String(min) });
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <p className="text-sm font-medium text-emerald-800">
            Computed combo stock: {stockMin}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Add at least one listed component product (search by name, ID, or SKU).
        </p>
      )}
    </div>
  );
}
