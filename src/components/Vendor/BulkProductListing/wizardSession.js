const PREFIX = "ierada.bulkListingWizard";
export const LISTING_KINDS = ["single", "color_size", "custom"];

export function normalizeListingKind(kind) {
  return LISTING_KINDS.includes(kind) ? kind : "single";
}

export function wizardSessionKey(mode, vendorId, kind = "single") {
  return `${PREFIX}.${mode}.${vendorId || "self"}.${normalizeListingKind(kind)}`;
}

function legacyWizardSessionKey(mode, vendorId) {
  return `${PREFIX}.${mode}.${vendorId || "self"}`;
}

function lastListingKindKey(mode, vendorId) {
  return `${PREFIX}.lastKind.${mode}.${vendorId || "self"}`;
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function emptyKindSession(kind, extra = {}) {
  const safeKind = normalizeListingKind(kind);
  return {
    step: 1,
    jobId: "",
    excelName: "",
    headers: [],
    rawRows: [],
    mapping: [],
    rows: [],
    imageSourceName: "",
    imagesBySku: {},
    imageSummary: null,
    selected: {},
    filter: "all",
    query: "",
    tab: "image",
    imageMapMethod: "sku",
    submitResult: null,
    ...extra,
    listingKind: safeKind,
    ownedKind: safeKind,
  };
}

export function kindSessionHasUploads(data) {
  if (!data || typeof data !== "object") return false;
  if (String(data.excelName || "").trim()) return true;
  if (String(data.jobId || "").trim()) return true;
  if (String(data.imageSourceName || "").trim()) return true;
  if (data.imagesBySku && Object.keys(data.imagesBySku).length) return true;
  if (Array.isArray(data.rawRows) && data.rawRows.length) return true;
  return false;
}

export function inferListingKindFromExcelName(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("custom") && n.includes("variation")) return "custom";
  if (n.includes("color_size") || n.includes("color-size") || (n.includes("colour") && n.includes("size"))) {
    return "color_size";
  }
  if (n.includes("single") && n.includes("product")) return "single";
  return null;
}

function sessionIdentity(data) {
  return {
    jobId: String(data?.jobId || "").trim(),
    excelName: String(data?.excelName || "").trim().toLowerCase(),
  };
}

function sessionsShareUploads(a, b) {
  const left = sessionIdentity(a);
  const right = sessionIdentity(b);
  if (left.jobId && left.jobId === right.jobId) return true;
  if (left.excelName && left.excelName === right.excelName) return true;
  return false;
}

function ownedKindOf(data, fallback) {
  return normalizeListingKind(data?.ownedKind || data?.listingKind || fallback);
}

function dropKindKey(mode, vendorId, kind) {
  try {
    localStorage.removeItem(wizardSessionKey(mode, vendorId, kind));
  } catch {
    /* ignore */
  }
}

function rawKindSession(mode, vendorId, kind) {
  return readJson(wizardSessionKey(mode, vendorId, kind));
}

export function dropClonedKindSessions(mode, vendorId, source, exceptKind) {
  const dropped = [];
  if (!source || !kindSessionHasUploads(source)) return dropped;
  const keep = exceptKind ? normalizeListingKind(exceptKind) : null;
  LISTING_KINDS.forEach((kind) => {
    if (keep && kind === keep) return;
    const other = rawKindSession(mode, vendorId, kind);
    if (!other || !kindSessionHasUploads(other)) return;
    if (!sessionsShareUploads(source, other)) return;
    dropKindKey(mode, vendorId, kind);
    dropped.push(kind);
  });
  return dropped;
}

function sessionBelongsToKind(data, kind) {
  const safeKind = normalizeListingKind(kind);
  if (!data || typeof data !== "object") return false;
  const owned = ownedKindOf(data, safeKind);
  if (owned !== safeKind) return false;
  const inferred = inferListingKindFromExcelName(data.excelName);
  if (inferred && inferred !== safeKind) return false;
  return true;
}

export function loadLastListingKind(mode, vendorId) {
  const saved = readJson(lastListingKindKey(mode, vendorId));
  if (saved?.kind) return normalizeListingKind(saved.kind);
  const legacy = readJson(legacyWizardSessionKey(mode, vendorId));
  if (legacy?.listingKind) return normalizeListingKind(legacy.listingKind);
  return "single";
}

export function saveLastListingKind(mode, vendorId, kind) {
  try {
    localStorage.setItem(
      lastListingKindKey(mode, vendorId),
      JSON.stringify({ kind: normalizeListingKind(kind) }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function loadWizardSession(mode, vendorId, kind = "single") {
  const safeKind = normalizeListingKind(kind);
  let typed = rawKindSession(mode, vendorId, safeKind);
  if (typed && !sessionBelongsToKind(typed, safeKind)) {
    dropKindKey(mode, vendorId, safeKind);
    typed = null;
  }
  if (typed && kindSessionHasUploads(typed)) {
    const inferred = inferListingKindFromExcelName(typed.excelName);
    LISTING_KINDS.forEach((other) => {
      if (!typed || other === safeKind) return;
      const otherData = rawKindSession(mode, vendorId, other);
      if (!otherData || !kindSessionHasUploads(otherData) || !sessionsShareUploads(typed, otherData)) return;
      if (inferred === safeKind) {
        dropKindKey(mode, vendorId, other);
        return;
      }
      dropKindKey(mode, vendorId, safeKind);
      typed = null;
    });
  }
  if (typed) return typed;
  const legacy = readJson(legacyWizardSessionKey(mode, vendorId));
  if (!legacy) return null;
  const legacyKind = ownedKindOf(legacy, "single");
  if (legacyKind !== safeKind) return null;
  if (!sessionBelongsToKind({ ...legacy, ownedKind: legacyKind }, safeKind)) return null;
  try {
    localStorage.setItem(wizardSessionKey(mode, vendorId, safeKind), JSON.stringify({ ...legacy, listingKind: safeKind, ownedKind: safeKind }));
  } catch {
    /* ignore migrate write */
  }
  return { ...legacy, listingKind: safeKind, ownedKind: safeKind };
}

export function saveWizardSession(mode, vendorId, kind, data) {
  const safeKind = normalizeListingKind(kind);
  const payload = {
    ...(data || {}),
    listingKind: safeKind,
    ownedKind: safeKind,
  };
  try {
    localStorage.setItem(wizardSessionKey(mode, vendorId, safeKind), JSON.stringify(payload));
    saveLastListingKind(mode, vendorId, safeKind);
  } catch {
    /* quota / private mode */
  }
}

export function clearWizardSession(mode, vendorId, kind) {
  try {
    if (kind) {
      localStorage.removeItem(wizardSessionKey(mode, vendorId, kind));
      return;
    }
    LISTING_KINDS.forEach((item) => {
      localStorage.removeItem(wizardSessionKey(mode, vendorId, item));
    });
    localStorage.removeItem(legacyWizardSessionKey(mode, vendorId));
  } catch {
    /* ignore */
  }
}

const MAPPING_TEMPLATE_KEY = "ierada.bulkListingMappingTemplate";

export function loadMappingTemplate() {
  try {
    const raw = localStorage.getItem(MAPPING_TEMPLATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveMappingTemplate(payload) {
  try {
    localStorage.setItem(MAPPING_TEMPLATE_KEY, JSON.stringify(payload || {}));
    return true;
  } catch {
    return false;
  }
}

export function clampWizardStep(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return fallback;
  return n;
}

export function readWizardStepFromLocation(search = typeof window !== "undefined" ? window.location.search : "") {
  try {
    return clampWizardStep(new URLSearchParams(search).get("step"), 1);
  } catch {
    return 1;
  }
}

export function stripPreviewUrls(imagesBySku) {
  const out = {};
  Object.entries(imagesBySku || {}).forEach(([sku, list]) => {
    out[sku] = (list || []).map((img) => {
      const { previewUrl, ...rest } = img || {};
      return rest;
    });
  });
  return out;
}
