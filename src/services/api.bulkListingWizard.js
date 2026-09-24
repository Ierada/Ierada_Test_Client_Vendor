import apiClient from "../axios.config";

export async function createBulkListingWizardJob(body = {}) {
  const res = await apiClient.post("/bulk-listing-wizard/jobs", body);
  return res.data;
}

export async function getBulkListingWizardJob(jobId) {
  const res = await apiClient.get(`/bulk-listing-wizard/jobs/${jobId}`);
  return res.data;
}

export async function downloadBulkListingTemplate(kind = "single") {
  const res = await apiClient.get(`/bulk-listing-wizard/templates/${kind}`, {
    responseType: "blob",
  });
  const disposition = res.headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || `IERADA_Bulk_Listing_${kind}.xlsx`;
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function lookupStagedBulkListingImages({ vendorId, skus = [] } = {}) {
  const res = await apiClient.post("/bulk-listing-wizard/images/lookup", {
    ...(vendorId ? { vendor_id: vendorId } : {}),
    skus,
  });
  return res.data;
}

export async function stageBulkListingImages({
  jobId,
  vendorId,
  files = [],
  zips = [],
  onProgress,
  signal,
}) {
  const fd = new FormData();
  if (jobId) fd.append("job_id", jobId);
  if (vendorId) fd.append("vendor_id", String(vendorId));
  if (files.length) fd.append("light", "1");
  files.forEach((file) => fd.append("images", file));
  files.forEach((file) => fd.append("image_paths", file.webkitRelativePath || file.name || ""));
  zips.forEach((file) => fd.append("zip", file));
  const res = await apiClient.post(
    jobId ? `/bulk-listing-wizard/jobs/${jobId}/images` : "/bulk-listing-wizard/images",
    fd,
    {
      timeout: 10 * 60 * 1000,
      signal,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      onUploadProgress: (ev) => {
        if (typeof onProgress !== "function") return;
        const loaded = Number(ev.loaded) || 0;
        const reported = Number(ev.total) || 0;
        onProgress({
          loaded,
          total: reported,
          percent: reported
            ? Math.min(100, Math.round((loaded / reported) * 100))
            : 0,
        });
      },
    },
  );
  return res.data;
}

const ZIP_CHUNK_BYTES = 6 * 1024 * 1024;
const IMAGE_SLICE_BYTES = 16 * 1024 * 1024;
const IMAGE_SLICE_FILES = 40;
const IMAGE_UPLOAD_CONCURRENCY = 4;

/** Keep each POST under the proxy body cap. A single photo larger than the cap goes alone. */
export function sliceImageFiles(
  files = [],
  maxBytes = IMAGE_SLICE_BYTES,
  maxFiles = IMAGE_SLICE_FILES,
) {
  const slices = [];
  let batch = [];
  let bytes = 0;
  for (const file of files) {
    const size = Number(file?.size) || 0;
    const full =
      batch.length > 0 && (bytes + size > maxBytes || batch.length >= maxFiles);
    if (full) {
      slices.push(batch);
      batch = [];
      bytes = 0;
    }
    batch.push(file);
    bytes += size;
  }
  if (batch.length) slices.push(batch);
  return slices;
}

/**
 * Folder and Choose Images used to send 40 photos in one body. A 1.8 GB
 * folder made that first body ~200 MB, the proxy dropped it, and the bar
 * froze near 9%. Same 6 MB slices as ZIP.
 */
export async function uploadBulkListingImagesInSlices({
  jobId,
  vendorId,
  files = [],
  onProgress,
  signal,
}) {
  const slices = sliceImageFiles(files);
  const total = files.reduce((sum, file) => sum + (Number(file?.size) || 0), 0);
  let currentJob = jobId || "";
  if (!currentJob) {
    const created = await createBulkListingWizardJob(
      vendorId ? { vendor_id: vendorId } : {},
    );
    if (created?.status !== 1) {
      throw new Error(created?.message || "Could not start the image upload");
    }
    currentJob = created.data?.job_id || "";
  }
  const loaded = new Array(slices.length).fill(0);
  const failed = [];
  const report = () => {
    if (typeof onProgress !== "function") return;
    const sum = loaded.reduce((n, value) => n + value, 0);
    onProgress({ loaded: Math.min(total, sum), total });
  };
  let cursor = 0;

  async function nextSlice() {
    const index = cursor;
    cursor += 1;
    if (index >= slices.length) return;
    const batch = slices[index];
    const batchBytes = batch.reduce((sum, file) => sum + (Number(file?.size) || 0), 0);
    const res = await stageBulkListingImages({
      jobId: currentJob,
      vendorId,
      files: batch,
      signal,
      onProgress: ({ loaded: inBatch }) => {
        loaded[index] = Math.min(Number(inBatch) || 0, batchBytes);
        report();
      },
    });
    if (res?.status !== 1) {
      throw new Error(res?.message || "Image upload failed");
    }
    if (Array.isArray(res.data?.failed)) failed.push(...res.data.failed);
    loaded[index] = batchBytes;
    report();
    await nextSlice();
  }

  const workers = Math.min(IMAGE_UPLOAD_CONCURRENCY, slices.length || 1);
  await Promise.all(Array.from({ length: workers }, () => nextSlice()));

  const finished = await getBulkListingWizardJob(currentJob);
  if (finished?.data) finished.data.failed = failed;
  return finished;
}

/**
 * Sends a ZIP in slices. A single large POST stalls behind the proxy and the
 * bar freezes, so each slice is its own request and progress is real bytes.
 */
export async function uploadBulkListingZipInChunks({
  jobId,
  vendorId,
  file,
  onProgress,
  signal,
}) {
  const total = Number(file?.size) || 0;
  const chunks = Math.max(1, Math.ceil(total / ZIP_CHUNK_BYTES));
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  let currentJob = jobId || "";
  let last = null;

  for (let index = 0; index < chunks; index += 1) {
    const start = index * ZIP_CHUNK_BYTES;
    const end = Math.min(total, start + ZIP_CHUNK_BYTES);
    const fd = new FormData();
    fd.append("chunk", file.slice(start, end), `${file.name}.part${index}`);
    fd.append("upload_id", uploadId);
    fd.append("chunk_index", String(index));
    fd.append("total_chunks", String(chunks));
    fd.append("filename", file.name || "images.zip");
    if (currentJob) fd.append("job_id", currentJob);
    if (vendorId) fd.append("vendor_id", String(vendorId));

    const res = await apiClient.post(
      currentJob
        ? `/bulk-listing-wizard/jobs/${currentJob}/zip-chunk`
        : "/bulk-listing-wizard/zip-chunk",
      fd,
      {
        timeout: 10 * 60 * 1000,
        signal,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        onUploadProgress: (ev) => {
          if (typeof onProgress !== "function") return;
          const inChunk = Math.min(Number(ev.loaded) || 0, end - start);
          onProgress({ loaded: Math.min(total, start + inChunk), total });
        },
      },
    );
    if (res.data?.status !== 1) {
      throw new Error(res.data?.message || "ZIP upload failed");
    }
    currentJob = res.data.data?.job_id || currentJob;
    last = res.data;
    if (typeof onProgress === "function") onProgress({ loaded: end, total });
  }

  return last;
}

export async function waitForStagedBulkListingImages(
  jobId,
  { onProgress, timeoutMs = 15 * 60 * 1000 } = {},
) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const res = await getBulkListingWizardJob(jobId);
    const data = res?.data || {};
    const progress = data.progress || {};
    if (typeof onProgress === "function") onProgress(progress, data);
    if (data.processing) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      continue;
    }
    if (progress.status === "error") {
      throw new Error(progress.message || "ZIP unpacking failed");
    }
    return res;
  }
  throw new Error(
    "ZIP unpacking timed out. Try a smaller archive or keep this page open and retry.",
  );
}
