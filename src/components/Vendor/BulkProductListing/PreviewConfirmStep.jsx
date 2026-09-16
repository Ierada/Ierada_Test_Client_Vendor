import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Pencil,
  Search,
  Smartphone,
  Upload,
  X,
} from "lucide-react";
import {
  imagesForSku,
  isVariationListingKind,
  isCustomListingKind,
  customAttributeColumns,
  variantAttrValue,
  previewAiMode,
  variationPreviewGroups,
  listingTableScrollClass,
  listingTableHeadClass,
  wizardImageSrc,
} from "./wizardEngine";

function formatInr(value) {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  if (!Number.isFinite(n)) return "—";
  return `₹ ${n.toLocaleString("en-IN")}`;
}

function categoryPath(row) {
  return [row.category, row.sub_category, row.inner_sub_category].map((p) => String(p || "").trim()).filter(Boolean).join(" > ") || "—";
}

function rowImages(row, imagesBySku) {
  return row.resolved?.images?.length
    ? row.resolved.images
    : imagesForSku(imagesBySku, row.image_sku || row.sku);
}

function StatusPill({ row }) {
  if (row.status === "valid") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-600">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-2.5 w-2.5" />
        </span>
        Ready to List
      </span>
    );
  }
  if (row.status === "warning") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-500">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-white text-[9px]">!</span>
        Check Details
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-500">
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-white text-[9px]">!</span>
      Check Details
    </span>
  );
}

function Thumbs({ images }) {
  if (!images?.length) {
    return (
      <span className="inline-flex rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-500">
        Missing
      </span>
    );
  }
  const shown = images.slice(0, 3);
  const extra = images.length - shown.length;
  return (
    <div className="flex w-max items-center">
      {shown.map((img, i) => (
        <img
          key={`${img.filename || img.url || i}`}
          src={wizardImageSrc(img)}
          alt=""
          className={`relative h-8 w-8 shrink-0 rounded-md bg-gray-100 object-cover ring-2 ring-white ${i ? "-ml-2" : ""}`}
        />
      ))}
      {extra > 0 ? <span className="ml-1 shrink-0 text-[11px] font-semibold text-[#F56C43]">+{extra}</span> : null}
    </div>
  );
}

function variantRows(variant) {
  return variant.rows?.length ? variant.rows : [variant.row];
}

function variantStatus(variant) {
  const list = variantRows(variant);
  if (list.some((row) => row.status === "error")) return "error";
  if (list.some((row) => row.status === "warning")) return "warning";
  if (list.some((row) => row.status === "valid")) return "valid";
  return list[0]?.status || "";
}

function variantActionRow(variant) {
  return variantRows(variant).find((row) => row.status === "error") || variant.row;
}

function Cover({ images }) {
  const src = wizardImageSrc(images[0]);
  if (!src) {
    return (
      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[10px] font-medium text-rose-500">
        No image
      </div>
    );
  }
  return <img src={src} alt="" className="h-[72px] w-[72px] shrink-0 rounded-xl bg-gray-100 object-cover" />;
}

function ProductTitle({ name, className = "line-clamp-2 text-[12px] font-medium leading-[1.35] text-[#1A2B48]" }) {
  const title = name || "Untitled product";
  return (
    <p className={className} title={title}>
      {title}
    </p>
  );
}

function TableCheck({ checked, disabled, onChange, className = "" }) {
  return (
    <input
      type="checkbox"
      disabled={disabled}
      checked={Boolean(checked) && !disabled}
      onChange={(e) => onChange?.(e.target.checked)}
      className={`h-3.5 w-3.5 shrink-0 rounded-[3px] border-gray-300 text-[#F56C43] accent-[#F56C43] focus:ring-1 focus:ring-[#F56C43]/25 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    />
  );
}

const CHECKLIST = [
  { id: "reviewed", label: "I have reviewed all product details" },
  { id: "images", label: "Images are correct and relevant" },
  { id: "category", label: "Category and pricing are accurate" },
  { id: "policy", label: "No prohibited or restricted products" },
  { id: "terms", label: "I agree to IERADA's listing policies" },
];

const LISTING_FIELD_KEYS = [
  "name",
  "sku",
  "brand_type",
  "brand",
  "colour",
  "size",
  "category",
  "sub_category",
  "inner_sub_category",
  "hsn_code",
  "gst",
  "mrp",
  "selling_price",
  "stock",
  "package_weight",
  "package_length",
  "package_width",
  "package_height",
  "short_description",
  "product_details",
  "key_features",
  "benefits",
  "whats_in_the_box",
  "specifications",
  "meta_title",
  "meta_description",
  "tags",
  "country_of_origin",
  "barcode",
];

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] text-[#1A2B48] focus:border-[#F56C43] focus:outline-none focus:ring-2 focus:ring-[#F56C43]/20";

function draftFromRow(row) {
  const draft = {};
  LISTING_FIELD_KEYS.forEach((key) => {
    draft[key] = row?.[key] ?? "";
  });
  return draft;
}

function taxFromTree(taxonomy, categoryName, subName, innerName) {
  const category = (taxonomy?.categories || []).find((c) => c.name === categoryName);
  const sub = (taxonomy?.subCategories || []).find(
    (s) => s.name === subName && (!category || String(s.categoryId) === String(category.id)),
  );
  const inner = (taxonomy?.innerSubCategories || []).find(
    (i) => i.name === innerName && (!sub || String(i.subCategoryId) === String(sub.id)),
  );
  const hsn = inner?.hsn_code || sub?.hsn_code || category?.hsn_code || "";
  const gst = inner?.tax ?? sub?.tax ?? category?.tax;
  return {
    hsn_code: hsn ? String(hsn) : "",
    gst: gst === undefined || gst === null || gst === "" ? "" : String(gst),
  };
}

function ListingEditModal({ row, imagesBySku, taxonomy, colors, sizes, onClose, onSave }) {
  const [draft, setDraft] = useState(() => draftFromRow(row));
  const images = rowImages(row, imagesBySku);

  useEffect(() => {
    setDraft(draftFromRow(row));
  }, [row]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const category = (taxonomy?.categories || []).find((c) => c.name === draft.category);
  const subOptions = (taxonomy?.subCategories || []).filter(
    (s) => !category || String(s.categoryId) === String(category.id),
  );
  const sub = subOptions.find((s) => s.name === draft.sub_category);
  const innerOptions = (taxonomy?.innerSubCategories || []).filter(
    (i) => !sub || String(i.subCategoryId) === String(sub.id),
  );

  const setField = (key, value) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "category") {
        const stillValid = (taxonomy?.subCategories || []).some(
          (s) => s.name === prev.sub_category && String(s.categoryId) === String((taxonomy?.categories || []).find((c) => c.name === value)?.id),
        );
        if (!stillValid) {
          next.sub_category = "";
          next.inner_sub_category = "";
        }
      }
      if (key === "sub_category") {
        const parent = (taxonomy?.subCategories || []).find((s) => s.name === value);
        const stillValid = (taxonomy?.innerSubCategories || []).some(
          (i) => i.name === prev.inner_sub_category && String(i.subCategoryId) === String(parent?.id),
        );
        if (!stillValid) next.inner_sub_category = "";
      }
      if (key === "category" || key === "sub_category" || key === "inner_sub_category") {
        const tax = taxFromTree(
          taxonomy,
          key === "category" ? value : next.category,
          key === "sub_category" ? value : next.sub_category,
          key === "inner_sub_category" ? value : next.inner_sub_category,
        );
        if (tax.hsn_code) next.hsn_code = tax.hsn_code;
        if (tax.gst) next.gst = tax.gst;
      }
      return next;
    });
  };

  const save = () => {
    onSave(row.row_id, draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-edit-title"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <p id="listing-edit-title" className="text-[16px] font-semibold text-[#1A2B48]">
              View / Edit listing
            </p>
            <p className="mt-0.5 truncate text-[12px] text-gray-500">
              SKU {row.sku || "—"} · Review every field, then save if you change anything.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill row={row} />
            <button type="button" onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-[#1A2B48]" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {row.errors?.length || row.warnings?.length ? (
            <div className="mb-4 space-y-1 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[12px]">
              {(row.errors || []).map((msg) => (
                <p key={msg} className="text-rose-600">{msg}</p>
              ))}
              {(row.warnings || []).map((msg) => (
                <p key={msg} className="text-amber-700">{msg}</p>
              ))}
            </div>
          ) : null}

          <div className="mb-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">Images</p>
            {images.length ? (
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <img
                    key={`${img.filename || img.url || i}`}
                    src={wizardImageSrc(img)}
                    alt=""
                    className="h-16 w-16 rounded-lg bg-gray-100 object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-rose-500">No images mapped to this SKU.</p>
            )}
            <p className="mt-1 text-[11px] text-gray-400">Images stay mapped by SKU. Rename files on step 1 if you need to change them.</p>
          </div>

          <Section title="Product">
            <Field label="Product Name" className="sm:col-span-2">
              <input className={inputCls} value={draft.name} onChange={(e) => setField("name", e.target.value)} />
            </Field>
            <Field label="SKU">
              <input className={inputCls} value={draft.sku} onChange={(e) => setField("sku", e.target.value)} />
            </Field>
            <Field label="Brand Type">
              <select className={inputCls} value={draft.brand_type} onChange={(e) => setField("brand_type", e.target.value)}>
                <option value="">Select</option>
                <option value="Branded">Branded</option>
                <option value="Generic">Generic</option>
                {draft.brand_type && !["Branded", "Generic"].includes(draft.brand_type) ? (
                  <option value={draft.brand_type}>{draft.brand_type}</option>
                ) : null}
              </select>
            </Field>
            <Field label="Brand Name">
              <input className={inputCls} value={draft.brand} onChange={(e) => setField("brand", e.target.value)} />
            </Field>
            <Field label="Colour">
              <select className={inputCls} value={draft.colour} onChange={(e) => setField("colour", e.target.value)}>
                <option value="">Select colour</option>
                {(colors || []).map((c) => (
                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                ))}
                {draft.colour && !(colors || []).some((c) => c.name === draft.colour) ? (
                  <option value={draft.colour}>{draft.colour}</option>
                ) : null}
              </select>
            </Field>
            <Field label="Size">
              <select className={inputCls} value={draft.size} onChange={(e) => setField("size", e.target.value)}>
                <option value="">Select size</option>
                {(sizes || []).map((s) => (
                  <option key={s.id || s.name} value={s.name}>{s.name}</option>
                ))}
                {draft.size && !(sizes || []).some((s) => String(s.name) === String(draft.size)) ? (
                  <option value={draft.size}>{draft.size}</option>
                ) : null}
              </select>
            </Field>
          </Section>

          <Section title="Category & tax">
            <Field label="Category">
              <select className={inputCls} value={draft.category} onChange={(e) => setField("category", e.target.value)}>
                <option value="">Select category</option>
                {(taxonomy?.categories || []).map((c) => (
                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                ))}
                {draft.category && !(taxonomy?.categories || []).some((c) => c.name === draft.category) ? (
                  <option value={draft.category}>{draft.category}</option>
                ) : null}
              </select>
            </Field>
            <Field label="Sub Category">
              <select className={inputCls} value={draft.sub_category} onChange={(e) => setField("sub_category", e.target.value)}>
                <option value="">Select sub category</option>
                {subOptions.map((s) => (
                  <option key={s.id || s.name} value={s.name}>{s.name}</option>
                ))}
                {draft.sub_category && !subOptions.some((s) => s.name === draft.sub_category) ? (
                  <option value={draft.sub_category}>{draft.sub_category}</option>
                ) : null}
              </select>
            </Field>
            <Field label="Inner Subcategory">
              <select className={inputCls} value={draft.inner_sub_category} onChange={(e) => setField("inner_sub_category", e.target.value)}>
                <option value="">Select inner subcategory</option>
                {innerOptions.map((i) => (
                  <option key={i.id || i.name} value={i.name}>{i.name}</option>
                ))}
                {draft.inner_sub_category && !innerOptions.some((i) => i.name === draft.inner_sub_category) ? (
                  <option value={draft.inner_sub_category}>{draft.inner_sub_category}</option>
                ) : null}
              </select>
            </Field>
            <Field label="HSN Code">
              <input className={inputCls} value={draft.hsn_code} onChange={(e) => setField("hsn_code", e.target.value)} />
            </Field>
            <Field label="GST %">
              <input className={inputCls} value={draft.gst} onChange={(e) => setField("gst", e.target.value)} />
            </Field>
          </Section>

          <Section title="Pricing & stock">
            <Field label="MRP ₹">
              <input className={inputCls} value={draft.mrp} onChange={(e) => setField("mrp", e.target.value)} />
            </Field>
            <Field label="Selling Price ₹">
              <input className={inputCls} value={draft.selling_price} onChange={(e) => setField("selling_price", e.target.value)} />
            </Field>
            <Field label="Stock">
              <input className={inputCls} value={draft.stock} onChange={(e) => setField("stock", e.target.value)} />
            </Field>
          </Section>

          <Section title="Package">
            <Field label="Weight (g)">
              <input className={inputCls} value={draft.package_weight} onChange={(e) => setField("package_weight", e.target.value)} />
            </Field>
            <Field label="Length (cm)">
              <input className={inputCls} value={draft.package_length} onChange={(e) => setField("package_length", e.target.value)} />
            </Field>
            <Field label="Width (cm)">
              <input className={inputCls} value={draft.package_width} onChange={(e) => setField("package_width", e.target.value)} />
            </Field>
            <Field label="Height (cm)">
              <input className={inputCls} value={draft.package_height} onChange={(e) => setField("package_height", e.target.value)} />
            </Field>
          </Section>

          <Section title="Listing copy">
            <Field label="Short Description" className="sm:col-span-2">
              <textarea className={`${inputCls} min-h-[72px]`} value={draft.short_description} onChange={(e) => setField("short_description", e.target.value)} />
            </Field>
            <Field label="Product Details" className="sm:col-span-2">
              <textarea className={`${inputCls} min-h-[88px]`} value={draft.product_details} onChange={(e) => setField("product_details", e.target.value)} />
            </Field>
            <Field label="Key Features" className="sm:col-span-2">
              <textarea className={`${inputCls} min-h-[72px]`} value={draft.key_features} onChange={(e) => setField("key_features", e.target.value)} />
            </Field>
            <Field label="Benefits" className="sm:col-span-2">
              <textarea className={`${inputCls} min-h-[72px]`} value={draft.benefits} onChange={(e) => setField("benefits", e.target.value)} />
            </Field>
            <Field label="What's in the Box" className="sm:col-span-2">
              <textarea className={`${inputCls} min-h-[72px]`} value={draft.whats_in_the_box} onChange={(e) => setField("whats_in_the_box", e.target.value)} />
            </Field>
            <Field label="Specifications" className="sm:col-span-2">
              <textarea className={`${inputCls} min-h-[72px]`} value={draft.specifications} onChange={(e) => setField("specifications", e.target.value)} />
            </Field>
          </Section>

          <Section title="SEO & other">
            <Field label="Meta Title" className="sm:col-span-2">
              <input className={inputCls} value={draft.meta_title} onChange={(e) => setField("meta_title", e.target.value)} />
            </Field>
            <Field label="Meta Description" className="sm:col-span-2">
              <textarea className={`${inputCls} min-h-[72px]`} value={draft.meta_description} onChange={(e) => setField("meta_description", e.target.value)} />
            </Field>
            <Field label="Tags" className="sm:col-span-2">
              <input className={inputCls} value={draft.tags} onChange={(e) => setField("tags", e.target.value)} />
            </Field>
            <Field label="Country of Origin">
              <input className={inputCls} value={draft.country_of_origin} onChange={(e) => setField("country_of_origin", e.target.value)} />
            </Field>
            <Field label="Barcode">
              <input className={inputCls} value={draft.barcode} onChange={(e) => setField("barcode", e.target.value)} />
            </Field>
          </Section>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-[#1A2B48]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-lg bg-[#F56C43] px-4 py-2 text-[12px] font-medium text-white"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] text-gray-500">{label}</span>
      {children}
    </label>
  );
}

export default function PreviewConfirmStep({
  stats,
  rows,
  visibleRows,
  listingKind = "single",
  imagesBySku,
  selected,
  setSelected,
  filter,
  setFilter,
  query,
  setQuery,
  busy,
  onEditMapping,
  onBackToValidate,
  onSubmit,
  onSaveRow,
  onDownloadCompleted,
  onReuploadCompleted,
  completedRef,
  taxonomy,
  colors,
  sizes,
}) {
  const [editRow, setEditRow] = useState(null);
  const [view, setView] = useState("card");
  const [checks, setChecks] = useState({});
  const readyCount = stats.valid;
  const issueCount = stats.warnings + stats.errors;
  const selectedReady = rows.filter((row) => selected[row.row_id] && row.status !== "error").length;
  const allChecked = CHECKLIST.every((item) => checks[item.id]);
  const canSubmit = selectedReady > 0 && allChecked && !busy;

  const tabs = [
    { id: "all", label: `All Products (${stats.total})` },
    { id: "valid", label: `Valid (${stats.valid})` },
    { id: "warnings", label: `With Warnings (${stats.warnings})` },
    { id: "errors", label: `With Errors (${stats.errors})` },
  ];

  const mobileRow = useMemo(() => {
    return visibleRows.find((row) => selected[row.row_id] && row.status !== "error") || visibleRows[0] || null;
  }, [visibleRows, selected]);

  const liveEditRow = useMemo(() => {
    if (!editRow) return null;
    return rows.find((row) => row.row_id === editRow.row_id) || editRow;
  }, [editRow, rows]);

  const toggleRow = (row, checked) => {
    if (row.status === "error") return;
    setSelected((prev) => ({ ...prev, [row.row_id]: checked }));
  };

  const variation = isVariationListingKind(listingKind);
  const groups = variation ? variationPreviewGroups(visibleRows) : [];

  const toggleVariant = (variant, checked) => {
    const list = variantRows(variant);
    setSelected((prev) => {
      const next = { ...prev };
      list.forEach((row) => {
        if (row.status !== "error") next[row.row_id] = checked;
      });
      return next;
    });
  };

  const toggleGroup = (group, checked) => {
    (group.variants || []).forEach((variant) => toggleVariant(variant, checked));
  };

  const variationTable = (
    <VariationConfirmTable
      groups={groups}
      imagesBySku={imagesBySku}
      selected={selected}
      listingKind={listingKind}
      onToggle={toggleGroup}
      onEdit={setEditRow}
    />
  );

  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_250px]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="border-l-4 border-[#F56C43] pl-2.5 text-[16px] font-semibold text-[#1A2B48]">
              Preview & Confirm
            </h2>
            <p className="mt-1 pl-2.5 text-[12px] text-gray-500">
              Review your product details below. Make sure everything looks correct before submitting.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onEditMapping}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-[#1A2B48]"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Mapping
            </button>
            <button
              type="button"
              onClick={onDownloadCompleted}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-[#1A2B48]"
            >
              <Download className="h-3.5 w-3.5" /> Completed Excel
            </button>
            <button
              type="button"
              onClick={() => completedRef?.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-[#1A2B48]"
            >
              <Upload className="h-3.5 w-3.5" /> Re-upload
            </button>
            <input
              ref={completedRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => onReuploadCompleted?.(e.target.files?.[0])}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`pb-2 text-[12px] font-medium ${
                filter === tab.id ? "border-b-2 border-[#F56C43] text-[#F56C43]" : "text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
            <input
              className="h-8 w-56 rounded-md border border-gray-200 bg-white pl-8 pr-2 text-[12px] focus:border-[#F56C43] focus:outline-none"
              placeholder="Search by product name, SKU…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="relative shrink-0">
            <select
              className="h-8 w-[12rem] appearance-none rounded-md border border-gray-200 bg-white bg-none py-0 pl-3 pr-9 text-[12px] leading-8 text-[#1A2B48] focus:border-[#F56C43] focus:outline-none"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="valid">Ready to List</option>
              <option value="warnings">With Warnings</option>
              <option value="errors">With Errors</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {view === "mobile" ? (
          <MobilePreview row={mobileRow} imagesBySku={imagesBySku} />
        ) : variation ? (
          variationTable
        ) : view === "list" ? (
          <ListPreview
            rows={visibleRows}
            selected={selected}
            onToggle={toggleRow}
            onEdit={setEditRow}
          />
        ) : (
          <div className={`${listingTableScrollClass(visibleRows.length, "divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white")}`}>
            {visibleRows.length ? (
              visibleRows.map((row, i) => {
                const images = rowImages(row, imagesBySku);
                const blocked = row.status === "error";
                const checked = Boolean(selected[row.row_id]) && !blocked;
                return (
                  <div key={row.row_id} className="flex flex-wrap items-center gap-3 px-3 py-3 lg:flex-nowrap">
                    <span className="w-5 text-center text-[12px] text-gray-400">{i + 1}</span>
                    <TableCheck
                      checked={checked}
                      disabled={blocked}
                      onChange={(on) => toggleRow(row, on)}
                    />
                    <Cover images={images} />
                    <div className="min-w-0 max-w-[240px] flex-1">
                      <ProductTitle
                        name={row.name}
                        className="line-clamp-2 text-[13px] font-medium leading-snug text-[#1A2B48]"
                      />
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">
                        {row.short_description || "Listing copy will appear here after AI fill."}
                      </p>
                    </div>
                    <Meta label="SKU" value={row.sku || "—"} />
                    <Meta label="Categories" value={categoryPath(row)} />
                    <Meta label="Price" value={formatInr(row.selling_price)} />
                    <div className="w-[88px]">
                      <p className="text-[10px] font-medium text-gray-400">Images</p>
                      <Thumbs images={images} />
                    </div>
                    <div className="w-[118px]">
                      <StatusPill row={row} />
                    </div>
                    <div className="w-[88px] text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[12px] text-[#1A2B48]"
                        onClick={() => setEditRow(row)}
                      >
                        View/Edit <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="px-4 py-10 text-center text-sm text-gray-500">No products match this filter.</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
          <div className="flex items-center gap-2 text-[#1A2B48]">
            <Eye className="h-4 w-4 text-sky-500" />
            <div>
              <p className="text-[12px] font-medium">Quick Preview</p>
              <p className="text-[10px] text-gray-400">See how your products will appear on IERADA.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {[
              { id: "card", label: "Product Card View", icon: LayoutGrid },
              { id: "list", label: "List View", icon: List },
              { id: "mobile", label: "Mobile View", icon: Smartphone },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] ${
                  view === item.id ? "border border-[#F56C43] bg-[#FFF5F0] text-[#F56C43]" : "text-gray-500"
                }`}
              >
                {item.icon ? <item.icon className="h-3.5 w-3.5" /> : null}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#1A2B48]">
            <FileSpreadsheet className="h-4 w-4 text-[#F56C43]" /> Upload Summary
          </p>
          <ul className="mt-2 space-y-1.5 text-[12px]">
            <SummaryLine label="Total Products" value={stats.total} />
            <SummaryLine label="Ready to List" value={readyCount} valueClass="text-emerald-600" />
            <SummaryLine label="With Warnings" value={stats.warnings} valueClass="text-amber-500" />
            <SummaryLine label="With Errors" value={stats.errors} valueClass="text-rose-500" />
          </ul>
          {readyCount ? (
            <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2 text-[11px] text-emerald-700">
              <p className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> {readyCount} products are ready to be listed!
              </p>
              {issueCount ? (
                <p className="mt-0.5 text-emerald-800/80">Please review the {issueCount} products with issues before submitting.</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-600">
              No products are ready to list. Fix errors on Validate Data first.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#1A2B48]">
            <FileSpreadsheet className="h-4 w-4 text-[#F56C43]" /> Before You Submit
          </p>
          <ul className="mt-2 space-y-2">
            {CHECKLIST.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-start gap-2 text-[11px] text-gray-600">
                  <span
                    className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                      checks[item.id]
                        ? "border-[#F56C43] bg-[#F56C43] text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {checks[item.id] ? <Check className="h-2.5 w-2.5" /> : null}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={Boolean(checks[item.id])}
                    onChange={(e) => setChecks((prev) => ({ ...prev, [item.id]: e.target.checked }))}
                  />
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-[#F56C43] px-3 py-2 text-[13px] font-medium text-white disabled:opacity-40"
          >
            Submit & Complete <ChevronRight className="h-4 w-4" />
          </button>
          <p className="mt-2 text-[10px] leading-snug text-gray-400">
            By submitting, these {selectedReady} valid products will be listed on your store.
          </p>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#1A2B48]">
            <Pencil className="h-3.5 w-3.5 text-sky-600" /> Need to make changes?
          </p>
          <p className="mt-1 text-[11px] text-gray-600">
            Go back to previous steps to edit your file, mapping or fix validation issues.
          </p>
          <button
            type="button"
            onClick={onBackToValidate}
            className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-[#1A2B48]"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Validate Data
          </button>
        </div>
      </aside>

      {liveEditRow ? (
        <ListingEditModal
          row={liveEditRow}
          imagesBySku={imagesBySku}
          taxonomy={taxonomy}
          colors={colors}
          sizes={sizes}
          onClose={() => setEditRow(null)}
          onSave={onSaveRow}
        />
      ) : null}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="min-w-[92px] max-w-[140px]">
      <p className="text-[10px] font-medium text-gray-400">{label}</p>
      <p className="truncate text-[12px] font-normal text-[#1A2B48]" title={value}>{value}</p>
    </div>
  );
}

function SummaryLine({ label, value, valueClass = "text-[#1A2B48]" }) {
  const tone = label.includes("Ready")
    ? "text-emerald-500"
    : label.includes("Warning")
      ? "text-amber-500"
      : label.includes("Error")
        ? "text-rose-500"
        : "text-gray-400";
  return (
    <li className="flex items-center justify-between gap-2">
      <span className={`flex items-center gap-1.5 ${tone}`}>
        {label.includes("Ready") ? <Check className="h-3 w-3" /> : label.includes("Warning") || label.includes("Error") ? <AlertTriangle className="h-3 w-3" /> : <span className="h-2 w-2 rounded-full bg-gray-300" />}
        {label}
      </span>
      <span className={valueClass}>{value}</span>
    </li>
  );
}

function VariationConfirmTable({ groups, imagesBySku, selected, listingKind = "color_size", onToggle, onEdit }) {
  const custom = isCustomListingKind(listingKind);
  const attrCols = custom
    ? customAttributeColumns(groups.flatMap((group) => group.variants.map((variant) => variant.row || {})))
    : [];
  const colSpan = custom ? 12 + attrCols.length : 14;
  return (
    <div className={`${listingTableScrollClass(groups.reduce((sum, group) => sum + (group.variants?.length || 0), 0))} rounded-xl border border-gray-200 bg-white`}>
      <table className="min-w-full text-left text-[11px] text-[#1A2B48]">
        <thead className={listingTableHeadClass("bg-[#F4F5F7] text-[11px] font-medium text-gray-500")}>
          <tr>
            <th className="w-8 px-3 py-2.5" />
            <th className="w-6 px-1 py-2.5">#</th>
            <th className="px-2 py-2.5">Product Name</th>
            <th className="px-2 py-2.5">Variant SKU</th>
            {custom ? (
              attrCols.map((col) => (
                <th key={col.key} className="px-2 py-2.5">{col.label}</th>
              ))
            ) : (
              <>
                <th className="px-2 py-2.5">Colour</th>
                <th className="px-2 py-2.5">Size</th>
              </>
            )}
            <th className="px-2 py-2.5">Image</th>
            <th className="px-2 py-2.5">Brand Name</th>
            <th className="px-2 py-2.5">Category Level 1</th>
            <th className="px-2 py-2.5">Selling Price</th>
            <th className="px-2 py-2.5">AI Mode</th>
            <th className="px-2 py-2.5">Short Description</th>
            <th className="px-2 py-2.5">Status</th>
            <th className="px-2 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {groups.length ? (
            groups.map((group, gi) => {
              const groupRows = group.variants.flatMap((variant) => variantRows(variant));
              const selectable = groupRows.filter((item) => item.status !== "error");
              const blocked = !selectable.length;
              const checked = selectable.length ? selectable.every((item) => selected[item.row_id]) : false;
              return group.variants.map((variant, vi) => {
                const row = variant.row || {};
                const images = rowImages(row, imagesBySku);
                const statusRow = { status: variantStatus(variant) };
                const actionRow = variantActionRow(variant);
                return (
                  <tr key={`${group.parentSku || gi}-${variant.mergeKey}`} className="border-t border-gray-100">
                    {vi === 0 ? (
                      <>
                        <td rowSpan={group.variants.length} className="w-8 px-3 py-2.5 align-top">
                          <TableCheck
                            className="mt-0.5"
                            checked={checked}
                            disabled={blocked}
                            onChange={(on) => onToggle(group, on)}
                          />
                        </td>
                        <td rowSpan={group.variants.length} className="w-6 px-1 py-2.5 align-top text-[11px] text-gray-400">
                          <span className="mt-0.5 inline-block">{gi + 1}</span>
                        </td>
                        <td rowSpan={group.variants.length} className="min-w-[168px] max-w-[208px] px-2 py-2.5 align-top">
                          <ProductTitle name={group.title} />
                        </td>
                      </>
                    ) : null}
                    <td className="whitespace-nowrap px-2 py-2.5 font-medium">{variant.sku || "—"}</td>
                    {custom ? (
                      attrCols.map((col) => (
                        <td key={col.key} className="px-2 py-2.5">
                          {variantAttrValue(variant, col.index) || "—"}
                        </td>
                      ))
                    ) : (
                      <>
                        <td className="px-2 py-2.5">{variant.colour || "—"}</td>
                        <td className="px-2 py-2.5">
                          {variant.sizes.length ? variant.sizes.join(", ") : "—"}
                        </td>
                      </>
                    )}
                    <td className="relative z-0 w-[7rem] min-w-[7rem] px-2 py-2.5">
                      <Thumbs images={images} />
                    </td>
                    <td className="relative z-10 whitespace-nowrap bg-white px-2 py-2.5">
                      {row.brand || "—"}
                    </td>
                    <td className="px-2 py-2.5">{row.category || "—"}</td>
                    <td className="px-2 py-2.5">{formatInr(row.selling_price)}</td>
                    <td className="px-2 py-2.5">{previewAiMode(row)}</td>
                    <td className="max-w-[180px] px-2 py-2.5 text-gray-600">
                      {row.short_description ? (
                        <span className="line-clamp-2 leading-[1.35]">{row.short_description}</span>
                      ) : (
                        <span className="text-gray-400">Pending AI</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5"><StatusPill row={statusRow} /></td>
                    <td className="px-2 py-2.5 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1A2B48]"
                        onClick={() => onEdit(actionRow)}
                      >
                        View/Edit <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                );
              });
            })
          ) : (
            <tr>
              <td className="px-4 py-8 text-center text-gray-500" colSpan={colSpan}>
                No products match this filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ListPreview({ rows, selected, onToggle, onEdit }) {
  return (
    <div className={`${listingTableScrollClass(rows.length)} rounded-xl border border-gray-200 bg-white`}>
      <table className="min-w-full text-left text-[12px]">
        <thead className={listingTableHeadClass("bg-[#F4F5F7] text-[11px] font-medium text-gray-500")}>
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-2 py-2" />
            <th className="px-2 py-2">Product</th>
            <th className="px-2 py-2">SKU</th>
            <th className="px-2 py-2">Price</th>
            <th className="px-2 py-2">Status</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, i) => {
            const blocked = row.status === "error";
            return (
              <tr key={row.row_id} className="border-t border-gray-100">
                <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                <td className="px-2 py-2">
                  <TableCheck
                    checked={Boolean(selected[row.row_id]) && !blocked}
                    disabled={blocked}
                    onChange={(on) => onToggle(row, on)}
                  />
                </td>
                <td className="max-w-[260px] px-2 py-2">
                  <ProductTitle name={row.name} />
                </td>
                <td className="px-2 py-2">{row.sku}</td>
                <td className="px-2 py-2">{formatInr(row.selling_price)}</td>
                <td className="px-2 py-2"><StatusPill row={row} /></td>
                <td className="px-2 py-2 text-right">
                  <button type="button" className="inline-flex items-center gap-1 text-[#1A2B48]" onClick={() => onEdit(row)}>
                    View/Edit <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </td>
              </tr>
            );
          }) : (
            <tr><td className="px-4 py-8 text-center text-gray-500" colSpan={7}>No products match this filter.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MobilePreview({ row, imagesBySku }) {
  if (!row) {
    return <p className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">No product to preview.</p>;
  }
  const images = rowImages(row, imagesBySku);
  const src = wizardImageSrc(images[0]);
  return (
    <div className="flex justify-center rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 py-6">
      <div className="w-[280px] overflow-hidden rounded-[28px] border-8 border-[#1A2B48] bg-white shadow-xl">
        <div className="h-5 bg-[#1A2B48]" />
        {src ? <img src={src} alt="" className="h-56 w-full object-cover" /> : <div className="flex h-56 items-center justify-center bg-gray-100 text-xs text-rose-500">No cover image</div>}
        <div className="p-3">
          <ProductTitle name={row.name} />
          <p className="mt-1 text-[16px] text-[#F56C43]">{formatInr(row.selling_price)}</p>
          <p className="mt-1 text-[11px] text-gray-500">{categoryPath(row)}</p>
          <p className="mt-2 line-clamp-3 text-[11px] text-gray-600">{row.short_description || "Listing copy will appear here."}</p>
          <button type="button" className="mt-3 w-full rounded-lg bg-[#F56C43] py-2 text-[12px] font-medium text-white">Add to cart</button>
        </div>
      </div>
    </div>
  );
}
