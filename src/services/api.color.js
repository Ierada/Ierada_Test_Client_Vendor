import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getAllColors = async ({ silent = false } = {}) => {
  try {
    const response = await apiClient.get("/color/get");
    if (response.data.status === 1) {
      return response.data;
    }
    if (!silent) notifyOnFail(response.data.message || "Could not load colors.");
    return response.data;
  } catch (error) {
    if (!silent) notifyOnFail(getApiErrorMessage(error, "Could not load colors."));
    console.error(error);
    throw error;
  }
};

export const addColor = async (colorData, { silent = false } = {}) => {
  try {
    const name = String(colorData?.name || "").trim();
    if (!name) {
      if (!silent) notifyOnFail("Enter a color name.");
      return;
    }
    const response = await apiClient.post("/color/add", { ...colorData, name });
    if (response.data.status === 1) {
      if (!silent) notifyOnSuccess(response.data.message || "Color added.");
      return response.data;
    }
    if (!silent) notifyOnFail(response.data.message || "Could not add color.");
    return response.data;
  } catch (error) {
    if (!silent) {
      notifyOnFail(getApiErrorMessage(error, "Could not add color."));
    }
    console.error(error);
    throw error;
  }
};

export const updateColor = async (id, colorData, { silent = false } = {}) => {
  try {
    const response = await apiClient.put(`/color/update/${id}`, colorData);
    if (response.data.status === 1) {
      if (!silent) notifyOnSuccess(response.data.message || "Color updated.");
      return response.data;
    }
    if (!silent) notifyOnFail(response.data.message || "Could not update color.");
    return response.data;
  } catch (error) {
    if (!silent) {
      notifyOnFail(getApiErrorMessage(error, "Could not update color."));
    }
    console.error(error);
    throw error;
  }
};

export const deleteColor = async (id, { silent = false } = {}) => {
  try {
    const response = await apiClient.delete(`/color/delete/${id}`);
    if (response.data.status === 1) {
      if (!silent) notifyOnSuccess(response.data.message || "Color deleted.");
      return response.data;
    }
    if (!silent) notifyOnFail(response.data.message || "Could not delete color.");
    return response.data;
  } catch (error) {
    if (!silent) {
      notifyOnFail(getApiErrorMessage(error, "Could not delete color."));
    }
    console.error(error);
    throw error;
  }
};
