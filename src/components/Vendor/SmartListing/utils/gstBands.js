/**
 * Pick GST % from ₹1000-style bands (textile 5/12, footwear 12/18).
 * If no bands, return fallbackTax (default rate for 18%/28%* etc.).
 */
export function gstFromBands(bands, price, fallbackTax) {
  const fallback =
    fallbackTax === "" || fallbackTax == null ? null : Number(fallbackTax);
  if (!Array.isArray(bands) || !bands.length) {
    return Number.isFinite(fallback) ? fallback : null;
  }
  const p = Number(price);
  const sale = Number.isFinite(p) ? p : 0;
  for (const b of bands) {
    const min = Number(b.min_price) || 0;
    const max = b.max_price == null || b.max_price === "" ? null : Number(b.max_price);
    if (sale + 1e-9 >= min && (max == null || sale <= max + 1e-9)) {
      const g = Number(b.gst_percent);
      return Number.isFinite(g) ? g : fallback;
    }
  }
  return Number.isFinite(fallback) ? fallback : null;
}
