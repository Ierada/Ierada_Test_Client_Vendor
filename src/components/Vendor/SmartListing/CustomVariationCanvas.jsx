import React, { useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { getAllAttributes } from "../../../services/api.attribute";
import { getAllColors } from "../../../services/api.color";
import { getAllSizes } from "../../../services/api.size";
import { notifyOnFail } from "../../../utils/notification/toast";
import { liveFieldError, validateMrpAndSelling, validateStockQty } from "./utils/listingFieldValidation";
import { resolveMediaUrl } from "./utils/listingMediaCache";
import {
  cartesianCustomRows,
  customAttrValues,
  customListingStats,
  customRowKey,
  customValueMediaKey,
  suggestVariantSku,
} from "./utils/variationHelpers";

const NAVY = "#1A2B48";
const ORANGE = "#F56C43";
const PEACH = "#FFF5F0";
const PEACH_BORDER = "#FDE4D8";
const CARD_BORDER = "#E6E8EE";
const MUTED = "#8C97A8";
const DASH = "#F4B183";
const MAX_BYTES = 5 * 1024 * 1024;

const cardStyle = {
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 14,
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};

const inputCls =
  "rounded-md border border-gray-200 bg-white px-2 py-1 text-[12px] leading-tight focus:outline-none focus:ring-2 focus:ring-[#F56C43]/20 focus:border-[#F56C43]";
const skuInputCls = `${inputCls} w-[132px]`;
const numInputCls = `${inputCls} w-[72px] tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;

function inputClsErr(error, extra = inputCls) {
  return error ? `${extra} border-red-400 bg-red-50` : extra;
}

const emptyAttr = () => ({ attribute_id: "", name: "", valuesText: "", values: [] });
const defaultAttrs = () => [emptyAttr(), emptyAttr(), emptyAttr(), emptyAttr()];

function photoLabel(index) {
  return index === 0 ? "front" : `extra${index}`;
}

function pickImageFiles(picked) {
  return Array.from(picked || []).filter(
    (f) => f.type?.startsWith("image/") && f.size <= MAX_BYTES,
  );
}

function entrySrc(entry) {
  if (entry?.existing?.url) return resolveMediaUrl(entry.existing.url);
  if (entry?.file instanceof File) return URL.createObjectURL(entry.file);
  return "";
}

function mediaForCustomRow(row, valueMedia) {
  const media = [];
  const existingMedia = [];
  for (const a of row.attributes || []) {
    const key = customValueMediaKey(a.attribute_name, a.attribute_value);
    const bucket = valueMedia?.[key];
    if (!bucket) continue;
    media.push(...(bucket.media || []));
    existingMedia.push(...(bucket.existingMedia || []));
  }
  return { media, existingMedia };
}

function SelectionSummary({ state }) {
  const chips = [
    ["Brand Type", state.brandType === "generic" ? "Generic Product" : "Branded Product"],
    ["Listing Type", "Custom Variation Listing"],
    ["Category", state.categoryTitle || "—"],
    ["Sub-Category", state.subCategoryTitle || "—"],
    ["Inner Sub-Category", state.innerSubCategoryTitle || "—"],
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {chips.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg px-3 py-2 min-w-0"
          style={{ backgroundColor: PEACH, border: `1px solid ${PEACH_BORDER}` }}
        >
          <p className="text-[10px] font-semibold text-slate-400 leading-none">{label}</p>
          <p className="text-[13px] font-semibold mt-1 truncate" style={{ color: NAVY }} title={value}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function TagChip({ label, onRemove }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md pl-2 pr-1 py-0.5 text-[11px] font-medium shrink-0"
      style={{ backgroundColor: "#F3F4F6", color: NAVY, border: "1px solid #E5E7EB" }}
    >
      {label}
      <button
        type="button"
        className="w-3.5 h-3.5 rounded-sm text-slate-400 hover:text-slate-700 leading-none"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </span>
  );
}

const COVER_H = 346;
const THUMB = 54;

function variationEntries(bucket) {
  const existing = (bucket?.existingMedia || []).map((existingItem, fi) => ({
    existing: existingItem,
    kind: "existing",
    fi,
  }));
  const files = (bucket?.media || []).map((file, fi) => ({
    file,
    kind: "file",
    fi,
  }));
  if (bucket?.coverKind === "file" && files.length) {
    return [files[0], ...existing, ...files.slice(1)];
  }
  return [...existing, ...files];
}

function GallerySideThumb({ src, onPromote, onRemove }) {
  return (
    <div
      className="relative shrink-0 rounded-lg overflow-hidden bg-slate-100"
      style={{ width: THUMB, height: THUMB, border: `1px solid ${CARD_BORDER}` }}
    >
      <button type="button" className="w-full h-full" onClick={onPromote} title="Set as cover">
        {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : null}
      </button>
      <button
        type="button"
        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center"
        style={{ backgroundColor: "rgba(55,65,81,0.55)" }}
        onClick={onRemove}
        aria-label="Remove image"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

function GallerySideUpload({ disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="shrink-0 rounded-lg border-2 border-dashed flex flex-col items-center justify-center disabled:opacity-40"
      style={{
        width: THUMB,
        height: THUMB,
        borderColor: DASH,
        backgroundColor: PEACH,
        color: ORANGE,
      }}
    >
      <Plus className="w-3.5 h-3.5" />
      <span className="text-[9px] font-semibold leading-none mt-0.5">Upload</span>
    </button>
  );
}

function CoverGallery({
  state,
  patch,
  categorySuggesting,
  variationGroup,
  valueMedia,
  addValueMedia,
  removeValueMedia,
  reorderValueMedia,
}) {
  const inputRef = useRef(null);
  const [selectedValue, setSelectedValue] = useState("");
  const files = state.files || [];
  const labels = state.mediaLabels || [];
  const existingMedia = state.existingMedia || [];
  const deleteMediaIds = state.deleteMediaIds || [];
  const variationValues = variationGroup?.values || [];
  const variationName = variationGroup?.name || "";
  const usingVariation = Boolean(variationName && variationValues.length);

  useEffect(() => {
    if (!usingVariation) {
      setSelectedValue("");
      return;
    }
    setSelectedValue((prev) => (variationValues.includes(prev) ? prev : variationValues[0]));
  }, [usingVariation, variationName, variationValues.join("|")]);

  const fileEntries = files
    .map((file, i) => ({ file, i, label: labels[i]?.label }))
    .filter((x) => x.file);
  const photoFileEntries = fileEntries.filter((x) => x.label !== "ai_3d");
  const generatedEntries = fileEntries.filter((x) => x.label === "ai_3d");
  const takenLabels = new Set(photoFileEntries.map((x) => x.label).filter(Boolean));
  const existingEntries = existingMedia
    .filter((m) => m?.url && m.label !== "ai_3d" && !takenLabels.has(m.label))
    .map((m) => ({ existing: m, label: m.label }));
  const listingPhotos = [...existingEntries, ...photoFileEntries];

  const variationKey = usingVariation && selectedValue
    ? customValueMediaKey(variationName, selectedValue)
    : "";
  const variationBucket = variationKey ? valueMedia?.[variationKey] || { media: [], existingMedia: [] } : null;
  const photoEntries = usingVariation ? variationEntries(variationBucket) : listingPhotos;
  const extras = photoEntries.slice(1);
  const leftExtras = extras.filter((_, i) => i % 2 === 0);
  const rightExtras = extras.filter((_, i) => i % 2 === 1);
  const canUpload = !(usingVariation && !selectedValue);

  const rebuildFromPhotos = (nextPhotos, extra = {}) => {
    const nextFiles = [];
    const nextLabels = [];
    const nextExisting = [];
    nextPhotos.forEach((p, i) => {
      const entry = { label: photoLabel(i), alt_text: `${state.name || "Product"} — ${photoLabel(i)}` };
      if (p.file) {
        nextFiles.push(p.file);
        nextLabels.push(entry);
      } else if (p.existing) {
        nextExisting.push({ ...p.existing, label: photoLabel(i) });
      }
    });
    generatedEntries.forEach((p) => {
      nextFiles.push(p.file);
      nextLabels.push(labels[p.i] || { label: "ai_3d" });
    });
    patch({ files: nextFiles, mediaLabels: nextLabels, existingMedia: nextExisting, ...extra });
  };

  const promoteToCover = (photoIndex) => {
    if (photoIndex <= 0 || photoIndex >= photoEntries.length) return;
    const next = [...photoEntries];
    const [picked] = next.splice(photoIndex, 1);
    next.unshift(picked);
    if (usingVariation) {
      reorderValueMedia(variationName, selectedValue, next);
      return;
    }
    rebuildFromPhotos(next);
  };

  const addFiles = (picked) => {
    const images = pickImageFiles(picked);
    if (!images.length) {
      notifyOnFail("JPG, PNG up to 5MB each");
      return;
    }
    if (usingVariation) {
      addValueMedia(variationName, selectedValue, images);
      return;
    }
    rebuildFromPhotos([
      ...photoEntries,
      ...images.map((file) => ({ file })),
    ]);
  };

  const removeAt = (idx) => {
    const entry = photoEntries[idx];
    if (usingVariation) {
      if (entry?.kind) removeValueMedia(variationName, selectedValue, entry.kind, entry.fi);
      return;
    }
    const extra = {};
    if (entry?.existing?.id) {
      extra.deleteMediaIds = [...new Set([...deleteMediaIds, entry.existing.id])];
    }
    rebuildFromPhotos(photoEntries.filter((_, i) => i !== idx), extra);
  };

  const cover = photoEntries[0];
  const openPicker = () => inputRef.current?.click();

  return (
    <section className="bg-white p-4 min-w-0" style={cardStyle}>
      <h3 className="text-[15px] font-extrabold leading-tight" style={{ color: NAVY }}>
        Primary Product Gallery
      </h3>
      <p className="text-[12px] mt-1 leading-snug" style={{ color: MUTED }}>
        {usingVariation
          ? `Showing ${selectedValue} photos. Side thumbs are this variation’s images; pick a variation below the cover.`
          : "Upload as many images as you need. First image will be used as cover."}
        {categorySuggesting ? " Detecting category…" : ""}
      </p>

      <div className="mt-3 flex gap-2 items-start">
        <div
          className="shrink-0 flex flex-col gap-2 overflow-y-auto"
          style={{ width: THUMB, maxHeight: COVER_H }}
        >
          {leftExtras.map((entry, i) => {
            const photoIndex = 1 + i * 2;
            return (
              <GallerySideThumb
                key={entry.label || entry.existing?.id || `left-${i}`}
                src={entrySrc(entry)}
                onPromote={() => promoteToCover(photoIndex)}
                onRemove={() => removeAt(photoIndex)}
              />
            );
          })}
          <GallerySideUpload disabled={!canUpload} onClick={openPicker} />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="relative min-w-0 rounded-xl overflow-hidden bg-[#F8FAFC]"
            style={{ border: `1px solid ${CARD_BORDER}` }}
          >
            {cover ? (
              <>
                <img src={entrySrc(cover)} alt="" className="w-full object-cover" style={{ height: COVER_H }} />
                <span
                  className="absolute bottom-2 left-2 rounded px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: "rgba(26,43,72,0.72)" }}
                >
                  {usingVariation ? selectedValue : "Cover Image"}
                </span>
                <button
                  type="button"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full text-white flex items-center justify-center"
                  style={{ backgroundColor: "rgba(55,65,81,0.55)" }}
                  onClick={() => removeAt(0)}
                  aria-label="Remove cover image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={openPicker}
                disabled={usingVariation && !selectedValue}
                className="w-full border-2 border-dashed flex flex-col items-center justify-center disabled:opacity-40"
                style={{ height: COVER_H, borderColor: DASH, backgroundColor: PEACH }}
              >
                <Plus className="w-7 h-7" style={{ color: ORANGE }} />
                <span className="mt-1 text-[12px] font-semibold" style={{ color: ORANGE }}>
                  {usingVariation ? `Upload ${selectedValue} cover` : "Upload cover"}
                </span>
              </button>
            )}
          </div>

          {usingVariation ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {variationValues.map((value) => {
                const key = customValueMediaKey(variationName, value);
                const first = variationEntries(valueMedia?.[key])[0];
                const src = first ? entrySrc(first) : "";
                const active = value === selectedValue;
                return (
                  <div key={value} className="shrink-0 flex flex-col items-center gap-0.5" style={{ width: THUMB }}>
                    <button
                      type="button"
                      title={value}
                      onClick={() => setSelectedValue(value)}
                      className="rounded-lg overflow-hidden bg-slate-100"
                      style={{
                        width: THUMB,
                        height: THUMB,
                        border: active ? `2px solid ${ORANGE}` : `1px solid ${CARD_BORDER}`,
                        boxShadow: active ? "0 0 0 2px rgba(245,108,67,0.18)" : "none",
                      }}
                    >
                      {src ? (
                        <img src={src} alt={value} className="w-full h-full object-cover" />
                      ) : (
                        <span
                          className="w-full h-full flex items-center justify-center px-1 text-[9px] font-semibold leading-tight text-center"
                          style={{ color: NAVY, backgroundColor: PEACH }}
                        >
                          {value}
                        </span>
                      )}
                    </button>
                    <span
                      className="w-full text-[9px] font-semibold truncate text-center leading-tight"
                      style={{ color: active ? ORANGE : MUTED }}
                    >
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div
          className="shrink-0 flex flex-col gap-2 overflow-y-auto"
          style={{ width: THUMB, maxHeight: COVER_H }}
        >
          {rightExtras.map((entry, i) => {
            const photoIndex = 2 + i * 2;
            return (
              <GallerySideThumb
                key={entry.label || entry.existing?.id || `right-${i}`}
                src={entrySrc(entry)}
                onPromote={() => promoteToCover(photoIndex)}
                onRemove={() => removeAt(photoIndex)}
              />
            );
          })}
          <GallerySideUpload disabled={!canUpload} onClick={openPicker} />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </section>
  );
}

function parseOptionValues(raw) {
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v || "").trim()).filter(Boolean);
  }
  const text = String(raw || "").trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v || "").trim()).filter(Boolean);
      }
    } catch {
      /* ignore */
    }
  }
  return text
    .split(/[,|\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function uniqueNames(list) {
  const seen = new Set();
  const out = [];
  for (const item of list || []) {
    const name = String(item || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

function catalogValuesFor(attr, catalog, colors, sizes) {
  const found =
    catalog.find((c) => String(c.id) === String(attr?.attribute_id)) ||
    catalog.find((c) => String(c.name || "").toLowerCase() === String(attr?.name || "").toLowerCase());
  const name = found?.name || attr?.name || "";
  const fromAttr = parseOptionValues(found?.option_values);
  if (/colou?r/i.test(name)) {
    return uniqueNames([...fromAttr, ...(colors || []).map((c) => c.name)]);
  }
  if (/^sizes?$/i.test(name)) {
    return uniqueNames([...fromAttr, ...(sizes || []).map((s) => s.name)]);
  }
  return uniqueNames(fromAttr);
}

function AttributeNameSelect({ value, attributeId, catalog, takenIds, onPick }) {
  const selectedId = String(attributeId || "");
  return (
    <select
      className={`${inputCls} w-[148px] shrink-0`}
      value={selectedId}
      onChange={(e) => {
        const id = e.target.value;
        const found = catalog.find((c) => String(c.id) === String(id));
        onPick({
          attribute_id: id,
          name: found?.name || "",
          values: [],
          valuesText: "",
        });
      }}
    >
      <option value="">{value && !selectedId ? value : "Select attribute"}</option>
      {catalog.map((opt) => {
        const taken = takenIds.has(String(opt.id)) && String(opt.id) !== selectedId;
        return (
          <option key={opt.id} value={opt.id} disabled={taken}>
            {opt.name}
          </option>
        );
      })}
    </select>
  );
}

function AttributeValueMultiSelect({ options, selected, onToggle, onAddCustom, draft, setDraft, placeholder }) {
  const [open, setOpen] = useState(false);
  const hasCatalog = (options || []).length > 0;
  return (
    <div
      className="flex flex-wrap items-center gap-1 min-w-0 flex-1 rounded-md px-1.5 py-1"
      style={{ border: `1px solid ${CARD_BORDER}`, backgroundColor: "#fff" }}
    >
      {selected.map((v) => (
        <TagChip key={v} label={v} onRemove={() => onToggle(v)} />
      ))}
      <div className="relative flex-1 min-w-[160px]">
        {hasCatalog ? (
          <>
            <button
              type="button"
              className="w-full text-left px-1 py-0.5 text-[12px] bg-transparent"
              style={{ color: selected.length ? MUTED : NAVY }}
              onClick={() => setOpen((v) => !v)}
            >
              {placeholder}
            </button>
            {open ? (
              <div
                className="absolute z-30 left-0 right-0 top-full mt-1 bg-white rounded-lg overflow-hidden max-h-48 overflow-y-auto"
                style={{ border: `1px solid ${CARD_BORDER}`, boxShadow: "0 8px 24px rgba(16,24,40,0.12)" }}
              >
                {options.map((opt) => {
                  const checked = selected.some((v) => v.toLowerCase() === opt.toLowerCase());
                  return (
                    <label
                      key={opt}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-[12px] hover:bg-[#FFF5F0] cursor-pointer"
                      style={{ color: NAVY }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(opt)}
                      />
                      {opt}
                    </label>
                  );
                })}
                <div className="border-t px-2 py-1.5" style={{ borderColor: CARD_BORDER }}>
                  <input
                    className={`${inputCls} w-full`}
                    placeholder="Custom value + Enter"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      onAddCustom(draft);
                    }}
                  />
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <input
            className="w-full bg-transparent px-1 py-0.5 text-[12px] focus:outline-none"
            placeholder={placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              onAddCustom(draft);
            }}
            onBlur={() => onAddCustom(draft)}
          />
        )}
      </div>
    </div>
  );
}

function VariantImagesPanel({ imageGroups, valueMedia, addValueMedia, removeValueMedia }) {
  return (
    <aside className="bg-white p-4 min-w-0" style={cardStyle}>
      <h3 className="text-[15px] font-extrabold inline-flex items-center gap-1.5 leading-tight" style={{ color: NAVY }}>
        Variant Images by Attribute
        <span title="Upload photos for each attribute value if they look different." className="text-slate-300">
          <HelpCircle className="w-3.5 h-3.5" />
        </span>
      </h3>
      <p className="text-[12px] mt-1 mb-3 leading-snug" style={{ color: MUTED }}>
        Add images for each attribute value if they are visually different.
      </p>
      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-0.5">
        {imageGroups.map((group) => (
          <div key={`${group.name}-${group.index}`}>
            <p className="text-[12px] font-semibold mb-1.5" style={{ color: NAVY }}>
              {group.name}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {group.values.map((value) => {
                const key = customValueMediaKey(group.name, value);
                const bucket = valueMedia[key] || { media: [], existingMedia: [] };
                const thumbs = [
                  ...(bucket.existingMedia || []).map((existing, fi) => ({
                    src: resolveMediaUrl(existing.url),
                    kind: "existing",
                    fi,
                  })),
                  ...(bucket.media || []).map((file, fi) => ({
                    src: file instanceof File ? URL.createObjectURL(file) : "",
                    kind: "file",
                    fi,
                  })),
                ];
                const cover = thumbs[0];
                return (
                  <div key={value} className="rounded-lg overflow-hidden min-w-0" style={{ border: `1px solid ${CARD_BORDER}` }}>
                    <p className="text-[11px] font-semibold px-2 pt-1.5 truncate" style={{ color: NAVY }}>
                      {value}
                    </p>
                    <div className="relative mx-2 mt-1 h-[72px] rounded-md overflow-hidden bg-[#F8FAFC]" style={{ border: `1px solid ${CARD_BORDER}` }}>
                      {cover?.src ? (
                        <>
                          <img src={cover.src} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-black/50 text-white rounded p-0.5"
                            onClick={() => removeValueMedia(group.name, value, cover.kind, cover.fi)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex items-center justify-center cursor-pointer" style={{ backgroundColor: PEACH }}>
                          <Plus className="w-4 h-4" style={{ color: ORANGE }} />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              addValueMedia(group.name, value, e.target.files);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <label className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold cursor-pointer" style={{ color: ORANGE }}>
                      + Add More
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          addValueMedia(group.name, value, e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {!imageGroups.length ? (
          <p className="text-[12px] py-8 text-center" style={{ color: MUTED }}>
            Add attribute values to attach images.
          </p>
        ) : null}
      </div>
    </aside>
  );
}

export default function CustomVariationCanvas({
  state,
  patch,
  fieldError,
  categorySuggesting,
}) {
  const [catalog, setCatalog] = useState([]);
  const [colorNames, setColorNames] = useState([]);
  const [sizeNames, setSizeNames] = useState([]);
  const [draftValue, setDraftValue] = useState({});
  const [showAll, setShowAll] = useState(false);

  const attrs = state.customAttrs?.length ? state.customAttrs : defaultAttrs();
  const rows = state.customRows || [];
  const valueMedia = state.customValueMedia || {};

  useEffect(() => {
    (async () => {
      try {
        const [attrRes, colorRes, sizeRes] = await Promise.all([
          getAllAttributes(),
          getAllColors({ silent: true }),
          getAllSizes({}, { silent: true }),
        ]);
        setCatalog(attrRes?.data || attrRes || []);
        setColorNames((colorRes?.data || []).map((c) => c.name).filter(Boolean));
        setSizeNames((sizeRes?.data || []).map((s) => s.name).filter(Boolean));
      } catch {
        /* catalog stays empty */
      }
    })();
  }, []);

  const setAttrs = (customAttrs) => patch({ customAttrs });
  const updateAttr = (index, partial) => {
    setAttrs(attrs.map((a, i) => (i === index ? { ...a, ...partial } : a)));
  };

  const addValue = (index, raw) => {
    const value = String(raw || "").trim();
    if (!value) return;
    const current = customAttrValues(attrs[index]);
    if (current.some((v) => v.toLowerCase() === value.toLowerCase())) return;
    const next = [...current, value];
    updateAttr(index, { values: next, valuesText: next.join(", ") });
    setDraftValue((prev) => ({ ...prev, [index]: "" }));
  };

  const removeValue = (index, value) => {
    const next = customAttrValues(attrs[index]).filter((v) => v !== value);
    updateAttr(index, { values: next, valuesText: next.join(", ") });
  };

  const attrSignature = attrs
    .map((a) => {
      const name = a.name || catalog.find((x) => String(x.id) === String(a.attribute_id))?.name || "";
      return `${a.attribute_id}|${name}|${customAttrValues(a).join(",")}`;
    })
    .join(";");

  useEffect(() => {
    const ready = attrs
      .map((a) => ({
        attribute_id: a.attribute_id,
        name: a.name || catalog.find((x) => String(x.id) === String(a.attribute_id))?.name || "",
        values: customAttrValues(a),
      }))
      .filter((a) => a.name && a.values.length);
    if (!ready.length) {
      if (rows.length) patch({ customRows: [] });
      return;
    }
    let generated = cartesianCustomRows(ready);
    if (!generated.length) return;
    const prevByKey = new Map((rows || []).map((r) => [customRowKey(r), r]));
    const base = state.sku || "SKU";
    generated = generated.map((r) => {
      const prev = prevByKey.get(customRowKey(r));
      const sku =
        prev?.sku ||
        suggestVariantSku(
          base,
          (r.attributes || []).map((a) => a.attribute_value),
        );
      const fromValues = mediaForCustomRow(r, valueMedia);
      return {
        ...r,
        original_price: prev?.original_price || state.original_price || "",
        discounted_price: prev?.discounted_price || state.discounted_price || "",
        stock: prev?.stock || state.stock || "",
        sku,
        barcode: prev?.barcode || "",
        media: prev?.media?.length ? prev.media : fromValues.media,
        existingMedia: prev?.existingMedia?.length ? prev.existingMedia : fromValues.existingMedia,
        enabled: prev?.enabled !== false,
        grouping_key: prev?.grouping_key || r.grouping_key,
      };
    });
    const nextKeys = generated.map(customRowKey).join("|");
    const prevKeys = (rows || []).map(customRowKey).join("|");
    if (nextKeys === prevKeys) return;
    patch({ customRows: generated });
  }, [attrSignature]);

  const updateRow = (ri, partial) => {
    patch({ customRows: rows.map((r, i) => (i === ri ? { ...r, ...partial } : r)) });
  };

  const addValueMedia = (attrName, value, files) => {
    const key = customValueMediaKey(attrName, value);
    const picked = pickImageFiles(files);
    if (!picked.length) return;
    const bucket = valueMedia[key] || { media: [], existingMedia: [] };
    patch({
      customValueMedia: {
        ...valueMedia,
        [key]: { ...bucket, media: [...(bucket.media || []), ...picked] },
      },
    });
  };

  const removeValueMedia = (attrName, value, kind, index) => {
    const key = customValueMediaKey(attrName, value);
    const bucket = valueMedia[key] || { media: [], existingMedia: [] };
    const next = { ...bucket };
    if (kind === "file") next.media = (bucket.media || []).filter((_, i) => i !== index);
    else next.existingMedia = (bucket.existingMedia || []).filter((_, i) => i !== index);
    if (kind === "file" && index === 0) next.coverKind = undefined;
    patch({ customValueMedia: { ...valueMedia, [key]: next } });
  };

  const reorderValueMedia = (attrName, value, nextEntries) => {
    const key = customValueMediaKey(attrName, value);
    const existingMedia = [];
    const media = [];
    nextEntries.forEach((entry) => {
      if (entry.file) media.push(entry.file);
      else if (entry.existing) existingMedia.push(entry.existing);
    });
    patch({
      customValueMedia: {
        ...valueMedia,
        [key]: {
          existingMedia,
          media,
          coverKind: nextEntries[0]?.file ? "file" : "existing",
        },
      },
    });
  };

  const visibleRows = showAll ? rows : rows.slice(0, 8);
  const stats = customListingStats(state);
  const imageGroups = attrs
    .map((a, i) => ({
      name: a.name || catalog.find((x) => String(x.id) === String(a.attribute_id))?.name || "",
      values: customAttrValues(a),
      index: i,
    }))
    .filter((g) => g.name && g.values.length);
  const variationGroup =
    imageGroups.find((g) => /colou?r/i.test(g.name)) || imageGroups[0] || null;

  return (
    <div className="space-y-3">
      <SelectionSummary state={state} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,0.44fr)_minmax(320px,0.56fr)] gap-3 items-start">
        <CoverGallery
          state={state}
          patch={patch}
          categorySuggesting={categorySuggesting}
          variationGroup={variationGroup}
          valueMedia={valueMedia}
          addValueMedia={addValueMedia}
          removeValueMedia={removeValueMedia}
          reorderValueMedia={reorderValueMedia}
        />

        <section className="bg-white p-4 min-w-0 w-full" style={cardStyle}>
          <h3 className="text-[15px] font-extrabold leading-tight" style={{ color: NAVY }}>
            Custom Combination Builder
          </h3>
          <p className="text-[12px] mt-1 mb-3" style={{ color: MUTED }}>
            Choose attributes from admin catalog. Multi-select values — selected chips show in the field.
          </p>
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-0.5">
            {attrs.map((attr, ai) => {
              const values = customAttrValues(attr);
              const options = catalogValuesFor(attr, catalog, colorNames, sizeNames);
              const takenIds = new Set(
                attrs
                  .filter((_, i) => i !== ai)
                  .map((a) => String(a.attribute_id || ""))
                  .filter(Boolean),
              );
              const isModel = /model/i.test(attr.name || "");
              return (
                <div key={ai} className="min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[12px] font-semibold text-slate-500">
                      Attribute {ai + 1}
                    </span>
                    {attrs.length > 1 ? (
                      <button
                        type="button"
                        className="p-1 text-slate-300 hover:text-rose-600 shrink-0"
                        onClick={() => setAttrs(attrs.filter((_, i) => i !== ai))}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <AttributeNameSelect
                      value={attr.name}
                      attributeId={attr.attribute_id}
                      catalog={catalog}
                      takenIds={takenIds}
                      onPick={(partial) => updateAttr(ai, partial)}
                    />
                    <AttributeValueMultiSelect
                      options={options}
                      selected={values}
                      placeholder={
                        isModel
                          ? "Select car models"
                          : options.length
                            ? "Select values"
                            : "+ Add more"
                      }
                      draft={draftValue[ai] || ""}
                      setDraft={(next) => setDraftValue((prev) => ({ ...prev, [ai]: next }))}
                      onToggle={(value) => {
                        if (values.some((v) => v.toLowerCase() === value.toLowerCase())) {
                          removeValue(ai, value);
                        } else {
                          addValue(ai, value);
                        }
                      }}
                      onAddCustom={(raw) => {
                        addValue(ai, raw);
                        setDraftValue((prev) => ({ ...prev, [ai]: "" }));
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="mt-3 text-[12px] font-semibold px-3 py-1.5 rounded-md bg-white"
            style={{ color: ORANGE, border: `1.5px solid ${ORANGE}` }}
            onClick={() => setAttrs([...attrs, emptyAttr()])}
          >
            + Add Custom Attribute
          </button>
        </section>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(250px,300px)] gap-3 items-start">
        <section className="bg-white p-4 min-w-0 overflow-hidden" style={cardStyle}>
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="text-[15px] font-extrabold inline-flex items-center gap-1.5" style={{ color: NAVY }}>
                Custom Variant Matrix
                <span title="Each unique attribute combination is a sellable SKU." className="text-slate-300">
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              </h3>
              <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
                Auto-generated based on selected attributes.
              </p>
            </div>
            <p className="text-[12px] font-semibold" style={{ color: NAVY }}>
              Total Variants: {rows.length}
            </p>
          </div>
          {fieldError ? <p className="text-xs text-red-600 mb-2">{fieldError}</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] min-w-[780px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 border-b">
                  <th className="py-2 pr-2 font-semibold">Combination</th>
                  <th className="py-2 pr-2 font-semibold">SKU</th>
                  <th className="py-2 pr-2 font-semibold">Selling Price (₹)</th>
                  <th className="py-2 pr-2 font-semibold">MRP (₹)</th>
                  <th className="py-2 pr-2 font-semibold">Stock</th>
                  <th className="py-2 pr-2 font-semibold">Status</th>
                  <th className="py-2 pr-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[12px] text-slate-400">
                      Generate custom variants to fill this table.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((r, ri) => {
                    const rowIndex = rows.indexOf(r);
                    const mrpSell = r.enabled ? validateMrpAndSelling(r.original_price, r.discounted_price) : {};
                    const mrpErr = r.enabled ? liveFieldError(mrpSell.original_price, r.original_price) : null;
                    const sellErr = r.enabled ? liveFieldError(mrpSell.discounted_price, r.discounted_price) : null;
                    const stockErr = r.enabled ? liveFieldError(validateStockQty(r.stock, "Stock"), r.stock) : null;
                    const combo = (r.attributes || []).map((a) => a.attribute_value).join(" / ");
                    const thumbs = [
                      ...(r.existingMedia || []).map((m) => resolveMediaUrl(m.url)),
                      ...(r.media || []).map((f) => (f instanceof File ? URL.createObjectURL(f) : "")),
                    ].filter(Boolean);
                    return (
                      <tr key={r.grouping_key || ri} className={`border-b ${r.enabled ? "" : "opacity-50"}`}>
                        <td className="py-2 pr-2 text-[11px] max-w-[220px]" style={{ color: NAVY }}>
                          {combo || "—"}
                        </td>
                        <td className="py-2 pr-2">
                          <input className={skuInputCls} value={r.sku || ""} onChange={(e) => updateRow(rowIndex, { sku: e.target.value })} />
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            className={inputClsErr(sellErr, numInputCls)}
                            value={r.discounted_price}
                            onChange={(e) => updateRow(rowIndex, { discounted_price: e.target.value })}
                          />
                          {sellErr ? <p className="text-[10px] text-red-600 mt-0.5">{sellErr}</p> : null}
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            className={inputClsErr(mrpErr, numInputCls)}
                            value={r.original_price}
                            onChange={(e) => updateRow(rowIndex, { original_price: e.target.value })}
                          />
                          {mrpErr ? <p className="text-[10px] text-red-600 mt-0.5">{mrpErr}</p> : null}
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className={inputClsErr(stockErr, numInputCls)}
                            value={r.stock}
                            onChange={(e) => updateRow(rowIndex, { stock: e.target.value })}
                          />
                          {stockErr ? <p className="text-[10px] text-red-600 mt-0.5">{stockErr}</p> : null}
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            className={inputCls}
                            value={r.enabled === false ? "inactive" : "active"}
                            onChange={(e) => updateRow(rowIndex, { enabled: e.target.value === "active" })}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          <div className="flex items-center gap-1">
                            {thumbs.slice(0, 3).map((src, i) => (
                              <img key={i} src={src} alt="" className="w-7 h-7 rounded object-cover border" />
                            ))}
                            <label
                              className="w-7 h-7 rounded border border-dashed flex items-center justify-center cursor-pointer"
                              style={{ borderColor: DASH, backgroundColor: PEACH, color: ORANGE }}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const picked = pickImageFiles(e.target.files);
                                  e.target.value = "";
                                  updateRow(rowIndex, { media: [...(r.media || []), ...picked] });
                                }}
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {rows.length > 8 ? (
            <div className="flex items-center justify-between text-[12px] text-slate-500 mt-2">
              <span>
                Showing {visibleRows.length} of {rows.length} variants
              </span>
              <button type="button" className="font-semibold" style={{ color: ORANGE }} onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Show fewer" : "View all variants"}
              </button>
            </div>
          ) : null}
        </section>

        <VariantImagesPanel
          imageGroups={imageGroups}
          valueMedia={valueMedia}
          addValueMedia={addValueMedia}
          removeValueMedia={removeValueMedia}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          ["Base MRP (All Variants)", stats.baseMrp ? `₹${Number(stats.baseMrp).toLocaleString("en-IN")}` : "₹ —"],
          [
            "Selling Price Range",
            stats.minSell && stats.maxSell && stats.minSell !== stats.maxSell
              ? `₹${Number(stats.minSell).toLocaleString("en-IN")} – ₹${Number(stats.maxSell).toLocaleString("en-IN")}`
              : stats.minSell
                ? `₹${Number(stats.minSell).toLocaleString("en-IN")}`
                : "₹ —",
          ],
          ["Total Variants", String(stats.variantCount || 0)],
          ["Total Stock", `${stats.totalStock || 0}`],
          ["You Earn (est.)", stats.youEarnTotal ? `₹${Number(stats.youEarnTotal).toLocaleString("en-IN")}` : "₹ —"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl px-3 py-2.5 bg-white" style={{ border: `1px solid ${CARD_BORDER}` }}>
            <p className="text-[10px] text-slate-400 font-medium">{label}</p>
            <p className="text-[14px] font-extrabold mt-0.5" style={{ color: NAVY }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
