import apiClient from "../axios.config";
import { notifyOnFail, notifyOnSuccess } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export async function getCategorySpecTemplates(params = {}) {
  try {
    const res = await apiClient.get("/category-specs/templates", { params });
    return res.data;
  } catch (e) {
    notifyOnFail(getApiErrorMessage(e, "Could not load spec templates"));
    return { status: 0, data: [] };
  }
}

export async function listAllCategorySpecTemplates() {
  try {
    const res = await apiClient.get("/category-specs/templates/all");
    return res.data;
  } catch (e) {
    notifyOnFail(getApiErrorMessage(e, "Could not load all templates"));
    return { status: 0, data: [] };
  }
}

export async function createCategorySpecTemplate(body) {
  try {
    const res = await apiClient.post("/category-specs/templates", body);
    if (res.data?.status === 1) notifyOnSuccess(res.data.message || "Created");
    else notifyOnFail(res.data?.message || "Create failed");
    return res.data;
  } catch (e) {
    notifyOnFail(getApiErrorMessage(e, "Create failed"));
    return { status: 0 };
  }
}

export async function updateCategorySpecTemplate(id, body) {
  try {
    const res = await apiClient.put(`/category-specs/templates/${id}`, body);
    if (res.data?.status === 1) notifyOnSuccess(res.data.message || "Updated");
    else notifyOnFail(res.data?.message || "Update failed");
    return res.data;
  } catch (e) {
    notifyOnFail(getApiErrorMessage(e, "Update failed"));
    return { status: 0 };
  }
}

export async function deleteCategorySpecTemplate(id) {
  try {
    const res = await apiClient.delete(`/category-specs/templates/${id}`);
    if (res.data?.status === 1) notifyOnSuccess(res.data.message || "Deleted");
    else notifyOnFail(res.data?.message || "Delete failed");
    return res.data;
  } catch (e) {
    notifyOnFail(getApiErrorMessage(e, "Delete failed"));
    return { status: 0 };
  }
}

export async function listCategorySpecRequests() {
  try {
    const res = await apiClient.get("/category-specs/requests");
    return res.data;
  } catch (e) {
    notifyOnFail(getApiErrorMessage(e, "Could not load requests"));
    return { status: 0, data: [] };
  }
}

export async function resolveCategorySpecRequest(id, body) {
  try {
    const res = await apiClient.patch(`/category-specs/requests/${id}`, body);
    if (res.data?.status === 1) notifyOnSuccess(res.data.message || "Resolved");
    else notifyOnFail(res.data?.message || "Resolve failed");
    return res.data;
  } catch (e) {
    notifyOnFail(getApiErrorMessage(e, "Resolve failed"));
    return { status: 0 };
  }
}

export async function createCategorySpecRequest(body) {
  try {
    const res = await apiClient.post("/category-specs/requests", body);
    return res.data;
  } catch (e) {
    notifyOnFail(getApiErrorMessage(e, "Request failed"));
    return { status: 0 };
  }
}
