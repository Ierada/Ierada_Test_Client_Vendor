import React, { useEffect, useState } from "react";
import { AlertTriangle, ImagePlus, Plus, Trash2 } from "lucide-react";
import { getAllAttributes } from "../../../services/api.attribute";
import { notifyOnFail } from "../../../utils/notification/toast";
import { cartesianCustomRows, suggestVariantSku } from "./utils/variationHelpers";
import { liveFieldError, validateMrpAndSelling, validateStockQty } from "./utils/listingFieldValidation";

const inputCls =
  "w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100/30";

function inputClsErr(error) {
  return error ? `${inputCls} border-red-400 bg-red-50` : inputCls;
}

const emptyAttr = () => ({ attribute_id: "", name: "", valuesText: "" });

export default function CustomVariationMatrix({ state, patch }) {
  const [attributes, setAttributes] = useState([]);
  const attrs = state.customAttrs?.length ? state.customAttrs : [emptyAttr()];
  const rows = state.customRows || [];

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllAttributes();
        setAttributes(res?.data || res || []);
      } catch {
        notifyOnFail("Could not load attributes");
      }
    })();
  }, []);

  const setAttrs = (customAttrs) => patch({ customAttrs });

  const generate = () => {
    const prepared = attrs
      .slice(0, 4)
      .map((a) => ({
        attribute_id: a.attribute_id,
        name:
          attributes.find((x) => String(x.id) === String(a.attribute_id))?.name ||
          a.name,
        values: String(a.valuesText || "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      }))
      .filter((a) => a.attribute_id && a.values.length);

    if (!prepared.length) {
      notifyOnFail("Add at least one attribute with comma-separated values");
      return;
    }
    if (prepared.length > 4) {
      notifyOnFail("Maximum 4 custom attributes");
      return;
    }

    let generated = cartesianCustomRows(prepared);
    if (generated.length > 48) {
      notifyOnFail(`Would create ${generated.length} rows — trim values (soft cap ~48).`);
    }
    const base = state.sku || "SKU";
    generated = generated.map((r) => ({
      ...r,
      original_price: state.original_price || "",
      discounted_price: state.discounted_price || "",
      stock: state.stock || "",
      sku: suggestVariantSku(
        base,
        (r.attributes || []).map((a) => a.attribute_value),
      ),
    }));
    patch({ customRows: generated, customAttrs: attrs.slice(0, 4) });
  };

  const updateRow = (ri, partial) => {
    patch({
      customRows: rows.map((r, i) => (i === ri ? { ...r, ...partial } : r)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-900">Custom variation (max 4 attrs)</h2>
          <p className="text-xs text-gray-500">
            Enter values comma-separated, then Generate matrix.
          </p>
        </div>
        <button
          type="button"
          onClick={generate}
          className="text-xs px-3 py-1.5 rounded-lg bg-primary-100 text-white"
        >
          Generate matrix
        </button>
      </div>

      {attrs.map((a, ai) => (
        <div key={ai} className="grid sm:grid-cols-12 gap-2 items-end border rounded-xl p-3">
          <label className="sm:col-span-4 space-y-1">
            <span className="text-xs text-gray-600">Attribute</span>
            <select
              className={inputCls}
              value={a.attribute_id}
              onChange={(e) => {
                const id = e.target.value;
                const found = attributes.find((x) => String(x.id) === String(id));
                const next = attrs.map((x, i) =>
                  i === ai
                    ? { ...x, attribute_id: id, name: found?.name || "" }
                    : x,
                );
                setAttrs(next);
              }}
            >
              <option value="">Select</option>
              {attributes.map((at) => (
                <option key={at.id} value={at.id}>
                  {at.name}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-7 space-y-1">
            <span className="text-xs text-gray-600">Values (comma separated)</span>
            <input
              className={inputCls}
              placeholder="e.g. S, M, L"
              value={a.valuesText}
              onChange={(e) => {
                const next = attrs.map((x, i) =>
                  i === ai ? { ...x, valuesText: e.target.value } : x,
                );
                setAttrs(next);
              }}
            />
          </label>
          <div className="sm:col-span-1 flex gap-1">
            {attrs.length > 1 ? (
              <button
                type="button"
                className="p-2 text-red-600"
                onClick={() => setAttrs(attrs.filter((_, i) => i !== ai))}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
      ))}

      {attrs.length < 4 ? (
        <button
          type="button"
          className="text-xs text-primary-100 inline-flex items-center gap-1"
          onClick={() => setAttrs([...attrs, emptyAttr()])}
        >
          <Plus className="w-3.5 h-3.5" /> Attribute
        </button>
      ) : null}

      {rows.length > 48 ? (
        <div className="flex gap-2 text-amber-800 bg-amber-50 border rounded-xl px-3 py-2 text-xs">
          <AlertTriangle className="w-4 h-4" />
          {rows.length} rows — disable unused before submit.
        </div>
      ) : null}

      {rows.length ? (
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto border rounded-xl">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="sticky top-0 bg-white border-b text-xs text-gray-500">
              <tr>
                <th className="p-2">On</th>
                <th className="p-2 text-left">Combo</th>
                <th className="p-2">MRP</th>
                <th className="p-2">Sell</th>
                <th className="p-2">Stock</th>
                <th className="p-2">SKU</th>
                <th className="p-2">Images</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => {
                const mrpSell = r.enabled
                  ? validateMrpAndSelling(r.original_price, r.discounted_price)
                  : {};
                const mrpErr = r.enabled ? liveFieldError(mrpSell.original_price, r.original_price) : null;
                const sellErr = r.enabled ? liveFieldError(mrpSell.discounted_price, r.discounted_price) : null;
                const stockErr = r.enabled
                  ? liveFieldError(validateStockQty(r.stock, "Stock"), r.stock)
                  : null;
                return (
                <tr key={ri} className={`border-b ${r.enabled ? "" : "opacity-50"}`}>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={!!r.enabled}
                      onChange={(e) => updateRow(ri, { enabled: e.target.checked })}
                    />
                  </td>
                  <td className="p-2 text-xs">
                    {(r.attributes || [])
                      .map((a) => a.attribute_value)
                      .join(" / ")}
                  </td>
                  <td className="p-1 align-top">
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      className={inputClsErr(mrpErr)}
                      value={r.original_price}
                      onChange={(e) =>
                        updateRow(ri, { original_price: e.target.value })
                      }
                    />
                    {mrpErr ? <p className="text-[10px] text-red-600 mt-0.5 leading-tight">{mrpErr}</p> : null}
                  </td>
                  <td className="p-1 align-top">
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      className={inputClsErr(sellErr)}
                      value={r.discounted_price}
                      onChange={(e) =>
                        updateRow(ri, { discounted_price: e.target.value })
                      }
                    />
                    {sellErr ? <p className="text-[10px] text-red-600 mt-0.5 leading-tight">{sellErr}</p> : null}
                  </td>
                  <td className="p-1 align-top">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className={inputClsErr(stockErr)}
                      value={r.stock}
                      onChange={(e) => updateRow(ri, { stock: e.target.value })}
                    />
                    {stockErr ? <p className="text-[10px] text-red-600 mt-0.5 leading-tight">{stockErr}</p> : null}
                  </td>
                  <td className="p-1">
                    <input
                      className={inputCls}
                      value={r.sku}
                      onChange={(e) => updateRow(ri, { sku: e.target.value })}
                    />
                  </td>
                  <td className="p-1">
                    <label className="inline-flex items-center gap-1 text-xs text-primary-100 cursor-pointer">
                      <ImagePlus className="w-3.5 h-3.5" />
                      {(r.media || []).length || 0}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const picked = Array.from(e.target.files || []).filter(
                            (f) =>
                              f.type.startsWith("image/") &&
                              f.size <= 5 * 1024 * 1024,
                          );
                          e.target.value = "";
                          updateRow(ri, {
                            media: [...(r.media || []), ...picked].slice(0, 6),
                          });
                        }}
                      />
                    </label>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No matrix yet — generate after defining attributes.</p>
      )}
    </div>
  );
}
