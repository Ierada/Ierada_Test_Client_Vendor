import apiClient from "../axios.config.js";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast.js";

export const getProductById = async (id) => {
  try {
    const res = await apiClient.get(`/product/getProductById/${id}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return null;
  }
};

export const getProductBySlug = async (slug, variationId = null) => {
  try {
    let url = `/product/getProductBySlug/${slug}`;
    if (variationId) {
      url += `?variation_id=${variationId}`;
    }
    const res = await apiClient.get(url);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return null;
  }
};

export const getProductsByVendorId = async (id, params) => {
  try {
    const res = await apiClient.get(`/product/getProductsByVendorId/${id}`, {
      params,
    });
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    // return error.response || error;
  }
};

export const getAllProducts = async (queryString = "") => {
  try {
    const res = await apiClient.get(`/product/getProducts?${queryString}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    // return error.response || error;
  }
};

export const searchProducts = async (keyword) => {
  try {
    const res = await apiClient.get(
      `/product/search?keyword=${encodeURIComponent(keyword)}`,
    );
    if (res.data.status === 1) {
      return res.data.data;
    } else {
      notifyOnFail(res.data.message);
      return [];
    }
  } catch (error) {
    notifyOnFail("Error searching products");
    console.error(error);
    return [];
  }
};

export const addProduct = async (productData) => {
  try {
    const res = await apiClient.post(`/product/addProduct`, productData);
    // if (res.data.status === 1) {
    //   notifyOnSuccess(res.data.message);
    // } else {
    //   notifyOnFail(res.data.message);
    // }
    return res.data;
  } catch (error) {
    notifyOnFail(
      "There was an error adding the product. Please try again later.",
    );
    return error.response || error;
  }
};

export const updateProductVisibility = async (id, data) => {
  try {
    const res = await apiClient.put(`/product/updateVisibility/${id}`, data);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    console.log(error);
    return error.response || error;
  }
};

export const updateProductPrice = async (productId, priceData) => {
  try {
    const response = await apiClient.patch(
      `/product/updatePrice/${productId}`,
      priceData,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating product price:", error);
    throw error;
  }
};

export const updateProduct = async (id, data) => {
  try {
    const res = await apiClient.patch(`/product/updateProduct/${id}`, data);
    // if (res.data.status === 1) {
    //   notifyOnSuccess(res.data.message);
    // } else {
    //   notifyOnFail(res.data.message);
    // }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return error.response || error;
  }
};

export const patchProduct = async (id, data) => {
  try {
    const res = await apiClient.patch(`/product/patch/${id}`, data);
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return error.response || error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const res = await apiClient.delete(`/product/deleteProduct/${id}`);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return error.response || error;
  }
};

export const getVariationDetails = async (product_id) => {
  try {
    const res = await apiClient.get(`/product/variation-details/${product_id}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const importTemplate = async (vendorId) => {
  try {
    const apiUrl = vendorId
      ? `/product/bulk/import-template/${vendorId}`
      : `/product/bulk/import-template`;
    const response = await apiClient.get(apiUrl, {
      responseType: "blob",
    });
    if (response.status === 200) {
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Create a temporary anchor element
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "product_import_template.xlsx");

      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      window.URL.revokeObjectURL(url);

      return { status: 1, message: "Template downloaded successfully" };
    } else {
      notifyOnFail("Failed to fetch import template");
      return { status: 0, message: "Failed to fetch template" };
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return error.response || error;
  }
};

export const bulkProductUpload = async (data, vendorId) => {
  try {
    const url = vendorId
      ? `/product/bulk/bulk-import/${vendorId}`
      : `/product/bulk/bulk-import`;
    const res = await apiClient.post(url, data);
    return res.data;
  } catch (error) {
    // notifyOnFail("Error reaching the server");
    console.log(error);
    return error.response || error;
  }
};

export const stockPriceUpdateTemplate = async () => {
  try {
    const apiUrl = `/product/bulk/stock-price-update-template`;
    const response = await apiClient.get(apiUrl, {
      responseType: "blob",
    });
    if (response.status === 200) {
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Create a temporary anchor element
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "product_stock_price_template.xlsx");

      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      window.URL.revokeObjectURL(url);

      return { status: 1, message: "Template downloaded successfully" };
    } else {
      notifyOnFail("Failed to fetch import template");
      return { status: 0, message: "Failed to fetch template" };
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return error.response || error;
  }
};

export const bulkStockPriceUpdate = async (data) => {
  try {
    const res = await apiClient.post(
      `/product/bulk/stock-price-update-template/`,
      data,
    );
    // if (res.data.status === 1) {
    //   notifyOnSuccess(res.data.message);
    // } else {
    //   notifyOnFail(res.data.message);
    // }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return error.response || error;
  }
};

// List all uploaded files
export const listAllFiles = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.vendor_id) queryParams.append("vendor_id", params.vendor_id);
    if (params.product_id) queryParams.append("product_id", params.product_id);
    if (params.variation_id)
      queryParams.append("variation_id", params.variation_id);

    const response = await apiClient.get(
      `/product/product-images/files?${queryParams.toString()}`,
    );

    return await response.data;
  } catch (error) {
    throw error;
  }
};

// Upload bulk files
export const uploadBulkFiles = async (formData) => {
  try {
    const response = await apiClient.post(
      `/product/product-images/upload-bulk`,
      formData,
    );

    return await response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a file
export const deleteFile = async (filename) => {
  try {
    const response = await apiClient.delete(
      `/product/product-images/single-delete/${filename}`,
    );

    return await response.data;
  } catch (error) {
    throw error;
  }
};

// Bulk delete files
export const bulkDeleteFiles = async (filenames) => {
  try {
    const response = await apiClient.delete(
      `/product/product-images/bulk-delete`,
      { data: { filenames } },
    );

    return await response.data;
  } catch (error) {
    throw error;
  }
};

// get all products, categories, subcategories, and inner subcategories
export const getProductCatData = async (type) => {
  try {
    const res = await apiClient.get(`/product/productcatdata/${type}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return error.response || error;
  }
};

export const updateBulkProductVisibility = async (data) => {
  try {
    const res = await apiClient.put(`/product/bulk/visibility`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return error.response || error;
  }
};

export const bulkDeleteProducts = async (data) => {
  try {
    const res = await apiClient.put(`/product/bulk/delete`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return error.response || error;
  }
};

export const shiftProducts = async (data) => {
  try {
    const res = await apiClient.put(`/product/bulk/shift`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return error.response || error;
  }
};
