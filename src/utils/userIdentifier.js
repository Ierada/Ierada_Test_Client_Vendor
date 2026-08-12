import Cookies from "js-cookie";
import config from "../config/config";
import { jwtDecode } from "jwt-decode";
import { clearActivityMarker } from "./idleTimeout";

const SESSION_MAX_MS =
  Number(import.meta.env.VITE_SESSION_MAX_MS) || 64_800_000; // 18h
const COOKIE_EXPIRES_DAYS = SESSION_MAX_MS / (24 * 60 * 60 * 1000);

const capitalize = (role) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1) : "Customer";

export const getTokenKey = (role = "vendor") =>
  `${config.BRAND_NAME}${capitalize(role)}Token`;

export const getUserKey = (role = "vendor") =>
  `${config.BRAND_NAME}${capitalize(role)}User`;

export const getGuestKey = () => `${config.BRAND_NAME}guestUserId`;

export const getUserIdentifier = (role = "vendor") => {
  const tokenKey = getTokenKey(role);
  const userKey = getUserKey(role);
  const guestKey = getGuestKey();

  // Check for existing user token
  const userToken = Cookies.get(tokenKey);
  let loggedUser = null;

  if (userToken) {
    try {
      loggedUser = jwtDecode(userToken);
      localStorage.setItem(userKey, JSON.stringify(loggedUser));
    } catch (error) {
      console.error(`Error decoding ${role} token:`, error);
      Cookies.remove(tokenKey);
    }
  }

  // Fallback to stored user data
  if (!loggedUser) {
    const storedUser = localStorage.getItem(userKey);
    if (storedUser) {
      loggedUser = JSON.parse(storedUser);
    }
  }

  let userId = localStorage.getItem(guestKey);
  if (loggedUser && loggedUser.role === role) {
    userId = loggedUser.id;
  }

  if (!userId && role === "customer") {
    // Generate guest ID for customers only
    userId = "guest_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(guestKey, userId);
  }

  return userId;
};

export const getUserToken = (role = "vendor") => {
  return Cookies.get(getTokenKey(role));
};

export const getRoleFromPath = (pathname) => {
  const pathParts = pathname.split("/").filter(Boolean);
  const panel =
    pathParts[0] === "admin"
      ? "admin"
      : pathParts[0] === "vendor"
        ? "vendor"
        : "website";
  return panel === "website" ? "customer" : panel;
};

// Helper function to get role-specific key
export const getUserStorageKey = (role) => {
  return getUserKey(role);
};

export const setUserCookie = (token, user, role) => {
  const tokenKey = getTokenKey(role);
  const userKey = getUserKey(role);

  Cookies.set(tokenKey, token, {
    expires: COOKIE_EXPIRES_DAYS,
    path: "/",
    secure: true,
    sameSite: "Lax",
  });

  localStorage.setItem(userKey, JSON.stringify(user));

  if (role === "customer") {
    localStorage.removeItem(getGuestKey());
  }
};

export const clearUserSession = (role = "vendor") => {
  Cookies.remove(getTokenKey(role), { path: "/" });
  localStorage.removeItem(getUserKey(role));
  // Legacy / handoff key used by AppContext + protected routes
  localStorage.removeItem("user");
  clearActivityMarker();

  if (role === "customer") {
    localStorage.removeItem(getGuestKey());
  }
};

const PUBLIC_AUTH_PATHS = ["/login", "/forgot-password", "/auth/handoff"];

export const isPublicAuthPath = (pathname = window.location.pathname) =>
  PUBLIC_AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

/** Clears vendor session and hard-navigates to login (avoids stale React state). */
export const endVendorSessionAndRedirect = ({
  redirect = true,
  replace = true,
} = {}) => {
  clearUserSession("vendor");
  if (!redirect || isPublicAuthPath()) return;
  if (replace) {
    window.location.replace("/login");
  } else {
    window.location.href = "/login";
  }
};
