import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getCollectionData = async (type, slug, queryParams) => {
  try {
    const res = await apiClient.get(
      `/collection/getCollectionData/${type}/${slug}`,
      {
        params: queryParams,
      }
    );

    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};

export const getCollectionBanner = async () => {
  try {
    const res = await apiClient.get(`/collection/getCollectionBanner`);
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};
