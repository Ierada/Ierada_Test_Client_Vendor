import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  getExportCustomerName,
  getExportDateTime,
  getExportProductFields,
} from "./exportFields";

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

  const rows = orders.map((o) => {
    const p = getExportProductFields(o);
    return [
      o.order_number || "—",
      getExportDateTime(o),
      getExportCustomerName(o),
      (p.name || "—").slice(0, 36),
      p.color,
      p.size,
      p.hsn,
      p.sku,
      String(o.qty || ""),
      `₹${o.order_total || 0}`,
      o.order_status || "—",
      o.payment_type?.toUpperCase() || "—",
      o.shipping_provider || o.courier_name || "—",
      o.tracking_id || "—",
    ];
  });

  doc.autoTable({
    head: [
      [
        "Order #",
        "Date & Time",
        "Customer",
        "Product Name",
        "Color",
        "Size",
        "HSN",
        "SKU",
        "Qty",
        "Amount",
        "Status",
        "Payment",
        "Provider",
        "AWB",
      ],
    ],
    body: rows,
    startY: 28,
    headStyles: { fontSize: 5.5, fillColor: [1, 100, 206] },
    styles: { fontSize: 5.5, cellPadding: 1.4, overflow: "linebreak" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 28 },
      3: { cellWidth: 40 },
      7: { cellWidth: 22 },
    },
  });

  doc.save(`orders-export-${Date.now()}.pdf`);
};
