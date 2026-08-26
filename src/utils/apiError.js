// Maps an axios error to short, realistic copy for a toast. Prefers the
// backend's own message when it's safe to show, otherwise falls back to a
// plain sentence — never the raw "Network Error" / stack / SQL text.
const isUnsafeMessage = (msg) =>
  !msg || /sequelize|sql|stack trace|ECONNREFUSED|ENOTFOUND|ENOENT/i.test(msg);

export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again.",
) => {
  const status = error?.response?.status;
  const rawServerMsg =
    error?.response?.data?.message || error?.response?.data?.error;
  const serverMsg = !isUnsafeMessage(rawServerMsg) ? rawServerMsg : null;

  if (status === 401 || status === 403) {
    return serverMsg || "You don't have permission to do this, or your session has expired.";
  }
  if (status === 429) {
    return "Too many requests — please wait a moment and try again.";
  }
  if (status === 400 || status === 422) {
    return serverMsg || "Please check the details and try again.";
  }
  if (status >= 500) {
    return serverMsg || "Something went wrong on our end. Please try again in a moment.";
  }
  if (serverMsg) return serverMsg;

  // No response at all — network drop / timeout. Never surface the raw axios
  // message ("Network Error", "ECONNABORTED", etc.) to the user.
  if (!error?.response) {
    if (error?.code === "ECONNABORTED" || /timeout/i.test(String(error?.message))) {
      return "Request timed out. Please check your connection and try again.";
    }
    return "Unable to reach the server. Please check your internet connection and try again.";
  }

  return fallback;
};
