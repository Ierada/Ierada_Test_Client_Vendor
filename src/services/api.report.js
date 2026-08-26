import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getVendorReport = async ({ vendor_id, startDate, endDate }) => {
  try {
    const res = await apiClient.post(`/reports/vendor/${vendor_id}`, {
      startDate,
      endDate,
    });
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const getAdminReport = async ({ startDate, endDate }) => {
  try {
    const res = await apiClient.post(`/reports/admin`, {
      startDate,
      endDate,
    });
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const getAllVendorPerformance = async () => {
  try {
    const res = await apiClient.get(`/reports/allvendor`);

    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};
