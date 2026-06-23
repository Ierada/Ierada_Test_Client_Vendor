import jsPDF from "jspdf";
import "jspdf-autotable";

export const exportToPDF = (orders) => {
  const doc = new jsPDF("landscape");
  
  const headers = [
    "Order ID", "Date", "Customer Name", "Product Name", 
    "Qty", "Amount", "Status"
  ];
  
  const tableRows = orders.map((order) => [
    order.order_number || "N/A",
    new Date(order.created_at).toLocaleDateString(),
    order.customer ? `${order.customer.customerDetails?.first_name || ""} ${order.customer.customerDetails?.last_name || ""}`.trim() : "Guest",
    order.product?.name || "N/A",
    order.qty || 0,
    `INR ${Number(order.order_total).toLocaleString("en-IN")}`,
    order.order_status || "N/A",
  ]);

  doc.autoTable({
    head: [headers],
    body: tableRows,
    styles: { fontSize: 8 },
  });

  doc.save("orders.pdf");
};
