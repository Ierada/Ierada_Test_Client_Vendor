import apiClient from "../axios.config";

/**
 * Shipease (NimbusPost) pickup-phone self-verification.
 * The OTP always goes to the vendor's own phone and is entered by the
 * vendor only — nobody else (including Admin) can do this on their behalf.
 */

export const getMyShipeaseStatus = async () => {
  try {
    const res = await apiClient.get("/warehouse/shipease/self/status");
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "Failed to load status";
    return { status: 0, message };
  }
};

export const sendMyShipeaseOtp = async () => {
  try {
    const res = await apiClient.post("/warehouse/shipease/self/otp/send");
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "Failed to send OTP";
    return { status: 0, message };
  }
};

export const verifyMyShipeaseOtp = async (otp) => {
  try {
    const res = await apiClient.post("/warehouse/shipease/self/otp/verify", {
      otp,
    });
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "Failed to verify OTP";
    return { status: 0, message };
  }
};
