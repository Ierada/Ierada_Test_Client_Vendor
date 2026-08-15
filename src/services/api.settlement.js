import apiClient from "../axios.config";

// Get all settlements for a vendor
export const getSettlements = async (params = {}) => {
  const response = await apiClient.get("/settlement", { params });
  return response.data;
};

// Get settlement summary cards
export const getSettlementSummary = async () => {
  const response = await apiClient.get("/settlement/summary");
  return response.data;
};

// Get single settlement by ID
export const getSettlementById = async (id) => {
  const response = await apiClient.get(`/settlement/${id}`);
  return response.data;
};

// Create new settlement (admin only)
export const createSettlement = async (data) => {
  const response = await apiClient.post("/settlement", data);
  return response.data;
};

// Update settlement (admin only)
export const updateSettlement = async (id, data) => {
  const response = await apiClient.put(`/settlement/${id}`, data);
  return response.data;
};
