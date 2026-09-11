/** Shared settlement / You Earn calc — rates come from Admin Settings > Commerce. */
export const TDS_RATE = 0.02;

/** Same rule as server helpers.applyPlatformFeeRules: % of price, then min(%, max). */
export function applyPlatformFeeRules(productPrice, platformFeePercent, maxCharge) {
  const base = Number(productPrice) || 0;
  const percent = Number(platformFeePercent) || 0;
  const max = Number(maxCharge) || 0;
  const raw = (base * percent) / 100;
  const capped = max > 0 ? Math.min(raw, max) : raw;
  const amount = Math.round((Number(capped) || 0) * 100) / 100;
  return {
    amount,
    percent,
    max,
    raw: Math.round((Number(raw) || 0) * 100) / 100,
    isCapped: max > 0 && raw > max,
  };
}

export function omitLiveCommerceRates(payload) {
  if (!payload || typeof payload !== "object") return payload || {};
  const {
    platform_fee_pct: _pct,
    platform_fee_max: _max,
    platformFee: _fee,
    default_return_window_days: _days,
    ...rest
  } = payload;
  return rest;
}

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
  // Hide shipping in summary until selling price is entered.
  const ship =
    sale > 0 && !freeShipping ? Number(shippingCharges) || 0 : 0;
  const fee = sale > 0 ? Number(platformFee) || 0 : 0;
  const otherPct = Number(otherChargesPct) || 0;

  const gstAmount =
    gstPct > 0 ? (sale * gstPct) / (100 + gstPct) : 0;
  const tds = sale * TDS_RATE;
  const otherCharges = (sale * otherPct) / 100;
  const youEarn = Math.max(0, sale - tds - fee - ship - otherCharges);
  // Listing price = sale + shipping + platform fee — stay 0 until selling price is set.
  const listingPrice = sale > 0 ? round2(sale + ship + fee) : 0;
  const discountPct =
    mrpN > 0 && listingPrice > 0
      ? Math.max(0, Math.round(((mrpN - listingPrice) / mrpN) * 100))
      : 0;

  return {
    mrp: mrpN,
    sale,
    discountPct,
    listingPrice,
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
