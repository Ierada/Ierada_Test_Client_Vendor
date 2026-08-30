import apiClient from "../axios.config.js";
import { getApiErrorMessage } from "../utils/apiError";

export async function saveProductDraft(body) {
  try {
    const res = await apiClient.post("/product/drafts", body);
    return res.data;
  } catch (error) {
    return {
      status: 0,
      message: getApiErrorMessage(error, "Could not save draft"),
      error,
    };
  }
}

export async function getProductDraft(stableId) {
  try {
    const res = await apiClient.get(`/product/drafts/${encodeURIComponent(stableId)}`);
    return res.data;
  } catch (error) {
    return {
      status: 0,
      message: getApiErrorMessage(error, "Could not load draft"),
      error,
    };
  }
}

export async function listProductDrafts() {
  try {
    const res = await apiClient.get("/product/drafts");
    return res.data;
  } catch (error) {
    return {
      status: 0,
      message: getApiErrorMessage(error, "Could not list drafts"),
      error,
    };
  }
}
