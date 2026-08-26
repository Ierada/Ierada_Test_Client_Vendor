import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const addReview = async (reviewData) => {
  try {
    const res = await apiClient.post("/review/add", reviewData);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    // return error.response || error;
  }
};

export const updateReviewStatus = async (review_id, data) => {
  try {
    const res = await apiClient.put(`/review/update-status/${review_id}`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    // return error.response || error;
  }
};

export const getReviewsByVendorId = async (vendor_id) => {
  try {
    const res = await apiClient.get(`/review/vendor/${vendor_id}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      // notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    // return error.response || error;
  }
};

// export const getReviewsByProductId = async product_id => {
//   try {
//     const res = await apiClient.get(`/review/product/${product_id}`);
//     if (res.data.status === 1) {
//       notifyOnSuccess(res.data.message);
//       return res.data;
//     } else {
//       notifyOnFail(res.data.message);
//     }
//   } catch (error) {
//     notifyOnFail('Error reaching the server');
//     console.log(error);
//     return error.response || error;
//   }
// };

export const getReviewsByUserId = async (user_id) => {
  try {
    const res = await apiClient.get(`/review/user/${user_id}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      // notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    // return error.response || error;
  }
};

export const getAllReviews = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add all parameters to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : "";
    const res = await apiClient.get(`/review/get${queryString}`);

    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return {
      status: 0,
      data: [],
      pagination: { totalItems: 0, totalPages: 1, currentPage: 1 },
    };
  }
};
