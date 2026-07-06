import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  Download,
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  ExternalLink,
  RefreshCw,
  Search,
  Printer,
  Tag,
} from "lucide-react";
import jsPDF from "jspdf";
import { useAppContext } from "../../../context/AppContext";
import {
  getSelfShipOrders,
  createSelfShip,
  bulkSelfShip,
  downloadSelfShipTemplate,
} from "../../../services/api.order";
import { formatDate } from "../../../utils/date&Time/dateAndTimeFormatter";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../utils/notification/toast";

// ─── Auto-ship providers (exclude from this page) ─────────────────────────────
const AUTO_SHIP_PROVIDERS = ["innofulfill", "shadowfax", "shiprocket"];

// ─── Self-ship workflow stages ─────────────────────────────────────────────────
const WORKFLOW_STAGES = [
  { id: "placed", label: "Order Placed" },
  { id: "accepted", label: "Seller Accepted" },
  { id: "packed", label: "Packed" },
  { id: "courier", label: "Courier Assigned" },
  { id: "shipped", label: "Shipped" },
  { id: "transit", label: "In Transit" },
  { id: "delivered", label: "Delivered" },
];

const getStageIndex = (order) => {
  const status = (order.order_status || "").toLowerCase();
  const provider = (order.shipping_provider || "").toLowerCase();
  if (status === "delivered") return 6;
  if (status === "intransit" || status === "in transit") return 5;
  if (status === "shipped") return 4;
  if (order.courier_name || order.tracking_id) return 3;
  if (status === "packed") return 2;
  if (status === "accepted") return 1;
  return 0;
};

// Map DB order → SelfShip card shape
const mapToSelfShip = (ord) => {
  const prod = ord.product || {};
  const addr = ord.Address || {};
  const vendor = ord.vendor?.vendorDetails || {};
  const customer =
    `${addr.first_name || ""} ${addr.last_name || ""}`.trim() || "Customer";
  const customerCity = addr.city ? `, ${addr.city}` : "";

  return {
    id: ord.id,
    orderId: ord.order_number || String(ord.id),
    sku: prod.variations?.sku || prod.sku || "—",
    qty: ord.qty || 1,
    productName: prod.name || "—",
    customer: customer + customerCity,
    price: ord.order_total || 0,
    courier: ord.courier_name || "",
    trackingId: ord.tracking_id || "",
    trackingUrl: ord.tracking_url || "",
    vendorComment: ord.vendor_comment || "",
    stageIndex: getStageIndex(ord),
    order_status: ord.order_status,
    shipping_provider: ord.shipping_provider,
    created_at: ord.created_at,
    // Full address for label
    address: {
      name: customer,
      phone: addr.phone || "",
      email: addr.email || "",
      street: addr.street_address || "",
      city: addr.city || "",
      state: addr.state || "",
      zip: addr.zip || "",
    },
    // Vendor/From address for label
    from: {
      name: vendor.first_name
        ? `${vendor.first_name} ${vendor.last_name || ""}`.trim()
        : "Vendor",
      shop: vendor.shop_name || "Vendor Warehouse",
    },
    rawOrder: ord,
  };
};

// ─── Step progress bar ─────────────────────────────────────────────────────────
const StepBar = ({ stageIndex }) => (
  <div className="flex items-center mt-3 mb-1">
    {WORKFLOW_STAGES.map((s, i) => {
      const done = i < stageIndex;
      const active = i === stageIndex;
      return (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center min-w-0">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all flex-shrink-0 ${
                done
                  ? "bg-green-500 border-green-500 text-white"
                  : active
                  ? "bg-orange-500 border-orange-500 text-white ring-2 ring-orange-200"
                  : "bg-white border-gray-200 text-gray-400"
              }`}
            >
              {done ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
            </div>
            <p
              className={`text-[9px] mt-1 font-semibold text-center max-w-[50px] leading-tight ${
                active
                  ? "text-orange-600"
                  : done
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {s.label}
            </p>
          </div>
          {i < WORKFLOW_STAGES.length - 1 && (
            <div
              className={`flex-1 h-0.5 mb-4 transition-all ${
                i < stageIndex ? "bg-green-400" : "bg-gray-200"
              }`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── SVG Barcode generator ─────────────────────────────────────────────────────
// Produces a realistic Code-128-style barcode as an inline SVG from any string.
const SvgBarcode = ({ value, width = 240, height = 60 }) => {
  // Seed a deterministic bar-width sequence from the string characters
  const seed = (value || "ORDER")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .split("")
    .map((c) => c.charCodeAt(0));

  const bars = [];
  // Always start with a quiet zone + start bar
  const pattern = [2, 1]; // quiet, start
  for (let i = 0; i < seed.length; i++) {
    const v = seed[i];
    // Encode each char as 3 bars: wide/narrow based on bit pattern of char code
    pattern.push((v >> 5) & 1 ? 3 : 1); // bit 5
    pattern.push((v >> 4) & 1 ? 1 : 2); // bit 4
    pattern.push((v >> 3) & 1 ? 2 : 1); // bit 3
    pattern.push((v >> 2) & 1 ? 1 : 3); // bit 2
    pattern.push((v >> 1) & 1 ? 3 : 1); // bit 1
    pattern.push((v >> 0) & 1 ? 1 : 2); // bit 0
  }
  pattern.push(2, 3, 1, 2); // stop + quiet

  // Calculate total units to scale to target width
  const totalUnits = pattern.reduce((a, b) => a + b, 0);
  const unitW = width / totalUnits;

  let x = 0;
  pattern.forEach((units, i) => {
    const barW = units * unitW;
    if (i % 2 === 1) {
      // odd indices = bar (dark)
      bars.push(
        <rect
          key={i}
          x={x}
          y={0}
          width={barW}
          height={height}
          fill="#2d2d2d"
        />,
      );
    }
    x += barW;
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

// ─── Label Modal ───────────────────────────────────────────────────────────────
// Pixel-accurate recreation of the design shown in the reference image:
//   • White modal, "Shipping Label" title + subtitle, X close button
//   • Card with dashed border: SVG barcode → ORDER #xx → divider →
//     SHIP TO section → divider → SHIP FROM section → divider →
//     PRODUCT / WEIGHT / PAYMENT footer row
//   • Single "Close" button at the bottom
const LabelModal = ({ show, onClose, order }) => {
  if (!show || !order) return null;

  // Derive weight from qty (placeholder — backend can add weight field later)
  const weightKg = ((order.qty || 1) * 0.45).toFixed(2);
  const paymentType =
    order.rawOrder?.payment_type === "cod" ? "COD" : "Prepaid";

  // Full address lines for SHIP TO
  const toName = order.address.name || "—";
  const toStreet = order.address.street || "";
  const toCity = order.address.city || "";
  const toState = order.address.state || "";
  const toZip = order.address.zip || "";
  const toPhone = order.address.phone || "";
  const toCityStateZip = [
    toCity && toState ? `${toCity}, ${toState}` : toCity || toState,
    toZip,
  ]
    .filter(Boolean)
    .join(" — ");

  // SHIP FROM
  const fromShop = order.from.shop || order.from.name || "Vendor Warehouse";
  const fromAddress = order.rawOrder?.vendor?.vendorDetails?.address || "";

  // Print handler — opens a clean print window showing only the label card
  const handlePrint = () => {
    const labelEl = document.getElementById("selfship-label-card");
    if (!labelEl) return;
    const win = window.open("", "_blank", "width=520,height=760");
    win.document.write(`
      <html>
        <head>
          <title>Shipping Label – ${order.orderId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
                   background: #fff; display: flex; justify-content: center; padding: 24px; }
            .card { border: 2px dashed #c0c0c0; border-radius: 16px; padding: 24px;
                    width: 420px; background: #fff; }
            .barcode-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 16px; }
            .order-num { font-size: 13px; font-weight: 800; letter-spacing: 2px;
                         color: #111; margin-top: 8px; text-align: center; }
            .divider { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }
            .section-label { font-size: 10px; font-weight: 700; color: #9ca3af;
                             text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
            .section-name { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 2px; }
            .section-line { font-size: 12px; color: #555; margin-bottom: 1px; }
            .footer-row { display: flex; gap: 0; margin-top: 14px; }
            .footer-col { flex: 1; }
            .footer-col-label { font-size: 10px; font-weight: 700; color: #9ca3af;
                                text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }
            .footer-col-val { font-size: 12px; font-weight: 700; color: #111; }
            .footer-col-val.prepaid { color: #16a34a; }
          </style>
        </head>
        <body>${labelEl.outerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  // PDF download using jsPDF — mirrors the visual layout
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: [105, 148] }); // A6
    const lm = 8,
      rm = 97,
      y = { v: 10 };
    const nl = (n = 5) => {
      y.v += n;
    };

    // Border
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([2, 2], 0);
    doc.roundedRect(4, 4, 97, 140, 3, 3);
    doc.setLineDashPattern([], 0);

    // Barcode placeholder (hatched rect)
    doc.setFillColor(240, 240, 240);
    doc.rect(lm, y.v, rm - lm, 18, "F");
    doc.setFontSize(6);
    doc.setTextColor(120);
    doc.text("▌▐█▌▐▌▌▐▌█▐▌▌▐█▌▐▌▌", lm + 2, y.v + 9);
    nl(20);

    // ORDER #
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20);
    doc.text(`ORDER #${order.orderId}`, 52.5, y.v, { align: "center" });
    nl(7);

    // Divider
    doc.setDrawColor(220);
    doc.line(lm, y.v, rm, y.v);
    nl(5);

    // SHIP TO
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150);
    doc.text("SHIP TO", lm, y.v);
    nl(5);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20);
    doc.text(toName, lm, y.v);
    nl(5);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    if (toStreet) {
      doc.text(toStreet, lm, y.v);
      nl(4);
    }
    if (toCityStateZip) {
      doc.text(toCityStateZip, lm, y.v);
      nl(4);
    }
    if (toPhone) {
      doc.text(`Phone: ${toPhone}`, lm, y.v);
      nl(4);
    }
    nl(2);

    // Divider
    doc.setDrawColor(220);
    doc.line(lm, y.v, rm, y.v);
    nl(5);

    // SHIP FROM
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150);
    doc.text("SHIP FROM", lm, y.v);
    nl(5);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20);
    doc.text(fromShop, lm, y.v);
    nl(5);
    if (fromAddress) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text(fromAddress, lm, y.v);
      nl(4);
    }
    nl(2);

    // Divider
    doc.setDrawColor(220);
    doc.line(lm, y.v, rm, y.v);
    nl(6);

    // Footer row: PRODUCT | WEIGHT | PAYMENT
    const cols = [
      { label: "PRODUCT", val: order.productName || "—", x: lm },
      { label: "WEIGHT", val: `${weightKg} kg`, x: 45 },
      { label: "PAYMENT", val: paymentType, x: 72 },
    ];
    cols.forEach(({ label, val, x: cx }) => {
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(150);
      doc.text(label, cx, y.v);
    });
    nl(5);
    cols.forEach(({ label, val, x: cx }) => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(
        label === "PAYMENT" && paymentType === "Prepaid"
          ? [22, 163, 74]
          : [20, 20, 20],
      );
      doc.text(val, cx, y.v);
    });

    doc.save(`label-${order.orderId}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
        {/* ── Modal header ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900 leading-tight">
              Shipping Label
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Preview and print logistics label for Order #{order.orderId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors mt-0.5 flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* ── Divider ── */}
        <div className="mx-6 my-5 border-t border-gray-100" />

        {/* ── Label card (scrollable if tall) ── */}
        <div
          className="overflow-y-auto px-6 pb-2"
          style={{ maxHeight: "65vh" }}
        >
          <div
            id="selfship-label-card"
            className="border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-white"
          >
            {/* Barcode + order number */}
            <div className="flex flex-col items-center mb-5">
              <SvgBarcode value={order.orderId} width={220} height={56} />
              <p className="text-sm font-extrabold text-gray-900 tracking-widest mt-2 uppercase">
                ORDER #{order.orderId}
              </p>
            </div>

            {/* Divider */}
            <hr className="border-gray-200 mb-4" />

            {/* SHIP TO */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Ship To
              </p>
              <p className="text-base font-bold text-gray-900">{toName}</p>
              {toStreet && (
                <p className="text-sm text-gray-500 mt-0.5">{toStreet}</p>
              )}
              {toCityStateZip && (
                <p className="text-sm text-gray-500">{toCityStateZip}</p>
              )}
              {toPhone && (
                <p className="text-sm text-gray-500">Phone: {toPhone}</p>
              )}
            </div>

            {/* Divider */}
            <hr className="border-gray-200 mb-4" />

            {/* SHIP FROM */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Ship From
              </p>
              <p className="text-base font-bold text-gray-900">{fromShop}</p>
              {fromAddress && (
                <p className="text-sm text-gray-500 mt-0.5">{fromAddress}</p>
              )}
            </div>

            {/* Divider */}
            <hr className="border-gray-200 mb-4" />

            {/* Footer row: PRODUCT / WEIGHT / PAYMENT */}
            <div className="flex items-start">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Product
                </p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {order.productName || "—"}
                </p>
              </div>
              <div className="w-20 flex-shrink-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Weight
                </p>
                <p className="text-sm font-bold text-gray-900">{weightKg} kg</p>
              </div>
              <div className="w-20 flex-shrink-0 text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Payment
                </p>
                <p
                  className={`text-sm font-bold ${
                    paymentType === "Prepaid"
                      ? "text-green-600"
                      : "text-amber-600"
                  }`}
                >
                  {paymentType}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom divider ── */}
        <div className="mx-6 mt-5 border-t border-gray-100" />

        {/* ── Action buttons ── */}
        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Individual order card ─────────────────────────────────────────────────────
const SelfShipOrderCard = ({ order, onAssignCourier, onViewLabel }) => {
  const canShip = ["placed", "pending"].includes(
    (order.order_status || "").toLowerCase(),
  );
  const isShipped = order.stageIndex >= 4;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900 font-mono">
              #{order.orderId}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                isShipped
                  ? "bg-green-100 text-green-700"
                  : canShip
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {order.order_status}
            </span>
            {order.shipping_provider === "self_ship" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-orange-100 text-orange-700">
                Self Ship
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {order.productName} · Qty {order.qty}
          </p>
          <p className="text-xs text-gray-400">{order.customer}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-gray-800">₹{order.price}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(order.created_at)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <StepBar stageIndex={order.stageIndex} />

      {/* Courier info chip (shown when courier is assigned) */}
      {(order.courier || order.trackingId) && (
        <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-2 flex-wrap">
            <Truck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            {order.courier && (
              <span className="text-xs font-semibold text-blue-800">
                {order.courier}
              </span>
            )}
            {order.trackingId && (
              <span className="text-xs font-mono text-blue-600">
                {order.trackingId}
              </span>
            )}
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 ml-auto"
              >
                Track <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* SKU strip */}
      {order.sku && order.sku !== "—" && (
        <p className="text-[10px] text-gray-400 mt-2 font-mono">
          SKU: {order.sku}
        </p>
      )}

      {/* Action buttons */}
      <div className="mt-3 flex items-center justify-end gap-2 flex-wrap">
        {/* View Label — shown whenever courier is assigned */}
        {isShipped && (order.courier || order.trackingId) && (
          <button
            onClick={() => onViewLabel(order)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-orange-300 text-orange-600 text-xs font-semibold rounded-xl hover:bg-orange-50 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            View Label
          </button>
        )}

        {/* Primary action */}
        {canShip && !isShipped ? (
          <button
            onClick={() => onAssignCourier(order)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            Assign Courier & Ship
          </button>
        ) : isShipped ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Shipped via Self-Ship
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic">
            Not eligible (status: {order.order_status})
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Courier assignment modal ──────────────────────────────────────────────────
const CourierModal = ({ show, onClose, onSave, loading, currentOrder }) => {
  const [form, setForm] = useState({
    courier_name: "",
    tracking_id: "",
    tracking_url: "",
    vendor_comment: "",
  });

  useEffect(() => {
    if (show)
      setForm({
        courier_name: "",
        tracking_id: "",
        tracking_url: "",
        vendor_comment: "",
      });
  }, [show, currentOrder?.id]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Assign Courier
            </h3>
            {currentOrder && (
              <p className="text-xs text-gray-500 mt-0.5">
                Order #{currentOrder.orderId} · {currentOrder.productName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Courier Name *
            </label>
            <input
              type="text"
              value={form.courier_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, courier_name: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              placeholder="e.g. FedEx, DTDC, Delhivery, BlueDart"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tracking ID / AWB *
            </label>
            <input
              type="text"
              value={form.tracking_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, tracking_id: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              placeholder="Enter AWB / tracking number"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tracking URL
            </label>
            <input
              type="url"
              value={form.tracking_url}
              onChange={(e) =>
                setForm((p) => ({ ...p, tracking_url: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              placeholder="https://track.courier.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.vendor_comment}
              rows={2}
              onChange={(e) =>
                setForm((p) => ({ ...p, vendor_comment: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none"
              placeholder="Any notes about this shipment…"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={loading || !form.courier_name || !form.tracking_id}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving…" : "Save & Mark Shipped"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Bulk upload tab ───────────────────────────────────────────────────────────
const BulkUploadTab = () => {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx"].includes(ext)) {
      notifyOnFail("Only CSV (.csv) and Excel (.xlsx) files are accepted.");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const res = await bulkSelfShip(file);
      if (res?.status === 1) {
        notifyOnSuccess(res.message || "Bulk upload complete");
        setResult(res.data);
        setFile(null);
      } else {
        notifyOnFail(res?.message || "Upload failed");
      }
    } catch (err) {
      notifyOnFail(err?.response?.data?.message || "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      await downloadSelfShipTemplate();
    } catch {
      notifyOnFail("Failed to download template");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Download template */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Download Template
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Required columns: order_id, courier_name, tracking_id,
              tracking_url, vendor_comment
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0164CE] rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloading ? "Downloading…" : "Download Template"}
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">
          Upload Shipment File
        </h3>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragging
              ? "border-orange-400 bg-orange-50"
              : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Upload
            className={`w-10 h-10 mx-auto mb-3 ${
              dragging ? "text-orange-500" : "text-gray-300"
            }`}
          />
          {file ? (
            <div>
              <p className="text-sm font-semibold text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / 1024).toFixed(1)} KB · Click to change
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Drop your CSV or Excel file here
              </p>
              <p className="text-xs text-gray-400 mt-1">or click to browse</p>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Remove
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Uploading…" : "Upload & Process"}
            </button>
          </div>
        )}
      </div>

      {/* Upload result */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Upload Result</h3>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 text-center">
              <p className="text-2xl font-bold text-gray-800">{result.total}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Rows</p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 text-center">
              <p className="text-2xl font-bold text-green-700">
                {result.successful}
              </p>
              <p className="text-xs text-green-600 mt-0.5">Succeeded</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 text-center">
              <p className="text-2xl font-bold text-red-600">{result.failed}</p>
              <p className="text-xs text-red-500 mt-0.5">Failed</p>
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-red-600 mb-2">
                Errors ({result.errors.length})
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 bg-red-50 border border-red-100 rounded-lg text-xs"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-red-700">
                      Row {e.row}
                      {e.order_id ? ` (Order #${e.order_id})` : ""}: {e.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.shipped?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-green-700 mb-2">
                Shipped ({result.shipped.length})
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {result.shipped.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 bg-green-50 border border-green-100 rounded-lg text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <span className="text-green-800 font-mono">
                      {s.order_number}
                    </span>
                    <span className="text-green-600">
                      · {s.courier_name} · {s.tracking_id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main SelfShip page ────────────────────────────────────────────────────────
const SelfShip = () => {
  const { user } = useAppContext();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("workflow");
  const [search, setSearch] = useState("");

  // Courier modal
  const [courierModalOpen, setCourierModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [saving, setSaving] = useState(false);

  // Label modal
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelOrder, setLabelOrder] = useState(null);

  // ── Fetch — calls new dedicated self-ship endpoint ─────────────────────────
  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await getSelfShipOrders(user?.id);
        const orderList = res?.data?.orders || [];
        setOrders(orderList.map(mapToSelfShip));
      } catch (e) {
        console.error("Error fetching self-ship orders:", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Courier modal handlers ─────────────────────────────────────────────────
  const handleAssignCourier = (order) => {
    setCurrentOrder(order);
    setCourierModalOpen(true);
  };

  const handleSaveCourier = async (form) => {
    if (!currentOrder) return;
    if (!form.courier_name || !form.tracking_id) {
      notifyOnFail("Courier name and tracking ID are required");
      return;
    }
    setSaving(true);
    try {
      const res = await createSelfShip(currentOrder.id, {
        courier_name: form.courier_name,
        tracking_id: form.tracking_id,
        tracking_url: form.tracking_url || undefined,
        vendor_comment: form.vendor_comment || undefined,
      });
      if (res?.status === 1) {
        notifyOnSuccess(
          `Order #${currentOrder.orderId} shipped via ${form.courier_name}!`,
        );
        setCourierModalOpen(false);
        setCurrentOrder(null);
        fetchOrders(true);
      } else {
        notifyOnFail(res?.message || "Failed to save shipment");
      }
    } catch (err) {
      notifyOnFail(err?.response?.data?.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  // ── Label modal handlers ───────────────────────────────────────────────────
  const handleViewLabel = (order) => {
    setLabelOrder(order);
    setLabelModalOpen(true);
  };

  // ── Search filter ──────────────────────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderId?.toLowerCase().includes(q) ||
      o.productName?.toLowerCase().includes(q) ||
      o.customer?.toLowerCase().includes(q) ||
      o.courier?.toLowerCase().includes(q) ||
      o.trackingId?.toLowerCase().includes(q)
    );
  });

  // ── Summary counts ─────────────────────────────────────────────────────────
  const shippableCount = orders.filter((o) =>
    ["placed", "pending"].includes((o.order_status || "").toLowerCase()),
  ).length;
  const shippedCount = orders.filter((o) => o.stageIndex >= 4).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FFF3EF] py-6 px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-950 font-satoshi">
            Self Ship
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-satoshi">
            Manage manual courier assignments and bulk shipping operations
          </p>
        </div>
        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-satoshi">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {orders.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-satoshi">Awaiting Ship</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {shippableCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-satoshi">Shipped</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {shippedCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-satoshi">Mode</p>
          <p className="text-sm font-bold text-orange-500 mt-1">
            Self Ship Only
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1 shadow-sm mb-6 w-fit">
        {[
          { id: "workflow", label: "Workflow", icon: Truck },
          { id: "bulk", label: "Bulk Upload", icon: Upload },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "workflow" ? (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search orders…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 py-2.5 pl-9 pr-4 text-sm rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/30 placeholder-gray-400 shadow-sm"
            />
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((x) => (
                <div
                  key={x}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-8 bg-gray-100 rounded w-full mt-4" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">
                {search
                  ? "No orders match your search"
                  : "No self-ship orders found"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {search
                  ? "Try a different search term"
                  : "Only orders with shipping_provider = 'self_ship' or unshipped placed orders appear here"}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <SelfShipOrderCard
                key={order.id}
                order={order}
                onAssignCourier={handleAssignCourier}
                onViewLabel={handleViewLabel}
              />
            ))
          )}
        </div>
      ) : (
        <BulkUploadTab />
      )}

      {/* Courier assignment modal */}
      <CourierModal
        show={courierModalOpen}
        onClose={() => {
          setCourierModalOpen(false);
          setCurrentOrder(null);
        }}
        onSave={handleSaveCourier}
        loading={saving}
        currentOrder={currentOrder}
      />

      {/* Label modal */}
      <LabelModal
        show={labelModalOpen}
        onClose={() => {
          setLabelModalOpen(false);
          setLabelOrder(null);
        }}
        order={labelOrder}
      />
    </div>
  );
};

export default SelfShip;
