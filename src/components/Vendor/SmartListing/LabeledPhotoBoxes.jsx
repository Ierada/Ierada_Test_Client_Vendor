import React from "react";
import { ImagePlus, X } from "lucide-react";

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

/**
 * Labeled photo boxes — each slot maps to files[] + mediaLabels[] for alt/label persist.
 * state.files is File[] aligned with state.mediaLabels[{label, alt_text}]
 */
export default function LabeledPhotoBoxes({ state, patch, fieldError }) {
  const files = state.files || [];
  const labels = state.mediaLabels || [];

  const bySlot = {};
  files.forEach((f, i) => {
    const slot = labels[i]?.label || (i === 0 ? "front" : `extra${i}`);
    if (!bySlot[slot]) bySlot[slot] = { file: f, index: i };
  });

  const setSlot = (slotId, file) => {
    const nextFiles = [...files];
    const nextLabels = [...labels];
    const existingIdx = nextLabels.findIndex((l) => l?.label === slotId);
    if (!file) {
      if (existingIdx >= 0) {
        nextFiles.splice(existingIdx, 1);
        nextLabels.splice(existingIdx, 1);
      }
      patch({ files: nextFiles, mediaLabels: nextLabels });
      return;
    }
    if (file.size > 5 * 1024 * 1024) return;
    if (!file.type.startsWith("image/")) return;
    const entry = {
      label: slotId,
      alt_text: `${state.name || "Product"} — ${slotId}`,
    };
    if (existingIdx >= 0) {
      nextFiles[existingIdx] = file;
      nextLabels[existingIdx] = entry;
    } else {
      if (nextFiles.length >= 8) return;
      nextFiles.push(file);
      nextLabels.push(entry);
    }
    patch({ files: nextFiles, mediaLabels: nextLabels });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Labeled slots help shoppers and QC. Front is required for Single/Combo publish.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PHOTO_SLOTS.map((slot) => {
          const hit = bySlot[slot.id];
          const preview =
            hit?.file instanceof File ? URL.createObjectURL(hit.file) : null;
          return (
            <div
              key={slot.id}
              className="border rounded-xl overflow-hidden bg-slate-50 relative aspect-square"
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
                <label className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer text-gray-400 hover:bg-white">
                  <ImagePlus className="w-6 h-6" />
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
