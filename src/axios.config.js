import axios from "axios";
import { toast } from "react-toastify";
import {
  getUserToken,
  clearUserSession,
  endVendorSessionAndRedirect,
  isPublicAuthPath,
} from "./utils/userIdentifier";
import { touchActivity } from "./utils/idleTimeout";
import {
  AUTH_SESSION_CODES,
  isAuthSessionError,
  markAuthSessionEnded,
  isAuthRedirectInFlight,
  setAuthRedirectInFlight,
} from "./utils/authSession";

const apiClient = axios.create({
  // baseURL: import.meta.env.VITE_TEST_API_URL,
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    // Retrieve the token from cookies
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(";").shift();
    };

    const userToken = getUserToken("vendor");

    const passwordToken = getCookie("passwordToken");
    if (userToken) {
      config.headers["auth-token"] = userToken;
      touchActivity();
    }
    if (passwordToken) {
      config.headers["password-token"] = passwordToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function beginVendorAuthRedirect(data = {}) {
  markAuthSessionEnded();

  if (isPublicAuthPath()) {
    clearUserSession("vendor");
    return;
  }
  if (isAuthRedirectInFlight()) return;
  setAuthRedirectInFlight(true);

  const code = data?.code;
  const serverMsg = data?.message;

  if (code === "PASSWORD_CHANGED") {
    toast.info(
      serverMsg || "Your password was recently changed. Please login again.",
      { toastId: "auth-password-changed", autoClose: 4000 },
    );
  } else if (code === "DEVICE_REVOKED") {
    toast.info(serverMsg || "This device was signed out. Please login again.", {
      toastId: "auth-device-revoked",
      autoClose: 4000,
    });
  } else if (code === "TOKEN_EXPIRED") {
    toast.info(serverMsg || "Your session has expired. Please login again.", {
      toastId: "auth-token-expired",
      autoClose: 4000,
    });
  } else if (code === "TOKEN_INVALID" || code === "USER_NOT_FOUND") {
    toast.info(serverMsg || "Invalid session. Please login again.", {
      toastId: "auth-token-invalid",
      autoClose: 4000,
    });
  }

  endVendorSessionAndRedirect({ redirect: true, replace: true });
}

apiClient.interceptors.response.use(
  (response) => {
    const data = response?.data;
    if (data?.status === 0 && AUTH_SESSION_CODES.has(data?.code)) {
      beginVendorAuthRedirect(data);
      return Promise.reject({
        isSessionError: true,
        code: data.code,
        message: data.message,
        response,
      });
    }
    return response;
  },
  (error) => {
    if (isAuthSessionError(error)) {
      beginVendorAuthRedirect(error.response?.data);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
