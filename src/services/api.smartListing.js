import apiClient from "../axios.config";

export async function getBrandAuthStatus({ vendor_id, product_id } = {}) {
  try {
    const res = await apiClient.get("/brand-auth/status", {
      params: {
        ...(vendor_id ? { vendor_id } : {}),
        ...(product_id ? { product_id } : {}),
      },
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

export async function listBulkListingJobs(params = {}) {
  try {
    const res = await apiClient.get("/bulk-listing-jobs", { params });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

export async function createBulkListingJob(body) {
  try {
    const res = await apiClient.post("/bulk-listing-jobs", body);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}
