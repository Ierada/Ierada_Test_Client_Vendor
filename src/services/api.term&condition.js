import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const updateTermConditions = async (terms_condition) => {
  try {
    const res = await apiClient.put("/settings/terms-condition", {
      terms_condition,
    });
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    }
    return data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
  }
};

export const getTermConditions = async () => {
  try {
    const res = await apiClient.get("/settings/terms-condition");
    if (res.data.status === 1) {
      return res.data;
    }
    return data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
  }
};
