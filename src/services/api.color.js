import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getAllColors = async () => {
  try {
    const response = await apiClient.get("/color/get");
    if (response.data.status === 1) {
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching colors"));
    console.error(error);
  }
};

export const addColor = async (colorData) => {
  try {
    const response = await apiClient.post("/color/add", colorData);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error adding color"));
    console.error(error);
  }
};

export const updateColor = async (id, colorData) => {
  try {
    const response = await apiClient.put(`/color/update/${id}`, colorData);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating color"));
    console.error(error);
  }
};

export const deleteColor = async (id) => {
  try {
    const response = await apiClient.delete(`/color/delete/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting color"));
    console.error(error);
  }
};
