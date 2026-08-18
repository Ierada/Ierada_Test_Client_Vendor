const orderMetaFromOrder = (order = {}) => {
  const addr = order.Address || {};
  return {
    orderNumber: order.order_number,
    awb: order.provider_shipment_id || order.tracking_id,
    customerName: `${addr.first_name || ""} ${addr.last_name || ""}`.trim(),
    customerPhone: addr.phone,
    customerAddress: [
      addr.street_address,
      addr.city,
      addr.state,
      addr.zip,
    ]
      .filter(Boolean)
      .join(", "),
    productName: order.product?.name || order.Product?.name,
    paymentType: order.payment_type,
  };
};

/**
 * Open the courier's own label PDF. There is no local/client-side
 * fallback — a label we draw ourselves is not the courier's real document
 * and can be rejected/mis-scanned at their facility. The server only
 * returns success once the courier's API has actually confirmed a label
 * url, so this should always be present here.
 */
export const saveShippingLabel = (apiData) => {
  const url = apiData?.shippingLabelUrl;
  if (!url) return null;
  window.open(url, "_blank", "noopener,noreferrer");
  return "url";
};

export { orderMetaFromOrder };
