/**
 * Durable store for listing photos.
 *
 * Drafts are autosaved to localStorage, but File objects cannot be
 * JSON-serialized, so photos were lost on reload. IndexedDB holds the blobs
 * until the listing is submitted or the draft is cleared.
 *
 * Primary-gallery photos are stored per listing type (`filesByType`) so
 * switching Single / Color-Size / Custom does not reuse another type's images.
 */

import { listingTypeKey, withSyncedMediaBuckets } from "./listingMediaByType";

const DB_NAME = "ierada_listing_media";
const STORE = "drafts";
const VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode, run) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const req = run(store);
    t.oncomplete = () => resolve(req?.result ?? null);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

function toRecord(file, label) {
  return {
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
    blob: file,
    label: label || null,
  };
}

function toFile(record) {
  if (!record?.blob) return null;
  try {
    return new File([record.blob], record.name || "photo.jpg", {
      type: record.type || record.blob.type || "image/jpeg",
      lastModified: record.lastModified || Date.now(),
    });
  } catch {
    return null;
  }
}

function galleryToRecords(files, mediaLabels) {
  return (files || [])
    .map((f, i) => (f instanceof File ? toRecord(f, mediaLabels?.[i]) : null))
    .filter(Boolean);
}

function recordsToGallery(records) {
  const files = [];
  const mediaLabels = [];
  (records || []).forEach((r) => {
    const file = toFile(r);
    if (!file) return;
    files.push(file);
    mediaLabels.push(r.label || { label: `extra${mediaLabels.length}` });
  });
  return { files, mediaLabels };
}

/** Persist every File in the listing state, keyed by draft id. */
export async function saveListingFiles(stableId, state) {
  if (!stableId || !state) return false;
  const synced = withSyncedMediaBuckets(state);
  const files = galleryToRecords(synced.files, synced.mediaLabels);

  const filesByType = {};
  Object.entries(synced.mediaByListingType || {}).forEach(([key, gallery]) => {
    const recs = galleryToRecords(gallery?.files, gallery?.mediaLabels);
    if (recs.length) filesByType[key] = recs;
  });
  const currentKey = listingTypeKey(synced.listingType);
  if (files.length && !filesByType[currentKey]) {
    filesByType[currentKey] = files;
  }

  const groups = (synced.colorGroups || []).map((g) => ({
    key: g.key ?? g.color_id ?? g.color?.id ?? null,
    media: (g.media || [])
      .map((f) => (f instanceof File ? toRecord(f) : null))
      .filter(Boolean),
  }));

  const sizeGroups = Object.entries(synced.sizeMedia || {}).map(([key, bucket]) => ({
    key,
    media: (bucket?.media || [])
      .map((f) => (f instanceof File ? toRecord(f) : null))
      .filter(Boolean),
  }));

  const customRowGroups = (synced.customRows || []).map((r, i) => ({
    key: r.grouping_key ?? String(i),
    media: (r.media || [])
      .map((f) => (f instanceof File ? toRecord(f) : null))
      .filter(Boolean),
  }));

  const customValueGroups = Object.entries(synced.customValueMedia || {}).map(([key, bucket]) => ({
    key,
    media: (bucket?.media || [])
      .map((f) => (f instanceof File ? toRecord(f) : null))
      .filter(Boolean),
  }));

  const brandAuthFile =
    synced.brandAuthFile instanceof File ? toRecord(synced.brandAuthFile) : null;

  const hasAnything =
    files.length ||
    Object.keys(filesByType).length ||
    brandAuthFile ||
    groups.some((g) => g.media.length) ||
    sizeGroups.some((g) => g.media.length) ||
    customRowGroups.some((g) => g.media.length) ||
    customValueGroups.some((g) => g.media.length);

  try {
    const db = await openDb();
    if (!hasAnything) {
      await tx(db, "readwrite", (s) => s.delete(stableId));
      db.close();
      return true;
    }
    await tx(db, "readwrite", (s) =>
      s.put({
        id: stableId,
        updatedAt: Date.now(),
        files,
        filesByType,
        groups,
        sizeGroups,
        customRowGroups,
        customValueGroups,
        brandAuthFile,
      }),
    );
    db.close();
    return true;
  } catch {
    return false;
  }
}

/** Rebuild the stored Files for a draft. Returns null when nothing is stored. */
export async function loadListingFiles(stableId) {
  if (!stableId) return null;
  try {
    const db = await openDb();
    const rec = await tx(db, "readonly", (s) => s.get(stableId));
    db.close();
    if (!rec) return null;

    const { files, mediaLabels } = recordsToGallery(rec.files);

    const filesByType = {};
    Object.entries(rec.filesByType && typeof rec.filesByType === "object" ? rec.filesByType : {}).forEach(
      ([key, recs]) => {
        const gallery = recordsToGallery(recs);
        if (gallery.files.length) filesByType[key] = gallery;
      },
    );

    const groups = (rec.groups || []).map((g) => ({
      key: g.key,
      media: (g.media || []).map(toFile).filter(Boolean),
    }));

    const sizeGroups = (rec.sizeGroups || []).map((g) => ({
      key: g.key,
      media: (g.media || []).map(toFile).filter(Boolean),
    }));

    const customRowGroups = (rec.customRowGroups || []).map((g) => ({
      key: g.key,
      media: (g.media || []).map(toFile).filter(Boolean),
    }));

    const customValueGroups = (rec.customValueGroups || []).map((g) => ({
      key: g.key,
      media: (g.media || []).map(toFile).filter(Boolean),
    }));

    return {
      files,
      mediaLabels,
      filesByType,
      groups,
      sizeGroups,
      customRowGroups,
      customValueGroups,
      brandAuthFile: toFile(rec.brandAuthFile),
    };
  } catch {
    return null;
  }
}

export async function clearListingFiles(stableId) {
  if (!stableId) return;
  try {
    const db = await openDb();
    await tx(db, "readwrite", (s) => s.delete(stableId));
    db.close();
  } catch {
    /* ignore */
  }
}
