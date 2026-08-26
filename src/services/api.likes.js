import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const addLike = async (userId, productId) => {
  try {
    const res = await apiClient.post("/likes/add", {
      user_id: userId,
      product_id: productId,
    });

    if (res.data.status === 1) {
      notifyOnSuccess("Thank you for liking the product!");
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error liking the product"));
    console.log(error);
    return null;
  }
};

export const getUserLikes = async (userId) => {
  try {
    const res = await apiClient.get(`/likes/get/${userId}`);

    if (res.data.status === 1) {
      return res.data.data;
    } else {
      return [];
    }
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getLikesReport = async (params) => {
  try {
    const res = await apiClient.get(`/likes/report?${params}`);

    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message || "Failed to fetch likes report");
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching likes report"));
    console.log(error);
    return null;
  }
};

export const getProductLikes = async (productId) => {
  try {
    const res = await apiClient.get(`/likes/product/${productId}`);

    if (res.data.status === 1) {
      return res.data;
    } else {
      return { data: [], total_likes: 0 };
    }
  } catch (error) {
    console.log(error);
    return { data: [], total_likes: 0 };
  }
};

export const generateLikeTemplate = async () => {
  try {
    const res = await apiClient.get("/likes/generate-template", {
      responseType: "blob",
    });
    return res;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error generating template"));
    console.log(error);
    throw error;
  }
};

export const bulkLikeUpdate = async (formData) => {
  try {
    const res = await apiClient.post("/likes/bulk-update", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message || "Bulk update failed");
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error uploading bulk likes"));
    console.log(error);
    return null;
  }
};
