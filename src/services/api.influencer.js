import apiClient from '../axios.config';
import { notifyOnSuccess, notifyOnFail } from '../utils/notification/toast';
import { useAppContext } from '../context/AppContext';
import { getApiErrorMessage } from "../utils/apiError";

export const getAllInfluencerByDesignerId = async id => {
  try {
    const res = await apiClient.get(`/influencermanagement/designer/${id}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail('Error reaching the server');
    console.log(error);
  }
};

export const makeInfluencerRequest = async (
  designer_id,
  influencer_id,
  sender
) => {
  try {
    const res = await apiClient.post('/influencermanagement/influencer-request', {
      designer_id,
      influencer_id,
      sender,
      job: 'requested',
    });
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail('Error reaching the server');
    console.log(error);
  }
};

export const responseToInfluencerRequest = async (
  designer_id,
  influencer_id,
  job
) => {
  try {
    const res = await apiClient.post('/influencermanagement/influencer-request-response', {
      designer_id,
      influencer_id,
      job,
    });
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail('Error reaching the server');
    console.log(error);
  }
};


export const getAllInfluencers = async () => {
  try {
    const res = await apiClient.get('/influencer/getInfluencerUsers');
    // if (res.data.status === 1) {
    //   notifyOnSuccess(res.data.message);
    // } else {
    //   notifyOnFail(res.data.message);
    // }
    return res.data;
  } catch (error) {
    notifyOnFail('Error reaching the server');
    console.log(error);
  }
};

export const updateInfluencer = async (id, influencerData) => {
  try {
    const res = await apiClient.put(`/influencer/editInfluencerUser/${id}`, influencerData);
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

export const addInfluencer = async (influencerData) => {
  try {
    const res = await apiClient.post('/influencer/addInfluencerUser', influencerData);
    console.log(res, 'res from api');
    
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

export const deleteInfluencer = async (id) => {
  try {
    const res = await apiClient.delete(`/influencer/deleteInfluencerUser/${id}`);
    console.log(res);
    
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