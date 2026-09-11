/**
 * Primary-gallery photos are stored per listing type (single / color_size / custom).
 * Switching type snapshots the current gallery and restores that type's own images.
 * File blobs stay in IndexedDB; JSON drafts keep existingMedia / labels / cover previews.
 */

export const UNSET_LISTING_TYPE_KEY = "_unset";

export function listingTypeKey(listingType) {
  const t = String(listingType || "").trim();
  return t || UNSET_LISTING_TYPE_KEY;
}

export function emptyGallery() {
  return {
    files: [],
    mediaLabels: [],
    existingMedia: [],
    deleteMediaIds: [],
    coverPreviewUrl: "",
  };
}

export function takeGallery(state) {
  return {
    files: Array.isArray(state?.files) ? state.files : [],
    mediaLabels: Array.isArray(state?.mediaLabels) ? [...state.mediaLabels] : [],
    existingMedia: Array.isArray(state?.existingMedia) ? [...state.existingMedia] : [],
    deleteMediaIds: Array.isArray(state?.deleteMediaIds) ? [...state.deleteMediaIds] : [],
    coverPreviewUrl: typeof state?.coverPreviewUrl === "string" ? state.coverPreviewUrl : "",
  };
}

export function applyGallery(gallery) {
  const g = gallery && typeof gallery === "object" ? gallery : emptyGallery();
  return {
    files: Array.isArray(g.files) ? g.files : [],
    mediaLabels: Array.isArray(g.mediaLabels) ? [...g.mediaLabels] : [],
    existingMedia: Array.isArray(g.existingMedia) ? [...g.existingMedia] : [],
    deleteMediaIds: Array.isArray(g.deleteMediaIds) ? [...g.deleteMediaIds] : [],
    coverPreviewUrl: typeof g.coverPreviewUrl === "string" ? g.coverPreviewUrl : "",
  };
}

function cloneGallery(gallery) {
  const g = gallery && typeof gallery === "object" ? gallery : emptyGallery();
  return {
    files: Array.isArray(g.files) ? g.files : [],
    mediaLabels: Array.isArray(g.mediaLabels) ? [...g.mediaLabels] : [],
    existingMedia: Array.isArray(g.existingMedia) ? [...g.existingMedia] : [],
    deleteMediaIds: Array.isArray(g.deleteMediaIds) ? [...g.deleteMediaIds] : [],
    coverPreviewUrl: typeof g.coverPreviewUrl === "string" ? g.coverPreviewUrl : "",
  };
}

export function cloneMediaBuckets(buckets) {
  const src = buckets && typeof buckets === "object" ? buckets : {};
  const out = {};
  Object.entries(src).forEach(([key, gallery]) => {
    out[key] = cloneGallery(gallery);
  });
  return out;
}

export function stripGalleryFiles(gallery) {
  const g = cloneGallery(gallery);
  return { ...g, files: [] };
}

export function stripMediaBucketsForDraft(buckets) {
  const out = {};
  Object.entries(cloneMediaBuckets(buckets)).forEach(([key, gallery]) => {
    out[key] = stripGalleryFiles(gallery);
  });
  return out;
}

export function withSyncedMediaBuckets(state) {
  if (!state || typeof state !== "object") return state;
  const key = listingTypeKey(state.listingType);
  const buckets = cloneMediaBuckets(state.mediaByListingType);
  buckets[key] = takeGallery(state);
  return { ...state, mediaByListingType: buckets };
}

export function switchListingTypeMedia(state, nextListingType) {
  const fromKey = listingTypeKey(state?.listingType);
  const toKey = listingTypeKey(nextListingType);
  if (fromKey === toKey) {
    return { ...state, listingType: nextListingType };
  }
  const buckets = cloneMediaBuckets(state?.mediaByListingType);
  buckets[fromKey] = takeGallery(state);
  let nextGallery = buckets[toKey] ? cloneGallery(buckets[toKey]) : emptyGallery();
  // Photos uploaded before a listing type was chosen live in `_unset`.
  // Carry them into the first real type so category auto-detect still sees them.
  if (
    fromKey === UNSET_LISTING_TYPE_KEY &&
    toKey !== UNSET_LISTING_TYPE_KEY &&
    !galleryHasMedia(nextGallery) &&
    galleryHasMedia(buckets[fromKey])
  ) {
    nextGallery = cloneGallery(buckets[fromKey]);
    buckets[toKey] = cloneGallery(nextGallery);
    buckets[fromKey] = emptyGallery();
  } else if (!buckets[toKey]) {
    buckets[toKey] = cloneGallery(nextGallery);
  }
  return {
    ...state,
    listingType: nextListingType,
    mediaByListingType: buckets,
    ...applyGallery(nextGallery),
  };
}

function galleryHasLiveFiles(gallery) {
  return (gallery?.files || []).some((f) => f instanceof File);
}

function galleryHasMedia(gallery) {
  return (
    galleryHasLiveFiles(gallery) ||
    (gallery?.existingMedia || []).some((m) => m?.url || m?.id)
  );
}

function pickLiveFiles(...galleries) {
  for (const gallery of galleries) {
    const files = (gallery?.files || []).filter((f) => f instanceof File);
    if (files.length) return { files, mediaLabels: gallery?.mediaLabels || [] };
  }
  return null;
}

export function mergeGalleryBuckets(payloadState, prevState = {}, cachedState = {}) {
  const payloadBuckets = cloneMediaBuckets(payloadState?.mediaByListingType);
  const prevBuckets = cloneMediaBuckets(prevState?.mediaByListingType);
  const cachedBuckets = cloneMediaBuckets(cachedState?.mediaByListingType);
  const currentKey = listingTypeKey(payloadState?.listingType ?? prevState?.listingType);

  const liveTop = takeGallery(payloadState || {});
  if (galleryHasLiveFiles(liveTop)) {
    payloadBuckets[currentKey] = {
      ...(payloadBuckets[currentKey] || emptyGallery()),
      ...liveTop,
      files: liveTop.files,
      mediaLabels: liveTop.mediaLabels?.length
        ? liveTop.mediaLabels
        : payloadBuckets[currentKey]?.mediaLabels || [],
    };
  } else if (!payloadBuckets[currentKey]) {
    payloadBuckets[currentKey] = liveTop;
  }

  const keys = new Set([
    ...Object.keys(payloadBuckets),
    ...Object.keys(prevBuckets),
    ...Object.keys(cachedBuckets),
    currentKey,
  ]);

  const merged = {};
  keys.forEach((key) => {
    const payloadG = payloadBuckets[key];
    const prevG = prevBuckets[key];
    const cachedG = cachedBuckets[key];
    const live = pickLiveFiles(payloadG, prevG, cachedG);
    merged[key] = {
      files: live?.files || [],
      mediaLabels: Array.isArray(payloadG?.mediaLabels)
        ? payloadG.mediaLabels
        : live?.mediaLabels?.length
          ? live.mediaLabels
          : Array.isArray(prevG?.mediaLabels)
            ? prevG.mediaLabels
            : Array.isArray(cachedG?.mediaLabels)
              ? cachedG.mediaLabels
              : [],
      existingMedia: Array.isArray(payloadG?.existingMedia)
        ? payloadG.existingMedia
        : Array.isArray(prevG?.existingMedia)
          ? prevG.existingMedia
          : Array.isArray(cachedG?.existingMedia)
            ? cachedG.existingMedia
            : [],
      deleteMediaIds: Array.isArray(payloadG?.deleteMediaIds)
        ? payloadG.deleteMediaIds
        : Array.isArray(prevG?.deleteMediaIds)
          ? prevG.deleteMediaIds
          : Array.isArray(cachedG?.deleteMediaIds)
            ? cachedG.deleteMediaIds
            : [],
      coverPreviewUrl: payloadG
        ? payloadG.coverPreviewUrl || ""
        : prevG?.coverPreviewUrl || cachedG?.coverPreviewUrl || "",
    };
  });

  return merged;
}

/** Rehydrate File blobs from IndexedDB into per-type buckets. Legacy records apply only to the active type. */
export function applyStoredListingFiles(prev, stored) {
  if (!stored || !prev) return prev;
  const currentKey = listingTypeKey(prev.listingType);
  const buckets = cloneMediaBuckets(prev.mediaByListingType);
  const live = takeGallery(prev);

  buckets[currentKey] = {
    ...(buckets[currentKey] || emptyGallery()),
    ...live,
    files: galleryHasLiveFiles(live) ? live.files : (buckets[currentKey]?.files || []),
    mediaLabels:
      Array.isArray(live.mediaLabels) && live.mediaLabels.length
        ? live.mediaLabels
        : buckets[currentKey]?.mediaLabels || [],
    existingMedia: Array.isArray(live.existingMedia)
      ? live.existingMedia
      : buckets[currentKey]?.existingMedia || [],
    deleteMediaIds: Array.isArray(live.deleteMediaIds)
      ? live.deleteMediaIds
      : buckets[currentKey]?.deleteMediaIds || [],
    coverPreviewUrl: live.coverPreviewUrl || buckets[currentKey]?.coverPreviewUrl || "",
  };

  const byType = stored.filesByType && typeof stored.filesByType === "object" ? stored.filesByType : {};
  const typeKeys = Object.keys(byType);

  if (typeKeys.length) {
    typeKeys.forEach((key) => {
      const g = byType[key];
      if (!buckets[key]) buckets[key] = emptyGallery();
      if (galleryHasLiveFiles(buckets[key])) return;
      if (!g?.files?.length) return;
      buckets[key] = {
        ...buckets[key],
        files: g.files,
        mediaLabels: g.mediaLabels?.length ? g.mediaLabels : buckets[key].mediaLabels,
      };
    });
  } else if (stored.files?.length && !galleryHasLiveFiles(buckets[currentKey])) {
    buckets[currentKey] = {
      ...buckets[currentKey],
      files: stored.files,
      mediaLabels: stored.mediaLabels?.length ? stored.mediaLabels : buckets[currentKey].mediaLabels,
    };
  }

  return {
    ...prev,
    mediaByListingType: buckets,
    ...applyGallery(buckets[currentKey] || emptyGallery()),
  };
}

/** Keep IDB files that arrived before product hydrate; seed the product's type from server media. */
export function mergeHydratedProductMedia(prev, hydrated) {
  const productKey = listingTypeKey(hydrated?.listingType);
  const buckets = cloneMediaBuckets(prev?.mediaByListingType);

  Object.entries(hydrated?.mediaByListingType || {}).forEach(([key, gallery]) => {
    if (!buckets[key]) buckets[key] = cloneGallery(gallery);
    else {
      buckets[key] = {
        ...cloneGallery(gallery),
        files: galleryHasLiveFiles(buckets[key]) ? buckets[key].files : gallery.files || [],
      };
    }
  });

  const prior = buckets[productKey] || emptyGallery();
  const productGallery = {
    files: Array.isArray(hydrated?.files) ? hydrated.files : [],
    mediaLabels: Array.isArray(hydrated?.mediaLabels) ? hydrated.mediaLabels : [],
    existingMedia: Array.isArray(hydrated?.existingMedia) ? hydrated.existingMedia : [],
    deleteMediaIds: Array.isArray(hydrated?.deleteMediaIds) ? hydrated.deleteMediaIds : [],
    coverPreviewUrl: hydrated?.coverPreviewUrl || "",
  };

  buckets[productKey] = {
    ...productGallery,
    files: galleryHasLiveFiles(prior) ? prior.files : productGallery.files,
    mediaLabels:
      galleryHasLiveFiles(prior) && prior.mediaLabels?.length
        ? prior.mediaLabels
        : productGallery.mediaLabels,
    coverPreviewUrl: prior.coverPreviewUrl || productGallery.coverPreviewUrl,
  };

  return {
    mediaByListingType: buckets,
    ...applyGallery(buckets[productKey]),
  };
}

export function mediaBucketsForListingMeta(buckets) {
  const out = {};
  Object.entries(stripMediaBucketsForDraft(buckets)).forEach(([key, gallery]) => {
    const hasMedia =
      (gallery.existingMedia || []).length ||
      (gallery.mediaLabels || []).length ||
      (gallery.deleteMediaIds || []).length ||
      gallery.coverPreviewUrl;
    if (!hasMedia) return;
    out[key] = gallery;
  });
  return out;
}
