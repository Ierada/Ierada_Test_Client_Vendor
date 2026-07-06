import apiClient from "../axios.config";
import { notifyOnFail } from "../utils/notification/toast";

export const initiateShipping = async (order_id, provider) => {
  try {
    const res = await apiClient.post(`/shipping/initiate`, {
      order_id,
      provider,
    });
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Error reaching the server";
    console.log("api.shipping initiateShipping error:", error);
    return { status: 0, message, error: error.response?.data?.error };
  }
};

export const manifestOrder = async (orderId) => {
  try {
    const res = await apiClient.post(`/shipping/manifest/${orderId}`);
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Error manifesting the order";
    console.log("api.shipping manifestOrder error:", error);
    return { status: 0, message, error: error.response?.data?.error };
  }
};

export const cancelShipping = async (orderId) => {
  try {
    const res = await apiClient.post(`/shipping/cancel/${orderId}`);
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Error cancelling the shipping order";
    console.log("api.shipping cancelShipping error:", error);
    return { status: 0, message, error: error.response?.data?.error };
  }
};

export const getTrackingDetails = async (orderId) => {
  const res = await apiClient.get(`/shipping/track/${orderId}`);
  return res.data;
};

export const getShippingRates = async (orderId) => {
  try {
    const res = await apiClient.get(`/shipping/rates/${orderId}`);
    return res.data;
  } catch (error) {
    notifyOnFail("Error fetching shipping rates");
    console.log(error);
  }
};

export const assignProvider = async (orderId, provider) => {
  try {
    const res = await apiClient.post(`/shipping/assign/${orderId}`, {
      provider,
    });
    return res.data;
  } catch (error) {
    notifyOnFail("Error assigning provider");
    console.log(error);
  }
};

export const getAvailableProviders = async () => {
  try {
    const res = await apiClient.get(`/shipping/providers`);
    return res.data;
  } catch (error) {
    notifyOnFail("Error fetching providers");
    console.log(error);
  }
};

export const getRateCards = async (filters = {}) => {
  try {
    const res = await apiClient.get(`/shipping/rate-cards`, {
      params: filters,
    });
    return res.data;
  } catch (error) {
    notifyOnFail("Error fetching rate cards");
    console.log(error);
  }
};

export const getRateCardById = async (id) => {
  try {
    const res = await apiClient.get(`/shipping/rate-cards/${id}`);
    return res.data;
  } catch (error) {
    notifyOnFail("Error fetching the rate card");
    console.log(error);
  }
};

export const createRateCard = async (payload) => {
  try {
    const res = await apiClient.post(`/shipping/rate-cards`, payload);
    return res.data;
  } catch (error) {
    notifyOnFail("Error creating the rate card");
    console.log(error);
  }
};

export const updateRateCard = async (id, payload) => {
  try {
    const res = await apiClient.put(`/shipping/rate-cards/${id}`, payload);
    return res.data;
  } catch (error) {
    notifyOnFail("Error updating the rate card");
    console.log(error);
  }
};

export const deleteRateCard = async (id) => {
  try {
    const res = await apiClient.delete(`/shipping/rate-cards/${id}`);
    return res.data;
  } catch (error) {
    notifyOnFail("Error deleting the rate card");
    console.log(error);
  }
};

export const getWarehouseAddresses = async (userId) => {
  try {
    const res = await apiClient.get(`/shipping/addresses/${userId}`);
    return res.data;
  } catch (error) {
    notifyOnFail("Error fetching warehouse addresses");
    console.log(error);
  }
};

export const getAllWarehouseAddresses = async (params = {}) => {
  try {
    const res = await apiClient.get(`/shipping/addresses`, { params });
    return res.data;
  } catch (error) {
    notifyOnFail("Error fetching warehouse addresses");
    console.log(error);
  }
};

export const addPickupAddress = async (payload) => {
  try {
    const res = await apiClient.post(`/shipping/addresses`, payload);
    return res.data;
  } catch (error) {
    notifyOnFail("Error adding pickup address");
    console.log(error);
  }
};

export const updatePickupAddress = async (id, payload) => {
  try {
    const res = await apiClient.put(`/shipping/addresses/${id}`, payload);
    return res.data;
  } catch (error) {
    notifyOnFail("Error updating pickup address");
    console.log(error);
  }
};

export const deletePickupAddress = async (id) => {
  try {
    const res = await apiClient.delete(`/shipping/addresses/${id}`);
    return res.data;
  } catch (error) {
    notifyOnFail("Error deleting pickup address");
    console.log(error);
  }
};

export const getShippingEstimate = async (userId, pincode = null) => {
  try {
    const res = await apiClient.get(`/shipping/estimate/${userId}`, {
      params: {
        pincode,
      },
    });
    return res.data;
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
      },
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
