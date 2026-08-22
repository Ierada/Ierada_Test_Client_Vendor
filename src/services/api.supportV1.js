import apiClient from "../axios.config";

const BASE = "/support/v1";

export const getContext = () => apiClient.get(`${BASE}/me/context`);
export const getCategories = () => apiClient.get(`${BASE}/categories`);
export const getStatus = () => apiClient.get(`${BASE}/status`);
export const startBotSession = () => apiClient.post(`${BASE}/bot/session`);
export const askBot = (payload) => apiClient.post(`${BASE}/bot/message`, payload);
export const escalateBot = (sessionId) =>
  apiClient.post(`${BASE}/bot/escalate`, { session_id: sessionId });
export const createTicket = (formData) =>
  apiClient.post(`${BASE}/tickets`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const listTickets = () => apiClient.get(`${BASE}/tickets`);
export const getTicket = (id) => apiClient.get(`${BASE}/tickets/${id}`);
export const replyToTicket = (id, formData) =>
  apiClient.post(`${BASE}/tickets/${id}/messages`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
