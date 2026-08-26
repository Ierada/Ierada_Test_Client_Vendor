import apiClient from "../axios.config";
import Cookies from "js-cookie";
import config from "../config/config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getUserDetals = async (userId) => {
  try {
    // const res = await apiClient.get(`/user/user-details/${userId}`);
    // if (res.data.status === 1) {
    //   return res.data;
    // } else {
    //   notifyOnFail(res.data.message);
    // }
  } catch (error) {
    //default fallback for error
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    // return error.response || error;
  }
};

export const updateUserDetails = async (userId, userData) => {
  try {
    const data = [
      {
        id: 1,
        first_name: "DIVYA",
        last_name: "UNNI",
        email: "designerUser1@gmail.com",
        phone: "2222222222",
        birthday: null,
        image: "https://via.placeholder.com/150",
        gender: "Women",
        complete_percentage: "",
        status: "",
      },
    ];
    return data;
    // const res = await apiClient.patch(
    //   `/user/update-profile/${userId}`,
    //   userData
    // );
    // if (res.data.status === 1) {
    //   notifyOnSuccess(res.data.message);
    // } else {
    //   notifyOnFail(res.data.message);
    // }
    // return res.data;
  } catch (error) {
    //default fallback for error
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    // return error.response || error;
  }
};

export const generateOTP = async (identifier) => {
  try {
    const res = await apiClient.post(`/auth/generateOTP/${identifier}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      // notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    //default fallback for error
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    // return error.response || error;
  }
};

export const verifyOTP = async (identifier, otp) => {
  try {
    const res = await apiClient.post(`/auth/verifyOTP/${identifier}`, { otp });
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      document.cookie = `passwordToken=${res.data.token}; path=/; max-age=300;`;
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    //default fallback for error
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    // return error.response || error;
  }
};

export const verifyMobileOTP = async (phone) => {
  try {
    const res = await apiClient.post(`/auth/verifyMobileOTP/${phone}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    //default fallback for error
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    // return error.response || error;
  }
};

//Reset password when forgot
export const resetPassword = async (identifier, password, identifierType) => {
  try {
    const res = await apiClient.patch(`/auth/updatePassword`, {
      identifier,
      password,
      identifierType,
    });
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    //default fallback for error
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    // return error.response || error;
  }
};

export const getAllDesigners = async () => {
  try {
    const res = await apiClient.get("/designer/getDesignerUsers");
    // if (res.data.status === 1) {
    //   notifyOnSuccess(res.data.message);
    // } else {
    //   notifyOnFail(res.data.message);
    // }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    // return error.response || error;
  }
};

//change password after login
export const changePassword = async (userId, changePasswordData) => {
  try {
    // const formattedData = {
    //   Password: changePasswordData.Password,
    //   newPassword: changePasswordData.NewPassword,
    //   confirmPassword: changePasswordData.confirmPassword,
    // };

    // console.log('Formatted Data:', formattedData);

    const response = await apiClient.put(
      `/user/change-password/${userId}`,
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

export const sendOtp = async (mobileNumber) => {
  try {
    const response = await apiClient.post("/user/register", {
      mobile: `+91${mobileNumber}`,
    });
    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
  }
};

export const userLogin = async (otp, mobileNumber) => {
  console.log(otp, "otp from api");
  console.log(mobileNumber, "mobile");

  try {
    const response = await apiClient.post("/user/verifyotp", {
      otp: otp,
      mobile: `+91${mobileNumber}`,
    });

    if (response.data.status === 1) {
      // Save auth-token and role in cookies
      Cookies.set(`${config.BRAND_NAME}userToken`, response.data.token, {
        expires: 30,
        path: "/",
        secure: true,
        sameSite: "strict",
      });
      // setToken(res.data.token);
      // setUser(res.data.data);
      localStorage.setItem(
        `${config.BRAND_NAME}user`,
        JSON.stringify(response.data.data)
      );
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const resendOtp = async (mobileNumber) => {
  try {
    const response = await apiClient.post("/user/resendotp", {
      mobile: `+91${mobileNumber}`,
    });
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
  }
};

export const updateEmailNotifications = async (id, status) => {
  try {
    const response = await apiClient.post(
      `/customer/changeemailnotification/${id}`,
      {
        status,
      }
    );
    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
  }
};
