import apiClient from "../axios.config";

// GST Summary endpoints
export const getGSTSummary = async (params = {}) => {
  const response = await apiClient.get("/gst-tax/gst-summary", { params });
  return response.data;
};

export const getGSTBreakup = async (params = {}) => {
  const response = await apiClient.get("/gst-tax/gst-breakup", { params });
  return response.data;
};

export const getGSTInvoiceSummary = async (params = {}) => {
  const response = await apiClient.get("/gst-tax/invoice-summary", { params });
  return response.data;
};

export const getGSTRFilingStatus = async (params = {}) => {
  const response = await apiClient.get("/gst-tax/gstr-status", { params });
  return response.data;
};

// TDS Report endpoints
export const getTDSReport = async (params = {}) => {
  const response = await apiClient.get("/gst-tax/tds-report", { params });
  return response.data;
};

// Commission Report endpoints
export const getCommissionReport = async (params = {}) => {
  const response = await apiClient.get("/gst-tax/commission-report", { params });
  return response.data;
};

export const getCommissionByCategory = async (params = {}) => {
  const response = await apiClient.get("/gst-tax/commission-category", { params });
  return response.data;
};

export const getOrderWiseCommission = async (params = {}) => {
  const response = await apiClient.get("/gst-tax/commission-orders", { params });
  return response.data;
};