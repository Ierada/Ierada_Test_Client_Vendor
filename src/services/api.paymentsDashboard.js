import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";

/**
 * Get payments dashboard data for the current vendor
 */
export const getPaymentsDashboardData = async (params = {}) => {
  try {
    const res = await apiClient.get("/payments-dashboard/dashboard", { params });
    
    if (res.data.status === 1) {
      return res.data.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Error fetching payments dashboard data";
    notifyOnFail(errorMessage);
    console.error("API Error:", error);
    return null;
  }
};

/**
 * Get order-wise payment details with filtering
 */
export const getOrderPaymentDetails = async (params = {}) => {
  try {
    const res = await apiClient.get("/payments-dashboard/order-details", { params });
    
    if (res.data.status === 1) {
      return res.data.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Error fetching order payment details";
    notifyOnFail(errorMessage);
    console.error("API Error:", error);
    return null;
  }
};

/**
 * Get reports center summary (totals for the top summary cards)
 */
export const getReportsSummary = async () => {
  try {
    const res = await apiClient.get("/payments-dashboard/reports-summary");

    if (res.data.status === 1) {
      return res.data.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Error fetching reports summary";
    notifyOnFail(errorMessage);
    console.error("API Error:", error);
    return null;
  }
};

/**
 * Get generated/downloadable reports list
 */
export const getGeneratedReports = async () => {
  try {
    const res = await apiClient.get("/payments-dashboard/reports");

    if (res.data.status === 1) {
      return res.data.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Error fetching generated reports";
    notifyOnFail(errorMessage);
    console.error("API Error:", error);
    return null;
  }
};

export default {
  getPaymentsDashboardData,
  getOrderPaymentDetails,
  getReportsSummary,
  getGeneratedReports,
};