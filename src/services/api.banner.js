import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getAllBanners = async () => {
  try {
    const response = await apiClient.get("/banner/getAll");

    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching Banners"));
    console.error(error);
  }
};

export const getBannersByType = async (type) => {
  try {
    const response = await apiClient.get(`/banner/getbytype/${type}`);

    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching Banners"));
    console.error(error);
  }
};

export const getBannerById = async (id) => {
  try {
    const response = await apiClient.get(`/banner/getById/${id}`);
    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching Banner"));
    console.error(error);
  }
};

export const updateBanner = async (id, BannerData) => {
  try {
    const response = await apiClient.put(`/banner/edit/${id}`, BannerData);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating the Banner"));
    console.error(error);
  }
};

export const addBanners = async (BannerData) => {
  try {
    const response = await apiClient.post("/banner/add", BannerData);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error adding the Banner"));
    console.error(error);
  }
};

export const deleteBanner = async (id) => {
  try {
    const response = await apiClient.delete(`/banner/delete/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the Banner"));
    console.error(error);
  }
};
