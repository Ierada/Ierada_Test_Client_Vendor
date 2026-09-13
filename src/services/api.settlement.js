import apiClient from "../axios.config";
import { notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

/** Ops-backed You Earn / fee preview for Smart Listing. */
export const previewListingSettlement = async (
  payload,
  { silent = false } = {},
) => {
  try {
    const response = await apiClient.post(
      "/settlement/listing-preview",
      payload,
      { timeout: 30000 },
    );
    if (response.data?.status !== 1 && !silent) {
      notifyOnFail(
        response.data?.message || "Could not refresh settlement preview.",
      );
    }
    return response.data;
  } catch (error) {
    if (!silent) {
      notifyOnFail(
        getApiErrorMessage(error, "Could not refresh settlement preview."),
      );
    }
    throw error;
  }
};

export const getSettlements = async (params = {}) => {
  try {
    const response = await apiClient.get("/settlement", { params });
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Could not load settlements."));
    throw error;
  }
};

export const getSettlementSummary = async () => {
  try {
    const response = await apiClient.get("/settlement/summary");
    return response.data;
  } catch (error) {
    notifyOnFail(
      getApiErrorMessage(error, "Could not load settlement summary."),
    );
    throw error;
  }
};

export const getSettlementById = async (id) => {
  try {
    const response = await apiClient.get(`/settlement/${id}`);
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Could not load settlement."));
    throw error;
  }
};

export const createSettlement = async (data) => {
  try {
    const response = await apiClient.post("/settlement", data);
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Could not create settlement."));
    throw error;
  }
};

export const updateSettlement = async (id, data) => {
  try {
    const response = await apiClient.put(`/settlement/${id}`, data);
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Could not update settlement."));
    throw error;
  }
};
