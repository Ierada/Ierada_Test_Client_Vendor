import {
  applyGallery,
  listingTypeKey,
  mergeGalleryBuckets,
  stripMediaBucketsForDraft,
  withSyncedMediaBuckets,
} from "./listingMediaByType";

const cache = new Map();

function groupsHaveFiles(groups) {
  return (groups || []).some((g) =>
    (g.media || []).some((f) => f instanceof File),
  );
}

function sizeMediaHasFiles(sizeMedia) {
  return Object.values(sizeMedia || {}).some((bucket) =>
    (bucket?.media || []).some((f) => f instanceof File),
  );
}

function customRowsHaveFiles(rows) {
  return (rows || []).some((r) => (r.media || []).some((f) => f instanceof File));
}

function valueMediaHasFiles(valueMedia) {
  return Object.values(valueMedia || {}).some((bucket) =>
    (bucket?.media || []).some((f) => f instanceof File),
  );
}

export function stashListingMedia(id, state) {
  if (!id || !state) return;
  const synced = withSyncedMediaBuckets(state);
  cache.set(id, {
    files: Array.isArray(synced.files) ? synced.files : [],
    mediaLabels: synced.mediaLabels || [],
    existingMedia: synced.existingMedia || [],
    deleteMediaIds: synced.deleteMediaIds || [],
    coverPreviewUrl: synced.coverPreviewUrl || "",
    listingType: synced.listingType || "",
    mediaByListingType: synced.mediaByListingType || {},
    brandAuthFile: synced.brandAuthFile || null,
    colorGroups: synced.colorGroups || [],
    sizeMedia: synced.sizeMedia || {},
    customRows: synced.customRows || [],
    customValueMedia: synced.customValueMedia || {},
  });
}

export function peekListingMedia(id) {
  return cache.get(id) || null;
}

export function stripFilesForDraft(state) {
  const synced = withSyncedMediaBuckets(state);
  const { files, brandAuthFile, mediaByListingType, ...rest } = synced || {};
  const colorGroups = (rest.colorGroups || []).map((g) => ({
    ...g,
    media: (g.media || []).filter((f) => !(f instanceof File)).length
      ? g.media.filter((f) => !(f instanceof File))
      : [],
  }));
  const sizeMedia = Object.fromEntries(
    Object.entries(rest.sizeMedia || {}).map(([id, bucket]) => [
      id,
      {
        existingMedia: bucket?.existingMedia || [],
        media: (bucket?.media || []).filter((f) => !(f instanceof File)),
      },
    ]),
  );
  const customRows = (rest.customRows || []).map((r) => ({
    ...r,
    media: (r.media || []).filter((f) => !(f instanceof File)),
  }));
  const customValueMedia = Object.fromEntries(
    Object.entries(rest.customValueMedia || {}).map(([key, bucket]) => [
      key,
      {
        existingMedia: bucket?.existingMedia || [],
        media: (bucket?.media || []).filter((f) => !(f instanceof File)),
      },
    ]),
  );
  return {
    ...rest,
    colorGroups,
    sizeMedia,
    customRows,
    customValueMedia,
    mediaByListingType: stripMediaBucketsForDraft(mediaByListingType),
  };
}

export function mergeCachedMedia(id, payload, prev = {}) {
  const cached = cache.get(id);
  const next = { ...(payload || {}) };

  const prevFiles = (prev.files || []).filter((f) => f instanceof File);
  const cachedFiles = (cached?.files || []).filter((f) => f instanceof File);
  const payloadFiles = (next.files || []).filter((f) => f instanceof File);
  next.files = payloadFiles.length
    ? payloadFiles
    : prevFiles.length
      ? prevFiles
      : cachedFiles;

  if (next.brandAuthFile instanceof File) {
    /* keep */
  } else if (prev.brandAuthFile instanceof File) {
    next.brandAuthFile = prev.brandAuthFile;
  } else if (cached?.brandAuthFile instanceof File) {
    next.brandAuthFile = cached.brandAuthFile;
  }

  if (next.mediaLabels?.length) {
    /* keep */
  } else if (prev.mediaLabels?.length) {
    next.mediaLabels = prev.mediaLabels;
  } else if (cached?.mediaLabels?.length) {
    next.mediaLabels = cached.mediaLabels;
  }

  if (groupsHaveFiles(next.colorGroups)) {
    /* keep */
  } else if (groupsHaveFiles(prev.colorGroups)) {
    next.colorGroups = prev.colorGroups;
  } else if (groupsHaveFiles(cached?.colorGroups)) {
    next.colorGroups = cached.colorGroups;
  }

  if (sizeMediaHasFiles(next.sizeMedia)) {
    /* keep */
  } else if (sizeMediaHasFiles(prev.sizeMedia)) {
    next.sizeMedia = prev.sizeMedia;
  } else   if (sizeMediaHasFiles(cached?.sizeMedia)) {
    next.sizeMedia = cached.sizeMedia;
  }

  if (customRowsHaveFiles(next.customRows)) {
    /* keep */
  } else if (customRowsHaveFiles(prev.customRows)) {
    next.customRows = prev.customRows;
  } else if (customRowsHaveFiles(cached?.customRows)) {
    next.customRows = cached.customRows;
  }

  if (valueMediaHasFiles(next.customValueMedia)) {
    /* keep */
  } else if (valueMediaHasFiles(prev.customValueMedia)) {
    next.customValueMedia = prev.customValueMedia;
  } else if (valueMediaHasFiles(cached?.customValueMedia)) {
    next.customValueMedia = cached.customValueMedia;
  }

  const mergedBuckets = mergeGalleryBuckets(next, prev, cached || {});
  next.mediaByListingType = mergedBuckets;
  const currentGallery = mergedBuckets[listingTypeKey(next.listingType)];
  if (currentGallery) Object.assign(next, applyGallery(currentGallery));

  const colorIds = (Array.isArray(next.color_ids) ? next.color_ids : [])
    .map(String)
    .filter(Boolean);
  const seeded = seedFirstColorFromPrimaryGallery(next, colorIds);
  if (seeded.changed) next.colorGroups = seeded.colorGroups;

  return next;
}

/** Absolute-or-relative product image URL for preview cards. */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  const api = import.meta.env.VITE_API_URL || "";
  const origin = api.replace(/\/api\/?$/, "");
  if (url.startsWith("/")) return `${origin}${url}`;
  return `${origin}/${url}`;
}

export function mediaFingerprint(entry) {
  const file = entry instanceof File ? entry : entry?.file instanceof File ? entry.file : null;
  if (file) return `file:${file.name}:${file.size}:${file.lastModified}`;
  if (typeof entry === "string" && entry) return `url:${entry}`;
  if (entry?.url) return `url:${entry.url}`;
  return "";
}

function mediaSrc(entry) {
  if (!entry) return "";
  if (entry instanceof File) {
    try {
      return URL.createObjectURL(entry);
    } catch {
      return "";
    }
  }
  if (entry?.file instanceof File) {
    try {
      return URL.createObjectURL(entry.file);
    } catch {
      return "";
    }
  }
  if (typeof entry === "string" && entry) return resolveMediaUrl(entry);
  if (entry?.url) return resolveMediaUrl(entry.url);
  return "";
}


/** Same photos as Primary Product Gallery, in the same order (★ Primary first). */
export function primaryGalleryPhotoEntries(state) {
  const files = state?.files || [];
  const labels = state?.mediaLabels || [];
  const fileEntries = files
    .map((file, i) => ({ file, i, label: labels[i]?.label }))
    .filter((x) => x.file && x.label !== "ai_3d");
  const takenLabels = new Set(fileEntries.map((x) => x.label).filter(Boolean));
  const existingEntries = (state?.existingMedia || [])
    .filter((m) => m && (m.url || m.id) && m.label !== "ai_3d" && !takenLabels.has(m.label))
    .map((m) => ({ existing: m, label: m.label }));
  return [...existingEntries, ...fileEntries];
}

export function primaryGalleryFingerprints(state) {
  const out = new Set();
  for (const entry of primaryGalleryPhotoEntries(state)) {
    const fp = mediaFingerprint(entry.file || entry.existing);
    if (fp) out.add(fp);
  }
  return out;
}

function gallerySignature(state) {
  return primaryGalleryPhotoEntries(state)
    .map((entry) => mediaFingerprint(entry.file || entry.existing))
    .filter(Boolean)
    .join("|");
}

export function firstColorMirrorsPrimaryGallery(state, group) {
  if (state?.skipPrimaryColorImageDefault) return false;
  if (group && group.usesPrimaryCoverDefault === false) return false;
  return true;
}

/**
 * First selected color always shows the Primary Gallery photos.
 * Leftover per-color uploads are dropped unless the vendor opted out.
 */
export function seedFirstColorFromPrimaryGallery(state, colorIds = []) {
  if (state?.listingType && state.listingType !== "color_size") {
    return { colorGroups: [...(state?.colorGroups || [])], changed: false };
  }
  const firstColorId = String(colorIds?.[0] || state?.color_id || "");
  const groups = [...(state?.colorGroups || [])];
  if (!firstColorId || !firstColorMirrorsPrimaryGallery(state)) {
    return { colorGroups: groups, changed: false };
  }

  const photos = primaryGalleryPhotoEntries(state);
  const galleryFp = primaryGalleryFingerprints(state);
  const nextFp = gallerySignature(state);

  let gi = groups.findIndex(
    (g) => String(g.color_id || g.color?.id) === firstColorId,
  );
  if (gi < 0) {
    groups.push({
      color_id: firstColorId,
      color_name: state?.color_name || "",
      color_code: "",
      media: [],
      existingMedia: [],
      sizes: [],
      usesPrimaryCoverDefault: true,
    });
    gi = groups.length - 1;
  }

  const g = groups[gi];
  // First takeover drops leftover per-color uploads. Later extras (added via +) stay.
  const keepExtras = g.usesPrimaryCoverDefault === true;
  const extrasMedia = keepExtras
    ? (g.media || []).filter((f) => {
        const fp = mediaFingerprint(f);
        return fp && !galleryFp.has(fp);
      })
    : [];
  const extrasExisting = keepExtras
    ? (g.existingMedia || []).filter((m) => {
        const fp = mediaFingerprint(m);
        return fp && !galleryFp.has(fp);
      })
    : [];

  const media = [
    ...photos.map((p) => p.file).filter((f) => f instanceof File),
    ...extrasMedia,
  ].slice(0, 8);
  const existingMedia = [
    ...photos.map((p) => p.existing).filter(Boolean),
    ...extrasExisting,
  ].slice(0, 8);

  const nextSig = [
    nextFp,
    extrasMedia.map((f) => mediaFingerprint(f)).join(","),
    extrasExisting.map((m) => mediaFingerprint(m)).join(","),
  ].join("#");
  if (g.usesPrimaryCoverDefault && g.primaryCoverFingerprint === nextSig) {
    return { colorGroups: groups, changed: false };
  }

  groups[gi] = {
    ...g,
    media,
    existingMedia,
    usesPrimaryCoverDefault: true,
    primaryCoverFingerprint: nextSig,
  };
  return { colorGroups: groups, changed: true };
}

/** First photo uploaded against this colour (its own media, then its size buckets). */
export function selectedColorPreviewSrc(group, sizeMedia = {}) {
  if (!group) return "";
  const colorId = String(group.color_id || group.color?.id || "");
  const bucket = sizeMedia?.[colorId] || {};
  const lists = [group.media, group.existingMedia, bucket.media, bucket.existingMedia];
  let firstSrc = "";
  for (const list of lists) {
    for (const entry of list || []) {
      const src = mediaSrc(entry);
      if (!src) continue;
      if (entry?.label === "front") return src;
      if (!firstSrc) firstSrc = src;
    }
  }
  return firstSrc;
}

/** Cover image for preview cards: the primary gallery image wins. */
export function listingCoverPreviewSrc(state, fileObjectUrls = []) {
  const files = state?.files || [];
  for (let i = 0; i < files.length; i += 1) {
    const f = files[i];
    if (f instanceof File && fileObjectUrls[i]) return fileObjectUrls[i];
    if (typeof f === "string" && f) return resolveMediaUrl(f);
    if (f?.url) return resolveMediaUrl(f.url);
  }
  const existing = state?.existingMedia || [];
  const front = existing.find((m) => m.label === "front" && m.url) || existing.find((m) => m.url);
  if (front?.url) return resolveMediaUrl(front.url);
  if (state?.coverPreviewUrl) return state.coverPreviewUrl;
  if (state?.listingType === "color_size") {
    for (const g of state?.colorGroups || []) {
      const src = selectedColorPreviewSrc(g, state?.sizeMedia);
      if (src) return src;
    }
  }
  return "";
}

/** Small JPEG data URL so the cover survives reload (File blobs cannot). */
export function fileToCoverPreviewUrl(file, maxEdge = 640) {
  return new Promise((resolve) => {
    if (!(file instanceof File)) {
      resolve("");
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      } catch {
        resolve("");
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      resolve("");
    };
    img.src = blobUrl;
  });
}
