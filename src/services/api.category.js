import apiClient from "../axios.config.js";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast.js";
import { getApiErrorMessage } from "../utils/apiError";

export const getCategories = async () => {
  try {
    const res = await apiClient.get("/category/getAll");
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
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

export const updateCategory = async (id, CategoryData) => {
  try {
    const response = await apiClient.put(`/category/edit/${id}`, CategoryData);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating the Category"));
    console.error(error);
  }
};

export const addCategory = async (CategoryData) => {
  try {
    const response = await apiClient.post("/category/add", CategoryData);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error adding the Category"));
    console.error(error);
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await apiClient.delete(`/category/delete/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the Category"));
    console.error(error);
  }
};

export const getSubCategories = async () => {
  try {
    const res = await apiClient.get("/subcategory/getAll");
    // if (res.data.status === 1) {
    //   notifyOnSuccess(res.data.message);
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

export const getSubCategoryById = async (id) => {
  try {
    const res = await apiClient.get(`/subcategory/getById/${id}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log("Error adding address:", error);
  }
};

export const updateSubCategory = async (id, SubCategoryData) => {
  try {
    const response = await apiClient.put(
      `/subcategory/edit/${id}`,
      SubCategoryData
    );
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating the subcategory"));
    console.error(error);
  }
};

export const addSubCategory = async (SubCategoryData) => {
  try {
    const response = await apiClient.post("/subcategory/add", SubCategoryData);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error adding the subcategory"));
    console.error(error);
  }
};

export const deleteSubCategory = async (id) => {
  try {
    const response = await apiClient.delete(`/subcategory/delete/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      console.log(response);
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the subcategory"));
    console.error(error);
  }
};

export const getInnerSubCategories = async () => {
  try {
    const res = await apiClient.get("/innersubcategory/getAll");
    // if (res.data.status === 1) {
    //   notifyOnSuccess(res.data.message);
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

export const updateInnerSubCategory = async (id, SubCategoryData) => {
  try {
    const response = await apiClient.put(
      `/innersubcategory/edit/${id}`,
      SubCategoryData
    );
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating the subcategory"));
    console.error(error);
  }
};

export const addInnerSubCategory = async (SubCategoryData) => {
  try {
    const response = await apiClient.post(
      "/innersubcategory/add",
      SubCategoryData
    );
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error adding the subcategory"));
    console.error(error);
  }
};

export const deleteInnerSubCategory = async (id) => {
  try {
    const response = await apiClient.delete(`/innersubcategory/delete/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      console.log(response);
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the subcategory"));
    console.error(error);
  }
};

export const exportCategoriesCSV = async () => {
  try {
    const response = await apiClient.get("/category/export", {
      responseType: "blob",
      headers: {
        Accept: "text/csv",
      },
    });
    return response;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error adding the Category"));
    console.error(error);
  }
};

export const getSubCategoriesByCategoryId = async (id) => {
  try {
    const res = await apiClient.get(`/subcategory/getByCatId/${id}`);
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return error.response || error;
  }
};

export const getInnerSubCategoriesBySubCategoryId = async (id) => {
  try {
    const res = await apiClient.get(`/innersubcategory/getBySubCatId/${id}`);
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return error.response || error;
  }
};
