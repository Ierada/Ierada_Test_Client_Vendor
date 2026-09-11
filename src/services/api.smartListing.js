import apiClient from "../axios.config";

export async function getBrandAuthStatus({ vendor_id, product_id } = {}) {
  const res = await apiClient.get("/brand-auth/status", {
    params: {
      ...(vendor_id ? { vendor_id } : {}),
      ...(product_id ? { product_id } : {}),
    },
  });
  return res.data;
}

export async function listBulkListingJobs(params = {}) {
  const res = await apiClient.get("/bulk-listing-jobs", { params });
  return res.data;
}

export async function createBulkListingJob(body) {
  const res = await apiClient.post("/bulk-listing-jobs", body);
  return res.data;
}

/** Vision-based category suggestion from product photo */
export async function suggestListingCategory(payload) {
  if (!payload?.image_base64 && !payload?.imageBase64) {
    const err = new Error("Product photo is required for category suggestion.");
    err.code = "IMAGE_REQUIRED";
    throw err;
  }
  const res = await apiClient.post("/ai/listing-category-suggest", payload, {
    timeout: 120000,
  });
  return res.data;
}

/** High-quality OpenAI listing draft for Smart Listing review step */
export async function generateListingAiDraft(payload) {
  const res = await apiClient.post("/ai/listing-draft", payload, {
    timeout: 180000,
  });
  return res.data;
}

/** 3D studio shot from the first listing photo */
export async function generateListing3dImage(payload) {
  if (!payload?.image_base64 && !payload?.imageBase64) {
    const err = new Error("Upload a product photo first, then try 3D studio again.");
    err.code = "IMAGE_REQUIRED";
    throw err;
  }
  const res = await apiClient.post("/ai/listing-3d-image", payload, {
    timeout: 180000,
  });
  return res.data;
}
