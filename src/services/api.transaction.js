import apiClient from "../axios.config";

// Get all transactions for a vendor
export const getTransactions = async (params = {}) => {
  const response = await apiClient.get("/transaction", { params });
  return response.data;
};

// Get transaction summary cards
export const getTransactionSummary = async () => {
  const response = await apiClient.get("/transaction/summary");
  return response.data;
};

// Get single transaction by ID
export const getTransactionById = async (id) => {
  const response = await apiClient.get(`/transaction/${id}`);
  return response.data;
};

// Create new transaction (admin only)
export const createTransaction = async (data) => {
  const response = await apiClient.post("/transaction", data);
  return response.data;
};

// Update transaction (admin only)
export const updateTransaction = async (id, data) => {
  const response = await apiClient.put(`/transaction/${id}`, data);
  return response.data;
};
