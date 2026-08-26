import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getThemes = async () => {
  try {
    const res = await apiClient.get("/productthemes");
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const getThemeById = async (id) => {
  try {
    const res = await apiClient.get(`/productthemes/${id}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const createTheme = async (data) => {
  try {
    const res = await apiClient.post("/productthemes", data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const updateTheme = async (id, data) => {
  try {
    const res = await apiClient.put(`/productthemes/${id}`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const deleteTheme = async (id) => {
  try {
    const res = await apiClient.delete(`/productthemes/${id}`);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const getThemeSections = async (id) => {
  try {
    const res = await apiClient.get(`/productthemes/${id}/sections`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const getThemeSectionById = async (themeId, sectionId) => {
  try {
    const res = await apiClient.get(
      `/productthemes/${themeId}/sections/${sectionId}`
    );
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const createThemeSection = async (themeId, data) => {
  try {
    const res = await apiClient.post(
      `/productthemes/${themeId}/sections`,
      data
    );
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const updateThemeSection = async (themeId, sectionId, data) => {
  try {
    const res = await apiClient.put(
      `/productthemes/${themeId}/sections/${sectionId}`,
      data
    );
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const deleteThemeSection = async (themeId, sectionId) => {
  try {
    const res = await apiClient.delete(
      `/productthemes/${themeId}/sections/${sectionId}`
    );
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const updateThemeSectionPositions = async (themeId, data) => {
  try {
    const res = await apiClient.put(
      `/productthemes/${themeId}/sections/positions`,
      data
    );
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const updateThemeSectionStatus = async (themeId, sectionId, data) => {
  try {
    const res = await apiClient.put(
      `/productthemes/${themeId}/sections/${sectionId}/status`,
      data
    );
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const getThemePageData = async (themeSlug, userId) => {
  try {
    const res = await apiClient.get(
      `/productthemes/${themeSlug}/data/${userId}`
    );
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};
