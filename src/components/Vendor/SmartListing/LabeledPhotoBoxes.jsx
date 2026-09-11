import React from "react";
import { ImagePlus, X } from "lucide-react";
import { notifyOnFail } from "../../../utils/notification/toast";
import { LISTING_IMAGE_MAX_BYTES } from "./utils/chunkUploadFiles";
import { resolveMediaUrl } from "./utils/listingMediaCache";

export const PHOTO_SLOTS = [
  { id: "front", label: "Front", required: true },
  { id: "back", label: "Back", required: false },
  { id: "side", label: "Side / Detail", required: false },
  { id: "lifestyle", label: "Lifestyle", required: false },
  { id: "packaging", label: "Packaging", required: false },
  { id: "extra1", label: "Extra 1", required: false },
  { id: "extra2", label: "Extra 2", required: false },
  { id: "extra3", label: "Extra 3", required: false },
];

function slotPreview(hit) {
  if (hit?.file instanceof File) return URL.createObjectURL(hit.file);
  if (hit?.existing?.url) return resolveMediaUrl(hit.existing.url);
  return null;
}

/**
 * Labeled photo boxes — each slot maps to files[] + mediaLabels[] for alt/label persist.
 * On edit, existingMedia[] (with url/label) fills slots until replaced.
 */
export default function LabeledPhotoBoxes({ state, patch, fieldError }) {
  const files = state.files || [];
  const labels = state.mediaLabels || [];
  const existingMedia = state.existingMedia || [];
  const deleteMediaIds = state.deleteMediaIds || [];

  const bySlot = {};
  files.forEach((f, i) => {
    const slot = labels[i]?.label || (i === 0 ? "front" : `extra${i}`);
    if (!bySlot[slot]) bySlot[slot] = { file: f, index: i };
  });
  existingMedia.forEach((m) => {
    const slot = m.label || null;
    if (!slot || bySlot[slot]) return;
    bySlot[slot] = { existing: m };
  });

  const setSlot = (slotId, file) => {
    const nextFiles = [...files];
    const nextLabels = [...labels];
    let nextExisting = [...existingMedia];
    let nextDelete = [...deleteMediaIds];
    const existingIdx = nextLabels.findIndex((l) => l?.label === slotId);
    const existingHit = nextExisting.find((m) => m.label === slotId);

    if (!file) {
      if (existingIdx >= 0) {
        nextFiles.splice(existingIdx, 1);
        nextLabels.splice(existingIdx, 1);
      }
      if (existingHit?.id) {
        nextDelete.push(existingHit.id);
        nextExisting = nextExisting.filter((m) => m.label !== slotId);
      }
      patch({
        files: nextFiles,
        mediaLabels: nextLabels,
        existingMedia: nextExisting,
        deleteMediaIds: [...new Set(nextDelete)],
      });
      return;
    }
    if (file.size > LISTING_IMAGE_MAX_BYTES) {
      const mb = Math.round(LISTING_IMAGE_MAX_BYTES / (1024 * 1024));
      notifyOnFail(`Image must be ${mb} MB or smaller`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      notifyOnFail("Only image files are allowed");
      return;
    }
    if (existingHit?.id) {
      nextDelete.push(existingHit.id);
      nextExisting = nextExisting.filter((m) => m.label !== slotId);
    }
    const entry = {
      label: slotId,
      alt_text: `${state.name || "Product"} — ${slotId}`,
    };
    if (existingIdx >= 0) {
      nextFiles[existingIdx] = file;
      nextLabels[existingIdx] = entry;
    } else {
      if (nextFiles.length + nextExisting.length >= 8) {
        notifyOnFail("Maximum 8 photos per listing");
        return;
      }
      nextFiles.push(file);
      nextLabels.push(entry);
    }
    patch({
      files: nextFiles,
      mediaLabels: nextLabels,
      existingMedia: nextExisting,
      deleteMediaIds: [...new Set(nextDelete)],
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Labeled slots help shoppers and QC. Front is required for Single/Combo publish.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PHOTO_SLOTS.map((slot) => {
          const hit = bySlot[slot.id];
          const preview = slotPreview(hit);
          return (
            <div
              key={slot.id}
              className={`overflow-hidden bg-white relative aspect-square ${
                preview
                  ? "border border-orange-100 rounded-xl"
                  : "border-2 border-dashed border-orange-300 rounded-xl bg-orange-50/40"
              }`}
            >
              {preview ? (
                <>
                  <img src={preview} alt={slot.label} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                    onClick={() => setSlot(slot.id, null)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer text-primary-100 hover:bg-orange-50">
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Add image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) setSlot(slot.id, f);
                    }}
                  />
                </label>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[11px] px-2 py-1">
                {slot.label}
                {slot.required ? " *" : ""}
              </div>
            </div>
          );
        })}
      </div>
      {fieldError ? <p className="text-xs text-red-600">{fieldError}</p> : null}
    </div>
  );
}
