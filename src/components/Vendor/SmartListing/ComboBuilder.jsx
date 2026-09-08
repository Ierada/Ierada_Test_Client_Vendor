import React, { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { getProductById, getProductsByVendorId } from "../../../services/api.product";
import { notifyOnFail, notifyOnWarning } from "../../../utils/notification/toast";
import { inheritComboParentFromItems } from "./utils/comboInherit";

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100/30";

function isListedProduct(p) {
  return (
    String(p?.visibility || "").toLowerCase() === "published" &&
    String(p?.listing_status || "").toLowerCase() === "published"
  );
}

function patchComboItems(patch, state, next) {
  patch({
    comboItems: next,
    ...inheritComboParentFromItems(next, state),
  });
}

export default function ComboBuilder({ state, patch, vendorId }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
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

  const runSearch = async () => {
    const term = q.trim();
    if (!term) {
      notifyOnFail("Enter product name, ID, or SKU to search");
      return;
    }
    if (!vendorId) {
      notifyOnFail("Vendor account required to search combo products");
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
      if (!res || res.status === 0) {
        setHits([]);
        return;
      }
      const rows = (res?.data || []).filter((p) => {
        if (!isListedProduct(p)) return false;
        if (String(p.listing_type || "").toLowerCase() === "combo") return false;
        if (parentId && String(p.id) === String(parentId)) return false;
        return true;
      });
      setHits(rows);
    } catch {
      // api.product already toasts network errors
      setHits([]);
    } finally {
      setBusy(false);
    }
  };

  const addProduct = async (p) => {
    if (vendorId && Number(p.vendor_id) !== Number(vendorId)) {
      notifyOnFail("Only products from your catalog can be added");
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
    setAddingId(p.id);
    try {
      const detail = await getProductById(p.id);
      if (detail && detail.status === 0) {
        notifyOnFail(detail.message || "Could not load product details");
        return;
      }
      const product = detail?.data || p;
      if (vendorId && Number(product.vendor_id) !== Number(vendorId)) {
        notifyOnFail("Only products from your catalog can be added");
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
      const thumb = (product.media || [])[0]?.url || "";
      const next = [
        ...items,
        {
          combo_product_id: product.id,
          name: product.name,
          sku: product.sku || "",
          thumb,
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
        },
      ];
      patchComboItems(patch, state, next);
      setHits((prev) => prev.filter((h) => String(h.id) !== String(product.id)));
      setQ("");
    } catch {
      notifyOnFail("Could not add product to combo");
    } finally {
      setAddingId(null);
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
    patchComboItems(patch, state, next);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Combo builder</h2>
        <p className="text-xs text-gray-500">
          Works for Brand and Generic. Search and add at least 2 already listed
          products from this vendor. Those products stay live as singles; this
          combo is an extra listing that shows them together. Category, HSN,
          GST, MRP and cover come from the components — no photoshoot or AI.
          {vendorId ? (
            <span className="block mt-1 text-amber-700">
              Search by product name, product ID, or SKU — listed products only.
              Minimum 2 products.
            </span>
          ) : (
            <span className="block mt-1 text-amber-700">
              Your vendor account is required to search component products.
            </span>
          )}
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
          onKeyDown={(e) => e.key === "Enter" && !busy && runSearch()}
          disabled={!vendorId || busy}
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
            const adding = String(addingId) === String(p.id);
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
                    {p.discounted_price != null ? ` · ₹${p.discounted_price}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={already || adding || !!addingId}
                  className="shrink-0 text-primary-100 inline-flex items-center gap-1 text-xs disabled:opacity-40"
                  onClick={() => addProduct(p)}
                >
                  <Plus className="w-3.5 h-3.5" />{" "}
                  {already ? "Added" : adding ? "Adding…" : "Add"}
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
          <p className="text-xs text-gray-600 font-medium">
            Combo components ({items.length}
            {items.length < 2 ? " — need 2+" : ""})
          </p>
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
                    className="w-10 h-10 rounded object-cover bg-gray-100 shrink-0"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{it.name}</p>
                  <p className="text-[11px] text-gray-500">
                    ID {it.combo_product_id}
                    {it.sku ? ` · SKU ${it.sku}` : ""} · Avail: {it.available_stock}
                  </p>
                </div>
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
                  onChange={(e) => {
                    const n = Math.max(1, parseInt(e.target.value, 10) || 1);
                    updateItem(idx, { qty: n });
                  }}
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
              Bundle MRP ₹{state.original_price || "—"} · Sale ₹
              {state.discounted_price || "—"} · HSN {state.hsn_code || "—"} ·{" "}
              {state.categoryTitle || "Category from first product"}
            </p>
            {items.length < 2 ? (
              <p className="text-xs text-amber-800">
                Add one more listed product to continue.
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Add at least 2 listed products (search by name, ID, or SKU).
        </p>
      )}
    </div>
  );
}
