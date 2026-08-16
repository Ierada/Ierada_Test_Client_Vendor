/**
 * Tracks intentional / forced auth endings so catch() blocks that hardcode
 * "Error reaching the server" do not spam toasts after 401 session invalidation.
 */

let authEndedAt = 0;
let redirectInFlight = false;

export const markAuthSessionEnded = () => {
  authEndedAt = Date.now();
};

export const wasAuthSessionEndedRecently = (windowMs = 5000) =>
  authEndedAt > 0 && Date.now() - authEndedAt < windowMs;

export const isAuthRedirectInFlight = () => redirectInFlight;

export const setAuthRedirectInFlight = (value) => {
  redirectInFlight = !!value;
};

/** Session-invalidating auth codes from tokenAuthenticator (not all 401s). */
export const AUTH_SESSION_CODES = new Set([
  "NO_TOKEN",
  "TOKEN_EXPIRED",
  "TOKEN_INVALID",
  "PASSWORD_CHANGED",
  "USER_NOT_FOUND",
  "ACCESS_CHANGED",
  "DEVICE_REVOKED",
]);

export const isAuthSessionError = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data || {};
  const code = data?.code;
  if (AUTH_SESSION_CODES.has(code)) {
    return status === 401 || status === 403 || data?.status === 0;
  }
  const msg = String(data?.message || "");
  return (
    status === 401 &&
    /signed out|device was revoked|please login again/i.test(msg)
  );
};
