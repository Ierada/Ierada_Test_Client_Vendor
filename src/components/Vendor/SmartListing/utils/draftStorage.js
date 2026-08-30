const KEY = "ierada_smart_listing_draft_v1";

export function newStableId(vendorKey = "v") {
  return `draft_${vendorKey}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function loadLocalDraft(stableId) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    if (stableId) return all[stableId] || null;
    // latest
    const entries = Object.values(all || {});
    if (!entries.length) return null;
    return entries.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    )[0];
  } catch {
    return null;
  }
}

export function saveLocalDraft(stableId, data) {
  try {
    const raw = localStorage.getItem(KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[stableId] = {
      ...data,
      stableId,
      updatedAt: new Date().toISOString(),
    };
    // Cap to 10 drafts
    const ids = Object.keys(all);
    if (ids.length > 10) {
      ids
        .map((id) => ({ id, t: all[id].updatedAt }))
        .sort((a, b) => new Date(a.t) - new Date(b.t))
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
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const all = JSON.parse(raw);
    delete all[stableId];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
