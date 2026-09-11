import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getAllSizes = async (query, { silent = false } = {}) => {
  try {
    const response = await apiClient.get("/size/get", { params: query });
    if (response.data.status === 1) {
      return response.data;
    }
    if (!silent) notifyOnFail(response.data.message || "Could not load sizes.");
    return response.data;
  } catch (error) {
    if (!silent) notifyOnFail(getApiErrorMessage(error, "Could not load sizes."));
    console.error(error);
    throw error;
  }
};

export const getSizeById = async (id, { silent = false } = {}) => {
  try {
    if (id == null || id === "") {
      if (!silent) notifyOnFail("Size id is required.");
      return;
    }
    const response = await apiClient.get(`/size/get/${id}`);
    if (response.data.status === 1) {
      return response.data;
    }
    if (!silent) notifyOnFail(response.data.message || "Could not load size.");
    return response.data;
  } catch (error) {
    if (!silent) {
      notifyOnFail(getApiErrorMessage(error, "Could not load size details."));
    }
    console.error(error);
    throw error;
  }
};

/** Filter sizes by size_type (general, clothing, footwear, …). */
export const getSizesByType = async (type, { silent = false } = {}) => {
  try {
    const normalized = String(type || "").trim().toLowerCase();
    if (!normalized) {
      if (!silent) notifyOnFail("Size type is required.");
      return { status: 0, message: "Size type is required." };
    }
    const response = await apiClient.get(`/size/get/type/${encodeURIComponent(normalized)}`);
    if (response.data.status === 1) {
      return response.data;
    }
    if (!silent) {
      notifyOnFail(response.data.message || "Could not load sizes by type.");
    }
    return response.data;
  } catch (error) {
    if (!silent) {
      notifyOnFail(getApiErrorMessage(error, "Could not load sizes by type."));
    }
    console.error(error);
    throw error;
  }
};

export const addSize = async (sizeData, { silent = false } = {}) => {
  try {
    const payload = Array.isArray(sizeData)
      ? sizeData
      : {
          ...sizeData,
          name: String(sizeData?.name || "").trim(),
          type: sizeData?.type || sizeData?.size_type || "general",
        };
    if (Array.isArray(payload)) {
      if (!payload.length) {
        if (!silent) notifyOnFail("At least one size is required.");
        return;
      }
    } else if (!payload.name) {
      if (!silent) notifyOnFail("Enter a size name.");
      return;
    }
    const response = await apiClient.post("/size/add", payload);
    if (response.data.status === 1) {
      if (!silent) notifyOnSuccess(response.data.message || "Size added.");
      return response.data;
    }
    if (!silent) notifyOnFail(response.data.message || "Could not add size.");
    return response.data;
  } catch (error) {
    if (!silent) {
      notifyOnFail(getApiErrorMessage(error, "Could not add size."));
    }
    console.error(error);
    throw error;
  }
};

export const updateSize = async (id, sizeData, { silent = false } = {}) => {
  try {
    const response = await apiClient.put(`/size/update/${id}`, sizeData);
    if (response.data.status === 1) {
      if (!silent) notifyOnSuccess(response.data.message || "Size updated.");
      return response.data;
    }
    if (!silent) notifyOnFail(response.data.message || "Could not update size.");
    return response.data;
  } catch (error) {
    if (!silent) {
      notifyOnFail(getApiErrorMessage(error, "Could not update size."));
    }
    console.error(error);
    throw error;
  }
};

export const deleteSize = async (id, { silent = false } = {}) => {
  try {
    const response = await apiClient.delete(`/size/delete/${id}`);
    if (response.data.status === 1) {
      if (!silent) notifyOnSuccess(response.data.message || "Size deleted.");
      return response.data;
    }
    if (!silent) notifyOnFail(response.data.message || "Could not delete size.");
    return response.data;
  } catch (error) {
    if (!silent) {
      notifyOnFail(getApiErrorMessage(error, "Could not delete size."));
    }
    console.error(error);
    throw error;
  }
};
