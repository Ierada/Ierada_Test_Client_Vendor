export const PREVIEW_HANDOFF_PATH = "/__preview-handoff";
const LAST_PATH_KEY = "ierada.vendor.lastPath";
export const DEFAULT_PREVIEW_PATH = "/bulk-upload/listing";

export function shouldUsePreviewHandoff() {
  return Boolean(import.meta.env.DEV);
}

export function safeReturnPath(value, fallback = "") {
  const next = String(value || "").trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) return fallback;
  const pathOnly = next.split("?")[0];
  if (
    pathOnly === "/login" ||
    pathOnly === "/" ||
    pathOnly === PREVIEW_HANDOFF_PATH ||
    pathOnly === "/auth/handoff" ||
    pathOnly.startsWith("/auth/handoff/")
  ) {
    return fallback;
  }
  return next;
}

export function rememberReturnPath(path) {
  try {
    const safe = safeReturnPath(path, "");
    if (safe) localStorage.setItem(LAST_PATH_KEY, safe);
  } catch {
    /* private mode */
  }
}

export function rememberedReturnPath() {
  try {
    return safeReturnPath(localStorage.getItem(LAST_PATH_KEY), "");
  } catch {
    return "";
  }
}

export function resolveHandoffPath(nextQuery) {
  return (
    safeReturnPath(nextQuery, "") ||
    rememberedReturnPath() ||
    (shouldUsePreviewHandoff() ? DEFAULT_PREVIEW_PATH : "/dashboard")
  );
}

export function currentReturnPath() {
  if (typeof window === "undefined") return DEFAULT_PREVIEW_PATH;
  return safeReturnPath(`${window.location.pathname}${window.location.search || ""}`, "");
}

export function goToPreviewHandoff() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === PREVIEW_HANDOFF_PATH) return;
  const next = currentReturnPath();
  const url = next
    ? `${PREVIEW_HANDOFF_PATH}?next=${encodeURIComponent(next)}`
    : PREVIEW_HANDOFF_PATH;
  window.location.replace(url);
}
