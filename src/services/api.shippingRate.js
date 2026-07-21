import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";

export const getShippingRates = async () => {
  try {
    const res = await apiClient.get("/shipping-rates/get");
    return res.data;
  } catch (error) {
    notifyOnFail(error.message || "Error fetching shipping rates");
    throw error;
  }
};

export const addShippingRate = async (payload) => {
  try {
    const res = await apiClient.post("/shipping-rates/add", payload);
    if (res.data.status === 1) {
      notifyOnSuccess("Shipping rate added successfully");
    } else {
      notifyOnFail(res.data.message || "Failed to add shipping rate");
      throw new Error(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(error.message || "Error adding shipping rate");
    throw error;
  }
};

export const updateShippingRate = async (id, payload) => {
  try {
    const res = await apiClient.put(`/shipping-rates/update/${id}`, payload);
    if (res.data.status === 1) {
      notifyOnSuccess("Shipping rate updated successfully");
    } else {
      notifyOnFail(res.data.message || "Failed to update shipping rate");
      throw new Error(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(error.message || "Error updating shipping rate");
    throw error;
  }
};

export const deleteShippingRate = async (id) => {
  try {
    const res = await apiClient.delete(`/shipping-rates/delete/${id}`);
    if (res.data.status === 1) {
      notifyOnSuccess("Shipping rate deleted successfully");
    } else {
      notifyOnFail(res.data.message || "Failed to delete shipping rate");
      throw new Error(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(error.message || "Error deleting shipping rate");
    throw error;
  }
};