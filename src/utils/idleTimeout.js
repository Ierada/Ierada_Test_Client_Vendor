/** Idle logout after inactivity. */

const IDLE_MS = Number(import.meta.env.VITE_IDLE_TIMEOUT_MS) || 3_600_000; // 1h
const ACTIVITY_KEY = "IERADA_VENDOR_LAST_ACTIVITY_AT";
const CHECK_INTERVAL_MS = 30_000;
const THROTTLE_MS = 1_000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "click",
  "scroll",
  "touchstart",
  "wheel",
];

export function getIdleTimeoutMs() {
  return IDLE_MS;
}

export function touchActivity() {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function getLastActivityAt() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const ts = raw ? Number(raw) : NaN;
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

export function clearActivityMarker() {
  try {
    localStorage.removeItem(ACTIVITY_KEY);
  } catch {
    // ignore
  }
}

/** Start idle watcher; returns cleanup. */
export function startIdleWatcher({ onIdle, isActive = () => true } = {}) {
  let lastTouch = 0;
  let fired = false;

  const throttledTouch = () => {
    if (!isActive()) return;
    const now = Date.now();
    if (now - lastTouch < THROTTLE_MS) return;
    lastTouch = now;
    touchActivity();
  };

  const checkIdle = () => {
    if (fired || !isActive()) return;
    const last = getLastActivityAt();
    if (last == null) {
      touchActivity();
      return;
    }
    if (Date.now() - last >= IDLE_MS) {
      fired = true;
      clearActivityMarker();
      onIdle?.({ reason: "IDLE_TIMEOUT", idleMs: IDLE_MS });
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      throttledTouch();
      checkIdle();
    }
  };

  touchActivity();

  for (const evt of ACTIVITY_EVENTS) {
    window.addEventListener(evt, throttledTouch, { passive: true });
  }
  document.addEventListener("visibilitychange", onVisibility);

  const intervalId = window.setInterval(checkIdle, CHECK_INTERVAL_MS);

  return () => {
    for (const evt of ACTIVITY_EVENTS) {
      window.removeEventListener(evt, throttledTouch);
    }
    document.removeEventListener("visibilitychange", onVisibility);
    window.clearInterval(intervalId);
  };
}
