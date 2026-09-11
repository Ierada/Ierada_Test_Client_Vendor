import apiClient from "../axios.config";
import { notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

/** Ops-backed You Earn / fee preview for Smart Listing. */
export const previewListingSettlement = async (payload, { silent = false } = {}) => {
  try {
    const response = await apiClient.post("/settlement/listing-preview", payload, {
      timeout: 30000,
    });
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

export const getSettlements = async (params = {}, { silent = false } = {}) => {
  try {
    const response = await apiClient.get("/settlement", { params });
    if (response.data?.status !== 1 && !silent) {
      notifyOnFail(response.data?.message || "Could not load settlements.");
    }
    return response.data;
  } catch (error) {
    if (!silent) {
      notifyOnFail(getApiErrorMessage(error, "Could not load settlements."));
    }
    throw error;
  }
};

export const getSettlementSummary = async ({ silent = false } = {}) => {
  try {
    const response = await apiClient.get("/settlement/summary");
    if (response.data?.status !== 1 && !silent) {
      notifyOnFail(
        response.data?.message || "Could not load settlement summary.",
      );
    }
    return response.data;
  } catch (error) {
    if (!silent) {
      notifyOnFail(
        getApiErrorMessage(error, "Could not load settlement summary."),
      );
    }
    throw error;
  }
};
