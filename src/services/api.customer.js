import apiClient from "../axios.config";
import Cookies from "js-cookie";
import config from "../config/config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getUserDetails = async (userId) => {
  try {
    const res = await apiClient.get(`/customer/user-details/${userId}`);

    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    //default fallback for error
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    // return error.response || error;
  }
};

export const updateUserDetails = async (userId, userData) => {
  try {
    const res = await apiClient.patch(
      `/customer/update-profile/${userId}`,
      userData
    );
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    //default fallback for error
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    // return error.response || error;
  }
};

export const changeUserPassword = async ({ currentPassword, newPassword }) => {
  try {
    const payload = { currentPassword, newPassword };
    const res = await apiClient.post("/settings/change-password", payload);

    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.error(error);
  }
};

export const getAllCustomers = async (params) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/customer/all?${queryString}`);

    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    //default fallback for error
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    // return error.response || error;
  }
};

export const getCustomerById = async (id) => {
  try {
    const res = await apiClient.get(`/customer/getbyid/${id}`);

    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    //default fallback for error
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    // return error.response || error;
  }
};

export const updateCustomerStatus = async (id, is_active) => {
  try {
    const res = await apiClient.put(`/customer/status/${id}`, {
      is_active,
    });
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};
