/** Today as DDMMYYYY (e.g. 20082026). */
export const todayDdMmYyyy = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}${mm}${yyyy}`;
};

/** Keep digits only, max 8 — DDMMYYYY. */
export const sanitizeDdMmYyyy = (raw) =>
  String(raw || "").replace(/\D/g, "").slice(0, 8);

/** Convert DDMMYYYY → YYYY-MM-DD for API. Returns null if invalid. */
export const ddMmYyyyToIso = (val) => {
  const digits = sanitizeDdMmYyyy(val);
  if (digits.length !== 8) return null;
  const dd = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const yyyy = Number(digits.slice(4, 8));
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 2000) return null;
  const iso = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getDate() !== dd || d.getMonth() + 1 !== mm || d.getFullYear() !== yyyy) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  if (d < today) return null;
  return iso;
};

/** Format 8 digits as DD/MM/YYYY while typing (visual aid). */
export const formatDdMmYyyyDisplay = (digits) => {
  const d = sanitizeDdMmYyyy(digits);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

export const validateSelfShipPayload = ({ courier_name, tracking_id, tracking_url, expected_delivery_date }) => {
  const courier = String(courier_name || "").trim();
  const awb = String(tracking_id || "").trim();
  const url = String(tracking_url || "").trim();
  const iso = ddMmYyyyToIso(expected_delivery_date);

  if (!courier || !awb || !url || !iso) {
    return {
      ok: false,
      message:
        "Courier name, AWB, tracking URL, and expected delivery date (DDMMYYYY) are required.",
    };
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, message: "Tracking URL must start with http:// or https://" };
    }
  } catch {
    return { ok: false, message: "Enter a valid tracking URL." };
  }

  return {
    ok: true,
    payload: {
      courier_name: courier,
      tracking_id: awb,
      tracking_url: url,
      expected_delivery_date: iso,
    },
  };
};
