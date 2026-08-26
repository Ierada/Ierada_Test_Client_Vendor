import * as XLSX from "xlsx";
import {
  getExportCustomerName,
  getExportDateTime,
  getExportProductFields,
} from "./exportFields";

export const exportToExcel = (orders = []) => {
  const rows = orders.map((o) => {
    const p = getExportProductFields(o);
    return {
      "Order #": o.order_number || "—",
      "Date & Time": getExportDateTime(o),
      Customer: getExportCustomerName(o),
      Phone: o.Address?.phone || "—",
      "Product Name": p.name,
      Color: p.color,
      Size: p.size,
      HSN: p.hsn,
      SKU: p.sku,
      Qty: o.qty || 0,
      "Amount (₹)": Number(o.order_total || 0),
      Status: o.order_status || "—",
      Payment: (o.payment_type || "—").toUpperCase(),
      "Payment Status": o.payment_status || "—",
      Provider: o.shipping_provider || o.courier_name || "—",
      AWB: o.tracking_id || "—",
      Manifested: o.is_manifested ? "Yes" : "No",
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 32 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 6 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  XLSX.writeFile(wb, `orders-export-${Date.now()}.xlsx`);
};
