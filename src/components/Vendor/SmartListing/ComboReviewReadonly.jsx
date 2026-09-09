import React, { useMemo } from "react";

const roCls =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800";

function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `₹${Math.round(v * 100) / 100}`;
}

function ReadOnlyField({ label, value, hint }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className={roCls}>{value || "—"}</div>
      {hint ? <p className="text-[11px] text-gray-500">{hint}</p> : null}
    </div>
  );
}

function productIdLabel(it) {
  return it.custom_id || it.sku || (it.combo_product_id != null ? `#${it.combo_product_id}` : "—");
}

/**
 * Combo review — display only.
 * Show every selected product (name + its own details). No parent SKU / stock /
 * warranty / single HSN editors. Shipping is summed from components.
 */
export default function ComboReviewReadonly({ section, state }) {
  const items = Array.isArray(state.comboItems) ? state.comboItems : [];

  const totals = useMemo(() => {
    let mrp = 0;
    let sale = 0;
    let weight = 0;
    let maxL = 0;
    let maxW = 0;
    let maxH = 0;
    let minUnits = Infinity;
    for (const it of items) {
      const qty = Math.max(1, Number(it.qty) || 1);
      mrp += (Number(it.original_price) || 0) * qty;
      sale += (Number(it.discounted_price) || 0) * qty;
      weight += (Number(it.package_weight) || 0) * qty;
      maxL = Math.max(maxL, Number(it.package_length) || 0);
      maxW = Math.max(maxW, Number(it.package_width) || 0);
      maxH = Math.max(maxH, Number(it.package_height) || 0);
      const stock = Number(it.available_stock);
      if (Number.isFinite(stock)) {
        minUnits = Math.min(minUnits, Math.floor(stock / qty));
      }
    }
    if (!Number.isFinite(minUnits)) minUnits = 0;
    if (sale > 0 && mrp <= sale) mrp = Math.round((sale + 1) * 100) / 100;
    const vol =
      maxL > 0 && maxW > 0 && maxH > 0
        ? Math.round(((maxL * maxW * maxH) / 5000) * 1000) / 1000
        : Number(state.volumetric_weight) || 0;
    return {
      mrp: Math.round(mrp * 100) / 100,
      sale: Math.round(sale * 100) / 100,
      weight: Math.round(weight * 100) / 100,
      maxL,
      maxW,
      maxH,
      minUnits,
      vol,
    };
  }, [items, state.volumetric_weight]);

  if (section === "pricing" || section === "product_info") {
    return (
      <div className="space-y-4">
        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Selected products only — each keeps its own name, SKU, stock, HSN and
          GST. On order we fulfil them one-by-one; this combo just shows them
          together. Nothing is editable here.
        </p>

        <div className="grid sm:grid-cols-3 gap-3">
          <ReadOnlyField label="Bundle MRP (sum)" value={money(totals.mrp)} />
          <ReadOnlyField
            label="Bundle selling (sum)"
            value={money(totals.sale)}
          />
          <ReadOnlyField
            label="Sellable combo units"
            value={String(totals.minUnits)}
            hint="Min of each product’s stock ÷ qty in combo."
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Product list ({items.length})
          </p>
          {!items.length ? (
            <p className="text-sm text-amber-800">
              No products — go back to Combo step.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((it, idx) => {
                const cat = [it.categoryTitle, it.subCategoryTitle]
                  .filter(Boolean)
                  .join(" › ");
                return (
                  <li
                    key={`${it.combo_product_id}-${idx}`}
                    className="border rounded-xl p-3 bg-white"
                  >
                    <div className="flex gap-3">
                      {it.thumb ? (
                        <img
                          src={it.thumb}
                          alt=""
                          className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">
                          {idx + 1}. {it.name || "Untitled product"}
                        </p>
                        <p className="text-[11px] font-mono text-gray-500">
                          {productIdLabel(it)}
                          {it.sku && it.custom_id ? ` · SKU ${it.sku}` : ""}
                        </p>
                        {cat ? (
                          <p className="text-[11px] text-gray-500">{cat}</p>
                        ) : null}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs text-gray-700">
                          <div>
                            <span className="text-gray-500 block">Qty in combo</span>
                            {Math.max(1, Number(it.qty) || 1)}
                          </div>
                          <div>
                            <span className="text-gray-500 block">Stock</span>
                            {it.available_stock != null ? it.available_stock : "—"}
                          </div>
                          <div>
                            <span className="text-gray-500 block">MRP</span>
                            {money(it.original_price)}
                          </div>
                          <div>
                            <span className="text-gray-500 block">Sale</span>
                            {money(it.discounted_price)}
                          </div>
                          <div>
                            <span className="text-gray-500 block">HSN</span>
                            {it.hsn_code || "—"}
                          </div>
                          <div>
                            <span className="text-gray-500 block">GST %</span>
                            {it.gst != null && it.gst !== "" ? it.gst : "—"}
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-gray-500 block">Package</span>
                            {[
                              it.package_weight
                                ? `${it.package_weight}g`
                                : null,
                              it.package_length || it.package_width || it.package_height
                                ? `${it.package_length || "—"}×${it.package_width || "—"}×${it.package_height || "—"} cm`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (section === "shipping") {
    const weight =
      totals.weight > 0
        ? String(totals.weight)
        : state.package_weight
          ? String(state.package_weight)
          : "—";
    const length =
      totals.maxL > 0
        ? String(totals.maxL)
        : state.package_length
          ? String(state.package_length)
          : "—";
    const width =
      totals.maxW > 0
        ? String(totals.maxW)
        : state.package_width
          ? String(state.package_width)
          : "—";
    const height =
      totals.maxH > 0
        ? String(totals.maxH)
        : state.package_height
          ? String(state.package_height)
          : "—";

    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          Auto-calculated from the selected products (weight = sum × qty; L/W/H =
          max across components). Non-editable. COD / return window / shipping
          charges still come from admin settings.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <ReadOnlyField label="Weight (g)" value={weight} hint="Sum of component weights × qty." />
          <ReadOnlyField
            label="Volumetric (kg)"
            value={totals.vol ? String(totals.vol) : "—"}
            hint="From max L × W × H ÷ 5000."
          />
          <ReadOnlyField label="Length (cm)" value={length} />
          <ReadOnlyField label="Width (cm)" value={width} />
          <ReadOnlyField label="Height (cm)" value={height} />
        </div>
        {items.length ? (
          <div className="border rounded-xl overflow-hidden">
            <p className="text-xs font-medium text-gray-600 bg-slate-50 px-3 py-2">
              Per product package
            </p>
            <ul className="divide-y text-sm">
              {items.map((it, idx) => (
                <li
                  key={`ship-${it.combo_product_id}-${idx}`}
                  className="px-3 py-2 flex flex-wrap gap-x-4 gap-y-1 justify-between"
                >
                  <span className="text-gray-800 min-w-0 flex-1 truncate">
                    {it.name || productIdLabel(it)}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {it.package_weight != null && it.package_weight !== ""
                      ? `${it.package_weight}g`
                      : "—g"}
                    {" · "}
                    {it.package_length || "—"}×{it.package_width || "—"}×
                    {it.package_height || "—"} cm
                    {" · qty "}
                    {Math.max(1, Number(it.qty) || 1)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}
