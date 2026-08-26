import * as XLSX from "xlsx";
import {
  formatDate,
  formatTime,
} from "../../../../utils/date&Time/dateAndTimeFormatter";

// Same columns as the PDF export, laid out as a proper worksheet so vendors
// can filter/sort/pivot in Excel instead of just reading a printed table.
export const exportToExcel = (orders = []) => {
  const rows = orders.map((o) => ({
    "Order #": o.order_number || "—",
    "Date & Time": `${formatDate(o.created_at)} ${formatTime(o.created_at)}`,
    Customer:
      `${o.Address?.first_name || ""} ${o.Address?.last_name || ""}`.trim() ||
      "—",
    Product: o.product?.name || "—",
    Qty: o.qty || 0,
    "Amount (₹)": Number(o.order_total || 0),
    Status: o.order_status || "—",
    Payment: (o.payment_type || "—").toUpperCase(),
    Provider: o.shipping_provider || o.courier_name || "—",
    AWB: o.tracking_id || "—",
    Manifested: o.is_manifested ? "Yes" : "No",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  XLSX.writeFile(wb, `orders-export-${Date.now()}.xlsx`);
};
