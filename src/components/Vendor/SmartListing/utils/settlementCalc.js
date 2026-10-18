/** Bank settlement amount = sale − inclusive GST − TDS 0.1%. Listing = sale + GST + TDS + shipping + fee. */
export const TDS_RATE = 0.001;
export const TDS_LABEL = `${Number((TDS_RATE * 100).toFixed(2))}%`;

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
    sale > 0 && !freeShipping ? Math.max(0, Number(shippingCharges) || 0) : 0;
  const fee = sale > 0 ? Math.max(0, Number(platformFee) || 0) : 0;
  const otherPct = Number(otherChargesPct) || 0;

  const gstAmount = round2(
    sale > 0 && gstPct > 0 ? (sale * gstPct) / (100 + gstPct) : 0,
  );
  const tds = round2(sale > 0 ? sale * TDS_RATE : 0);
  const otherCharges = round2(sale > 0 ? (sale * otherPct) / 100 : 0);
  const bankSettlement = sale > 0 ? round2(sale - gstAmount - tds) : 0;
  const listingPrice =
    sale > 0 ? roundRupee(sale + ship + fee + gstAmount + tds) : 0;
  const mrpRounded = mrpN > 0 ? roundRupee(mrpN) : 0;
  const discountPct =
    mrpRounded > 0 && listingPrice > 0
      ? Math.max(0, Math.round(((mrpRounded - listingPrice) / mrpRounded) * 100))
      : 0;

  return {
    mrp: mrpRounded,
    sale,
    discountPct,
    listingPrice,
    gstAmount,
    tds,
    shipping: ship,
    platformFee: fee,
    otherCharges,
    youEarn: bankSettlement,
    bankSettlement,
  };
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function roundRupee(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) return 0;
  return Math.round(x);
}

export function suggestSku(name = "", brand = "") {
  const base = String(brand || name || "PRD")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 8)
    .toUpperCase();
  // High-entropy suffix so AI/manual regenerations stay unique across products + variations
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`
    .replace(/[^a-z0-9]/gi, "")
    .slice(-12)
    .toUpperCase();
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
