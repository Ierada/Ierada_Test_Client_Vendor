import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

// Create an ad
export const createAd = async (adData) => {
  try {
    const response = await apiClient.post("/ads/create", adData);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error creating ad"));
    console.error(error);
  }
};

// Approve an ad
export const approveAd = async (adId) => {
  try {
    const response = await apiClient.put("/ads/approve", { ad_id: adId });
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error approving ad"));
    console.error(error);
  }
};

// Reject an ad
export const rejectAd = async (adId) => {
  try {
    const response = await apiClient.put("/ads/reject", { ad_id: adId });
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error rejecting ad"));
    console.error(error);
  }
};

// Reset an ad status to pending
export const setPendingAd = async (adId) => {
  try {
    const response = await apiClient.put("/ads/pending", { ad_id: adId });
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error resetting ad status"));
    console.error(error);
  }
};

// Get ads by vendor ID
export const getAdsByVendorId = async (vendorId) => {
  try {
    const response = await apiClient.get(`/ads/vendor/${vendorId}`);
    if (response.data.status === 1) {
      return response.data.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching ads"));
    console.error(error);
  }
};

// Get all ads
export const getAllAds = async () => {
  try {
    const response = await apiClient.get("/ads/get");
    if (response.data.status === 1) {
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching all ads"));
    console.error(error);
  }
};

// Get ad by ID
export const getAdById = async (adId) => {
  try {
    const response = await apiClient.get(`/ads/${adId}`);
    if (response.data.status === 1) {
      return response.data.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching ad details"));
    console.error(error);
  }
};

// Delete ad by ID
export const deleteAd = async (adId) => {
  try {
    const response = await apiClient.delete(`/ads/${adId}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting ad"));
    console.error(error);
  }
};
