import {
  formatDate,
  formatTime,
} from "../../../../utils/date&Time/dateAndTimeFormatter";

// Shared field picks for PDF + Excel order exports.
export const getExportProductFields = (o = {}) => {
  const product = o.product || o.Product || {};
  const variation = o.Variation || product.variations || {};
  const color =
    variation?.Color?.name ||
    variation?.color?.name ||
    variation?.color ||
    product.color ||
    "";
  const size =
    variation?.Size?.name ||
    variation?.size?.name ||
    variation?.size ||
    product.size ||
    "";
  return {
    name,
    color: color || "—",
    size: size || "—",
    hsn: product.hsn_code || product.hsn || "—",
    sku:
      o.product_sku ||
      variation?.sku ||
      product.sku ||
      "—",
  };
};

export const getExportCustomerName = (o = {}) =>
  `${o.Address?.first_name || ""} ${o.Address?.last_name || ""}`.trim() || "—";

export const getExportDateTime = (o = {}) =>
  `${formatDate(o.created_at)} ${formatTime(o.created_at)}`;
