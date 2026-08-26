import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getAllShippingPartners = async () => {
  try {
    const response = await apiClient.get(`/shippingpartner/get`);
    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }

    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return;
  }
};

export const updateShippingPartner = async (id, shippingPartnerData) => {
  try {
    const response = await apiClient.put(
      `/shippingpartner/updated/${id}`,
      shippingPartnerData
    );
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating the ShippingPartner"));
    console.error(error);
  }
};

export const updateShippingPartnerStatus = async (id, shippingPartnerData) => {
  try {
    const response = await apiClient.put(
      `/shippingpartner/updatedstatus/${id}`,
      shippingPartnerData
    );
    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
      return null;
    }
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating the shipping partner status"));
    console.error(error);
    return null;
  }
};

export const deleteShippingPartner = async (id) => {
  try {
    const response = await apiClient.delete(`/shippingpartner/delete/${id}`);
    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the ShippingPartner"));
    console.error(error);
  }
};

export const createShippingPartner = async (data) => {
  try {
    const response = await apiClient.post("/shippingpartner/add", data);
    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the ShippingPartner"));
    console.error(error);
  }
};
