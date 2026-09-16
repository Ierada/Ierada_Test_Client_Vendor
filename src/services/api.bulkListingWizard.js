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
}) {
  const fd = new FormData();
  if (jobId) fd.append("job_id", jobId);
  if (vendorId) fd.append("vendor_id", String(vendorId));
  files.forEach((file) => fd.append("images", file));
  zips.forEach((file) => fd.append("zip", file));
  const res = await apiClient.post(
    jobId ? `/bulk-listing-wizard/jobs/${jobId}/images` : "/bulk-listing-wizard/images",
    fd,
    {
      timeout: 0,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      onUploadProgress: (ev) => {
        if (typeof onProgress !== "function") return;
        const total = Number(ev.total) || 0;
        const loaded = Number(ev.loaded) || 0;
        onProgress({
          loaded,
          total,
          percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : 0,
        });
      },
    },
  );
  return res.data;
}
