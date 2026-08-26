import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getAllContacts = async () => {
  try {
    const res = await apiClient.get("/contactus/get");
    if (res.data.status === 1) {
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
    //   return error.response || error;
  }
};

export const createContact = async (data) => {
  try {
    const res = await apiClient.post("/contactus/add", data);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
    //   return error.response || error;
  }
};

export const updateContact = async (id, data) => {
  try {
    const res = await apiClient.put(`/contactus/update/${id}`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
    //   return error.response || error;
  }
};

export const deleteContact = async (id) => {
  try {
    const response = await apiClient.delete(`/contactus/delete/${id}`);
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
