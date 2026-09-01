/** Split files into upload batches (proxy-safe ~50 MB per request). */

/** Realistic per-image cap for product photos (phone / DSLR). Server allows up to 50 MB. */
export const LISTING_IMAGE_MAX_BYTES = 20 * 1024 * 1024;

export const BULK_MEDIA_LIMITS = {
  maxBytes: 48 * 1024 * 1024,
  maxCount: 50,
  maxPerFileBytes: LISTING_IMAGE_MAX_BYTES,
  maxSessionFiles: 2500,
};

export function chunkFilesForUpload(
  files,
  { maxBytes = 28 * 1024 * 1024, maxCount = 40 } = {},
) {
  const chunks = [];
  let current = [];
  let size = 0;

  for (const file of files) {
    const wouldExceedBytes = current.length > 0 && size + file.size > maxBytes;
    const wouldExceedCount = current.length >= maxCount;
    if (wouldExceedBytes || wouldExceedCount) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(file);
    size += file.size;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

/** Media Manager / large bulk photo uploads — fewer round trips, within CDN limit. */
export function chunkFilesForBulkMedia(files) {
  return chunkFilesForUpload(files, BULK_MEDIA_LIMITS);
}

export function validateBulkMediaFiles(files, limits = BULK_MEDIA_LIMITS) {
  const list = Array.from(files || []);
  if (!list.length) return { ok: false, message: "Please select at least one image." };
  if (list.length > limits.maxSessionFiles) {
    return {
      ok: false,
      message: `Too many files (${list.length}). Max ${limits.maxSessionFiles} photos per upload session — upload in batches.`,
    };
  }
  const tooLarge = list.find((f) => f.size > limits.maxPerFileBytes);
  if (tooLarge) {
    const mb = Math.round(limits.maxPerFileBytes / (1024 * 1024));
    return {
      ok: false,
      message: `"${tooLarge.name}" is over ${mb} MB. Compress or resize before upload.`,
    };
  }
  return { ok: true, files: list };
}
