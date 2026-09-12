import { getApiErrorMessage, isCanceledRequest } from "./apiError";
import { notifyOnFail } from "./notification/toast";

export function notifyApiError(error, fallback = "Something went wrong. Please try again.") {
  if (isCanceledRequest(error)) return;
  const message = getApiErrorMessage(error, fallback);
  if (message) notifyOnFail(message);
}

export function notifyApiResponseFail(response, fallback = "Request failed. Please try again.") {
  notifyOnFail(response?.message || fallback);
}
