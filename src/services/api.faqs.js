import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getAllFaqs = async () => {
  try {
    const res = await apiClient.get("/faqs/get");
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
    //   return error.response || error;
  }
};

export const createFaq = async (data) => {
  try {
    const res = await apiClient.post("/faqs/add", data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
    //   return error.response || error;
  }
};

export const updateFaq = async (id, data) => {
  try {
    const res = await apiClient.put(`/faqs/update/${id}`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
    //   return error.response || error;
  }
};

export const deleteFaq = async (id) => {
  try {
    const response = await apiClient.delete(`/faqs/delete/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the attribute"));
    console.error(error);
    // return error.response || error;
  }
};
