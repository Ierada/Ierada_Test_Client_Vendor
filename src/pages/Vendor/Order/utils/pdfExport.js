import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  formatDate,
  formatTime,
} from "../../../../utils/date&Time/dateAndTimeFormatter";

export const exportToPDF = (orders = []) => {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text("Orders Export", 14, 16);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-IN")}   Total: ${
      orders.length
    } orders`,
    14,
    22,
  );

  const rows = orders.map((o) => [
    o.order_number || "—",
    `${formatDate(o.created_at)} ${formatTime(o.created_at)}`,
    `${o.Address?.first_name || ""} ${o.Address?.last_name || ""}`.trim() ||
      "—",
    (o.product?.name || "—").slice(0, 30),
    String(o.qty || ""),
    `₹${o.order_total || 0}`,
    o.order_status || "—",
    o.payment_type?.toUpperCase() || "—",
    o.shipping_provider || o.courier_name || "—",
    o.tracking_id || "—",
    o.is_manifested ? "Yes" : "No",
  ]);

  doc.autoTable({
    head: [
      [
        "Order #",
        "Date & Time",
        "Customer",
        "Product",
        "Qty",
        "Amount",
        "Status",
        "Payment",
        "Provider",
        "AWB",
        "Manifested",
      ],
    ],
    body: rows,
    startY: 28,
    headStyles: { fontSize: 6.5, fillColor: [1, 100, 206] },
    styles: { fontSize: 6.5, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`orders-export-${Date.now()}.pdf`);
};
