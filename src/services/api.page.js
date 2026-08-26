import apiClient from "../axios.config.js";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast.js";
import { getApiErrorMessage } from "../utils/apiError";

// Get all pages
export const getAllPages = async () => {
  try {
    const res = await apiClient.get("/pages/getAll");
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching pages"));
    console.error(error);
    return null;
  }
};

// Get a page by slug
export const getPageBySlug = async (slug) => {
  try {
    const res = await apiClient.get(`/pages/slug/${slug}`);
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(`Error fetching page with slug: ${slug}`);
    console.error(error);
    return null;
  }
};

// Get a page by ID
export const getPageById = async (id) => {
  try {
    const res = await apiClient.get(`/pages/getById/${id}`);
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(`Error fetching page with ID: ${id}`);
    console.error(error);
    return null;
  }
};

// Create a new page
export const createPage = async (pageData) => {
  try {
    const res = await apiClient.post("/pages/create", pageData);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error creating page"));
    console.error(error);
    return null;
  }
};

// Update a page
export const updatePage = async (id, pageData) => {
  try {
    const res = await apiClient.put(`/pages/update/${id}`, pageData);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(`Error updating page with ID: ${id}`);
    console.error(error);
    return null;
  }
};

// Delete a page
export const deletePage = async (id) => {
  try {
    const res = await apiClient.delete(`/pages/delete/${id}`);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(`Error deleting page with ID: ${id}`);
    console.error(error);
    return null;
  }
};

// Get privacy policy
export const getPolicy = async () => {
  try {
    const res = await apiClient.get("/pages/privacy-policy");
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching privacy policy"));
    console.error(error);
    return null;
  }
};

// Update privacy policy
export const updatePolicy = async (content) => {
  try {
    const res = await apiClient.put("/pages/privacy-policy", {
      privacy_policy: content,
    });
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating privacy policy"));
    console.error(error);
    return null;
  }
};

// Get terms and conditions
export const getTermConditions = async () => {
  try {
    const res = await apiClient.get("/pages/terms-condition");
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching terms and conditions"));
    console.error(error);
    return null;
  }
};

// Update terms and conditions
export const updateTermConditions = async (content) => {
  try {
    const res = await apiClient.put("/pages/terms-condition", {
      terms_condition: content,
    });
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating terms and conditions"));
    console.error(error);
    return null;
  }
};
