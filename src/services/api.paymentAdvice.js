import apiClient from "../axios.config";

// Get all payment advice for a vendor
export const getPaymentAdviceList = async (params = {}) => {
  const response = await apiClient.get("/payment-advice", { params });
  return response.data;
};

// Get single payment advice by ID
export const getPaymentAdviceById = async (id) => {
  const response = await apiClient.get(`/payment-advice/${id}`);
  return response.data;
};

// Get payment advice by settlement ID
export const getPaymentAdviceBySettlement = async (settlementId) => {
  const response = await apiClient.get(`/payment-advice/settlement/${settlementId}`);
  return response.data;
};

// Generate new payment advice from settlement
export const generatePaymentAdvice = async (data) => {
  const response = await apiClient.post("/payment-advice/generate", data);
  return response.data;
};

// Get order-wise details for a payment advice
export const getOrderWiseDetails = async (id, params = {}) => {
  const response = await apiClient.get(`/payment-advice/${id}/orders`, { params });
  return response.data;
};

// Download payment advice (PDF generation)
export const downloadPaymentAdvice = async (id) => {
  const response = await apiClient.get(`/payment-advice/${id}/download`);
  return response.data;
};