import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  GripVertical,
  HelpCircle,
  Package,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { getAllColors } from "../../../services/api.color";
import { getAllSizes } from "../../../services/api.size";
import { notifyOnFail, notifyOnSuccess } from "../../../utils/notification/toast";
import SearchablePicker from "./SearchablePicker";
import {
  generateColorSizeCombinations,
  flattenColorSizeVariants,
  selectedVariationColorIds,
  selectedVariationSizeIds,
  sizeQueryFromListing,
  splitContextualSizes,
  sizePickerOptions,
  suggestColorSizeSku,
  availableSizeIdsForColor,
  unionSizeIdsFromAvailability,
  seedFirstColorSizesFromListing,
  toggleColorSizeAvailability,
  combinationSignature,
  reorderFlattenedVariants,
  patchColorGroupSize,
} from "./utils/variationHelpers";
import { liveFieldError, validateMrpAndSelling, validateStockQty } from "./utils/listingFieldValidation";
import {
  resolveMediaUrl,
  seedFirstColorFromPrimaryGallery,
  primaryGalleryPhotoEntries,
  firstColorMirrorsPrimaryGallery,
} from "./utils/listingMediaCache";
import PrimaryProductGallery from "./PrimaryProductGallery";

const NAVY = "#1A2B48";
const ORANGE = "#F56C43";
const PEACH = "#FFF5F0";
const PEACH_BORDER = "#FDE4D8";
const CARD_BORDER = "#E5E7EB";
const MUTED = "#8C97A8";
const DASH = "#F4B183";
const cardStyle = {
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};

const inputCls =
  "rounded-md border border-gray-200 px-1.5 py-1 text-[12px] leading-tight focus:outline-none focus:ring-2 focus:ring-primary-100/30";
const skuInputCls = `${inputCls} w-[128px]`;
const numInputCls = `${inputCls} w-[56px] tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;

function inputClsErr(error, extra = inputCls) {
  return error ? `${extra} border-red-400 bg-red-50` : extra;
}

function swatchColor(color) {
  const code = color?.code || color?.color_code;
  if (code && /^#?[0-9a-f]{3,8}$/i.test(String(code).trim())) {
    return String(code).startsWith("#") ? code : `#${code}`;
  }
  const name = String(color?.name || color?.color_name || "").toLowerCase();
  const map = {
    black: "#111827",
    white: "#F9FAFB",
    blue: "#2563EB",
    olive: "#4B5320",
    navy: "#1A2B48",
    red: "#DC2626",
    green: "#16A34A",
    grey: "#6B7280",
    gray: "#6B7280",
    pink: "#EC4899",
    beige: "#D4B896",
    brown: "#92400E",
    yellow: "#EAB308",
    orange: "#F56C43",
  };
  return map[name] || "#D1D5DB";
}

function SelectionSummary({ state }) {
  const chips = [
    ["Brand Type", state.brandType === "generic" ? "Generic Product" : "Branded Product"],
    ["Listing Type", "Color & Size Variation Listing"],
    ["Category", state.categoryTitle || "—"],
    ["Sub-Category", state.subCategoryTitle || "—"],
    ["Inner Sub-Category", state.innerSubCategoryTitle || "—"],
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
      {chips.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg px-2.5 py-2"
          style={{ backgroundColor: PEACH, border: `1px solid ${PEACH_BORDER}` }}
        >
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 leading-none">{label}</p>
          <p className="text-[11.5px] font-semibold mt-1 truncate leading-tight" style={{ color: NAVY }} title={value}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function pickImageFiles(picked) {
  return Array.from(picked || []).filter(
    (f) => f.type?.startsWith("image/") && f.size <= 5 * 1024 * 1024,
  );
}

function VariantImagesPanel({
  title,
  help,
  subtitle,
  cards,
  emptyHint,
  panelRef,
  firstInputRef,
}) {
  return (
    <aside ref={panelRef} className="bg-white" style={{ ...cardStyle, padding: "10px 12px 10px" }}>
      <h3 className="text-[13px] font-bold inline-flex items-center gap-1.5" style={{ color: NAVY }}>
        {title}
        <span title={help} className="text-slate-300">
          <HelpCircle className="w-3.5 h-3.5" />
        </span>
      </h3>
      <p className="text-[10px] mt-0.5 mb-2 leading-snug" style={{ color: MUTED }}>
        {subtitle}
      </p>
      {cards.length ? (
        <div className="grid grid-cols-2 gap-1.5">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className="rounded-lg p-2 min-w-0"
              style={{ border: `1px solid ${CARD_BORDER}` }}
            >
              <p
                className="text-[11px] font-semibold mb-1.5 inline-flex items-center gap-1.5 min-w-0"
                style={{ color: NAVY }}
              >
                {card.swatch}
                <span className="truncate">
                  {card.label} ({card.thumbs.length})
                </span>
              </p>
              {card.extra}
              <div className="flex flex-wrap gap-1">
                {card.thumbs.map((t, i) => (
                  <div key={i} className="relative w-9 h-9 rounded-md overflow-hidden border bg-white">
                    {t.src ? <img src={t.src} alt="" className="w-full h-full object-cover" /> : null}
                    {t.locked || card.readOnly ? null : (
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-black/55 text-white p-0.5"
                        onClick={() => card.onRemove(t)}
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
                {card.readOnly ? null : card.plusOpensSizePicker ? (
                <button
                  type="button"
                  className="w-9 h-9 rounded-md border border-dashed flex items-center justify-center"
                  style={{ borderColor: DASH, backgroundColor: PEACH }}
                  title="Add size"
                  onClick={card.onPlus}
                >
                  <Plus className="w-3.5 h-3.5" style={{ color: ORANGE }} />
                </button>
                ) : (
                <label
                  className="w-9 h-9 rounded-md border border-dashed flex items-center justify-center cursor-pointer"
                  style={{ borderColor: DASH, backgroundColor: PEACH }}
                >
                  <Plus className="w-3.5 h-3.5" style={{ color: ORANGE }} />
                  <input
                    ref={index === 0 ? firstInputRef : undefined}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      card.onAdd(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px]" style={{ color: MUTED }}>
          {emptyHint}
        </p>
      )}
    </aside>
  );
}

function stockStatusPatch(qty) {
  if (qty === "" || qty == null) return {};
  const n = Number(qty);
  if (!Number.isFinite(n)) return {};
  if (n <= 0) return { status: "out_of_stock", enabled: false };
  return { status: "in_stock", enabled: true };
}

function VariantStockPanel({
  colorIds,
  sizeIds,
  colors,
  sizes,
  groups,
  availability,
  parentStock,
  onSetStock,
  onFillEmpty,
}) {
  if (!colorIds.length || !sizeIds.length) {
    return (
      <section className="bg-white" style={{ ...cardStyle, padding: "8px 10px 8px" }}>
        <h3 className="text-[11px] font-bold inline-flex items-center gap-1" style={{ color: NAVY }}>
          <Package className="w-3 h-3" style={{ color: ORANGE }} />
          Update Variant Stock
        </h3>
        <p className="text-[9px] mt-0.5" style={{ color: MUTED }}>
          Select colors and sizes first.
        </p>
      </section>
    );
  }

  const cards = colorIds.map((colorId) => {
    const color = colors.find((c) => String(c.id) === String(colorId));
    const g = groups.find((row) => String(row.color_id || row.color?.id) === String(colorId));
    const gi = groups.findIndex((row) => String(row.color_id || row.color?.id) === String(colorId));
    const offered = availableSizeIdsForColor(colorId, sizeIds, availability);
    const cells = offered.map((sizeId) => {
      const size = sizes.find((z) => String(z.id) === String(sizeId));
      const si = (g?.sizes || []).findIndex(
        (s) => String(s.size_id || s.size?.id) === String(sizeId),
      );
      const row = si >= 0 ? g.sizes[si] : null;
      const offeredHere = offered.includes(String(sizeId)) && gi >= 0 && si >= 0;
      const qty = row?.stock ?? "";
      const n = Number(qty);
      const stockErr =
        !offeredHere || !row || row.status === "out_of_stock"
          ? null
          : liveFieldError(validateStockQty(qty, "Stock"), qty);
      return {
        sizeId,
        sizeName: size?.name || "Size",
        offered: offeredHere,
        gi,
        si,
        qty,
        stockErr,
        units: Number.isFinite(n) && n > 0 ? n : 0,
      };
    });
    const total = cells.reduce((sum, c) => sum + (c.offered ? c.units : 0), 0);
    return {
      colorId,
      colorName: color?.name || g?.color_name || "Color",
      swatch: swatchColor(color || g || { color_name: color?.name }),
      cells,
      total,
    };
  });
  const grandTotal = cards.reduce((sum, card) => sum + card.total, 0);

  return (
    <section className="bg-white" style={{ ...cardStyle, padding: "8px 10px 8px" }}>
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <h3 className="text-[11px] font-bold inline-flex items-center gap-1" style={{ color: NAVY }}>
          <Package className="w-3 h-3" style={{ color: ORANGE }} />
          Update Variant Stock
          <span title="Units on hand for each color × size." className="text-slate-300">
            <HelpCircle className="w-3 h-3" />
          </span>
        </h3>
        <div className="flex items-center gap-1.5">
          <p className="text-[9px] font-semibold" style={{ color: MUTED }}>
            <span className="tabular-nums" style={{ color: NAVY }}>{grandTotal}</span> units
          </p>
          {parentStock !== "" && parentStock != null ? (
            <button
              type="button"
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{ color: ORANGE, border: `1px solid ${PEACH_BORDER}` }}
              onClick={onFillEmpty}
            >
              Fill empty
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {cards.map((card, cardIndex) => (
          <div
            key={card.colorId}
            className="rounded-md p-1.5 min-w-0"
            style={{ border: `1px solid ${CARD_BORDER}` }}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <p className="text-[10px] font-semibold inline-flex items-center gap-1 min-w-0" style={{ color: NAVY }}>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: card.swatch, border: "1px solid #E5E7EB" }}
                />
                <span className="truncate">{card.colorName}</span>
              </p>
              <span className="text-[9px] font-semibold tabular-nums shrink-0" style={{ color: MUTED }}>
                {card.total}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-0.5">
              {card.cells.map((cell) => (
                <label
                  key={cell.sizeId}
                  className="flex items-center justify-between gap-0.5 rounded px-1 py-0.5"
                  style={{
                    backgroundColor: cardIndex === 0 || cell.offered ? "#FAFBFC" : "#F8FAFC",
                    border: `1px solid ${CARD_BORDER}`,
                    opacity: cardIndex === 0 || cell.offered ? 1 : 0.45,
                  }}
                >
                  <span className="text-[9px] font-semibold leading-none" style={{ color: NAVY }}>
                    {cell.sizeName}
                  </span>
                  {cardIndex === 0 || cell.offered ? (
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={inputClsErr(
                        cell.stockErr,
                        `${inputCls} w-[36px] px-0.5 py-px text-[10px] leading-tight text-right tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`,
                      )}
                      value={cell.qty}
                      title={cell.stockErr || undefined}
                      onChange={(e) =>
                        onSetStock(cell.gi, cell.si, e.target.value, {
                          colorId: card.colorId,
                          sizeId: cell.sizeId,
                        })
                      }
                    />
                  ) : (
                    <span className="text-[9px] text-slate-300">—</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TagChip({ label, swatch, onRemove }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full pl-1.5 pr-1 py-px text-[11px] font-medium bg-white shrink-0 whitespace-nowrap"
      style={{ border: `1px solid ${PEACH_BORDER}`, color: NAVY }}
    >
      {swatch ? (
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            backgroundColor: swatch,
            border: swatch.toLowerCase() === "#f9fafb" ? "1px solid #D1D5DB" : "none",
          }}
        />
      ) : null}
      {label}
      <button
        type="button"
        className="w-3.5 h-3.5 rounded-full text-slate-400 hover:text-slate-700 leading-none"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
      >
        ×
      </button>
    </span>
  );
}

export default function VariationListingCanvas({
  state,
  patch,
  fieldError,
  onGenerateAi,
  aiGenerating,
  categorySuggesting,
}) {
  const [colors, setColors] = useState([]);
  const [sizeSplit, setSizeSplit] = useState({
    all: [],
    contextual: [],
    rest: [],
    totalContextual: 0,
  });
  const colorIdsKey = selectedVariationColorIds(state).join(",");
  const colorIds = useMemo(() => colorIdsKey.split(",").filter(Boolean), [colorIdsKey]);
  const [sizeIds, setSizeIds] = useState(() => selectedVariationSizeIds(state));
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(() =>
    flattenColorSizeVariants(state.colorGroups || []).some((r) => String(r.size?.sku || "").trim()),
  );
  const [sizePickerColorId, setSizePickerColorId] = useState(null);
  const colorImagesRef = useRef(null);
  const colorImagesInputRef = useRef(null);
  const sizeImagesRef = useRef(null);
  const sizeImagesInputRef = useRef(null);
  const groupsRef = useRef(state.colorGroups || []);
  const dragIndexRef = useRef(null);

  const sizes = sizeSplit.all;
  const sizeOptions = useMemo(() => sizePickerOptions(sizeSplit), [sizeSplit]);
  const groups = state.colorGroups || [];
  groupsRef.current = groups;
  const variants = useMemo(() => flattenColorSizeVariants(groups), [groups]);
  const visible = useMemo(() => {
    if (showAll) return variants;
    const used = new Map();
    return variants.filter((row) => {
      const key = String(row.group?.color_id || row.group?.color?.id || row.gi);
      const n = used.get(key) || 0;
      if (n >= 5) return false;
      used.set(key, n + 1);
      return true;
    });
  }, [showAll, variants]);
  const defaults = {
    original_price: state.original_price,
    discounted_price: state.discounted_price,
    stock: state.stock,
  };
  const baseSku = state.sku || (state.innerSubCategoryTitle || "SKU").replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "SKU";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [cRes, sRes] = await Promise.all([
          getAllColors({ silent: true }),
          getAllSizes(sizeQueryFromListing(state), { silent: true }),
        ]);
        if (cancelled) return;
        setColors(cRes?.data || []);
        setSizeSplit(splitContextualSizes(sRes?.data || [], sRes?.meta, state));
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

  const categorySizeKey = selectedVariationSizeIds(state).join(",");

  useEffect(() => {
    if (!categorySizeKey) return;
    setSizeIds(categorySizeKey.split(",").filter(Boolean));
  }, [categorySizeKey]);

  useEffect(() => {
    if (!colorIds.length || !sizeIds.length) return;
    const next = seedFirstColorSizesFromListing(
      state.colorSizeAvailability,
      colorIds,
      sizeIds,
    );
    if (next === state.colorSizeAvailability) return;
    patch({ colorSizeAvailability: next });
    // Category Size (e.g. Free size) must show on Attribute 2 for the first color.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorIdsKey, categorySizeKey]);

  const setGroups = (colorGroups, extra = {}) => {
    groupsRef.current = colorGroups;
    patch({ colorGroups, ...extra });
  };

  const buildCombinations = (existingGroups = groupsRef.current) => {
    const sizesByColor = Object.fromEntries(
      colorIds.map((id) => [
        id,
        availableSizeIdsForColor(id, sizeIds, state.colorSizeAvailability),
      ]),
    );
    return {
      sizesByColor,
      next: generateColorSizeCombinations({
        colorIds,
        sizeIds,
        sizesByColor,
        existingGroups,
        colors,
        sizes,
        defaults,
        baseSku,
      }),
    };
  };

  const applyCombinations = (next, { toast = false } = {}) => {
    const firstColor = colors.find((c) => String(c.id) === String(colorIds[0]));
    const combo = next.reduce((n, g) => n + (g.sizes || []).length, 0);
    const seeded = seedFirstColorFromPrimaryGallery(
      { ...state, colorGroups: next },
      colorIds,
    );
    const colorGroups = seeded.colorGroups;
    if (combo) setHasGenerated(true);
    setGroups(colorGroups, {
      size_ids: sizeIds,
      size_id: sizeIds[0] || "",
      color_ids: colorIds,
      color_id: colorIds[0] || "",
      color_name: firstColor?.name || "",
    });
    if (toast) notifyOnSuccess(`${combo} variant combinations generated`);
    return combo;
  };

  useEffect(() => {
    if (!colorIds.length) return;
    const { sizesByColor, next } = buildCombinations();
    if (!Object.values(sizesByColor).some((ids) => ids.length)) return;
    if (combinationSignature(groupsRef.current) === combinationSignature(next)) return;
    applyCombinations(next);
    // Keep the table in sync with Attribute Builder / size availability.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorIds, sizeIds, state.colorSizeAvailability, colors, sizes, baseSku]);

  useEffect(() => {
    if (!colorIds.length) return;
    const { colorGroups, changed } = seedFirstColorFromPrimaryGallery(
      { ...state, colorGroups: groupsRef.current },
      colorIds,
    );
    if (!changed) return;
    groupsRef.current = colorGroups;
    patch({ colorGroups });
    // First color (e.g. Sky Blue) inherits the Primary Gallery cover; others stay empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    colorIdsKey,
    state.files,
    state.existingMedia,
    state.mediaLabels,
    state.skipPrimaryColorImageDefault,
  ]);

  const updateSize = (gi, si, partial) => {
    patch((prev) => {
      const current = prev.colorGroups || groupsRef.current || [];
      const colorGroups = patchColorGroupSize(current, gi, si, partial);
      groupsRef.current = colorGroups;
      return { colorGroups };
    });
  };

  const setVariantStock = (gi, si, qty, meta = {}) => {
    const extra = stockStatusPatch(qty);
    if (gi >= 0 && si >= 0) {
      updateSize(gi, si, { stock: qty, ...extra });
      return;
    }
    const colorId = String(meta.colorId || "");
    const sizeId = String(meta.sizeId || "");
    if (!colorId || !sizeId) return;
    patch((prev) => {
      const current = [...(prev.colorGroups || groupsRef.current || [])];
      const color = colors.find((c) => String(c.id) === colorId);
      let index = current.findIndex(
        (g) => String(g.color_id || g.color?.id) === colorId,
      );
      if (index < 0) {
        current.push({
          color_id: colorId,
          color_name: color?.name || "",
          media: [],
          existingMedia: [],
          sizes: [],
        });
        index = current.length - 1;
      }
      const g = current[index];
      const sizeRows = [...(g.sizes || [])];
      const size = sizes.find((z) => String(z.id) === sizeId);
      const sizeName = size?.name || "";
      const sIndex = sizeRows.findIndex(
        (s) => String(s.size_id || s.size?.id) === sizeId,
      );
      if (sIndex < 0) {
        sizeRows.push({
          size_id: sizeId,
          size: { id: sizeId, name: sizeName },
          stock: qty,
          original_price: prev.original_price ?? "",
          discounted_price: prev.discounted_price ?? "",
          sku: suggestColorSizeSku(baseSku, g.color_name || color?.name || "", sizeName),
          barcode: "",
          status: extra.status || "in_stock",
          enabled: extra.enabled !== false,
          ...extra,
        });
      } else {
        sizeRows[sIndex] = { ...sizeRows[sIndex], stock: qty, ...extra };
      }
      current[index] = { ...g, sizes: sizeRows };
      groupsRef.current = current;
      return { colorGroups: current };
    });
  };

  const addSizeId = (id, colorId = null) => {
    const sid = String(id || "");
    const target = String(colorId || colorIds[0] || "");
    if (!sid || !target) return;
    const current = Array.isArray(state.colorSizeAvailability?.[target])
      ? state.colorSizeAvailability[target].map(String)
      : [];
    if (current.includes(sid)) return;
    const nextAvail = {
      ...state.colorSizeAvailability,
      [target]: [...current, sid],
    };
    const nextIds = unionSizeIdsFromAvailability(nextAvail, colorIds);
    setSizeIds(nextIds);
    patch({
      size_ids: nextIds,
      size_id: nextIds[0] || "",
      colorSizeAvailability: nextAvail,
    });
  };

  const removeSizeFromColor = (id, colorId) => {
    const sid = String(id || "");
    const target = String(colorId || colorIds[0] || "");
    if (!sid || !target) return;
    const current = Array.isArray(state.colorSizeAvailability?.[target])
      ? state.colorSizeAvailability[target].map(String)
      : [];
    const nextAvail = {
      ...state.colorSizeAvailability,
      [target]: current.filter((x) => x !== sid),
    };
    const nextIds = unionSizeIdsFromAvailability(nextAvail, colorIds);
    setSizeIds(nextIds);
    patch({
      size_ids: nextIds,
      size_id: nextIds[0] || "",
      colorSizeAvailability: nextAvail,
    });
  };

  const fillEmptyStockFromParent = () => {
    const qty = state.stock;
    if (qty === "" || qty == null) return;
    patch((prev) => {
      const current = prev.colorGroups || groupsRef.current || [];
      const extra = stockStatusPatch(qty);
      const colorGroups = current.map((g) => {
        const colorId = String(g.color_id || g.color?.id || "");
        const offered = availableSizeIdsForColor(colorId, sizeIds, prev.colorSizeAvailability);
        return {
          ...g,
          sizes: (g.sizes || []).map((s) => {
            const sizeId = String(s.size_id || s.size?.id || "");
            if (!offered.includes(sizeId)) return s;
            if (s.stock !== "" && s.stock != null) return s;
            return { ...s, stock: qty, ...extra };
          }),
        };
      });
      groupsRef.current = colorGroups;
      return { colorGroups };
    });
  };

  const updateGroup = (gi, partial) => {
    patch((prev) => {
      const current = prev.colorGroups || groupsRef.current || [];
      const colorGroups = current.map((g, i) => (i === gi ? { ...g, ...partial } : g));
      groupsRef.current = colorGroups;
      return { colorGroups };
    });
  };

  const applyColorIds = (nextIds) => {
    const unique = [...new Set((nextIds || []).map(String).filter(Boolean))];
    const keep = new Set(unique);
    const first = colors.find((c) => String(c.id) === String(unique[0]));
    const current = groupsRef.current || [];
    const colorGroups = current.filter((g) => keep.has(String(g.color_id || g.color?.id)));
    groupsRef.current = colorGroups;
    const nextAvail = { ...(state.colorSizeAvailability || {}) };
    for (const id of unique) {
      if (!Array.isArray(nextAvail[id])) nextAvail[id] = [];
    }
    for (const key of Object.keys(nextAvail)) {
      if (!keep.has(key)) delete nextAvail[key];
    }
    patch({
      color_ids: unique,
      color_id: unique[0] || "",
      color_name: first?.name || "",
      colorGroups,
      colorSizeAvailability: nextAvail,
    });
  };

  const reorderVariants = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    patch((prev) => {
      const colorGroups = reorderFlattenedVariants(prev.colorGroups || groupsRef.current, fromIndex, toIndex);
      groupsRef.current = colorGroups;
      return { colorGroups };
    });
  };

  const addMedia = (gi, picked) => {
    const files = pickImageFiles(picked);
    if (!files.length) return;
    patch((prev) => {
      const current = prev.colorGroups || groupsRef.current || [];
      const firstId = String(colorIds[0] || "");
      const colorGroups = current.map((row, i) => {
        if (i !== gi) return row;
        const rowId = String(row.color_id || row.color?.id || "");
        const mirroring =
          firstId &&
          rowId === firstId &&
          firstColorMirrorsPrimaryGallery(prev, row);
        return {
          ...row,
          media: [...(row.media || []), ...files].slice(0, 8),
          existingMedia: row.existingMedia || [],
          usesPrimaryCoverDefault: mirroring,
          primaryCoverFingerprint: mirroring ? row.primaryCoverFingerprint || "" : "",
        };
      });
      groupsRef.current = colorGroups;
      return { colorGroups };
    });
  };

  const sizeMediaMap = state.sizeMedia || {};

  const patchSizeBucket = (key, nextBucket) => {
    patch({
      sizeMedia: {
        ...sizeMediaMap,
        [String(key)]: nextBucket,
      },
    });
  };

  const addMediaToColor = (colorId, picked) => {
    const gi = groups.findIndex((g) => String(g.color_id || g.color?.id) === String(colorId));
    if (gi >= 0) {
      addMedia(gi, picked);
      return;
    }
    const files = pickImageFiles(picked);
    if (!files.length) return;
    const color = colors.find((c) => String(c.id) === String(colorId));
    setGroups([
      ...groups,
      {
        color_id: colorId,
        color_name: color?.name || "",
        media: files.slice(0, 8),
        existingMedia: [],
        sizes: [],
        usesPrimaryCoverDefault: false,
        primaryCoverFingerprint: "",
      },
    ]);
  };

  const addMediaToSize = (colorId, picked) => {
    const files = pickImageFiles(picked);
    if (!files.length) return;
    const key = String(colorId);
    const bucket = sizeMediaMap[key] || { media: [], existingMedia: [] };
    patchSizeBucket(key, {
      existingMedia: bucket.existingMedia || [],
      media: [...(bucket.media || []), ...files].slice(0, 8),
    });
  };

  const thumbSrc = (t) =>
    t.existing
      ? resolveMediaUrl(t.existing.url)
      : t.file instanceof File
        ? URL.createObjectURL(t.file)
        : "";

  const galleryEntries = primaryGalleryPhotoEntries(state);

  const colorImageCards = colorIds.map((id, colorIndex) => {
    const gi = groups.findIndex((g) => String(g.color_id || g.color?.id) === String(id));
    const g = gi >= 0 ? groups[gi] : null;
    const color = colors.find((c) => String(c.id) === String(id));
    const label = color?.name || g?.color_name || "Color";
    const isPrimaryVariant = colorIndex === 0;
    const thumbs = isPrimaryVariant
      ? galleryEntries.map((entry, fi) =>
          entry.file
            ? { file: entry.file, fi, locked: true }
            : { existing: entry.existing, fi, locked: true },
        )
      : [
          ...(g?.existingMedia || []).map((m, fi) => ({ existing: m, fi })),
          ...(g?.media || []).map((file, fi) => ({ file, fi })),
        ];
    return {
      id,
      label,
      readOnly: isPrimaryVariant,
      swatch: (
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            backgroundColor: swatchColor(color || g || { color_name: label }),
            border: "1px solid #E5E7EB",
          }}
        />
      ),
      thumbs: thumbs.map((t) => ({ ...t, src: thumbSrc(t) })),
      onAdd: isPrimaryVariant ? () => {} : (files) => addMediaToColor(id, files),
      onRemove: (t) => {
        if (isPrimaryVariant || gi < 0) return;
        const clearingDefault = !!g?.usesPrimaryCoverDefault;
        if (t.existing) {
          const mediaId = t.existing.id;
          const existingMedia = (g.existingMedia || []).filter((_, x) => x !== t.fi);
          updateGroup(gi, {
            existingMedia,
            usesPrimaryCoverDefault: false,
            primaryCoverFingerprint: "",
          });
          if (mediaId) {
            patch({
              deleteMediaIds: [...new Set([...(state.deleteMediaIds || []), mediaId])],
              ...(clearingDefault ? { skipPrimaryColorImageDefault: true } : {}),
            });
          } else if (clearingDefault) {
            patch({ skipPrimaryColorImageDefault: true });
          }
        } else {
          updateGroup(gi, {
            media: (g.media || []).filter((_, x) => x !== t.fi),
            usesPrimaryCoverDefault: false,
            primaryCoverFingerprint: "",
          });
          if (clearingDefault) patch({ skipPrimaryColorImageDefault: true });
        }
      },
    };
  });

  const sizeImageCards = colorIds.map((colorId, colorIndex) => {
    const color = colors.find((c) => String(c.id) === String(colorId));
    const g = groups.find((row) => String(row.color_id || row.color?.id) === String(colorId));
    const colorName = color?.name || g?.color_name || "Color";
    const key = String(colorId);
    const isPrimarySizeSection = colorIndex === 0;
    const bucket = sizeMediaMap[key] || { media: [], existingMedia: [] };
    const available = availableSizeIdsForColor(colorId, sizeIds, state.colorSizeAvailability);
    const thumbs = [
      ...(bucket.existingMedia || []).map((m, fi) => ({ existing: m, fi })),
      ...(bucket.media || []).map((file, fi) => ({ file, fi })),
    ];
    return {
      id: key,
      label: colorName,
      readOnly: isPrimarySizeSection,
      swatch: (
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            backgroundColor: swatchColor(color || g || { color_name: colorName }),
            border: "1px solid #E5E7EB",
          }}
        />
      ),
      extra: available.length ? (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {available.map((sizeId) => {
            const size = sizes.find((z) => String(z.id) === String(sizeId));
            const on = isPrimarySizeSection || available.includes(String(sizeId));
            if (isPrimarySizeSection) {
              return (
                <span
                  key={sizeId}
                  className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold leading-none"
                  style={{ backgroundColor: PEACH, color: NAVY, border: `1px solid ${PEACH_BORDER}` }}
                >
                  {size?.name || "Size"}
                </span>
              );
            }
            return (
              <button
                key={sizeId}
                type="button"
                className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold leading-none"
                style={
                  on
                    ? { backgroundColor: PEACH, color: NAVY, border: `1px solid ${PEACH_BORDER}` }
                    : { backgroundColor: "#fff", color: MUTED, border: `1px solid ${CARD_BORDER}` }
                }
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  patch({
                    colorSizeAvailability: toggleColorSizeAvailability(
                      state.colorSizeAvailability,
                      colorId,
                      sizeId,
                      sizeIds,
                    ),
                  });
                }}
              >
                {size?.name || "Size"}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] mb-1.5" style={{ color: MUTED }}>
          Add sizes in Configure Product Variations.
        </p>
      ),
      thumbs: thumbs.map((t) => ({ ...t, src: thumbSrc(t) })),
      plusOpensSizePicker: !isPrimarySizeSection,
      onPlus: isPrimarySizeSection ? undefined : () => setSizePickerColorId(String(colorId)),
      onAdd: (files) => addMediaToSize(colorId, files),
      onRemove: (t) => {
        if (t.existing) {
          const mediaId = t.existing.id;
          patchSizeBucket(key, {
            media: bucket.media || [],
            existingMedia: (bucket.existingMedia || []).filter((_, x) => x !== t.fi),
          });
          if (mediaId) {
            patch({
              deleteMediaIds: [...new Set([...(state.deleteMediaIds || []), mediaId])],
            });
          }
        } else {
          patchSizeBucket(key, {
            existingMedia: bucket.existingMedia || [],
            media: (bucket.media || []).filter((_, x) => x !== t.fi),
          });
        }
      },
    };
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <SelectionSummary state={state} />
        <PrimaryProductGallery
          compact
          state={state}
          patch={patch}
          onGenerateAi={onGenerateAi}
          aiGenerating={aiGenerating}
          categorySuggesting={categorySuggesting}
        />
        <p className="text-sm text-gray-500 px-1">Loading colors & sizes…</p>
      </div>
    );
  }

  const colorCount = colorIds.length;
  const firstColorSizeIds = colorIds[0]
    ? availableSizeIdsForColor(colorIds[0], sizeIds, state.colorSizeAvailability)
    : [];
  const sizeCount = firstColorSizeIds.length;
  const comboCount = colorIds.reduce(
    (n, id) => n + availableSizeIdsForColor(id, sizeIds, state.colorSizeAvailability).length,
    0,
  );
  const generated = hasGenerated && variants.length > 0 && variants.length === comboCount;

  return (
    <div className="space-y-4">
      <SelectionSummary state={state} />

      <PrimaryProductGallery
        compact
        state={state}
        patch={patch}
        onGenerateAi={onGenerateAi}
        aiGenerating={aiGenerating}
        categorySuggesting={categorySuggesting}
      />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] gap-4 items-start">
        <div className="min-w-0 space-y-4">
        <section className="bg-white p-4 min-w-0 overflow-hidden" style={cardStyle}>
          <div className="mb-4">
            <h3 className="text-[16px] font-extrabold" style={{ color: NAVY }}>
              Configure Product Variations
            </h3>
            <p className="text-[12px] mt-1" style={{ color: MUTED }}>
              Attribute Builder
            </p>
          </div>
          <div className="space-y-3">
            <AttributeRow
              index={1}
              typeLabel="Color"
              picker={
                <SearchablePicker
                  compact
                  value=""
                  allowClear={false}
                  onChange={(id) => {
                    if (!id) return;
                    const sid = String(id);
                    if (colorIds.includes(sid)) return;
                    applyColorIds([...colorIds, sid]);
                  }}
                  placeholder="Add color"
                  searchPlaceholder="Search color…"
                  options={colors
                    .filter((c) => !colorIds.includes(String(c.id)))
                    .map((c) => ({ id: c.id, label: c.name }))}
                />
              }
              tags={colorIds.map((id) => {
                const c = colors.find((x) => String(x.id) === String(id));
                return (
                  <TagChip
                    key={id}
                    label={c?.name || id}
                    swatch={swatchColor(c)}
                    onRemove={() => applyColorIds(colorIds.filter((x) => String(x) !== String(id)))}
                  />
                );
              })}
            />
            <AttributeRow
              index={2}
              typeLabel="Size"
              picker={
                <SearchablePicker
                  compact
                  value=""
                  allowClear={false}
                  onChange={(id) => addSizeId(id)}
                  placeholder="Add size"
                  searchPlaceholder="Search size…"
                  options={sizeOptions.filter((o) => !firstColorSizeIds.includes(String(o.id)))}
                />
              }
              tags={firstColorSizeIds.map((id) => {
                const z = sizes.find((x) => String(x.id) === String(id));
                return (
                  <TagChip
                    key={id}
                    label={z?.name || id}
                    onRemove={() => removeSizeFromColor(id, colorIds[0])}
                  />
                );
              })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              type="button"
              className="text-[13px] font-semibold px-3.5 py-2 rounded-lg bg-white"
              style={{ color: ORANGE, border: `1.5px solid ${ORANGE}` }}
              onClick={() =>
                notifyOnFail("Color & Size listings use Color and Size. Choose Custom Variation for more attributes.")
              }
            >
              + Add Attribute
            </button>
          </div>
        </section>

        <section className="bg-white p-4 min-w-0 overflow-hidden" style={cardStyle}>
          <h3 className="text-[14.5px] font-extrabold inline-flex items-center gap-1.5 mb-1.5" style={{ color: NAVY }}>
            Variant Combinations ({variants.length})
            <span title="Each color and size pair is a sellable SKU." className="text-slate-300">
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </h3>
          {fieldError ? <p className="text-xs text-red-600 mb-1.5">{fieldError}</p> : null}
          {variants.length === 0 ? (
            <p className="text-[13px] text-slate-500 py-6 text-center">
              Select colors and sizes to build variant combinations.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] min-w-[760px]">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 border-b">
                      <th className="py-1 pr-2 font-semibold w-7" />
                      <th className="py-1 pr-2 font-semibold">Variant</th>
                      <th className="py-1 pr-2 font-semibold">SKU</th>
                      <th className="py-1 pr-2 font-semibold">Price (₹)</th>
                      <th className="py-1 pr-2 font-semibold">MRP (₹)</th>
                      <th className="py-1 pr-2 font-semibold">Stock</th>
                      <th className="py-1 pr-2 font-semibold">Status</th>
                      <th className="py-1 pr-2 font-semibold">Variant Images</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row, index) => {
                            const s = row.size;
                            const g = row.group;
                            const color = colors.find((c) => String(c.id) === String(g.color_id || g.color?.id));
                            const sizeName =
                              sizes.find((z) => String(z.id) === String(s.size_id || s.size?.id))?.name ||
                              s.size?.name ||
                              "";
                            const colorName = color?.name || g.color_name || "Color";
                            const mrpSell = validateMrpAndSelling(s.original_price, s.discounted_price);
                            const mrpErr = liveFieldError(mrpSell.original_price, s.original_price);
                            const sellErr = liveFieldError(mrpSell.discounted_price, s.discounted_price);
                            const stockErr =
                              s.status === "out_of_stock"
                                ? null
                                : liveFieldError(validateStockQty(s.stock, "Stock"), s.stock);
                            const isPrimaryVariant =
                              String(g.color_id || g.color?.id) === String(colorIds[0]);
                            const thumbs = isPrimaryVariant
                              ? galleryEntries
                                  .map((entry) =>
                                    entry.file instanceof File
                                      ? URL.createObjectURL(entry.file)
                                      : resolveMediaUrl(entry.existing?.url),
                                  )
                                  .filter(Boolean)
                              : [
                                  ...(g.existingMedia || []).map((m) => resolveMediaUrl(m.url)),
                                  ...(g.media || [])
                                    .map((f) => (f instanceof File ? URL.createObjectURL(f) : f?.url))
                                    .filter(Boolean),
                                ];
                            const status = s.status || (s.enabled === false ? "out_of_stock" : "in_stock");
                            const imageLabel = `${thumbs.length} image${thumbs.length === 1 ? "" : "s"}`;
                            const flatIndex = variants.findIndex((r) => r.gi === row.gi && r.si === row.si);
                            return (
                                  <tr
                                    key={`${row.gi}-${row.si}-${s.size_id || s.size?.id || index}`}
                                    className="border-b border-gray-100"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      const from = Number(e.dataTransfer.getData("text/plain"));
                                      reorderVariants(
                                        Number.isFinite(from) ? from : dragIndexRef.current,
                                        flatIndex,
                                      );
                                      dragIndexRef.current = null;
                                    }}
                                  >
                                    <td
                                      className="py-1.5 pr-1.5 align-middle text-slate-300 cursor-grab active:cursor-grabbing"
                                      draggable
                                      onDragStart={(e) => {
                                        dragIndexRef.current = flatIndex;
                                        e.dataTransfer.setData("text/plain", String(flatIndex));
                                        e.dataTransfer.effectAllowed = "move";
                                      }}
                                      title="Drag to reorder"
                                    >
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </td>
                                    <td className="py-1.5 pr-2 align-middle">
                                      <span
                                        className="inline-flex items-center gap-1 font-semibold text-[11px] whitespace-nowrap"
                                        style={{ color: NAVY }}
                                        title={`${colorName} / ${sizeName}`}
                                      >
                                        <span
                                          className="w-3 h-3 rounded-full shrink-0"
                                          style={{
                                            backgroundColor: swatchColor(color || g),
                                            border: "1px solid #E5E7EB",
                                          }}
                                        />
                                        {colorName} / {sizeName}
                                      </span>
                                    </td>
                                    <td className="py-1.5 pr-2 align-middle">
                                      <input
                                        className={skuInputCls}
                                        value={s.sku ?? ""}
                                        onChange={(e) => updateSize(row.gi, row.si, { sku: e.target.value })}
                                        placeholder={suggestColorSizeSku(baseSku, colorName, sizeName)}
                                      />
                                    </td>
                                    <td className="py-1.5 pr-2 align-middle">
                                      <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        className={inputClsErr(sellErr, numInputCls)}
                                        value={s.discounted_price ?? ""}
                                        title={sellErr || undefined}
                                        onChange={(e) =>
                                          updateSize(row.gi, row.si, { discounted_price: e.target.value })
                                        }
                                      />
                                    </td>
                                    <td className="py-1.5 pr-2 align-middle">
                                      <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        className={inputClsErr(mrpErr, numInputCls)}
                                        value={s.original_price ?? ""}
                                        title={mrpErr || undefined}
                                        onChange={(e) =>
                                          updateSize(row.gi, row.si, { original_price: e.target.value })
                                        }
                                      />
                                    </td>
                                    <td className="py-1.5 pr-2 align-middle">
                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        className={inputClsErr(stockErr, numInputCls)}
                                        value={s.stock ?? ""}
                                        title={stockErr || undefined}
                                        onChange={(e) => updateSize(row.gi, row.si, { stock: e.target.value })}
                                      />
                                    </td>
                                    <td className="py-1.5 pr-2 align-middle">
                                      <select
                                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold cursor-pointer appearance-auto"
                                        style={
                                          status === "in_stock"
                                            ? {
                                                backgroundColor: "#ECFDF3",
                                                color: "#067647",
                                                border: "1px solid #ABEFC6",
                                              }
                                            : {
                                                backgroundColor: "#F2F4F7",
                                                color: "#475467",
                                                border: "1px solid #D0D5DD",
                                              }
                                        }
                                        value={status}
                                        onChange={(e) =>
                                          updateSize(row.gi, row.si, {
                                            status: e.target.value,
                                            enabled: e.target.value !== "out_of_stock",
                                          })
                                        }
                                      >
                                        <option value="in_stock">In Stock</option>
                                        <option value="out_of_stock">Out of Stock</option>
                                      </select>
                                    </td>
                                    <td className="py-1.5 pr-2 align-middle">
                                      <div className="flex items-center gap-1">
                                        {thumbs.slice(0, 4).map((src, i) => (
                                          <img
                                            key={i}
                                            src={src}
                                            alt=""
                                            className="w-6 h-6 rounded object-cover border border-gray-100"
                                          />
                                        ))}
                                        {isPrimaryVariant ? (
                                          <span
                                            className="text-[10px] font-semibold whitespace-nowrap"
                                            style={{ color: MUTED }}
                                            title="Uses Primary Product Gallery photos"
                                          >
                                            {imageLabel}
                                          </span>
                                        ) : (
                                          <>
                                        <label
                                          className="text-[10px] font-semibold whitespace-nowrap cursor-pointer underline-offset-2 hover:underline"
                                          style={{ color: thumbs.length ? MUTED : ORANGE }}
                                        >
                                          {imageLabel}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                              addMedia(row.gi, e.target.files);
                                              e.target.value = "";
                                            }}
                                          />
                                        </label>
                                        <label
                                          className="w-6 h-6 rounded border border-dashed flex items-center justify-center cursor-pointer"
                                          style={{ borderColor: DASH, backgroundColor: PEACH, color: ORANGE }}
                                          title="Add variant images"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                              addMedia(row.gi, e.target.files);
                                              e.target.value = "";
                                            }}
                                          />
                                        </label>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                            );
                          })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between text-[11.5px] text-slate-500 mt-1.5">
                <span>
                  Showing {visible.length} of {variants.length} variants
                </span>
                {variants.length > 5 ? (
                  <button
                    type="button"
                    className="font-semibold"
                    style={{ color: ORANGE }}
                    onClick={() => setShowAll((v) => !v)}
                  >
                    {showAll ? "Show fewer" : "View All Variants"}
                  </button>
                ) : null}
              </div>
            </>
          )}
        </section>
        </div>

        <div className="space-y-2">
          <aside
            className="bg-white"
            style={{ ...cardStyle, padding: "10px 12px 10px", borderRadius: 10 }}
          >
            <p className="text-[11px] font-bold leading-none mb-2.5" style={{ color: NAVY }}>
              Variants Summary
            </p>
            <div className="grid grid-cols-2 gap-0">
              <div className="pr-2.5" style={{ borderRight: `1px solid ${CARD_BORDER}` }}>
                <p className="text-[10px] font-semibold leading-none" style={{ color: NAVY }}>
                  Color Options
                </p>
                <p className="text-[16px] font-extrabold tabular-nums leading-none mt-1.5" style={{ color: NAVY }}>
                  {colorCount}
                </p>
              </div>
              <div className="pl-2.5">
                <p className="text-[10px] font-semibold leading-none" style={{ color: NAVY }}>
                  Size Options
                </p>
                <p className="text-[16px] font-extrabold tabular-nums leading-none mt-1.5" style={{ color: NAVY }}>
                  {sizeCount}
                </p>
              </div>
            </div>
            <div className="pt-2 mt-2.5" style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
              <p className="text-[10px] font-semibold leading-none" style={{ color: NAVY }}>
                Total Variant Combinations
              </p>
              <p className="text-[22px] font-extrabold tabular-nums leading-none mt-1.5" style={{ color: NAVY }}>
                {comboCount}
              </p>
            </div>
            {generated ? (
              <p className="text-[10px] inline-flex items-center gap-1 mt-2.5 font-medium" style={{ color: "#22A06B" }}>
                <span
                  className="inline-flex h-[12px] w-[12px] items-center justify-center rounded-full shrink-0"
                  style={{ backgroundColor: "#22A06B" }}
                  aria-hidden
                >
                  <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.2 6.2 4.8 8.8 9.8 3.2"
                      stroke="#fff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                All combinations listed below
              </p>
            ) : (
              <p className="text-[10px] mt-2.5" style={{ color: MUTED }}>
                Combinations update as you add colors and sizes.
              </p>
            )}
          </aside>
          <VariantImagesPanel
            title="Variant Images by Color"
            help="The first color always uses every Primary Gallery photo and cannot be edited here. Upload photos for the other colors yourself."
            subtitle="Variant 1 mirrors the Primary Product Gallery. Add images for the other colors yourself."
            cards={colorImageCards}
            emptyHint="Select colors in Attribute Builder to add images per color."
            panelRef={colorImagesRef}
            firstInputRef={colorImagesInputRef}
          />
          <VariantImagesPanel
            title="Variant Images by Size"
            help="Tap + to add a size from the same size picker as Attribute 2. Then tap a size chip to turn it on or off for this color."
            subtitle="Tap + to add a size. Tap a size chip to turn it on or off for this color."
            cards={sizeImageCards}
            emptyHint="Select colors in Attribute Builder. Each color gets one size cell for availability and photos."
            panelRef={sizeImagesRef}
            firstInputRef={sizeImagesInputRef}
          />
          {sizePickerColorId ? (
            <SearchablePicker
              hideTrigger
              defaultOpen
              value=""
              allowClear={false}
              placeholder="Add size"
              searchPlaceholder="Search size…"
              options={sizeOptions.filter(
                (o) =>
                  !availableSizeIdsForColor(
                    sizePickerColorId,
                    sizeIds,
                    state.colorSizeAvailability,
                  ).includes(String(o.id)),
              )}
              onChange={(id) => addSizeId(id, sizePickerColorId)}
              onClose={() => setSizePickerColorId(null)}
            />
          ) : null}
          <VariantStockPanel
            colorIds={colorIds}
            sizeIds={sizeIds}
            colors={colors}
            sizes={sizes}
            groups={groups}
            availability={state.colorSizeAvailability}
            parentStock={state.stock}
            onSetStock={setVariantStock}
            onFillEmpty={fillEmptyStockFromParent}
          />
        </div>
      </div>

      <div className="rounded-2xl px-5 py-3.5" style={{ backgroundColor: PEACH, border: `1px solid ${PEACH_BORDER}` }}>
        <p className="text-[13px] font-bold inline-flex items-center gap-1.5 mb-2" style={{ color: NAVY }}>
          <Sparkles className="w-4 h-4" style={{ color: ORANGE }} />
          AI Help for Variation Listing
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {[
            "Variant Title",
            "Short Description",
            "Product Description",
            "Key Features",
            "Specifications",
            "What's in the Box",
            "SEO Details",
          ].map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5 text-[12px] text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {variants.length > 100 ? (
        <div className="flex gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Large matrix — consider fewer colors or sizes.
        </div>
      ) : null}
    </div>
  );
}

function AttributeRow({ index, typeLabel, picker, tags }) {
  return (
    <div
      className="flex flex-nowrap items-center gap-2 rounded-xl px-2.5 py-2 overflow-x-auto"
      style={{ border: `1px solid ${CARD_BORDER}`, backgroundColor: "#FAFBFC" }}
    >
      <span className="text-[11px] font-semibold text-slate-500 w-[72px] shrink-0">
        Attribute {index}
      </span>
      <span
        className="text-[12px] font-semibold px-2 py-1 rounded-md bg-white w-[58px] shrink-0 text-center"
        style={{ border: `1px solid ${CARD_BORDER}`, color: NAVY }}
      >
        {typeLabel}
      </span>
      <div className="flex flex-nowrap items-center gap-1 min-w-0 flex-1">
        {tags}
        <div className="w-[112px] shrink-0">{picker}</div>
      </div>
    </div>
  );
}
