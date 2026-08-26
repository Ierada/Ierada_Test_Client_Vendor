import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

// Get all bills for the vendor
export const getAllBillsByVendor = async (vendorId) => {
  try {
    const res = await apiClient.get(`/invoice/getAllByVendor/${vendorId}`);

    if (res.data.status === 1) {
      return res.data.data;
    } else {
      notifyOnFail(res.data.message);
      return [];
    }
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

// Get specific bill by ID
export const getBillById = async (id) => {
  try {
    const res = await apiClient.get(`/invoice/getById/${id}`);

    if (res.data.status === 1) {
      return res.data.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    handleApiError(error);
    return null;
  }
};


// Submit new bill
// Submit new bill (CORRECTED)
export const submitBill = async (vendorId, billData) => {
  try {

    // Remove manual Content-Type header
    const res = await apiClient.post(`/invoice/submit/${vendorId}`, billData);

    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

// Update existing bill
export const updateBill = async (id, billData) => {
  try {
    const formData = new FormData();

    // Append all bill data to FormData
    Object.keys(billData).forEach((key) => {
      if (key === "bill_document" && billData[key]) {
        formData.append("bill_document", billData[key]);
      } else {
        formData.append(key, billData[key]);
      }
    });

    const res = await apiClient.put(`/invoice/update/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

export const getAllBills = async () => {
  try {
    const response = await apiClient.get("/invoice/getAll");

    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching address"));
    console.error(error);
  }
};

export const updateInvoiceStatus = async (id, newStatus) => {
  try {
    const response = await apiClient.put(`/invoice/status/${id}`, {
      invoice_status: newStatus,
    });

    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error fetching address"));
    console.error(error);
  }
};

export const deleteBill = async (id) => {
  try {
    const response = await apiClient.delete(`/invoice/delete/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data.message;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the Banner"));
    console.error(error);
  }
};

// Helper function to handle API errors
const handleApiError = (error) => {
  const errorMessage = error.response?.data?.message || "Something went wrong";
  notifyOnFail(errorMessage);
  console.error("API Error:", error);
};

export default {
  getAllBills,
  getBillById,
  submitBill,
  updateBill,
};
