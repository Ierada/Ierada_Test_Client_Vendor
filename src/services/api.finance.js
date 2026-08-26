import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getFinancialDashboard = async (params) => {
  try {
    const res = await apiClient.get("/order/get-financial-dashboard", {
      params,
    });
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
    //   return error.response || error;
  }
};
