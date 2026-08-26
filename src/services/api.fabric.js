import apiClient from "../axios.config.js";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast.js";
import { getApiErrorMessage } from "../utils/apiError";

export const getAllFabrics = async () => {
  try {
    const response = await apiClient.get("/fabrics/getAll");
    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
      return response.data.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching Fabrics"));
    console.error(error);
    return error.response || error;
  }
};

export const getAllFabricsByStatus = async (query = {}) => {
  try {
    const response = await apiClient.get("/fabrics/getAllByStatus", {
      params: query,
    });
    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
      return response.data.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching Fabrics"));
    console.error(error);
    return error.response || error;
  }
};

export const getFabricById = async (id) => {
  try {
    const response = await apiClient.get(`/fabrics/getById/${id}`);
    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
      return response.data.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching the Fabric"));
    console.error(error);
    return error.response || error;
  }
};

export const addFabric = async (FabricData) => {
  try {
    const response = await apiClient.post("/fabrics/add", FabricData);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error adding the Fabric"));
    console.error(error);
    return error.response || error;
  }
};

export const editFabric = async (id, FabricData) => {
  try {
    const response = await apiClient.put(`/fabrics/edit/${id}`, FabricData);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating the Fabric"));
    console.error(error);
    return error.response || error;
  }
};

export const deleteFabric = async (id) => {
  try {
    const response = await apiClient.delete(`/fabrics/delete/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data.message;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the Fabric"));
    console.error(error);
    return error.response || error;
  }
};

export const updateStatus = async (fabricId, data) => {
  try {
    const res = await apiClient.put(`/fabrics/updatestatus/${fabricId}`, data);
    // if (res.data.status === 1) {
    //   // notifyOnSuccess(res.data.message);
    // } else {
    //   notifyOnFail(res.data.message);
    // }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return error.response || error;
  }
};
