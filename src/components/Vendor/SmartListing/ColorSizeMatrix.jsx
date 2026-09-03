import React, { useEffect, useMemo, useState } from "react";
import { ImagePlus, Plus, Trash2, AlertTriangle } from "lucide-react";
import { getAllColors, addColor } from "../../../services/api.color";
import { getAllSizes, addSize } from "../../../services/api.size";
import { notifyOnFail } from "../../../utils/notification/toast";
import {
  suggestVariantSku,
  sizeQueryFromListing,
  splitContextualSizes,
  sizePickerOptions,
  hasRealSizeRow,
} from "./utils/variationHelpers";
import SearchablePicker from "./SearchablePicker";
import { liveFieldError, validateMrpAndSelling, validateStockQty } from "./utils/listingFieldValidation";

const inputCls =
  "w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100/30";

function inputClsErr(error) {
  return error ? `${inputCls} border-red-400 bg-red-50` : inputCls;
}

function emptySizeRow(defaults = {}) {
  return {
    size_id: "",
    stock: defaults.stock ?? "",
    original_price: defaults.original_price ?? "",
    discounted_price: defaults.discounted_price ?? "",
    sku: "",
    barcode: "",
  };
}

function emptyColorGroup(defaults = {}) {
  return {
    color_id: "",
    color_name: "",
    media: [],
    sizes: [emptySizeRow(defaults)],
  };
}

/**
 * Color × Size matrix — images shared by color (grouping_key = color_id).
 */
export default function ColorSizeMatrix({ state, patch }) {
  const [colors, setColors] = useState([]);
  const [sizeSplit, setSizeSplit] = useState({
    all: [],
    contextual: [],
    rest: [],
    totalContextual: 0,
  });
  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("");
  const [loading, setLoading] = useState(true);

  const groups = state.colorGroups?.length
    ? state.colorGroups
    : [emptyColorGroup({ original_price: state.original_price, discounted_price: state.discounted_price, stock: state.stock })];

  const setGroups = (colorGroups) => patch({ colorGroups });
  const sizes = sizeSplit.all;
  const sizeOptions = useMemo(() => sizePickerOptions(sizeSplit), [sizeSplit]);
  const showNoCategorySizesHint =
    Boolean(state.category_id) &&
    sizeSplit.totalContextual === 0 &&
    !hasRealSizeRow(groups);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [cRes, sRes] = await Promise.all([
          getAllColors(),
          getAllSizes(sizeQueryFromListing(state)),
        ]);
        if (cancelled) return;
        setColors(cRes?.data || []);
        setSizeSplit(
          splitContextualSizes(sRes?.data || [], sRes?.meta, state),
        );
      } catch {
        notifyOnFail("Could not load colors/sizes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.category_id, state.sub_category_id, state.inner_sub_category_id]);

  const rowCount = useMemo(
    () =>
      groups.reduce(
        (n, g) => n + (g.sizes || []).filter((s) => s.size_id || s.size?.id).length,
        0,
      ),
    [groups],
  );

  const updateGroup = (gi, partial) => {
    const next = groups.map((g, i) => (i === gi ? { ...g, ...partial } : g));
    setGroups(next);
  };

  const updateSize = (gi, si, partial) => {
    const next = groups.map((g, i) => {
      if (i !== gi) return g;
      const sizesNext = (g.sizes || []).map((s, j) =>
        j === si ? { ...s, ...partial } : s,
      );
      return { ...g, sizes: sizesNext };
    });
    setGroups(next);
  };

  const addColorQuick = async () => {
    const name = newColor.trim();
    if (!name) return;
    try {
      const res = await addColor({ name, code: "#808080" });
      if (res?.status === 1 && res?.data) {
        setColors((prev) => [...prev, res.data]);
        setNewColor("");
      }
    } catch {
      /* toasted */
    }
  };

  const addSizeQuick = async () => {
    const name = newSize.trim();
    if (!name) return;
    try {
      const res = await addSize({ name, type: "general" });
      if (res?.status === 1 && res?.data) {
        setSizeSplit((prev) => ({
          ...prev,
          all: [...prev.all, res.data],
          rest: [...prev.rest, res.data],
        }));
        setNewSize("");
      }
    } catch {
      /* toasted */
    }
  };

  const autoFillSkus = () => {
    const base = state.sku || "SKU";
    const next = groups.map((g) => {
      const colorName =
        colors.find((c) => String(c.id) === String(g.color_id))?.name ||
        g.color_name ||
        "";
      return {
        ...g,
        sizes: (g.sizes || []).map((s) => {
          const sizeName =
            sizes.find((z) => String(z.id) === String(s.size_id || s.size?.id))?.name || "";
          return {
            ...s,
            sku: s.sku || suggestVariantSku(base, [colorName, sizeName]),
            original_price: s.original_price || state.original_price,
            discounted_price: s.discounted_price || state.discounted_price,
          };
        }),
      };
    });
    setGroups(next);
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading colors & sizes…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-900">Color × Size matrix</h2>
          <p className="text-xs text-gray-500">
            Images attach per color and apply to all sizes of that color. Category sizes are listed first — you can still add, change, or remove any row.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={autoFillSkus}
            className="text-xs px-3 py-1.5 rounded-lg border"
          >
            Auto SKUs
          </button>
          <button
            type="button"
            onClick={() =>
              setGroups([
                ...groups,
                emptyColorGroup({
                  original_price: state.original_price,
                  discounted_price: state.discounted_price,
                  stock: state.stock,
                }),
              ])
            }
            className="text-xs px-3 py-1.5 rounded-lg bg-primary-100 text-white inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Color
          </button>
        </div>
      </div>

      {showNoCategorySizesHint ? (
        <div className="flex gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          This category has no sizes. Add them in Size & Color, pick a size below, or use a Single listing.
        </div>
      ) : null}

      {rowCount > 100 ? (
        <div className="flex gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {rowCount} rows — large matrix may be slow. Consider fewer colors/sizes.
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-2">
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder="Quick add color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
          />
          <button type="button" className="px-3 rounded-lg border text-sm" onClick={addColorQuick}>
            Add
          </button>
        </div>
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder="Quick add size"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
          />
          <button type="button" className="px-3 rounded-lg border text-sm" onClick={addSizeQuick}>
            Add
          </button>
        </div>
      </div>

      {groups.map((g, gi) => (
        <div key={gi} className="border rounded-xl p-4 space-y-3 bg-slate-50/50">
          <div className="flex flex-wrap gap-2 items-end">
            <label className="flex-1 min-w-[160px] space-y-1">
              <span className="text-xs font-medium text-gray-600">Color</span>
              <SearchablePicker
                compact
                value={g.color_id || g.color?.id || ""}
                onChange={(id) => {
                  const c = colors.find((x) => String(x.id) === String(id));
                  updateGroup(gi, { color_id: id, color_name: c?.name || "" });
                }}
                placeholder="Select color"
                searchPlaceholder="Search color…"
                options={colors.map((c) => ({ id: c.id, label: c.name }))}
              />
            </label>
            {groups.length > 1 ? (
              <button
                type="button"
                className="p-2 text-red-600"
                onClick={() => setGroups(groups.filter((_, i) => i !== gi))}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Images for this color</p>
            <div className="flex flex-wrap gap-2 items-center">
              {(g.media || []).map((f, fi) => (
                <div key={fi} className="relative w-16 h-16 rounded-lg overflow-hidden border bg-white">
                  <img
                    src={f instanceof File ? URL.createObjectURL(f) : ""}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-black/60 text-white text-[10px] px-1"
                    onClick={() =>
                      updateGroup(gi, {
                        media: g.media.filter((_, i) => i !== fi),
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="w-16 h-16 rounded-lg border border-dashed flex items-center justify-center cursor-pointer text-gray-400 hover:bg-white">
                <ImagePlus className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files || []).filter(
                      (f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024,
                    );
                    e.target.value = "";
                    updateGroup(gi, { media: [...(g.media || []), ...picked].slice(0, 8) });
                  }}
                />
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="py-2 pr-2">Size</th>
                  <th className="py-2 pr-2">MRP</th>
                  <th className="py-2 pr-2">Sell</th>
                  <th className="py-2 pr-2">Stock</th>
                  <th className="py-2 pr-2">SKU</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(g.sizes || []).map((s, si) => {
                  const mrpSell = validateMrpAndSelling(s.original_price, s.discounted_price);
                  const mrpErr = liveFieldError(mrpSell.original_price, s.original_price);
                  const sellErr = liveFieldError(mrpSell.discounted_price, s.discounted_price);
                  const stockErr = liveFieldError(validateStockQty(s.stock, "Stock"), s.stock);
                  return (
                  <tr key={si} className="border-b border-gray-100">
                    <td className="py-1.5 pr-2 min-w-[140px]">
                      <SearchablePicker
                        compact
                        value={s.size_id || s.size?.id || ""}
                        onChange={(id) => updateSize(gi, si, { size_id: id })}
                        placeholder="Size"
                        searchPlaceholder="Search size…"
                        options={sizeOptions}
                      />
                    </td>
                    <td className="py-1.5 pr-2 align-top">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        className={inputClsErr(mrpErr)}
                        value={s.original_price}
                        onChange={(e) =>
                          updateSize(gi, si, { original_price: e.target.value })
                        }
                      />
                      {mrpErr ? <p className="text-[10px] text-red-600 mt-0.5 leading-tight">{mrpErr}</p> : null}
                    </td>
                    <td className="py-1.5 pr-2 align-top">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        className={inputClsErr(sellErr)}
                        value={s.discounted_price}
                        onChange={(e) =>
                          updateSize(gi, si, { discounted_price: e.target.value })
                        }
                      />
                      {sellErr ? <p className="text-[10px] text-red-600 mt-0.5 leading-tight">{sellErr}</p> : null}
                    </td>
                    <td className="py-1.5 pr-2 align-top">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className={inputClsErr(stockErr)}
                        value={s.stock}
                        onChange={(e) => updateSize(gi, si, { stock: e.target.value })}
                      />
                      {stockErr ? <p className="text-[10px] text-red-600 mt-0.5 leading-tight">{stockErr}</p> : null}
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        className={inputCls}
                        value={s.sku}
                        onChange={(e) => updateSize(gi, si, { sku: e.target.value })}
                      />
                    </td>
                    <td className="py-1.5">
                      {(g.sizes || []).length > 1 || s.size_id || s.size?.id ? (
                        <button
                          type="button"
                          className="text-red-500"
                          onClick={() =>
                            updateGroup(gi, {
                              sizes:
                                (g.sizes || []).length > 1
                                  ? g.sizes.filter((_, i) => i !== si)
                                  : [
                                      emptySizeRow({
                                        original_price: state.original_price,
                                        discounted_price: state.discounted_price,
                                        stock: state.stock,
                                      }),
                                    ],
                            })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            <button
              type="button"
              className="mt-2 text-xs text-primary-100"
              onClick={() =>
                updateGroup(gi, {
                  sizes: [
                    ...(g.sizes || []),
                    emptySizeRow({
                      original_price: state.original_price,
                      discounted_price: state.discounted_price,
                      stock: state.stock,
                    }),
                  ],
                })
              }
            >
              + Add size row
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
