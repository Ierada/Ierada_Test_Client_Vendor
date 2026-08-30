/** Brand authorization — allowed doc types + review SLA (Ops-confirmed defaults). */
export const BRAND_AUTH_DOC_TYPES = [
  { id: "authorization_letter", label: "Brand authorization letter" },
  {
    id: "trademark_certificate",
    label: "Trademark registration certificate",
  },
  { id: "brand_invoice", label: "Brand / manufacturer invoice" },
  {
    id: "distributor_authorization",
    label: "Distributor / dealer authorization",
  },
  { id: "other", label: "Other brand proof" },
];

/** Target Admin review SLA in business days (Mon–Fri). */
export const BRAND_AUTH_SLA_BUSINESS_DAYS = 2;

export function labelForDocType(id) {
  const hit = BRAND_AUTH_DOC_TYPES.find((d) => d.id === id);
  return hit?.label || id || "authorization_letter";
}

export function businessDaysBetween(fromDate, toDate = new Date()) {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  let days = 0;
  const cur = new Date(start);
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) days += 1;
  }
  return days;
}

export function isSlaBreached(
  createdAt,
  slaDays = BRAND_AUTH_SLA_BUSINESS_DAYS,
) {
  return businessDaysBetween(createdAt) > slaDays;
}
