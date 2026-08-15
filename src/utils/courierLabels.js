/** Factory key → what ops see. Innofulfill books Shri Maruti. */
export const COURIER_LABELS = {
  innofulfill: "Shri Maruti",
  shadowfax: "Shadowfax",
  shiprocket: "Shiprocket",
  self_ship: "Self Ship",
};

export function courierLabel(key) {
  if (!key) return "—";
  const k = String(key).toLowerCase().trim();
  return COURIER_LABELS[k] || key;
}
