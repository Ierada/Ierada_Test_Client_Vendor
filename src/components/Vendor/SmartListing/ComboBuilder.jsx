import React, { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { searchProducts, getProductById } from "../../../services/api.product";
import { notifyOnFail } from "../../../utils/notification/toast";

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export default function ComboBuilder({ state, patch }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState([]);
  const [busy, setBusy] = useState(false);
  const items = state.comboItems || [];

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
    if (!q.trim()) return;
    setBusy(true);
    try {
      const res = await searchProducts(q.trim());
      setHits(res?.data || []);
    } catch {
      notifyOnFail("Search failed");
    } finally {
      setBusy(false);
    }
  };

  const addProduct = async (p) => {
    try {
      const detail = await getProductById(p.id);
      const product = detail?.data || p;
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
          variation_id: "",
          variations,
          qty: 1,
          available_stock: stock,
          discount_percentage: null,
        },
      ];
      patch({ comboItems: next, stock: String(Math.min(...next.map((it) => {
        const child = Number(it.available_stock) || 0;
        const qty = Math.max(1, Number(it.qty) || 1);
        return Math.floor(child / qty);
      })) || 0) });
      setHits([]);
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
          Parent stock = min(floor(component stock ÷ qty)). Tax uses parent listing
          HSN/GST only (pan-India ecommerce standard — no component breakup).
        </p>
      </div>

      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder="Search products to add…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
        />
        <button
          type="button"
          disabled={busy}
          onClick={runSearch}
          className="px-3 rounded-lg bg-blue-600 text-white text-sm inline-flex items-center gap-1"
        >
          <Search className="w-4 h-4" /> Search
        </button>
      </div>

      {hits.length ? (
        <ul className="border rounded-xl divide-y max-h-48 overflow-y-auto bg-white">
          {hits.slice(0, 12).map((p) => (
            <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="truncate pr-2">{p.name}</span>
              <button
                type="button"
                className="text-blue-600 inline-flex items-center gap-1 text-xs"
                onClick={() => addProduct(p)}
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {items.length ? (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="border rounded-xl p-3 grid sm:grid-cols-12 gap-2 items-end bg-slate-50/60">
              <div className="sm:col-span-4">
                <p className="text-sm font-medium truncate">{it.name}</p>
                <p className="text-[11px] text-gray-500">Avail: {it.available_stock}</p>
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
                      #{v.id} stock {v.stock}
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
                  patch({ comboItems: next });
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
        <p className="text-sm text-gray-500">Add at least one component product.</p>
      )}
    </div>
  );
}
