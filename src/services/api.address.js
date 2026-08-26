import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getAllAddress = async (user_id) => {
  try {
    const response = await apiClient.get(`/address/get/${user_id}`);
    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
      return response.data.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching address"));
    console.error(error);
    // return error.response || error;
  }
};

export const addAddress = async (user_id, addressData) => {
  try {
    const res = await apiClient.post(`/address/add/${user_id}`, addressData);
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

export const setDefaultAddress = async (user_id, address_id) => {
  try {
    const res = await apiClient.put(
      `/address/default/${user_id}/${address_id}`
    );
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error setting default address:", error);
  }
};

export const updateAddress = async (id, data) => {
  try {
    const res = await apiClient.put(`/address/updated/${id}`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    // return error.response || error;
  }
};

export const deleteAddress = async (id) => {
  try {
    const response = await apiClient.put(`/address/delete/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data.message;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the attribute"));
    console.error(error);
    // return error.response || error;
  }
};
