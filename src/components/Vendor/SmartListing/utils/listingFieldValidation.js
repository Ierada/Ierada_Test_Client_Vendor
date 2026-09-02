/** Shared numeric + pricing rules for Smart Listing and bulk grid. */

function toNum(val) {
  if (val === "" || val === null || val === undefined) return NaN;
  const n = Number(String(val).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : NaN;
}

/** Price fields must be > 0 unless optional empty. */
export function validatePositivePrice(val, label, { required = true } = {}) {
  if (val === "" || val === null || val === undefined) {
    return required ? `${label} is required` : null;
  }
  const n = toNum(val);
  if (!Number.isFinite(n)) return `${label} must be a valid number`;
  if (n <= 0) return `${label} cannot be 0`;
  return null;
}

/** Stock / qty must be integer >= 1. */
export function validateStockQty(val, label = "Stock") {
  if (val === "" || val === null || val === undefined) {
    return `${label} is required`;
  }
  const n = toNum(val);
  if (!Number.isFinite(n)) return `${label} must be a valid number`;
  if (!Number.isInteger(n)) return `${label} must be a whole number`;
  if (n <= 0) return `${label} must be at least 1`;
  return null;
}

/** Optional non-negative number (GST %, shipping, platform fee). */
export function validateNonNegativeOptional(val, label) {
  if (val === "" || val === null || val === undefined) return null;
  const n = toNum(val);
  if (!Number.isFinite(n)) return `${label} must be a valid number`;
  if (n < 0) return `${label} cannot be negative`;
  return null;
}

export function validateMrpAndSelling(mrpVal, sellVal) {
  const errors = {};
  const mrpErr = validatePositivePrice(mrpVal, "MRP");
  const sellErr = validatePositivePrice(sellVal, "Selling price");
  if (mrpErr) errors.original_price = mrpErr;
  if (sellErr) errors.discounted_price = sellErr;
  if (!mrpErr && !sellErr) {
    const mrp = toNum(mrpVal);
    const sell = toNum(sellVal);
    if (sell >= mrp) {
      errors.discounted_price = "Selling price cannot be greater than MRP";
      errors.original_price = "MRP cannot be less than selling price";
    }
  }
  return errors;
}

/** Category-step fields only (MRP / selling / GST) — stock lives on Review. */
export function validateCategoryStepPricing(state) {
  const errors = {
    ...validateMrpAndSelling(state.original_price, state.discounted_price),
  };
  const gstErr = validateNonNegativeOptional(state.gst, "GST %");
  if (gstErr) errors.gst = gstErr;
  return errors;
}

export function validateSingleListingPricing(state) {
  const errors = {
    ...validateMrpAndSelling(state.original_price, state.discounted_price),
  };
  const stockErr = validateStockQty(state.stock, "Stock");
  if (stockErr) errors.stock = stockErr;

  const gstErr = validateNonNegativeOptional(state.gst, "GST %");
  if (gstErr) errors.gst = gstErr;

  const shipErr = validateNonNegativeOptional(state.shipping_charges, "Shipping charges");
  if (shipErr) errors.shipping_charges = shipErr;

  const feeErr = validateNonNegativeOptional(state.platformFee, "Platform fee");
  if (feeErr) errors.platformFee = feeErr;

  const lowErr = validateNonNegativeOptional(state.low_stock_threshold, "Low stock alert");
  if (lowErr) errors.low_stock_threshold = lowErr;
  else if (state.low_stock_threshold !== "" && state.low_stock_threshold != null) {
    const low = toNum(state.low_stock_threshold);
    const stk = toNum(state.stock);
    if (Number.isFinite(low) && Number.isFinite(stk) && low > stk) {
      errors.low_stock_threshold = "Low stock alert cannot exceed current stock";
    }
  }

  const minQtyErr = validateMinOrderQty(state.min_order_qty);
  if (minQtyErr) errors.min_order_qty = minQtyErr;

  return errors;
}

/** Min order qty — if set, must be whole number >= 1. */
export function validateMinOrderQty(val) {
  if (val === "" || val === null || val === undefined) return null;
  const n = toNum(val);
  if (!Number.isFinite(n)) return "Minimum order quantity must be a valid number";
  if (!Number.isInteger(n)) return "Minimum order quantity must be a whole number";
  if (n <= 0) return "Minimum order quantity must be at least 1";
  return null;
}

export function validateVariationRow(row, prefix = "") {
  const errors = {};
  const p = prefix ? `${prefix}: ` : "";
  const mrpSell = validateMrpAndSelling(row.original_price, row.discounted_price);
  Object.entries(mrpSell).forEach(([k, v]) => {
    errors[k] = p + v;
  });
  const stockErr = validateStockQty(row.stock, "Stock");
  if (stockErr) errors.stock = p + stockErr;
  return errors;
}

export function validateComboItems(comboItems = []) {
  const errors = {};
  if (!comboItems.length) {
    errors.combo = "Add at least one product to the combo";
    return errors;
  }
  comboItems.forEach((it, i) => {
    const qty = toNum(it.quantity ?? it.qty ?? 1);
    if (!Number.isFinite(qty) || qty <= 0) {
      errors[`combo_qty_${i}`] = `Combo item ${i + 1}: quantity must be at least 1`;
    }
  });
  return errors;
}

export function validateSmartListingState(state) {
  const errors = {};
  if (!String(state.name || "").trim()) errors.name = "Product name is required";
  if (!String(state.hsn_code || "").trim()) errors.hsn_code = "HSN code is required";

  if (state.listingType === "single" || !state.listingType) {
    Object.assign(errors, validateSingleListingPricing(state));
  }

  if (state.listingType === "combo") {
    Object.assign(errors, validateSingleListingPricing(state));
    Object.assign(errors, validateComboItems(state.comboItems));
  }

  if (state.listingType === "color_size") {
    const groups = state.colorGroups || [];
    let anyRow = false;
    groups.forEach((g, gi) => {
      (g.sizes || []).forEach((s, si) => {
        if (!s.size_id) return;
        anyRow = true;
        const rowErr = validateVariationRow(s, `Color ${gi + 1} / size ${si + 1}`);
        Object.assign(errors, rowErr);
      });
    });
    if (!anyRow) errors.matrix = "Add at least one size row with price and stock";
  }

  if (state.listingType === "custom") {
    const rows = (state.customRows || []).filter((r) => r.enabled);
    if (!rows.length) errors.matrix = "Enable at least one variation row";
    rows.forEach((r, i) => {
      Object.assign(errors, validateVariationRow(r, `Variation ${i + 1}`));
    });
  }

  return errors;
}

/** First human-readable error for banners/toasts. */
export function firstValidationError(errors) {
  const vals = Object.values(errors || {}).filter(Boolean);
  return vals[0] || null;
}

/** Both price-rule lines for toast (MRP vs selling). */
export function formatPriceValidationToast(errors = {}) {
  const parts = [];
  if (errors.original_price) parts.push(errors.original_price);
  if (errors.discounted_price && errors.discounted_price !== errors.original_price) {
    parts.push(errors.discounted_price);
  }
  return parts.join("\n");
}

/** Show numeric errors as soon as the field has a value (0, equal MRP, etc.). */
export function liveFieldError(err, value) {
  if (value === "" || value == null) return null;
  return err || null;
}

/** First MRP / selling / stock error on Color×Size or custom rows. */
export function firstVariationMatrixError(state) {
  if (state.listingType === "color_size") {
    const groups = state.colorGroups || [];
    for (let gi = 0; gi < groups.length; gi++) {
      const sizes = groups[gi].sizes || [];
      for (let si = 0; si < sizes.length; si++) {
        const s = sizes[si];
        if (!s.size_id) continue;
        const msg = firstValidationError(
          validateVariationRow(s, `Color ${gi + 1} / size ${si + 1}`),
        );
        if (msg) return msg;
      }
    }
  }
  if (state.listingType === "custom") {
    const rows = (state.customRows || []).filter((r) => r.enabled);
    for (let i = 0; i < rows.length; i++) {
      const msg = firstValidationError(validateVariationRow(rows[i], `Variation ${i + 1}`));
      if (msg) return msg;
    }
  }
  return null;
}
