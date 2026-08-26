import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const addSubAdmin = async (data) => {
  try {
    const res = await apiClient.post(`/admin/add`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
    //   return error.response || error;
  }
};

export const getAllSubAdmin = async () => {
  try {
    const res = await apiClient.get(`/admin/get`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
    //   return error.response || error;
  }
};

export const updateSubAdmin = async (id, data) => {
  try {
    const res = await apiClient.put(`/admin/updated/${id}`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    // return error.response || error;
  }
};

export const deleteSubAdmin = async (id) => {
  try {
    const response = await apiClient.delete(`/admin/delete/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
    } else {
      notifyOnFail(response.data.message);
    }
    return response.data.message;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the attribute"));
    console.error(error);
    // return error.response || error;
  }
};

export const getSubAdminById = async (id) => {
  try {
    const res = await apiClient.get(`/admin/get/${id}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
    //   return error.response || error;
  }
};

export const getAdminPermissions = async (id) => {
  try {
    const res = await apiClient.get(`/admin/permissions/${id}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
    //   return error.response || error;
  }
};

export const updateStatus = async (id, data) => {
  try {
    const res = await apiClient.put(`/admin/status/${id}`, data);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      // notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return error.response || error;
  }
};

export const editAdmin = async (id, data) => {
  try {
    const res = await apiClient.put(`/admin/edit/${id}`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return error.response || error;
  }
};

export const getAdminById = async (id) => {
  try {
    const res = await apiClient.get(`/admin/admin/${id}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
    //   return error.response || error;
  }
};

export const getAdminByUserId = async (id) => {
  try {
    const res = await apiClient.get(`/admin/getbyuser/${id}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
    //   return error.response || error;
  }
};

export const toggleAdmin2FA = async (userId, data) => {
  try {
    const res = await apiClient.post(`/admin/2fa/toggle/${userId}`, data);
    // if (res.data.status === 1) {
    //   notifyOnSuccess(res.data.message);
    // } else {
    //   notifyOnFail(res.data.message);
    // }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const verifyAdmin2FA = async (userId, data) => {
  try {
    const res = await apiClient.post(`/admin/2fa/verify/${userId}`, data);
    // if (res.data.status === 1) {
    //   notifyOnSuccess(res.data.message);
    // } else {
    //   notifyOnFail(res.data.message);
    // }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};
