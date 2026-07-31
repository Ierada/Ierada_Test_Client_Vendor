import axios from "axios";
import { getUserToken } from "./utils/userIdentifier";

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

export default apiClient;
