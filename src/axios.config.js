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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAuthSessionError(error)) {
      // Always suppress follow-up "reaching the server" toasts
      markAuthSessionEnded();

      if (isPublicAuthPath()) {
        // Already on login/forgot — clear leftovers, do not lock redirect flag
        clearUserSession("vendor");
      } else if (!isAuthRedirectInFlight()) {
        setAuthRedirectInFlight(true);

        const code = error.response?.data?.code;
        const serverMsg = error.response?.data?.message;

        if (code === "PASSWORD_CHANGED") {
          toast.info(
            serverMsg ||
              "Your password was recently changed. Please login again.",
            { toastId: "auth-password-changed", autoClose: 4000 },
          );
        } else if (code === "TOKEN_EXPIRED") {
          toast.info(
            serverMsg || "Your session has expired. Please login again.",
            { toastId: "auth-token-expired", autoClose: 4000 },
          );
        } else if (code === "TOKEN_INVALID" || code === "USER_NOT_FOUND") {
          toast.info(serverMsg || "Invalid session. Please login again.", {
            toastId: "auth-token-invalid",
            autoClose: 4000,
          });
        }
        // NO_TOKEN (e.g. logout race): silent redirect

        endVendorSessionAndRedirect({ redirect: true, replace: true });
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
