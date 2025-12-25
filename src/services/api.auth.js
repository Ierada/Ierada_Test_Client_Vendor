import apiClient from "../axios.config";
import Cookies from "js-cookie";
import config from "../config/config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";

export const registerVendor = async (vendorData) => {
  try {
    const res = await apiClient.post(`/auth/vendor/register`, vendorData);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      // notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    //default fallback for error
    notifyOnFail("Error reaching the server");
    // return error.response || error;
  }
};

export const registerVendorByAdmin = async (vendorData) => {
  try {
    const res = await apiClient.post(
      `/auth/vendor/registerbyadmin`,
      vendorData
    );
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      // notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    //default fallback for error
    notifyOnFail("Error reaching the server");
    // return error.response || error;
  }
};

export const vendorLogin = async (data) => {
  try {
    const res = await apiClient.post(`/auth/vendor/login`, data);

    return res.data;
  } catch (error) {
    //default fallback for error
    notifyOnFail("Error reaching the server");
    // return error.response || error;
  }
};

export const adminLogin = async (data) => {
  try {
    const res = await apiClient.post(`/auth/admin/login`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else if (res.data.status === 2) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    //default fallback for error
    notifyOnFail("Error reaching the server");
    // return error.response || error;
  }
};

export const sendOtp = async ({ type, value, verifiedValue }) => {
  try {
    const query = verifiedValue
      ? `?${type === "email" ? "mobile" : "email"}=${verifiedValue}`
      : "";
    const response = await apiClient.post(
      `/auth/customer/send-otp${query}`,
      {
        type,
        value,
      },
      {
        headers: {
          "Project-Id": config.VITE_EMAIL_PROJECT_ID, // Add required header}
        },
      }
    );
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
  }
};

export const verifyOtp = async (data) => {
  try {
    const response = await apiClient.post(`/auth/customer/verify-otp`, data, {
      headers: {
        "Project-Id": config.VITE_EMAIL_PROJECT_ID, // required header
      },
    });
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail("Mobile verification falied !");
  }
};

export const verifyGoogle = async (data) => {
  try {
    const response = await apiClient.post(`/auth/google/verify`, data);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
  }
};

export const verifyFacebook = async (data) => {
  try {
    const response = await apiClient.post(`/auth/facebook/verify`, data);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
  }
};

export const verifyInstagram = async (data) => {
  try {
    const response = await apiClient.post(`/auth/instagram/verify`, data);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
  }
};

export const verifyMobile = async (data) => {
  try {
    const response = await apiClient.post(`/auth/customer/verify-mobile`, data);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
  }
};

export const verifyVendorMobile = async (data) => {
  try {
    const response = await apiClient.post(
      `/auth/customer/verifyVendorMobile`,
      data
    );
    return response.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
  }
};

export const customerRegister = async (data) => {
  try {
    const res = await apiClient.post(`/auth/customer/register`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
  }
};

export const customerLogin = async ({ type, value, password }) => {
  try {
    const response = await apiClient.post("/auth/customer/login", {
      type,
      value,
      password,
    });
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
  }
};

//Reset password when forgot
export const resetPassword = async (email, password) => {
  try {
    const res = await apiClient.patch(`/auth/updatePassword/${email}`, {
      password,
    });
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    //default fallback for error
    notifyOnFail("Error reaching the server");
    // return error.response || error;
  }
};

//change password after login
export const changePassword = async (userId, changePasswordData) => {
  try {
    const response = await apiClient.put(
      `/auth/change-password/${userId}`,
      changePasswordData
    );

    console.log("Backend Response:", response.data);

    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Error reaching the server";
    notifyOnFail(errorMessage);
    console.error("Change Password Error:", error.response?.data || error);
    return { status: 0, error: errorMessage };
  }
};

export const resendOtp = async (mobileNumber) => {
  try {
    const response = await apiClient.post("/user/resendotp", {
      mobile: `${mobileNumber}`,
    });
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
  }
};
