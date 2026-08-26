import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getAllSizes = async (query) => {
  try {
    const response = await apiClient.get("/size/get", { params: query });
    if (response.data.status === 1) {
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching sizes"));
    console.error(error);
  }
};

export const getSizeById = async (id) => {
  try {
    const response = await apiClient.get(`/size/get/${id}`);
    if (response.data.status === 1) {
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching size details"));
    console.error(error);
  }
};

export const getSizesByType = async (type) => {
  try {
    const response = await apiClient.get(`/size/get/type/${type}`);
    if (response.data.status === 1) {
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching sizes by type"));
    console.error(error);
  }
};

export const addSize = async (sizeData) => {
  try {
    const response = await apiClient.post("/size/add", sizeData);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error adding size"));
    console.error(error);
  }
};

export const updateSize = async (id, sizeData) => {
  try {
    const response = await apiClient.put(`/size/update/${id}`, sizeData);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating size"));
    console.error(error);
  }
};

export const deleteSize = async (id) => {
  try {
    const response = await apiClient.delete(`/size/delete/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting size"));
    console.error(error);
  }
};
