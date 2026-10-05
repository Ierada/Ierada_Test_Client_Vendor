const KEY = "ierada_smart_listing_draft_v1";
const ADD_SESSION_KEY = "ierada_smart_listing_add_session_v1";
const RESUME_ONCE_KEY = "ierada_smart_listing_resume_once_v1";

export function newStableId(vendorKey = "v") {
  return `draft_${vendorKey}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function editDraftStableId(mode, productId) {
  return `draft_${mode || "v"}_edit_${String(productId)}`;
}

export function isEditDraftStableId(stableId) {
  return /_edit_/.test(String(stableId || ""));
}

function parseDraftMap(raw) {
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return parsed;
}

function draftTime(entry) {
  const t = Date.parse(entry?.updatedAt);
  return Number.isFinite(t) ? t : 0;
}

function matchesListingMode(stableId, mode) {
  if (!mode) return true;
  return String(stableId || "").startsWith(`draft_${mode}_`);
}

export function readAddSessionId() {
  try {
    return sessionStorage.getItem(ADD_SESSION_KEY) || "";
  } catch {
    return "";
  }
}

export function writeAddSessionId(id) {
  try {
    if (id) sessionStorage.setItem(ADD_SESSION_KEY, String(id));
    else sessionStorage.removeItem(ADD_SESSION_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function markAddDraftResume(stableId) {
  writeAddSessionId(stableId);
  try {
    sessionStorage.setItem(RESUME_ONCE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function peekAddDraftResume() {
  try {
    return sessionStorage.getItem(RESUME_ONCE_KEY) === "1";
  } catch {
    return false;
  }
}

export function consumeAddDraftResume() {
  try {
    const flagged = sessionStorage.getItem(RESUME_ONCE_KEY) === "1";
    sessionStorage.removeItem(RESUME_ONCE_KEY);
    return flagged;
  } catch {
    return false;
  }
}

export function isPublishedDraftPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  const status = String(payload.listing_status || "").toLowerCase();
  const vis = String(payload.visibility || "").toLowerCase();
  return status === "published" || vis === "published";
}

export function isDraftListingPayload(payload) {
  const status = String(payload?.listing_status || "draft").toLowerCase();
  return status === "draft" || status === "";
}

export function canRestoreAddDraft(entry) {
  if (!entry?.payload || typeof entry.payload !== "object") return false;
  if (entry.kind === "edit" || isEditDraftStableId(entry.stableId)) return false;
  if (isPublishedDraftPayload(entry.payload)) return false;
  if (!isDraftListingPayload(entry.payload)) return false;
  return true;
}

export function loadLatestRestorableAddDraft(mode) {
  try {
    const all = parseDraftMap(localStorage.getItem(KEY));
    const entries = Object.values(all).filter(
      (entry) =>
        entry &&
        canRestoreAddDraft(entry) &&
        matchesListingMode(entry.stableId, mode),
    );
    if (!entries.length) return null;
    return entries.sort((a, b) => draftTime(b) - draftTime(a))[0];
  } catch {
    return null;
  }
}

export function initialListingStableId({
  mode = "v",
  editProductId,
  freshStart,
  bulkMode,
} = {}) {
  if (editProductId) return editDraftStableId(mode, editProductId);
  if (bulkMode) return newStableId(mode);

  if (peekAddDraftResume()) {
    const resumeId = readAddSessionId();
    const resumeDraft = resumeId ? loadLocalDraft(resumeId) : null;
    if (resumeId && canRestoreAddDraft(resumeDraft)) return resumeId;
    const latest = loadLatestRestorableAddDraft(mode);
    if (latest?.stableId) {
      writeAddSessionId(latest.stableId);
      return latest.stableId;
    }
    return newStableId(mode);
  }

  if (freshStart) {
    const id = newStableId(mode);
    writeAddSessionId(id);
    return id;
  }

  const sessionId = readAddSessionId();
  const sessionDraft = sessionId ? loadLocalDraft(sessionId) : null;
  if (
    sessionId &&
    matchesListingMode(sessionId, mode) &&
    canRestoreAddDraft(sessionDraft)
  ) {
    return sessionId;
  }

  const latest = loadLatestRestorableAddDraft(mode);
  if (latest?.stableId) {
    writeAddSessionId(latest.stableId);
    return latest.stableId;
  }

  const id = newStableId(mode);
  writeAddSessionId(id);
  return id;
}

export function loadLocalDraft(stableId) {
  try {
    const all = parseDraftMap(localStorage.getItem(KEY));
    if (stableId) return all[stableId] || null;
    const entries = Object.values(all).filter(
      (entry) => entry && entry.kind !== "edit" && !isEditDraftStableId(entry.stableId),
    );
    if (!entries.length) return null;
    return entries.sort((a, b) => draftTime(b) - draftTime(a))[0];
  } catch {
    return null;
  }
}

export function saveLocalDraft(stableId, data) {
  try {
    if (!stableId) return false;
    const all = parseDraftMap(localStorage.getItem(KEY));
    const kind = isEditDraftStableId(stableId) ? "edit" : data?.kind || "add";
    all[stableId] = {
      ...data,
      stableId,
      kind,
      updatedAt: new Date().toISOString(),
    };
    const ids = Object.keys(all);
    if (ids.length > 10) {
      ids
        .map((id) => ({ id, t: draftTime(all[id]) }))
        .sort((a, b) => a.t - b.t)
        .slice(0, ids.length - 10)
        .forEach(({ id }) => delete all[id]);
    }
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

export function clearLocalDraft(stableId) {
  try {
    if (!stableId) return;
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const all = parseDraftMap(raw);
    delete all[stableId];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
