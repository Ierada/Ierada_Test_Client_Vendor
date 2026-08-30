import apiClient from "../axios.config";
import { notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export async function resolveCategoryGst(params) {
  try {
    const res = await apiClient.get("/category-gst/resolve", { params });
    return res.data;
  } catch (e) {
    notifyOnFail(getApiErrorMessage(e, "GST resolve failed"));
    return { status: 0, data: null };
  }
}

export async function listCategoryGstRules() {
  try {
    const res = await apiClient.get("/category-gst/rules");
    return res.data;
  } catch (e) {
    return { status: 0, data: [] };
  }
}

export async function createCategoryGstRule(body) {
  try {
    const res = await apiClient.post("/category-gst/rules", body);
    return res.data;
  } catch (e) {
    notifyOnFail(getApiErrorMessage(e, "Could not create GST rule"));
    return { status: 0 };
  }
}

export async function updateCategoryGstRule(id, body) {
  try {
    const res = await apiClient.put(`/category-gst/rules/${id}`, body);
    return res.data;
  } catch (e) {
    notifyOnFail(getApiErrorMessage(e, "Could not update GST rule"));
    return { status: 0 };
  }
}

export async function deleteCategoryGstRule(id) {
  try {
    const res = await apiClient.delete(`/category-gst/rules/${id}`);
    return res.data;
  } catch (e) {
    notifyOnFail(getApiErrorMessage(e, "Could not delete GST rule"));
    return { status: 0 };
  }
}
