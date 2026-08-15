import jsPDF from "jspdf";

const pick = (obj, ...keys) => {
  for (const key of keys) {
    const val = obj?.[key];
    if (val !== undefined && val !== null && val !== "") return val;
  }
  return null;
};

const normalizeLabelRecord = (labelData) => {
  if (!labelData) return {};
  if (Array.isArray(labelData)) return labelData[0] || {};
  if (Array.isArray(labelData?.data)) return labelData.data[0] || {};
  return labelData.data || labelData;
};

/**
 * Build a printable shipping-label PDF from Innofulfill label-invoice API data.
 */
export const downloadLabelPdf = (labelPayload, orderMeta = {}) => {
  const record = normalizeLabelRecord(labelPayload?.labelData || labelPayload);
  const awb =
    labelPayload?.awbNumber ||
    pick(record, "awbNumber", "awb_number", "trackingNumber") ||
    orderMeta.awb ||
    "—";
  const cAwb =
    labelPayload?.cAwbNumber ||
    pick(record, "cAwbNumber", "c_awb_number", "courierAwb") ||
    "";

  const shipToName =
    pick(record, "consigneeName", "customerName", "receiverName") ||
    orderMeta.customerName ||
    "—";
  const shipToPhone =
    pick(record, "consigneePhone", "customerPhone", "receiverPhone") ||
    orderMeta.customerPhone ||
    "";
  const shipToAddr =
    [
      pick(record, "consigneeAddress", "shippingAddress", "receiverAddress"),
      pick(record, "consigneeCity", "city"),
      pick(record, "consigneeState", "state"),
      pick(record, "consigneePincode", "pincode", "zip"),
    ]
      .filter(Boolean)
      .join(", ") ||
    orderMeta.customerAddress ||
    "—";

  const shipFromName =
    pick(record, "shipperName", "sellerName", "pickupName") || "Vendor Warehouse";
  const shipFromAddr =
    [
      pick(record, "shipperAddress", "pickupAddress", "sellerAddress"),
      pick(record, "shipperCity", "pickupCity"),
      pick(record, "shipperState", "pickupState"),
      pick(record, "shipperPincode", "pickupPincode"),
    ]
      .filter(Boolean)
      .join(", ") || "—";

  const productName =
    pick(record, "productName", "itemName", "description") ||
    orderMeta.productName ||
    "—";
  const weight =
    pick(record, "weight", "packageWeight", "deadWeight") || orderMeta.weight;
  const paymentType =
    pick(record, "paymentType", "paymentMode") || orderMeta.paymentType || "—";
  const orderNumber =
    pick(record, "orderNumber", "shipperOrderId", "orderId") ||
    orderMeta.orderNumber ||
    "—";

  const doc = new jsPDF({ unit: "mm", format: [105, 148] });
  doc.setDrawColor(180);
  doc.setLineDashPattern([2, 2], 0);
  doc.roundedRect(4, 4, 97, 140, 3, 3);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`AWB: ${awb}`, 52.5, 12, { align: "center" });
  if (cAwb) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Courier AWB: ${cAwb}`, 52.5, 16, { align: "center" });
  }

  doc.setDrawColor(220);
  doc.line(8, 19, 97, 19);

  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text("SHIP TO", 8, 24);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20);
  doc.text(String(shipToName).slice(0, 40), 8, 29);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  const toLines = doc.splitTextToSize(String(shipToAddr), 88);
  doc.text(toLines.slice(0, 3), 8, 34);
  if (shipToPhone) doc.text(`Phone: ${shipToPhone}`, 8, 46);

  doc.setDrawColor(220);
  doc.line(8, 50, 97, 50);

  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text("SHIP FROM", 8, 55);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20);
  doc.text(String(shipFromName).slice(0, 40), 8, 60);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  const fromLines = doc.splitTextToSize(String(shipFromAddr), 88);
  doc.text(fromLines.slice(0, 2), 8, 65);

  doc.setDrawColor(220);
  doc.line(8, 74, 97, 74);

  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text("ORDER", 8, 79);
  doc.text("PRODUCT", 8, 88);
  doc.text("PAYMENT", 70, 88);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20);
  doc.text(String(orderNumber).slice(0, 22), 8, 84);
  doc.text(String(productName).slice(0, 28), 8, 93);
  doc.text(String(paymentType).slice(0, 12), 70, 93);
  if (weight) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Weight: ${weight}`, 8, 100);
  }

  const filename = `shipping-label-${orderMeta.orderNumber || awb}.pdf`;
  doc.save(filename);
};

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

const downloadBase64Pdf = (base64, filename) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
};

/**
 * Save courier PDF URL, server-generated AWB PDF, or client-side fallback.
 */
export const saveShippingLabel = (apiData, orderMeta = {}) => {
  const url = apiData?.shippingLabelUrl;
  if (url && !String(url).startsWith("data:")) {
    window.open(url, "_blank", "noopener,noreferrer");
    return "url";
  }

  const b64 = apiData?.shippingLabelPdfBase64;
  const awb = apiData?.awbNumber || orderMeta.awb || "awb";
  const filename = `shipping-label-${orderMeta.orderNumber || awb}.pdf`;
  if (b64) {
    downloadBase64Pdf(b64, filename);
    return "pdf";
  }

  downloadLabelPdf(apiData, orderMeta);
  return "generated";
};

export { orderMetaFromOrder };
