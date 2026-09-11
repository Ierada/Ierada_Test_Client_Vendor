import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCircle2,
  CloudUpload,
  Headset,
  ImagePlus,
  Info,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import SearchablePicker from "./SearchablePicker";
import { BRAND_AUTH_DOC_TYPES } from "./utils/brandAuthConfig";
import { notifyOnFail } from "../../../utils/notification/toast";
import { resolveMediaUrl } from "./utils/listingMediaCache";
import { StorefrontPreviewCard, BankSettlementSummary } from "./AiReviewStep";
import PrimaryProductGallery from "./PrimaryProductGallery";

export const SETUP_STEPS = ["brand", "type", "images", "category"];

export function listingProgressStep(state) {
  if (state?.category_id) return "category";
  if (state?.files?.length) return "images";
  if (state?.listingType) return "images";
  if (state?.brandType) return "type";
  return "brand";
}

export function listingSectionFromScroll(headerOffset = 176) {
  let current = "brand";
  for (const id of SETUP_STEPS) {
    const el = document.getElementById(`listing-step-${id}`);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= headerOffset) current = id;
  }
  return current;
}

export function scrollToListingSection(id) {
  if (!id || id === "review") return;
  document.getElementById(`listing-step-${id}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export const SETUP_STEP_META = [
  { id: "brand", n: 0, label: "Select Brand Type" },
  { id: "type", n: 1, label: "Select Listing Type" },
  { id: "images", n: 2, label: "Upload Product Images" },
  { id: "category", n: 3, label: "Select Category" },
  { id: "review", n: 4, label: "AI Review" },
];

export function variationSetupStepMeta(state = {}) {
  const isCustom = state.listingType === "custom";
  const photos = (state.files || []).filter((_, i) => state.mediaLabels?.[i]?.label !== "ai_3d").length
    + (state.existingMedia || []).filter((m) => m?.label !== "ai_3d").length;
  const brandCaption =
    state.brandType === "generic" ? "Generic Product" : state.brandType === "branded" ? "Branded Product" : "Choose type";
  return [
    { id: "brand", n: 0, label: "Brand Type", caption: brandCaption },
    {
      id: "type",
      n: 1,
      label: "Listing Type",
      caption: isCustom ? "Custom Variation Listing" : "Variation Listing",
    },
    {
      id: "images",
      n: 2,
      label: "Upload Images",
      caption: photos ? `${photos} Image${photos === 1 ? "" : "s"} Uploaded` : "Add photos",
    },
    {
      id: "category",
      n: 3,
      label: "Select Category",
      caption: state.innerSubCategoryTitle || state.categoryTitle || "Auto-detect",
    },
    {
      id: "matrix",
      n: 4,
      label: isCustom ? "Configure Custom Variations" : "Configure Variation",
      caption: isCustom ? "Custom attributes" : "Color & Size",
    },
    { id: "review", n: 5, label: "Review & Submit", caption: "Final check & publish" },
  ];
}

function IconSingleBox() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
      <path d="M18 5.5 32 12.2 18 19 4 12.2 18 5.5Z" fill="#E8A070" />
      <path d="M4 12.2V23.2L18 30.2V19L4 12.2Z" fill="#C56A3C" />
      <path d="M32 12.2V23.2L18 30.2V19L32 12.2Z" fill="#F3C39A" />
      <rect x="15.2" y="16.2" width="5.6" height="7.4" rx="0.6" fill="#F56C43" />
    </svg>
  );
}

function IconTshirt() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
      <path
        d="M12 10.5 18 13.5 24 10.5 29 13.5 25.5 17v12.5H10.5V17L7 13.5 12 10.5Z"
        stroke="#3B82F6"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 11.2c.8 2.2 2 3.3 4 3.3s3.2-1.1 4-3.3" stroke="#3B82F6" strokeWidth="1.8" />
    </svg>
  );
}

function IconSlidersPink() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
      <path d="M6 11h24" stroke="#E11D74" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M6 18h24" stroke="#E11D74" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M6 25h24" stroke="#E11D74" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="13" cy="11" r="3.1" fill="#fff" stroke="#E11D74" strokeWidth="2" />
      <circle cx="23" cy="18" r="3.1" fill="#fff" stroke="#E11D74" strokeWidth="2" />
      <circle cx="16" cy="25" r="3.1" fill="#fff" stroke="#E11D74" strokeWidth="2" />
    </svg>
  );
}

export const LISTING_TYPE_CARDS = [
  {
    id: "single",
    title: "Single Listing",
    desc: "Single product with one price and SKU.",
    Icon: IconSingleBox,
  },
  {
    id: "color_size",
    title: "Color & Size Variation Listing",
    desc: "Same product with different colors and sizes.",
    Icon: IconTshirt,
  },
  {
    id: "custom",
    title: "Custom Variation Listing",
    desc: "Custom variations like material, size, color, and more.",
    Icon: IconSlidersPink,
  },
];

const NAVY = "#1A2B48";
const ORANGE = "#F56C43";
const CARD_BORDER = "#E5E7EB";

const DOC_GUIDELINES = [
  { text: "Upload clear and valid brand registration certificate" },
  { or: true },
  { text: "Upload brand authorization / approval letter" },
  { text: "Document should be issued by brand owner / manufacturer" },
  { text: "All details must be clearly visible" },
];

const LISTING_TIPS = [
  "Use high-quality images on a clean background",
  "Pick the most specific inner category",
  "Upload brand proof before requesting publish",
  "Save as draft anytime — you will not create duplicates",
];

const VARIATION_TIPS = [
  "Upload clear photos for every color",
  "Keep SKUs unique for each color / size pair",
  "Set accurate stock so orders do not oversell",
];

const CUSTOM_VARIATION_TIPS = [
  "Use clear, high-resolution images from multiple angles",
  "Ensure variant images match the selected attributes",
  "Keep SKUs unique for each custom combination",
  "Set accurate stock so orders do not oversell",
];

function sellerDisplayName(user) {
  return (
    [user?.firstName || user?.first_name, user?.lastName || user?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    user?.name ||
    "Seller"
  );
}

function sellerIdLabel(user) {
  const raw = user?.vendor_code || user?.seller_id || user?.id;
  if (!raw) return "Seller ID: —";
  const id = String(raw);
  if (id.startsWith("IER")) return `Seller ID: ${id}`;
  return `Seller ID: IER${id}`;
}

export function ListingPageHeader({
  user,
  supportPhone = "9211736358",
  notificationCount = 0,
  bulkProgress,
  skipBulkListing,
  onExitBulk,
  listingType,
}) {
  const name = sellerDisplayName(user);
  const initial = (name.charAt(0) || "S").toUpperCase();
  return (
    <div className="bg-white px-4 lg:px-5 pt-2 pb-1">
      <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1
            className="text-[18px] sm:text-[20px] font-extrabold tracking-tight leading-none inline-flex items-center gap-2 flex-wrap"
            style={{ color: NAVY }}
          >
            Smart Product Listing
            {listingType === "color_size" || listingType === "custom" ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: "#FFF5F0", color: ORANGE, border: "1px solid #FDE4D8" }}
              >
                <Sparkles className="w-3 h-3" />
                {listingType === "custom" ? "Custom Variation Listing" : "Variation Listing"}
              </span>
            ) : null}
          </h1>
          {bulkProgress ? (
            <p className="text-xs text-gray-500 mt-2">
              Bulk {bulkProgress.current} of {bulkProgress.total}
              {bulkProgress.plannedType ? ` · ${bulkProgress.plannedLabel}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-4 sm:gap-5">
          {bulkProgress ? (
            <div className="flex items-center gap-3 text-xs">
              <button type="button" className="text-primary-100 font-medium" onClick={skipBulkListing}>
                Skip this
              </button>
              <button type="button" className="text-amber-700" onClick={onExitBulk}>
                Exit bulk
              </button>
            </div>
          ) : null}
          <a
            href={`tel:+91${String(supportPhone).replace(/\D/g, "").replace(/^91/, "")}`}
            className="hidden md:flex items-center gap-2.5"
          >
            <Headset className="w-5 h-5 shrink-0" style={{ color: ORANGE }} strokeWidth={2.25} />
            <span className="leading-tight">
              <span className="block text-[13px] font-semibold" style={{ color: NAVY }}>
                Seller Support
              </span>
              <span className="block text-[13px] font-medium text-slate-500">{supportPhone}</span>
            </span>
          </a>
          <Link
            to="/notifications"
            className="relative text-slate-400 hover:text-slate-600"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" strokeWidth={1.75} />
            {notificationCount > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary-100 text-white text-[9px] font-bold flex items-center justify-center">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            ) : null}
          </Link>
          <div className="flex items-center gap-3 pl-1">
            {user?.profile_pic || user?.avatar ? (
              <img
                src={user.profile_pic || user.avatar}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: ORANGE }}
              >
                {initial}
              </div>
            )}
            <div className="hidden sm:block leading-tight">
              <p className="text-[13px] font-bold" style={{ color: NAVY }}>
                {name}
              </p>
              <p className="text-[12px] text-slate-400 mt-0.5">{sellerIdLabel(user)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SetupStepper({
  step,
  extraSteps: _extraSteps = [],
  phase,
  onSelect,
  listingType,
  state,
}) {
  const isVariation = listingType === "color_size" || listingType === "custom";
  const flow = isVariation ? variationSetupStepMeta(state) : SETUP_STEP_META;
  const activeId =
    phase === "review"
      ? "review"
      : step === "matrix"
        ? "matrix"
        : SETUP_STEPS.includes(step)
          ? step
          : "type";
  const activeIdx = Math.max(0, flow.findIndex((s) => s.id === activeId));

  return (
    <div className="bg-white px-4 lg:px-5 pb-2 pt-0 border-b border-[#F1F5F9]">
      <div className="max-w-[1400px] mx-auto overflow-x-auto">
        <ol className={`flex items-start ${isVariation ? "min-w-[860px]" : "min-w-[640px]"}`}>
          {flow.map((meta, idx) => {
            const active = idx === activeIdx;
            const done = idx < activeIdx;
            return (
              <li key={meta.id} className="flex-1 flex flex-col items-center min-w-0">
                <div className="flex items-center w-full">
                  <span
                    className="h-px flex-1"
                    style={{
                      backgroundColor:
                        idx === 0
                          ? "transparent"
                          : done || active
                            ? done && isVariation
                              ? "#22C55E"
                              : ORANGE
                            : "#E5E7EB",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => onSelect?.(meta.id)}
                    className="w-7 h-7 rounded-full shrink-0 text-[13px] font-bold flex items-center justify-center transition-colors"
                    style={
                      active
                        ? { backgroundColor: ORANGE, color: "#fff" }
                        : done && isVariation
                          ? { backgroundColor: "#22C55E", color: "#fff" }
                          : done
                            ? { backgroundColor: ORANGE, color: "#fff" }
                            : {
                                backgroundColor: "#fff",
                                color: "#C4C9D4",
                                border: "2px solid #E5E7EB",
                              }
                    }
                  >
                    {done && isVariation ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : meta.n}
                  </button>
                  <span
                    className="h-px flex-1"
                    style={{
                      backgroundColor:
                        idx === flow.length - 1
                          ? "transparent"
                          : done
                            ? isVariation
                              ? "#22C55E"
                              : ORANGE
                            : "#E5E7EB",
                    }}
                  />
                </div>
                <p
                  className="mt-1 text-[11px] sm:text-[12px] text-center px-1 leading-snug whitespace-nowrap"
                  style={
                    active
                      ? {
                          color: ORANGE,
                          fontWeight: 600,
                          textDecoration: "underline",
                          textUnderlineOffset: "3px",
                          textDecorationThickness: "1.5px",
                        }
                      : done && isVariation
                        ? { color: "#16A34A", fontWeight: 600 }
                        : { color: "#9CA3AF", fontWeight: 500 }
                  }
                >
                  {meta.label}
                </p>
                {meta.caption ? (
                  <p className="text-[10px] text-slate-400 mt-0.5 text-center px-1 leading-tight line-clamp-1">
                    {meta.caption}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function SectionHeading({ n, title, hint, numbered = true, circled = false }) {
  return (
    <div className="mb-2.5">
      <h2 className="text-[15px] font-bold flex items-center gap-2" style={{ color: NAVY }}>
        {circled ? (
          <span
            className="w-6 h-6 rounded-full text-white text-[12px] font-bold flex items-center justify-center shrink-0"
            style={{ backgroundColor: NAVY }}
          >
            {n}
          </span>
        ) : null}
        {circled ? title : `${n}. ${title}`}
        {hint ? (
          <span title={hint} className="text-slate-300 hover:text-slate-500 cursor-help">
            <Info className="w-3.5 h-3.5" strokeWidth={2} />
          </span>
        ) : null}
      </h2>
    </div>
  );
}

function BrandTypeCard({ selected, onClick, variant, title, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative text-left w-full rounded-[10px] px-4 py-3 flex items-center gap-3.5 bg-white"
      style={{
        border: selected ? `1.5px solid ${ORANGE}` : `1px solid ${CARD_BORDER}`,
      }}
    >
      <span
        className="absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center"
        style={{
          border: selected ? `2px solid ${ORANGE}` : "1.5px solid #D1D5DB",
          backgroundColor: "#fff",
        }}
      >
        {selected ? <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ORANGE }} /> : null}
      </span>
      {variant === "branded" ? (
        <svg width="32" height="32" viewBox="0 0 32 32" className="shrink-0" aria-hidden>
          <path d="M10 26 16 22.5 22 26v-9.5H10V26Z" fill={ORANGE} />
          <circle cx="16" cy="12" r="7" fill={ORANGE} />
          <path d="M16 8.2 17.4 11.4 20.8 11.7 18.2 14 19 17.4 16 15.6 13 17.4 13.8 14 11.2 11.7 14.6 11.4Z" fill="#fff" />
        </svg>
      ) : (
        <svg width="32" height="32" viewBox="0 0 32 32" className="shrink-0" aria-hidden>
          <path
            d="M7 13.5 16 7l9 6.5V23c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2v-9.5Z"
            fill={selected ? "#FFF1EC" : "#F3F4F6"}
            stroke={selected ? ORANGE : "#9CA3AF"}
            strokeWidth="1.6"
          />
          <path d="M12 16h8M12 19.5h5" stroke={selected ? ORANGE : "#9CA3AF"} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
      <span className="min-w-0 pr-6">
        <span className="block text-[13.5px] font-semibold leading-snug" style={{ color: NAVY }}>
          {title}
        </span>
        <span className="block text-[12px] text-slate-400 mt-0.5 leading-snug">{desc}</span>
      </span>
    </button>
  );
}

function ListingTypeCard({ selected, onClick, icon: Icon, title, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full rounded-[10px] px-2.5 py-2.5 flex items-center gap-2 bg-white min-h-[72px]"
      style={{
        border: selected ? `1.5px solid ${ORANGE}` : `1px solid ${CARD_BORDER}`,
      }}
    >
      <span
        className="w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center"
        style={{
          border: selected ? `2px solid ${ORANGE}` : "1.5px solid #D1D5DB",
          backgroundColor: "#fff",
        }}
      >
        {selected ? <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ORANGE }} /> : null}
      </span>
      <span className="shrink-0">
        <Icon />
      </span>
      <span className="min-w-0">
        <span className="block text-[12.5px] font-semibold leading-snug" style={{ color: NAVY }}>
          {title}
        </span>
        <span className="block text-[11px] text-slate-400 mt-0.5 leading-snug">{desc}</span>
      </span>
    </button>
  );
}

function BrandAuthDropzone({ state, patch }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const takeFile = (f) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      notifyOnFail("Max 5MB");
      return;
    }
    patch({ brandAuthFile: f, brandAuthDocName: f.name });
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        takeFile(e.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className="rounded-lg border-2 border-dashed cursor-pointer flex flex-col items-center justify-center text-center px-4 py-7 min-h-[132px]"
      style={{
        borderColor: ORANGE,
        backgroundColor: dragOver ? "#FFE8DC" : "#FFF4EE",
      }}
    >
      <CloudUpload className="w-8 h-8 mb-1.5" style={{ color: ORANGE }} />
      <p className="text-[13px] font-semibold" style={{ color: NAVY }}>
        Click to upload or drag & drop
      </p>
      <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (Max 5MB)</p>
      {state.brandAuthDocName ? (
        <p className="text-xs text-emerald-700 mt-2 font-medium">Uploaded: {state.brandAuthDocName}</p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => {
          takeFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

const IMAGE_SLOT_HINTS = [
  { label: "front", hint: "Front pic" },
  { label: "left", hint: "Left side" },
  { label: "right", hint: "Right side" },
  { label: "back", hint: "Back" },
];

function ImageStrip({
  state,
  patch,
  onGenerateAi,
  aiGenerating,
  categorySuggesting,
}) {
  const files = state.files || [];
  const labels = state.mediaLabels || [];
  const existingMedia = state.existingMedia || [];
  const deleteMediaIds = state.deleteMediaIds || [];
  const plusRef = useRef(null);
  const thumb = "w-[104px] h-[104px]";

  const fileEntries = files
    .map((file, i) => ({ file, i, label: labels[i]?.label }))
    .filter((x) => x.file);
  const photoFileEntries = fileEntries.filter((x) => x.label !== "ai_3d");
  const generatedEntries = fileEntries.filter((x) => x.label === "ai_3d");

  // Photos already saved on the product (edit / resume) have no File object.
  const takenLabels = new Set(photoFileEntries.map((x) => x.label).filter(Boolean));
  const existingEntries = existingMedia
    .filter((m) => m?.url && m.label !== "ai_3d" && !takenLabels.has(m.label))
    .map((m) => ({ existing: m, label: m.label }));

  const photoEntries = [...existingEntries, ...photoFileEntries];

  const addFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notifyOnFail("Only image files are allowed");
      return;
    }
    const photos = photoEntries.length;
    const slot = IMAGE_SLOT_HINTS[photos]?.label || `extra${photos}`;
    const nextFiles = [
      ...photoFileEntries.map((p) => p.file),
      file,
      ...generatedEntries.map((p) => p.file),
    ];
    const nextLabels = [
      ...photoFileEntries.map(
        (p) => labels[p.i] || { label: IMAGE_SLOT_HINTS[p.i]?.label || `extra${p.i}` },
      ),
      { label: slot, alt_text: `${state.name || "Product"} — ${slot}` },
      ...generatedEntries.map((p) => labels[p.i]),
    ];
    patch({ files: nextFiles, mediaLabels: nextLabels });
  };

  const removeAt = (idx) => {
    patch({
      files: files.filter((_, i) => i !== idx),
      mediaLabels: labels.filter((_, i) => i !== idx),
    });
  };

  const removeExisting = (media) => {
    patch({
      existingMedia: existingMedia.filter((m) => m !== media),
      deleteMediaIds: media?.id
        ? [...new Set([...deleteMediaIds, media.id])]
        : deleteMediaIds,
    });
  };

  const renderFilled = (entry, badge) => {
    const url = entry.existing
      ? resolveMediaUrl(entry.existing.url)
      : entry.file instanceof File
        ? URL.createObjectURL(entry.file)
        : entry.file?.url || "";
    return (
      <div
        key={entry.existing ? `e-${entry.existing.id ?? entry.label}` : `f-${entry.i}`}
        className={`relative ${thumb} rounded-lg overflow-hidden bg-slate-100`}
        style={{ border: `1px solid ${CARD_BORDER}` }}
      >
        {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : null}
        {badge ? (
          <span className="absolute bottom-1 left-1 rounded px-1 py-0.5 text-[9px] font-bold text-white bg-primary-100">
            {badge}
          </span>
        ) : null}
        <button
          type="button"
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
          onClick={() =>
            entry.existing ? removeExisting(entry.existing) : removeAt(entry.i)
          }
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const emptySlot = (i) => {
    const hint = IMAGE_SLOT_HINTS[i]?.hint || "Extra photo";
    return (
      <label
        key={`empty-${i}`}
        className={`relative ${thumb} rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer text-slate-300 hover:text-primary-100 overflow-hidden`}
        style={{ borderColor: "#D1D5DB", backgroundColor: "#F8FAFC" }}
      >
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none px-1 text-center font-semibold leading-tight"
          style={{
            color: "rgba(148, 163, 184, 0.38)",
            fontSize: "12px",
            transform: "rotate(-18deg)",
          }}
        >
          {hint}
        </span>
        <ImagePlus className="w-7 h-7 relative z-[1] opacity-70" />
        <span className="relative z-[1] mt-0.5 text-[11px] font-medium text-slate-400 text-center px-1 leading-tight">
          {hint}
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            addFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
    );
  };

  const photoSlots = [];
  for (let i = 0; i < Math.max(4, photoEntries.length); i += 1) {
    photoSlots.push(photoEntries[i] ? renderFilled(photoEntries[i]) : emptySlot(i));
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      <div className="flex flex-wrap gap-2.5 flex-1 min-w-0">
        {photoSlots}
        <button
          type="button"
          onClick={() => plusRef.current?.click()}
          className={`${thumb} rounded-lg border-2 border-dashed flex items-center justify-center text-slate-400 hover:text-primary-100`}
          style={{ borderColor: CARD_BORDER, backgroundColor: "#FAFBFC" }}
          aria-label="Add more images"
        >
          <Plus className="w-6 h-6" strokeWidth={2} />
        </button>
        {generatedEntries.map((entry) => renderFilled(entry))}
        <input
          ref={plusRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            addFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
        <button
          type="button"
          disabled={aiGenerating || categorySuggesting || photoEntries.length === 0}
          onClick={onGenerateAi}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-[13px] font-semibold disabled:opacity-50"
          style={{ backgroundColor: ORANGE }}
        >
          {aiGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Generate with AI
        </button>
        <p className="text-[10px] text-slate-400 text-center max-w-[140px] leading-snug">
          Uses the first photo to create a 3D studio shot (added last)
        </p>
      </div>
    </div>
  );
}

export default function SmartListingSetupForm({
  state,
  patch,
  fieldErrors,
  categories,
  filteredSubs,
  filteredInners,
  categorySuggesting,
  onDetectCategory,
  onGenerateAi,
  aiGenerating,
  pricingBlock,
}) {
  return (
    <div className="space-y-6">
      <section id="listing-step-brand" className="scroll-mt-[168px]">
        <SectionHeading
          n={1}
          title="Select Brand Type"
          hint="Choose branded if you have a registered brand for this product."
        />
        <p className="text-[12px] text-slate-400 -mt-1 mb-3">
          Choose whether your product is a branded product or generic (no brand).
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <BrandTypeCard
            selected={state.brandType === "branded"}
            onClick={() => patch({ brandType: "branded" })}
            variant="branded"
            title="Branded Product"
            desc="I have a registered brand for this product."
          />
          <BrandTypeCard
            selected={state.brandType === "generic"}
            onClick={() => patch({ brandType: "generic" })}
            variant="generic"
            title="Generic Product"
            desc="My product does not have a brand / is non-branded."
          />
        </div>
        {fieldErrors.brandType ? <p className="text-xs text-red-600 mt-2">{fieldErrors.brandType}</p> : null}

        {state.brandType === "branded" ? (
          <div
            className="rounded-[10px] bg-white p-4 mt-3 space-y-2"
            style={{ border: `1px solid ${CARD_BORDER}` }}
          >
            <p className="text-[13.5px] font-bold" style={{ color: NAVY }}>
              Brand Authorization / Approval (Required)
            </p>
            <p className="text-[12px] text-slate-400">
              To sell branded products, upload brand registration certificate or authorization letter.
            </p>
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-3 pt-1">
              <div className="space-y-2.5">
                <label className="block text-[12px] font-semibold" style={{ color: NAVY }}>
                  Select Document Type
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-normal text-slate-700"
                    value={state.brandAuthDocType || "brand_registration"}
                    onChange={(e) => patch({ brandAuthDocType: e.target.value })}
                  >
                    {BRAND_AUTH_DOC_TYPES.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <p className="text-[12px] font-semibold mb-1" style={{ color: NAVY }}>
                    Upload Document
                  </p>
                  <BrandAuthDropzone state={state} patch={patch} />
                </div>
                {state.brandAuthStatus ? (
                  <p className={`text-xs ${state.brandAuthApproved ? "text-emerald-700" : "text-amber-700"}`}>
                    Auth status: {state.brandAuthStatus}
                  </p>
                ) : null}
                {fieldErrors.brandAuth ? <p className="text-xs text-red-600">{fieldErrors.brandAuth}</p> : null}
              </div>
              <div className="rounded-lg bg-[#F4F6F8] p-3.5 relative" style={{ border: `1px solid ${CARD_BORDER}` }}>
                <p className="text-[13px] font-bold pr-6 mb-2.5" style={{ color: NAVY }}>
                  Document Guidelines
                </p>
                <span className="absolute top-3 right-3 text-primary-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 3 4 7v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V7l-8-4Z" stroke="#F56C43" strokeWidth="1.8" />
                    <path d="m8.5 12 2.4 2.4 4.6-5" stroke="#F56C43" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <ul className="space-y-2">
                  {DOC_GUIDELINES.map((item, i) =>
                    item.or ? (
                      <li key={`or-${i}`} className="text-[11px] font-bold text-slate-500 pl-5">
                        OR
                      </li>
                    ) : (
                      <li key={item.text} className="flex items-start gap-2 text-[11.5px] text-slate-600">
                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-700" />
                        {item.text}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section id="listing-step-type" className="scroll-mt-[168px]">
        <SectionHeading
          n={2}
          title="Select Listing Type"
          hint="Pick the listing structure that matches how you sell this product."
        />
        <p className="text-[12px] text-slate-400 -mt-1 mb-3">
          Choose the type of listing that best describes your product.
        </p>
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {LISTING_TYPE_CARDS.map((t) => (
            <ListingTypeCard
              key={t.id}
              selected={state.listingType === t.id}
              onClick={() => patch({ listingType: t.id })}
              icon={t.Icon}
              title={t.title}
              desc={t.desc}
            />
          ))}
        </div>
        {fieldErrors.listingType ? <p className="text-xs text-red-600 mt-2">{fieldErrors.listingType}</p> : null}
      </section>

      <section id="listing-step-images" className="scroll-mt-[168px]">
        {state.listingType === "color_size" ? (
          <PrimaryProductGallery
            state={state}
            patch={patch}
            onGenerateAi={onGenerateAi}
            aiGenerating={aiGenerating}
            categorySuggesting={categorySuggesting}
            fieldError={fieldErrors.files}
          />
        ) : (
          <>
            <SectionHeading n={3} title="Upload Product Images" circled />
            <div
              className="rounded-[10px] bg-white p-3.5 space-y-2"
              style={{ border: `1px solid ${CARD_BORDER}` }}
            >
              <p className="text-[12px] text-slate-400">
                Add front / left / right / back. AI fills category from the first photo.
              </p>
              {categorySuggesting ? (
                <p
                  className="text-xs bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 inline-flex items-center gap-2"
                  style={{ color: ORANGE }}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Detecting category from your photo…
                </p>
              ) : null}
              {fieldErrors.files ? <p className="text-xs text-red-600">{fieldErrors.files}</p> : null}
              <ImageStrip
                state={state}
                patch={patch}
                onGenerateAi={onGenerateAi}
                aiGenerating={aiGenerating}
                categorySuggesting={categorySuggesting}
              />
            </div>
          </>
        )}
      </section>

      {state.listingType === "single" ? (
      <section id="listing-step-combo" className="scroll-mt-[168px]">
        <label
          className="flex items-start gap-3 cursor-pointer select-none rounded-[10px] bg-white px-3.5 py-3"
          style={{ border: `1px solid ${CARD_BORDER}` }}
        >
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300"
            style={{ accentColor: ORANGE }}
            checked={!!state.isCombo}
            onChange={(e) => patch({ isCombo: e.target.checked })}
          />
          <span>
            <span className="block text-[13.5px] font-bold" style={{ color: NAVY }}>
              This listing is a combo
            </span>
            <span className="block text-[12px] text-slate-400 mt-0.5">
              Tick if this listing is sold as a combo. This only flags the listing — it does not change how you create it.
            </span>
          </span>
        </label>
      </section>
      ) : null}

      <section id="listing-step-category" className="scroll-mt-[168px]">
        <SectionHeading n={4} title="Select Category" circled />
        <div
          className="rounded-[10px] bg-white px-3 py-3 w-full"
          style={{ border: `1px solid ${CARD_BORDER}` }}
        >
          <p className="text-[12px] text-slate-400 mb-2">
            Auto-filled from the product photo. You can still change it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400 mb-1">Category</p>
              <SearchablePicker
                compact
                value={state.category_id}
                onChange={(id) => {
                  const cat = categories.find((c) => String(c.id) === String(id));
                  patch({
                    category_id: id,
                    categoryTitle: cat?.name || "",
                    sub_category_id: "",
                    subCategoryTitle: "",
                    inner_sub_category_id: "",
                    innerSubCategoryTitle: "",
                  });
                }}
                placeholder="Select category"
                searchPlaceholder="Search category…"
                options={categories.map((c) => ({ id: c.id, label: c.name }))}
                error={fieldErrors.category_id}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400 mb-1">Sub-Category</p>
              <SearchablePicker
                compact
                value={state.sub_category_id}
                onChange={(id) => {
                  const sub = filteredSubs.find((c) => String(c.id) === String(id));
                  patch({
                    sub_category_id: id,
                    subCategoryTitle: sub?.name || "",
                    inner_sub_category_id: "",
                    innerSubCategoryTitle: "",
                  });
                }}
                placeholder="Select sub-category"
                searchPlaceholder="Search subcategory…"
                options={filteredSubs.map((c) => ({ id: c.id, label: c.name }))}
                error={fieldErrors.sub_category_id}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400 mb-1">Inner Sub-Category</p>
              <SearchablePicker
                compact
                value={state.inner_sub_category_id}
                onChange={(id) => {
                  const inner = filteredInners.find((c) => String(c.id) === String(id));
                  patch({
                    inner_sub_category_id: id,
                    innerSubCategoryTitle: inner?.name || "",
                  });
                }}
                placeholder="Select inner sub-category"
                searchPlaceholder="Search inner subcategory…"
                options={filteredInners.map((c) => ({ id: c.id, label: c.name }))}
              />
            </div>
          </div>
          {state.files?.length ? (
            <button
              type="button"
              disabled={categorySuggesting}
              onClick={() => onDetectCategory?.()}
              className="mt-2 text-xs font-medium hover:underline disabled:opacity-50"
              style={{ color: ORANGE }}
            >
              {categorySuggesting ? "Detecting…" : "Re-detect category from photo"}
            </button>
          ) : null}
          {pricingBlock}
        </div>
      </section>
    </div>
  );
}

export function ListingRightRail({ state, settlement, previewUrl }) {
  const tips =
    state.listingType === "color_size"
      ? VARIATION_TIPS
      : state.listingType === "custom"
        ? CUSTOM_VARIATION_TIPS
        : LISTING_TIPS;
  return (
    <div className="space-y-2.5 text-[13px]">
      <StorefrontPreviewCard state={state} previewUrl={previewUrl} settlement={settlement} />
      <BankSettlementSummary state={state} settlement={settlement} />
      <div
        className="bg-white rounded-[10px] px-2.5 py-2"
        style={{ border: `1px solid ${CARD_BORDER}` }}
      >
        <h3 className="text-[12px] font-bold mb-1.5" style={{ color: NAVY }}>
          Listing Tips
        </h3>
        <ul className="space-y-1">
          {tips.map((t) => (
            <li key={t} className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-600">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
              {t}
            </li>
          ))}
        </ul>
        <Link to="/product" className="mt-1.5 inline-block text-[11px] font-medium" style={{ color: ORANGE }}>
          View All Tips →
        </Link>
      </div>
    </div>
  );
}

export function ListingStickyFooter({
  onBack,
  saveHint,
  saving,
  submitting,
  discarding,
  isPublishedLive,
  showDraft,
  onSaveDraft,
  onDiscard,
  phase,
  onPrimary,
  aiGenerating,
  primaryLabel,
  primaryVariant,
  showBack,
  stats,
}) {
  const savedText =
    saveHint === "Ready"
      ? "All changes saved"
      : saveHint?.toLowerCase().includes("save")
        ? saveHint
        : saveHint || "All changes saved";
  const useNextStyle = primaryVariant === "next" || (primaryVariant == null && phase === "basics");
  return (
    <footer
      className="fixed bottom-0 left-0 right-0 lg:left-[72px] bg-white z-30"
      style={{ borderTop: `1px solid ${CARD_BORDER}`, boxShadow: "0 -4px 16px rgba(16, 24, 40, 0.04)" }}
    >
      <div className="w-full px-4 lg:px-5 py-3 flex items-center gap-3 flex-nowrap overflow-x-auto">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 sticky left-0 z-10 bg-white text-sm font-medium text-slate-500 hover:text-slate-800 pr-2"
        >
          ← Back
        </button>
        <p className="shrink-0 text-[13px] font-medium text-emerald-600 inline-flex items-center gap-2">
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-[18px] h-[18px]" />
          )}
          <span>{savedText}</span>
          <span className="text-slate-400 font-normal">Just now</span>
        </p>
        {stats ? (
          <div className="hidden md:flex flex-1 min-w-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500 overflow-hidden">
            <FooterStat label="Base MRP" value={stats.baseMrp} />
            <FooterStat label="Selling Price Range" value={stats.sellRange} />
            <FooterStat label="Total Variants" value={stats.variantCount} />
            <FooterStat label="Total Stock" value={stats.totalStock} />
            <FooterStat label="You Earn (Est.)" value={stats.youEarn} accent />
          </div>
        ) : (
          <div className="flex-1 min-w-0" />
        )}
        <div className="flex items-center gap-3 flex-nowrap justify-end ml-auto shrink-0">
          {showDraft ? (
            <>
              <button
                type="button"
                disabled={submitting || discarding}
                onClick={onDiscard}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white disabled:opacity-50 inline-flex items-center gap-2"
                style={{ color: "#B42318", border: "1.5px solid #FECDCA" }}
              >
                {discarding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Discard Draft
              </button>
              <button
                type="button"
                disabled={submitting || discarding}
                onClick={onSaveDraft}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white disabled:opacity-50"
                style={{ color: ORANGE, border: `1.5px solid ${ORANGE}` }}
              >
                Save as Draft
              </button>
            </>
          ) : null}
          <button
            type="button"
            disabled={aiGenerating || submitting || discarding}
            onClick={onPrimary}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: useNextStyle ? ORANGE : "#059669" }}
          >
            {aiGenerating || submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {primaryLabel}
          </button>
        </div>
      </div>
    </footer>
  );
}

function FooterStat({ label, value, accent }) {
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className="uppercase tracking-wide text-[9px] font-semibold text-slate-400">{label}</span>
      <span className={`font-bold tabular-nums ${accent ? "text-emerald-700" : ""}`} style={accent ? undefined : { color: NAVY }}>
        {value}
      </span>
    </span>
  );
}
