import apiClient from "../axios.config.js";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast.js";
import { getApiErrorMessage } from "../utils/apiError";

export const getActiveOffer = async () => {
  try {
    const response = await apiClient.get("/offer/active");

    if (response.data.status === 1) {
      //   notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching Banners"));
    console.error(error);
  }
};

export const getAllOffers = async () => {
  try {
    const response = await apiClient.get("/offer/getOffers");

    if (response.data.status === 1) {
      //   notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching Banners"));
    console.error(error);
  }
};

export const updateOffer = async (id, offerData) => {
  try {
    const response = await apiClient.put(`/offer/updateOffer/${id}`, offerData);
    if (response.data.status === 1) {
      //   notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating the Banner"));
    console.error(error);
  }
};

export const addOffer = async (offerData) => {
  try {
    const response = await apiClient.post("/offer/addOffer", offerData);
    if (response.data.status === 1) {
      //   notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error adding the Banner"));
    console.error(error);
  }
};

export const deleteOffer = async (id) => {
  try {
    const response = await apiClient.delete(`/offer/deleteOffer/${id}`);
    if (response.data.status === 1) {
      //   notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data.message;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the Banner"));
    console.error(error);
  }
};

export const getOfferById = async (offerId) => {
  try {
    const response = await apiClient.get(`/offer/getOfferById/${offerId}`);

    if (response.data.status === 1) {
      //   notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching Banners"));
    console.error(error);
  }
};

export const updateStatus = async (offerId, data) => {
  try {
    const res = await apiClient.put(`/offer/update-status/${offerId}`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
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
