import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const updatePolicy = async (privacy_policy) => {
  try {
    const res = await apiClient.put("/settings/privacy-policy", {
      privacy_policy,
    });
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
  }
};

export const getPolicy = async () => {
  try {
    const res = await apiClient.get("/settings/privacy-policy");
    if (res.data.status === 1) {
      return res.data;
    }
    return data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
  }
};
