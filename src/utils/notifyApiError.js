import { getApiErrorMessage } from "./apiError";
import { notifyOnFail } from "./notification/toast";

export function notifyApiError(error, fallback = "Something went wrong. Please try again.") {
  notifyOnFail(getApiErrorMessage(error, fallback));
}

export function notifyApiResponseFail(response, fallback = "Request failed. Please try again.") {
  notifyOnFail(response?.message || fallback);
}
