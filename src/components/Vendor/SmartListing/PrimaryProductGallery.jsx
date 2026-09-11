import React, { useRef, useState } from "react";
import { Loader2, Plus, Star, Trash2 } from "lucide-react";
import { notifyOnFail } from "../../../utils/notification/toast";
import { resolveMediaUrl } from "./utils/listingMediaCache";

const ORANGE = "#F56C43";
const NAVY = "#1A2B48";
const MUTED = "#8C97A8";
const PEACH = "#FFF8F4";
const DASH = "#F4B183";
const MAX_BYTES = 5 * 1024 * 1024;
const SLOT_LG = 156;
const SLOT_SM = 120;

function photoLabel(index) {
  if (index === 0) return "front";
  return `extra${index}`;
}

function AddImageGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="5" y="8" width="24" height="20" rx="3.5" stroke={ORANGE} strokeWidth="1.8" />
      <path d="M8.5 24.5 14 18l5 5.5 3-2.5 5.5 6" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12.5" cy="14.5" r="1.6" fill={ORANGE} />
      <circle cx="30" cy="28" r="8" fill={ORANGE} />
      <path d="M30 24.5v7M26.5 28h7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function PrimaryProductGallery({
  state,
  patch,
  categorySuggesting,
  fieldError,
  compact = false,
}) {
  const SLOT = compact ? SLOT_SM : SLOT_LG;
  const files = state.files || [];
  const labels = state.mediaLabels || [];
  const existingMedia = state.existingMedia || [];
  const deleteMediaIds = state.deleteMediaIds || [];
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  const fileEntries = files
    .map((file, i) => ({ file, i, label: labels[i]?.label }))
    .filter((x) => x.file);
  const photoFileEntries = fileEntries.filter((x) => x.label !== "ai_3d");
  const generatedEntries = fileEntries.filter((x) => x.label === "ai_3d");
  const takenLabels = new Set(photoFileEntries.map((x) => x.label).filter(Boolean));
  const existingEntries = existingMedia
    .filter((m) => m?.url && m.label !== "ai_3d" && !takenLabels.has(m.label))
    .map((m) => ({ existing: m, label: m.label }));
  const photoEntries = [...existingEntries, ...photoFileEntries];

  const rebuildFromPhotos = (nextPhotos, extra = {}) => {
    const nextFiles = [];
    const nextLabels = [];
    const nextExisting = [];
    nextPhotos.forEach((p, i) => {
      const label = photoLabel(i);
      const entry = {
        label,
        alt_text: `${state.name || "Product"} — ${label}`,
      };
      if (p.file) {
        nextFiles.push(p.file);
        nextLabels.push(entry);
      } else if (p.existing) {
        nextExisting.push({ ...p.existing, label });
      }
    });
    generatedEntries.forEach((p) => {
      nextFiles.push(p.file);
      nextLabels.push(labels[p.i] || { label: "ai_3d" });
    });
    patch({
      files: nextFiles,
      mediaLabels: nextLabels,
      existingMedia: nextExisting,
      ...extra,
    });
  };

  const addFiles = (picked) => {
    const images = Array.from(picked || []).filter((f) => f.type?.startsWith("image/"));
    if (!images.length) {
      notifyOnFail("Only image files are allowed");
      return;
    }
    const accepted = [];
    for (const file of images) {
      if (file.size > MAX_BYTES) {
        notifyOnFail("JPG, PNG up to 5MB each");
        continue;
      }
      accepted.push({ file, label: photoLabel(photoEntries.length + accepted.length) });
    }
    if (!accepted.length) return;
    rebuildFromPhotos([...photoEntries, ...accepted]);
  };

  const removeAt = (idx) => {
    const entry = photoEntries[idx];
    const extra = {};
    if (entry?.existing?.id) {
      extra.deleteMediaIds = [...new Set([...deleteMediaIds, entry.existing.id])];
    }
    rebuildFromPhotos(
      photoEntries.filter((_, i) => i !== idx),
      extra,
    );
  };

  const movePhoto = (from, to) => {
    if (from == null || to == null || from === to) return;
    if (from < 0 || to < 0 || from >= photoEntries.length || to >= photoEntries.length) return;
    const next = [...photoEntries];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    rebuildFromPhotos(next);
  };

  const DEFAULT_SLOTS = 4;
  const emptyCount = Math.max(0, DEFAULT_SLOTS - photoEntries.length);
  const showPlus = emptyCount === 0;
  const slotStyle = {
    width: SLOT,
    height: SLOT,
    minWidth: SLOT,
    minHeight: SLOT,
  };

  return (
    <div
      className="bg-white"
      style={{
        border: "1px solid #E6E8EE",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
      }}
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes("Files")) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (e.dataTransfer?.files?.length) {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[18px] font-extrabold leading-none" style={{ color: NAVY }}>
            Primary Product Gallery
          </h3>
          <p className="text-[13px] mt-2 leading-snug" style={{ color: MUTED }}>
            These images represent your main product. First image will be used as the cover image.
            {categorySuggesting ? (
              <span className="inline-flex items-center gap-1.5 ml-2 font-medium" style={{ color: ORANGE }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Detecting category…
              </span>
            ) : null}
          </p>
        </div>
        <span className="text-[13px] font-semibold whitespace-nowrap pt-0.5" style={{ color: ORANGE }}>
          Upload as many images as you need
        </span>
      </div>

      {fieldError ? <p className="mt-3 text-xs text-red-600">{fieldError}</p> : null}

      <div
        className="mt-5 flex gap-4 overflow-x-auto pb-1"
        style={{ backgroundColor: dragOver ? PEACH : "transparent", borderRadius: 12 }}
      >
        {photoEntries.map((entry, idx) => {
          const url = entry.existing
            ? resolveMediaUrl(entry.existing.url)
            : entry.file instanceof File
              ? URL.createObjectURL(entry.file)
              : entry.file?.url || "";
          const primary = idx === 0;
          return (
            <div
              key={entry.existing ? `e-${entry.existing.id ?? entry.label}` : `f-${entry.i ?? idx}`}
              draggable
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                movePhoto(dragIndex, idx);
                setDragIndex(null);
              }}
              className="relative rounded-[14px] overflow-hidden bg-slate-100 shrink-0"
              style={{
                ...slotStyle,
                border: primary ? `2px solid ${ORANGE}` : "1px solid #E6E8EE",
              }}
            >
              {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : null}
              {primary ? (
                <span
                  className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] text-[11px] font-semibold text-white"
                  style={{ backgroundColor: ORANGE }}
                >
                  <Star className="w-3 h-3 fill-white" />
                  Primary
                </span>
              ) : null}
              <button
                type="button"
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full text-white flex items-center justify-center"
                style={{ backgroundColor: "rgba(55,65,81,0.55)" }}
                onClick={() => removeAt(idx)}
                aria-label="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {Array.from({ length: emptyCount }).map((_, i) => (
          <button
            key={`empty-${i}`}
            type="button"
            onClick={() => inputRef.current?.click()}
            className="shrink-0 rounded-[14px] border-2 border-dashed flex flex-col items-center justify-center"
            style={{
              ...slotStyle,
              borderColor: DASH,
              backgroundColor: PEACH,
            }}
          >
            <AddImageGlyph />
            <span className="mt-2 text-[13px] font-semibold" style={{ color: ORANGE }}>
              Add Image
            </span>
            <span className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              Drag & drop
            </span>
          </button>
        ))}

        {showPlus ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="shrink-0 rounded-[14px] border-2 border-dashed flex flex-col items-center justify-center"
            style={{
              ...slotStyle,
              borderColor: ORANGE,
              backgroundColor: "#fff",
            }}
            aria-label="Add more product images"
            title="Add more images"
          >
            <span
              className="inline-flex items-center justify-center rounded-full text-white"
              style={{ width: compact ? 44 : 52, height: compact ? 44 : 52, backgroundColor: ORANGE }}
            >
              <Plus className={compact ? "w-7 h-7" : "w-8 h-8"} strokeWidth={2.6} />
            </span>
            <span className="mt-2 text-[13px] font-semibold" style={{ color: ORANGE }}>
              Add more
            </span>
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
        Drag to reorder images. JPG, PNG up to 5MB each.
      </p>
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
    </div>
  );
}
