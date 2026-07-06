import React, { useRef } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  FileText,
  Printer,
  Download,
  Package,
  CheckCircle2,
  Truck,
} from "lucide-react";

// ─── Shared section shell ──────────────────────────────────────────────────────
const StepShell = ({ children, title, subtitle, icon: Icon }) => (
  <div className="w-full max-w-2xl mx-auto p-6">
    <div className="bg-white rounded-2xl border border-[#EDF0F4] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#EDF0F4]">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#0164CE]" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ─── Row helper ────────────────────────────────────────────────────────────────
const Row = ({ label, value, bold, green }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span
      className={`text-sm font-semibold ${bold ? "text-gray-900" : ""} ${
        green ? "text-green-600" : ""
      }`}
    >
      {value ?? "—"}
    </span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Invoice
// ═══════════════════════════════════════════════════════════════════════════════
export const InvoiceStep = ({ orderData }) => {
  if (!orderData) return null;

  const { product, orderInfo, customer } = orderData;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Tax Invoice", 14, 20);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `Order: #${orderData.id}   Date: ${orderInfo.orderedDate}`,
      14,
      28,
    );
    doc.text(`Customer: ${customer.name}   Phone: ${customer.phone}`, 14, 34);
    doc.text(
      `Address: ${customer.address.line1}, ${customer.address.line2}`,
      14,
      40,
    );
    doc.setTextColor(0);
    doc.autoTable({
      startY: 48,
      head: [["Description", "Qty", "Unit Price", "Total"]],
      body: [
        [
          product.name || "—",
          String(product.quantity || 1),
          orderInfo.price,
          orderInfo.orderTotal,
        ],
      ],
      headStyles: { fillColor: [1, 100, 206], fontSize: 9 },
      styles: { fontSize: 9 },
    });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.text(`Payment: ${orderInfo.paymentType}`, 14, finalY);
    doc.text(`Discount: ${orderInfo.discount}`, 14, finalY + 6);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${orderInfo.orderTotal}`, 14, finalY + 16);
    doc.save(`invoice-${orderData.id}.pdf`);
  };

  return (
    <StepShell
      icon={FileText}
      title="Invoice Preview"
      subtitle="Review and download the tax invoice for this order"
    >
      {/* Invoice document preview */}
      <div className="border border-dashed border-gray-200 rounded-xl p-5 bg-gray-50 mb-5">
        {/* Invoice header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-lg font-black text-gray-900 tracking-tight">
              TAX INVOICE
            </p>
            <p className="text-xs text-gray-400 mt-0.5">#{orderData.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{orderInfo.orderedDate}</p>
            <p className="text-xs text-gray-400">{orderInfo.orderedTime}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Bill To
            </p>
            <p className="text-sm font-bold text-gray-900">{customer.name}</p>
            <p className="text-xs text-gray-500">{customer.address.line1}</p>
            <p className="text-xs text-gray-500">{customer.address.line2}</p>
            <p className="text-xs text-gray-500">{customer.phone}</p>
          </div>
        </div>

        {/* Line items */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
          <div className="grid grid-cols-4 px-4 py-2.5 bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <span className="col-span-2">Description</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Total</span>
          </div>
          <div className="grid grid-cols-4 px-4 py-3 text-sm">
            <span className="col-span-2 font-medium text-gray-800 truncate">
              {product.name}
            </span>
            <span className="text-center text-gray-600">
              {product.quantity || 1}
            </span>
            <span className="text-right font-bold text-gray-900">
              {orderInfo.orderTotal}
            </span>
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-0">
          <Row label="Price" value={orderInfo.price} />
          <Row label="Discount" value={orderInfo.discount} />
          <Row label="Order Total" value={orderInfo.orderTotal} bold green />
          <Row label="Payment" value={orderInfo.paymentType} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownloadPDF}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-[#0164CE] rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Invoice PDF
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>
    </StepShell>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Shipping Label
// ═══════════════════════════════════════════════════════════════════════════════

// SVG barcode (same generator as SelfShip LabelModal)
const SvgBarcode = ({ value, width = 220, height = 52 }) => {
  const seed = (value || "ORDER")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .split("")
    .map((c) => c.charCodeAt(0));
  const pattern = [2, 1];
  for (let i = 0; i < seed.length; i++) {
    const v = seed[i];
    pattern.push(
      (v >> 5) & 1 ? 3 : 1,
      (v >> 4) & 1 ? 1 : 2,
      (v >> 3) & 1 ? 2 : 1,
      (v >> 2) & 1 ? 1 : 3,
      (v >> 1) & 1 ? 3 : 1,
      (v >> 0) & 1 ? 1 : 2,
    );
  }
  pattern.push(2, 3, 1, 2);
  const total = pattern.reduce((a, b) => a + b, 0);
  const uw = width / total;
  const bars = [];
  let x = 0;
  pattern.forEach((u, i) => {
    const bw = u * uw;
    if (i % 2 === 1)
      bars.push(
        <rect key={i} x={x} y={0} width={bw} height={height} fill="#1a1a1a" />,
      );
    x += bw;
  });
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={width} height={height} fill="white" />
      {bars}
    </svg>
  );
};

export const ShippingLabelStep = ({ orderData }) => {
  if (!orderData) return null;

  const { product, orderInfo, customer } = orderData;
  const paymentType = orderInfo.paymentType === "cod" ? "COD" : "Prepaid";

  const handlePrint = () => {
    const el = document.getElementById("flow-shipping-label");
    if (!el) return;
    const win = window.open("", "_blank", "width=520,height=760");
    win.document
      .write(`<html><head><title>Shipping Label – ${orderData.id}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:-apple-system,Arial,sans-serif; background:#fff; display:flex; justify-content:center; padding:24px; }
        .card { border:2px dashed #ccc; border-radius:16px; padding:24px; width:420px; }
        .bc { display:flex; flex-direction:column; align-items:center; margin-bottom:14px; }
        .on { font-size:12px; font-weight:800; letter-spacing:2px; margin-top:6px; }
        hr { border:none; border-top:1px solid #e5e7eb; margin:12px 0; }
        .sl { font-size:9px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:4px; }
        .sn { font-size:14px; font-weight:700; margin-bottom:2px; }
        .sv { font-size:11px; color:#555; }
        .fr { display:flex; gap:8px; }
        .fc { flex:1; }
        .fk { font-size:9px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px; }
        .fv { font-size:11px; font-weight:700; }
        .green { color:#16a34a; }
      </style></head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: [105, 148] });
    doc.setDrawColor(180);
    doc.setLineDashPattern([2, 2], 0);
    doc.roundedRect(4, 4, 97, 140, 3, 3);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20);
    doc.text(`ORDER #${orderData.id}`, 52.5, 14, { align: "center" });
    doc.setDrawColor(220);
    doc.line(8, 18, 97, 18);
    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text("SHIP TO", 8, 24);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20);
    doc.text(customer.name || "—", 8, 30);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(customer.address.line1 || "", 8, 36);
    doc.text(customer.address.line2 || "", 8, 41);
    doc.text(`Phone: ${customer.phone || "—"}`, 8, 46);
    doc.setDrawColor(220);
    doc.line(8, 50, 97, 50);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150);
    doc.text("SHIP FROM", 8, 56);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20);
    doc.text("Vendor Warehouse", 8, 62);
    doc.setDrawColor(220);
    doc.line(8, 66, 97, 66);
    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text("PRODUCT", 8, 72);
    doc.text("WEIGHT", 50, 72);
    doc.text("PAYMENT", 78, 72);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20);
    doc.text((product.name || "—").slice(0, 18), 8, 78);
    doc.text("0.45 kg", 50, 78);
    doc.setTextColor(paymentType === "Prepaid" ? [22, 163, 74] : [20, 20, 20]);
    doc.text(paymentType, 78, 78);
    doc.save(`shipping-label-${orderData.id}.pdf`);
  };

  return (
    <StepShell
      icon={Package}
      title="Shipping Label"
      subtitle="Review and print the shipping label for this order"
    >
      {/* Label preview */}
      <div
        id="flow-shipping-label"
        className="border-2 border-dashed border-gray-200 rounded-2xl p-5 bg-white mb-5"
      >
        {/* Barcode */}
        <div className="flex flex-col items-center mb-4">
          <SvgBarcode value={String(orderData.id)} width={220} height={52} />
          <p className="text-xs font-extrabold text-gray-900 tracking-widest mt-2 uppercase">
            ORDER #{orderData.id}
          </p>
        </div>
        <hr className="border-gray-200 mb-4" />

        {/* Ship To */}
        <div className="mb-4">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Ship To
          </p>
          <p className="text-sm font-bold text-gray-900">{customer.name}</p>
          <p className="text-xs text-gray-500">{customer.address.line1}</p>
          <p className="text-xs text-gray-500">{customer.address.line2}</p>
          {customer.phone && (
            <p className="text-xs text-gray-500">Phone: {customer.phone}</p>
          )}
        </div>
        <hr className="border-gray-200 mb-4" />

        {/* Ship From */}
        <div className="mb-4">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Ship From
          </p>
          <p className="text-sm font-bold text-gray-900">Vendor Warehouse</p>
        </div>
        <hr className="border-gray-200 mb-4" />

        {/* Footer row */}
        <div className="flex items-start">
          <div className="flex-1">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Product
            </p>
            <p className="text-xs font-bold text-gray-900 truncate">
              {product.name}
            </p>
          </div>
          <div className="w-20">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Weight
            </p>
            <p className="text-xs font-bold text-gray-900">0.45 kg</p>
          </div>
          <div className="w-20 text-right">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Payment
            </p>
            <p
              className={`text-xs font-bold ${
                paymentType === "Prepaid" ? "text-green-600" : "text-amber-600"
              }`}
            >
              {paymentType}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownloadPDF}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-[#0164CE] rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Label PDF
        </button>
        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>
    </StepShell>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4 — Mark Shipped / Packed confirmation
// ═══════════════════════════════════════════════════════════════════════════════
export const MarkShippedStep = ({ orderData }) => {
  if (!orderData) return null;

  const { product, orderInfo, customer } = orderData;

  return (
    <StepShell
      icon={Truck}
      title="Confirm & Mark Packed"
      subtitle="Verify everything is correct before marking the order as packed and ready for pickup"
    >
      {/* Summary card */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mb-5 space-y-3">
        <div className="flex items-center gap-3">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0"
            />
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{product.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Qty: {product.quantity || 1} · {product.color || ""}{" "}
              {product.size ? `/ ${product.size}` : ""}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Customer
            </p>
            <p className="text-xs font-semibold text-gray-800">
              {customer.name}
            </p>
            <p className="text-xs text-gray-500">{customer.phone}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Deliver To
            </p>
            <p className="text-xs font-semibold text-gray-800">
              {customer.address.line1}
            </p>
            <p className="text-xs text-gray-500">{customer.address.line2}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Payment
            </p>
            <p className="text-xs font-semibold text-gray-800">
              {orderInfo.paymentType}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Order Total
            </p>
            <p className="text-xs font-bold text-green-600">
              {orderInfo.orderTotal}
            </p>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2.5 mb-5">
        {[
          "Product is correctly packed and sealed",
          "Shipping label has been printed and attached",
          "Invoice has been included inside the package",
          "Order details have been verified with the customer",
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl"
          >
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 font-medium">{item}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Clicking <strong>"Mark as Packed"</strong> will update the order status
        and notify the customer. This action cannot be undone.
      </p>
    </StepShell>
  );
};
