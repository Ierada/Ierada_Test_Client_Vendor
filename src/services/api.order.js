import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";

export const getOrdersByVendorId = async (id) => {
  try {
    const res = await apiClient.get(`/order/getOrdersByVendorId/${id}`);
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

export const getOrdersByUserId = async (id) => {
  try {
    const res = await apiClient.get(`/order/user-orders/${id}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    // return error.response || error;
  }
};

export const initiatePayment = async (orderData) => {
  try {
    const res = await apiClient.post("/order/initiatePayment", orderData);
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
    notifyOnSuccess(res.data.message);
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    // return error.response || error;
  }
};

export const verifyPayment = async (orderData) => {
  try {
    const res = await apiClient.post("/order/verifyPayment", orderData);
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
    notifyOnSuccess(res.data.message);
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    // return error.response || error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const res = await apiClient.post("/order/createOrder", orderData);
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
    notifyOnSuccess(res.data.message);
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    // return error.response || error;
  }
};

export const getOrderByOrderId = async (id) => {
  try {
    const res = await apiClient.get(`/order/order-id/${id}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    }
    // else {
    // notifyOnFail(res.data.message);
    // }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const getOrderByOrderNumber = async (order_number) => {
  try {
    const res = await apiClient.get(`/order/order-number/${order_number}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    }
    // else {
    // notifyOnFail(res.data.message);
    // }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const getAllOrder = async (params = {}) => {
  try {
    const res = await apiClient.get(`/order/getAllOrders`, { params }); // Pass dynamic params
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      // Handle failure response from the server
      notifyOnFail(res.data.message || "Something went wrong");
      return [];
    }
  } catch (error) {
    // Handle server or network errors
    notifyOnFail(error.response?.data?.message || "Error reaching the server");
    console.error("Error fetching orders:", error); // Log for debugging
    return null; // Return null for error cases
  }
};

export const updateOrderStatus = async (order_id, data) => {
  try {
    const res = await apiClient.put(`/order/status/${order_id}`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    // return error.response || error;
  }
};

export const createReturnOrReplacement = async (
  order_id,
  role,
  returnDetails = null,
  returnAction = null,
) => {
  try {
    const requestBody = {};
    if (returnDetails) {
      requestBody.returnDetails = returnDetails;
    }
    if (returnAction) {
      requestBody.returnAction = returnAction;
    }

    const queryParams = [];
    if (returnDetails.replacement)
      queryParams.push(`replacement=${returnDetails.replacement}`);
    if (returnDetails.variation_id)
      queryParams.push(`variation_id=${returnDetails.variation_id}`);

    const queryString = queryParams.length ? `?${queryParams.join("&")}` : "";

    const res = await apiClient.post(
      `/shipping/returnOrReplace/${role}/${order_id}${queryString}`,
      requestBody,
    );
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    // return error.response || error;
  }
};

export const cancelOrder = async (order_id, role, returnDetails = null) => {
  try {
    const requestBody = {};
    if (returnDetails) {
      requestBody.returnDetails = returnDetails;
    }

    const res = await apiClient.post(
      `/order/cancel/${order_id}/${role}`,
      requestBody,
    );
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    // return error.response || error;
  }
};

export const getAllShipments = async () => {
  try {
    const res = await apiClient.get("/order/shipment/get");
    if (res.data.status === 1) {
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the Server");
    console.log(error);
    return null;
  }
};

export const createSelfShip = async (orderId, payload) => {
  try {
    const res = await apiClient.post(`/order/self-ship/${orderId}`, payload);
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to create self-ship";
    console.error("api.order createSelfShip error:", error);
    notifyOnFail(message);
    return { status: 0, message };
  }
};

export const bulkSelfShip = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiClient.post("/order/bulk-self-ship", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "Bulk upload failed";
    console.error("api.order bulkSelfShip error:", error);
    notifyOnFail(message);
    return { status: 0, message };
  }
};

export const downloadSelfShipTemplate = async () => {
  try {
    const res = await apiClient.get("/order/self-ship-template", {
      responseType: "blob",
    });

    // Create a temporary anchor to trigger the download
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = "self_ship_template.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to download template";
    console.error("api.order downloadSelfShipTemplate error:", error);
    notifyOnFail(message);
    throw error;
  }
};

export const getSelfShipOrders = async (vendorId) => {
  try {
    const res = await apiClient.get(`/order/self-ship-orders/${vendorId}`);
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch self-ship orders";
    console.error("api.order getSelfShipOrders error:", error);
    notifyOnFail(message);
    return { status: 0, message, data: { orders: [] } };
  }
};

export const downloadShippingLabel = async (orderId) => {
  try {
    const res = await apiClient.get(`/shipping/label/${orderId}`);

    if (res.data.status === 1 && res.data.data) {
      console.log("Label data received:", res.data.data);
      notifyOnSuccess("Shipping label data fetched successfully");
      return { status: 1, data: res.data.data };
    }

    notifyOnFail("Failed to get label data");
    return { status: 0, message: "No label data available" };
  } catch (error) {
    let message =
      error.response?.data?.message ||
      error.message ||
      "Failed to download shipping label";

    // Provide more user-friendly error message for service unavailability
    if (
      message.includes("temporarily unavailable") ||
      message.includes("503")
    ) {
      message =
        "Innofulfill service is temporarily unavailable. Please try again in a few minutes.";
    }

    console.error("api.order downloadShippingLabel error:", error);
    notifyOnFail(message);
    return { status: 0, message };
  }
};

export const downloadManifest = async (orderIds) => {
  try {
    const res = await apiClient.post("/shipping/manifest", { orderIds });

    if (res.data.status === 1 && res.data.data) {
      console.log("Manifest data received:", res.data.data);
      notifyOnSuccess("Manifest data fetched successfully");
      return { status: 1, data: res.data.data };
    }

    notifyOnFail("Failed to get manifest data");
    return { status: 0, message: "No manifest data available" };
  } catch (error) {
    let message =
      error.response?.data?.message ||
      error.message ||
      "Failed to download manifest";

    // Provide more user-friendly error message for service unavailability
    if (
      message.includes("temporarily unavailable") ||
      message.includes("503")
    ) {
      message =
        "Innofulfill service is temporarily unavailable. Please try again in a few minutes.";
    }

    console.error("api.order downloadManifest error:", error);
    notifyOnFail(message);
    return { status: 0, message };
  }
};

export const getTrackingByAwb = async (awb) => {
  try {
    const res = await apiClient.get(`/shipping/track-by-awb/${awb}`);

    if (res.data.status === 1 && res.data.data) {
      console.log("Tracking data received:", res.data.data);
      return { status: 1, data: res.data.data };
    }

    notifyOnFail("Failed to get tracking data");
    return { status: 0, message: "No tracking data available" };
  } catch (error) {
    let message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch tracking details";

    // Provide more user-friendly error message for service unavailability
    if (
      message.includes("temporarily unavailable") ||
      message.includes("503")
    ) {
      message =
        "Innofulfill service is temporarily unavailable. Please try again in a few minutes.";
    }

    console.error("api.order getTrackingByAwb error:", error);
    notifyOnFail(message);
    return { status: 0, message };
  }
};
