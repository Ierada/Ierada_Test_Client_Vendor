const STORAGE_KEY = "ierada_bulk_smart_session";

/** Soft cap for one Smart Bulk session (localStorage queue). */
export const BULK_SESSION_MAX = 1000;

export const BULK_LISTING_TYPES = [
  { id: "single", label: "Single", hint: "One price, one SKU" },
  { id: "combo", label: "Combo", hint: "Needs existing products first" },
  { id: "color_size", label: "Color × Size", hint: "Variation matrix" },
  { id: "custom", label: "Custom variation", hint: "Up to 4 attributes" },
];

export function buildTypeQueue(counts = {}) {
  const queue = [];
  for (const { id } of BULK_LISTING_TYPES) {
    const n = Math.max(0, Math.floor(Number(counts[id]) || 0));
    for (let i = 0; i < n; i++) {
      queue.push(id);
      if (queue.length >= BULK_SESSION_MAX) return queue;
    }
  }
  return queue;
}

/**
 * @param {{ total?: number, vendorId?: string|number|null, typeCounts?: Record<string,number>, mode?: 'flexible'|'planned' }} opts
 * flexible = each slot can be any type (user picks every time)
 * planned = queue built from type counts (mixed in one session)
 */
export function createBulkSession({
  total = 5,
  vendorId = null,
  typeCounts = null,
  mode = "flexible",
} = {}) {
  let queue = [];
  if (mode === "planned" && typeCounts) {
    queue = buildTypeQueue(typeCounts);
  }
  if (!queue.length) {
    const n = Math.max(1, Math.min(BULK_SESSION_MAX, Number(total) || 1));
    queue = Array.from({ length: n }, () => "any");
  }

  const session = {
    id: `bulk_${Date.now()}`,
    mode: mode === "planned" ? "planned" : "flexible",
    total: queue.length,
    completed: 0,
    skipped: 0,
    vendorId: vendorId ? String(vendorId) : null,
    startedAt: Date.now(),
    queue,
    history: [],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function getBulkSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.total || !Array.isArray(parsed.queue)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Planned listing type for the current (next) slot, or null if flexible/any. */
export function getPlannedType(session) {
  if (!session?.queue?.length) return null;
  const idx = session.completed || 0;
  const t = session.queue[idx];
  if (!t || t === "any") return null;
  return t;
}

export function typeLabel(typeId) {
  return BULK_LISTING_TYPES.find((t) => t.id === typeId)?.label || typeId || "Any";
}

/**
 * Advance after save or skip.
 * @param {{ listingType?: string, productId?: string|number|null, status?: 'saved'|'skipped' }} meta
 */
export function advanceBulkSession(meta = {}) {
  const session = getBulkSession();
  if (!session) return null;
  const status = meta.status || "saved";
  const entry = {
    index: session.completed,
    planned: session.queue[session.completed] || "any",
    listingType: meta.listingType || session.queue[session.completed] || "any",
    productId: meta.productId || null,
    status,
    at: Date.now(),
  };
  const next = {
    ...session,
    completed: (session.completed || 0) + 1,
    skipped: (session.skipped || 0) + (status === "skipped" ? 1 : 0),
    history: [...(session.history || []), entry].slice(-BULK_SESSION_MAX),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearBulkSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function bulkSessionProgress(session) {
  if (!session) return null;
  const done = (session.completed || 0) >= session.total;
  const current = Math.min((session.completed || 0) + 1, session.total);
  const plannedType = getPlannedType(session);
  const byType = {};
  for (const t of session.queue || []) {
    const key = t === "any" ? "any" : t;
    byType[key] = (byType[key] || 0) + 1;
  }
  const remainingByType = {};
  for (let i = session.completed || 0; i < (session.queue || []).length; i++) {
    const t = session.queue[i] === "any" ? "any" : session.queue[i];
    remainingByType[t] = (remainingByType[t] || 0) + 1;
  }
  return {
    current,
    total: session.total,
    done,
    plannedType,
    plannedLabel: plannedType ? typeLabel(plannedType) : "Any type",
    mode: session.mode || "flexible",
    skipped: session.skipped || 0,
    saved: Math.max(0, (session.completed || 0) - (session.skipped || 0)),
    byType,
    remainingByType,
  };
}

export function summarizeTypeCounts(counts) {
  return BULK_LISTING_TYPES.map(({ id, label }) => ({
    id,
    label,
    count: Math.max(0, Math.floor(Number(counts[id]) || 0)),
  })).filter((x) => x.count > 0);
}
