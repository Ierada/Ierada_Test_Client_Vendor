import apiClient from '../axios.config';
import { notifyOnSuccess, notifyOnFail } from '../utils/notification/toast';

export const getNotifications = async (user_id, limit = 10, offset = 0) => {
  try {
    const response = await apiClient.get(
      `/notification/get/${user_id}?limit=${limit}&offset=${offset}`
    );
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail('Error reaching the server');
    console.error(error);
  }
};

export const getNotificationPreview = async user_id => {
  try {
    const response = await apiClient.get(
      `/notification/get-preview/${user_id}`
    );
    if (response.data.status === 1) {
      // notifyOnSuccess(response.data.message);
      return response.data;
    }
    // else {
    //   notifyOnFail(response.data.message);
  } catch (error) {
    notifyOnFail('Error reaching the server');
    console.error(error);
  }
};

export const markNotificationAsRead = async id => {
  try {
    const response = await apiClient.put(`/notification/read/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    }
    // else {
    //   notifyOnFail(response.data.message);
    // }
  } catch (error) {
    notifyOnFail('Error reaching the server');
    console.error(error);
  }
};

export const deleteNotification = async id => {
  try {
    const response = await apiClient.delete(`/notification/delete/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response;
    }
    // else {
    //   notifyOnFail(response.data.message);
    // }
  } catch (error) {
    notifyOnFail('Error reaching the server');
    console.error(error);
  }
};
