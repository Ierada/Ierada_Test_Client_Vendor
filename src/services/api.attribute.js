import apiClient from "../axios.config.js";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast.js";
import { getApiErrorMessage } from "../utils/apiError";

export const getAllAttributes = async (query = {}, { silent = false } = {}) => {
  try {
    const result = await apiClient.get("/attributes/getAll", { params: query });
    if (result.data?.status === 1) return result.data;
    if (!silent) notifyOnFail(result.data?.message || "Could not load attributes.");
    return result.data;
  } catch (err) {
    if (!silent) notifyOnFail(getApiErrorMessage(err, "Could not load attributes."));
    if (silent) return { status: 0, data: [] };
    throw err;
  }
};

export const getAttributeById = async (id, { silent = false } = {}) => {
  try {
    const result = await apiClient.get(`/attributes/getById/${id}`);
    if (result.data?.status === 1) return result.data;
    if (!silent) notifyOnFail(result.data?.message || "Could not load attribute.");
    return result.data;
  } catch (err) {
    if (!silent) notifyOnFail(getApiErrorMessage(err, "Could not load attribute."));
    throw err;
  }
};

export const createAttribute = async (data, { silent = false } = {}) => {
  try {
    const result = await apiClient.post("/attributes/create", data);
    if (result.data?.status === 1) {
      if (!silent) notifyOnSuccess(result.data.message || "Attribute created.");
      return result.data;
    }
    if (!silent) notifyOnFail(result.data?.message || "Could not create attribute.");
    return result.data;
  } catch (err) {
    if (!silent) notifyOnFail(getApiErrorMessage(err, "Could not create attribute."));
    throw err;
  }
};

export const updateAttribute = async (id, data, { silent = false } = {}) => {
  try {
    const result = await apiClient.put(`/attributes/update/${id}`, data);
    if (result.data?.status === 1) {
      if (!silent) notifyOnSuccess(result.data.message || "Attribute updated.");
      return result.data;
    }
    if (!silent) notifyOnFail(result.data?.message || "Could not update attribute.");
    return result.data;
  } catch (err) {
    if (!silent) notifyOnFail(getApiErrorMessage(err, "Could not update attribute."));
    throw err;
  }
};

export const deleteAttribute = async (id, { silent = false } = {}) => {
  try {
    const result = await apiClient.delete(`/attributes/delete/${id}`);
    if (result.data?.status === 1) {
      if (!silent) notifyOnSuccess(result.data.message || "Attribute deleted.");
      return result.data;
    }
    if (!silent) notifyOnFail(result.data?.message || "Could not delete attribute.");
    return result.data;
  } catch (err) {
    if (!silent) notifyOnFail(getApiErrorMessage(err, "Could not delete attribute."));
    throw err;
  }
};
