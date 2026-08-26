import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getItemsForCoupon = async (type) => {
  try {
    const res = await apiClient.get(`/coupon/get-items-for-coupon/${type}`);

    if (res.data.status === 1) {
      return res.data;
    }
    // else {
    //   notifyOnFail(res.data.message);
    // }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error retrieving items for coupon"));
    console.error(error);
  }
};

/**
 * Generate a new coupon
 * @param {object} couponData - Coupon details
 */
export const generateCoupon = async (couponData) => {
  try {
    const res = await apiClient.post("/coupon/generateCoupon", couponData);

    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error generating coupon"));
    console.error(error);
    return null;
  }
};

/**
 * Apply coupon to an order
 * @param {object} couponDetails - Coupon application details
 */
export const applyCoupon = async (couponDetails) => {
  try {
    const res = await apiClient.post("/coupon/applyCoupon", couponDetails);

    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error applying coupon"));
    console.error(error);
    return null;
  }
};

/**
 * Get available coupons
 * @param {object} [params] - Optional query parameters
 */
export const getCoupons = async (params) => {
  try {
    const res = await apiClient.get("/coupon/getAllCoupons");

    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error retrieving coupons"));
    console.error(error);
    return null;
  }
};

/**
 * Get coupons applicable to user's cart
 * @param {string|number} userId - User ID
 */
export const getCouponsByUserId = async (userId) => {
  try {
    const res = await apiClient.get(`/coupon/getCouponsByUserId/${userId}`);

    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error retrieving user-specific coupons"));
    console.error(error);
    return null;
  }
};

export const editCoupon = async (id, data) => {
  try {
    const res = await apiClient.put(`/coupon/updateCoupon/${id}`, data);
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

export const deleteCoupon = async (id) => {
  try {
    const response = await apiClient.delete(`/coupon/deleteCoupon/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data.message;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the attribute"));
    console.error(error);
    return error.response || error;
  }
};

export const getAllCouponsAdmin = async () => {
  try {
    const res = await apiClient.get("/coupon/getAllCoupons");

    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error retrieving coupons"));
    console.error(error);
    return null;
  }
};

export const updateStatus = async (couponId, data) => {
  try {
    const res = await apiClient.put(`/coupon/updatestatus/${couponId}`, data);
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
