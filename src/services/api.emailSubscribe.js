import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const addEmailSubscribe = async (emailSubscribeData) => {
  try {
    const res = await apiClient.post(
      "/email_subscribe/addemail",
      emailSubscribeData
    );

    return res.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Error reaching the server";
    notifyOnFail(errorMessage);
    console.error("API Error:", error);
    return { status: 0, message: errorMessage };
  }
};

export const getAllEmailSubscription = async () => {
  try {
    const res = await apiClient.get("/email_subscribe/getall");
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return error.response || error;
  }
};

export const unSubscribeEmail = async (data) => {
  try {
    const res = await apiClient.post(`/email_subscribe/unsubscribe`, data);
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return error.response || error;
  }
};

export const deleteSubscription = async (id) => {
  try {
    const res = await apiClient.delete(`/email_subscribe/delete/${id}`);
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return error.response || error;
  }
};

export const reactivateSubscription = async (id) => {
  try {
    const res = await apiClient.post(`/email_subscribe/reactivate/${id}`);
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return error.response || error;
  }
};
