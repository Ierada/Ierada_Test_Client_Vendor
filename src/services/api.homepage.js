import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

// Homepage Services
export const getHomePageData = async (userId) => {
  try {
    const res = await apiClient.get(`/homepage/homepage/${userId}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.error(error);
  }
};

export const getSections = async () => {
  try {
    const res = await apiClient.get("/homepage/sections");
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching sections"));
    console.error(error);
  }
};

export const getSectionById = async (id) => {
  try {
    const response = await apiClient.get(`/homepage/section/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching section:", error);
    throw error;
  }
};

export const createSection = async (sectionData) => {
  try {
    const res = await apiClient.post("/homepage/sections", sectionData);
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error creating section"));
    console.error(error);
  }
};

export const updateSection = async (id, sectionData) => {
  try {
    const res = await apiClient.put(
      `/homepage/sections/update/${id}`,
      sectionData
    );
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating section"));
    console.error(error);
  }
};

export const deleteSection = async (id) => {
  try {
    const res = await apiClient.delete(`/homepage/sections/${id}`);
    if (res.data.status === 1) {
      return res.data;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting section"));
    console.error(error);
  }
};

export const updateSectionPositions = async (positions) => {
  try {
    const res = await apiClient.put("/homepage/sections/positions", positions);
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating section positions"));
    console.error(error);
  }
};

export const updateSectionStatus = async (id, status) => {
  try {
    const res = await apiClient.put(`/homepage/sections/status/${id}`, {
      status,
    });
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating section status"));
    console.error(error);
  }
};
