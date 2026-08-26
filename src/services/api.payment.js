import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getAllPayments = async () => {
    try {
        const res = await apiClient.get("/payment");
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

export const getPaymentById = async (id) => {
    try {
        const res = await apiClient.get(`/payment/${id}`);
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

export const updatePayment = async (id, data) => {
    try {
        const res = await apiClient.put(`/payment/${id}`, data);
        if (res.data.status === 1) {
            notifyOnSuccess(res.data.message);
            return res.data;
        } else {
            notifyOnFail(res.data.message);
        }
    } catch (error) {
        notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
        console.log(error);
        // return error.response || error;
    }
};

export const deletePayment = async (id) => {
    try {
        const res = await apiClient.delete(`/payment/${id}`);
        if (res.data.status === 1) {
            notifyOnSuccess(res.data.message);
            return res.data;
        } else {
            notifyOnFail(res.data.message);
        }
    } catch (error) {
        notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
        console.log(error);
        // return error.response || error;
    }
};