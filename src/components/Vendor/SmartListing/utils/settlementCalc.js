/** Shared settlement / You Earn calc — rates are placeholders until Ops confirms. */
export const TDS_RATE = 0.02;

export function calcSettlement({
  mrp = 0,
  sellingPrice = 0,
  gstPercent = 0,
  shippingCharges = 0,
  platformFee = 0,
  freeShipping = false,
  otherChargesPct = 0,
} = {}) {
  const sale = Number(sellingPrice) || 0;
  const mrpN = Number(mrp) || 0;
  const gstPct = Number(gstPercent) || 0;
  const ship = freeShipping ? 0 : Number(shippingCharges) || 0;
  const fee = Number(platformFee) || 0;
  const otherPct = Number(otherChargesPct) || 0;

  const gstAmount =
    gstPct > 0 ? (sale * gstPct) / (100 + gstPct) : 0;
  const tds = sale * TDS_RATE;
  const otherCharges = (sale * otherPct) / 100;
  const youEarn = Math.max(0, sale - tds - fee - ship - otherCharges);
  const discountPct =
    mrpN > 0 && sale > 0 ? Math.round(((mrpN - sale) / mrpN) * 100) : 0;

  return {
    mrp: mrpN,
    sale,
    discountPct,
    gstAmount: round2(gstAmount),
    tds: round2(tds),
    shipping: ship,
    platformFee: fee,
    otherCharges: round2(otherCharges),
    youEarn: round2(youEarn),
    bankSettlement: round2(youEarn),
  };
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function suggestSku(name = "", brand = "") {
  const base = String(brand || name || "PRD")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 8)
    .toUpperCase();
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  return `${base || "PRD"}-${suffix}`;
}

export function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
