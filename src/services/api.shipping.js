import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";

export const initiateShipping = async (user_id, order_id) => {
  try {
    const res = await apiClient.post(`/shipping/initiate-shipping`, {
      user_id,
      order_id,
    });
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const trackShipping = async (shiprocket_shipment_id) => {
  try {
    const res = await apiClient.post(`/shipping/track`, {
      shiprocket_shipment_id,
    });
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const cancelShipping = async (shiprocket_order_id, user_id) => {
  try {
    const res = await apiClient.post(`/shipping/cancel`, {
      user_id,
      shiprocket_order_id,
    });
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const getDeliveryEstimation = async (user_id, pin_code) => {
  try {
    const res = await apiClient.get(
      `/shipping/delivery-estimation/${user_id}`,
      {
        params: {
          pin_code,
        },
      }
    );
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const trackOrderById = async (order_id) => {
  try {
    const res = await apiClient.get(`/shipping/track/${order_id}`);
    return res.data;
  } catch (error) {
    console.error("Error reaching the server for tracking:", error);
    return null;
  }
};
