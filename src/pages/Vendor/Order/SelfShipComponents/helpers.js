export const prepareOrderDataForLabel = (order) => {
  if (order.rawOrder) {
    const ord = order.rawOrder;
    const prod = ord.product || ord.products?.[0] || {};
    const cust = ord.customer || {};
    const addr = ord.Address || ord.shippingAddress || {};
    return {
      id: ord.orderNumber || ord.id || order.id,
      product: { name: prod.productName || prod.name || order.productName },
      customer: {
        name: `${cust.firstName || ""} ${cust.lastName || ""}`.trim() || order.customer.split(",")[0],
        address: {
          line1: addr.streetAddress || addr.street_address || "Plot 42, Sector 5",
          line2: `${addr.city || "Mumbai"} — ${addr.zip || "400001"}`,
        },
        phone: cust.phone || addr.phone || "+91 98765 43210",
      }
    };
  }
  const custParts = order.customer.split(",");
  return {
    id: order.id,
    product: { name: order.productName },
    customer: {
      name: custParts[0]?.trim() || "Customer Name",
      address: { line1: "42 Marine Drive", line2: `${custParts[1]?.trim() || "Mumbai"} — 400001` },
      phone: "+91 98765 43210"
    }
  };
};
