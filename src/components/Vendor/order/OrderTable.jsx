import React, { useState, useRef } from "react";
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  MoreHorizontal,
  X,
  Download,
  FileStack,
  FileText,
} from "lucide-react";
import {
  formatDate,
  formatTime,
} from "../../../utils/date&Time/dateAndTimeFormatter";
import { updateOrderStatus } from "../../../services/api.order";
import {
  downloadShippingLabel,
  manifestOrder,
} from "../../../services/api.shipping";
import { saveShippingLabel, orderMetaFromOrder } from "../../../pages/Vendor/Order/utils/labelPdf";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../utils/notification/toast";
import TrackingModal from "./TrackingModal";
import CourierCell from "./CourierCell";
import ProductCell from "./ProductCell";
import { StatusBadge } from "./OrderBadge";

// ─── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CFG = {
  placed: {
    label: "Placed",
    cls: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  accepted: {
    label: "Accepted",
    cls: "bg-blue-50 text-blue-600 border border-blue-200",
  },
  packed: {
    label: "Packed",
    cls: "bg-blue-50 text-blue-600 border border-blue-200",
  },
  shipped: {
    label: "Shipped",
    cls: "bg-blue-50 text-blue-600 border border-blue-200",
  },
  intransit: {
    label: "In Transit",
    cls: "bg-blue-50 text-blue-600 border border-blue-200",
  },
  delivered: {
    label: "Completed",
    cls: "bg-green-50 text-green-700 border border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-red-50 text-red-600 border border-red-200",
  },
  rejected: {
    label: "Cancelled",
    cls: "bg-red-50 text-red-600 border border-red-200",
  },
  returned: {
    label: "Returned",
    cls: "bg-purple-50 text-purple-700 border border-purple-200",
  },
};
const getStatusCfg = (s) =>
  STATUS_CFG[(s || "").toLowerCase()] || {
    label: s || "—",
    cls: "bg-gray-100 text-gray-600 border border-gray-200",
  };

// ─── Risk helpers (from doc 10) ────────────────────────────────────────────────
const getRisk = (order) => {
  if (order.payment_status === "failed" || order.order_status === "cancelled")
    return "high";
  if (order.payment_type === "cod" && order.payment_status === "unpaid")
    return "medium";
  return "low";
};

const getRiskScoreDetails = (order) => {
  const risk = getRisk(order);
  if (risk === "high")
    return {
      score: "85%",
      colorClass: "text-red-600",
      bgClass: "bg-red-500",
      percent: 85,
    };
  if (risk === "medium")
    return {
      score: "42%",
      colorClass: "text-amber-600",
      bgClass: "bg-amber-500",
      percent: 42,
    };
  return {
    score: "12%",
    colorClass: "text-green-600",
    bgClass: "bg-green-500",
    percent: 12,
  };
};

const OrderActions = ({
  order,
  onViewOrder,
  onOrderUpdate,
  onAcceptSuccess,
  openUpward,
  onShowTracking,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [manifestLoading, setManifestLoading] = useState(false);
  const dropdownRef = useRef(null);

  const provider = (order.shipping_provider || "").toLowerCase();
  const hasBooking = Boolean(
    order.provider_shipment_id || order.tracking_id || order.provider_order_id,
  );
  const canDownloadShippingDocs =
    hasBooking && provider && provider !== "self_ship";

  const handleDownloadLabel = async (e) => {
    e.stopPropagation();
    setLabelLoading(true);
    try {
      const res = await downloadShippingLabel(order.id);
      if (res?.status !== 1) {
        notifyOnFail(res?.message || "Failed to download label");
        return;
      }

      saveShippingLabel(res.data, orderMetaFromOrder(order));
      notifyOnSuccess("Shipping label downloaded");
    } catch (err) {
      notifyOnFail(err?.response?.data?.message || "Error downloading label");
    } finally {
      setLabelLoading(false);
    }
  };

  const handleDownloadManifest = async (e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Generate manifest for this order?\n\nThis locks the order on the courier side and schedules pickup.",
      )
    ) {
      return;
    }

    setManifestLoading(true);
    try {
      const res = await manifestOrder(order.id);
      if (res?.status !== 1) {
        notifyOnFail(res?.message || "Failed to generate manifest");
        return;
      }

      const manifestUrl =
        res?.data?.manifestUrl ||
        res?.data?.raw?.data?.[0]?.manifestUrl ||
        res?.data?.raw?.manifestUrl ||
        null;

      if (manifestUrl) {
        window.open(manifestUrl, "_blank", "noopener,noreferrer");
        notifyOnSuccess("Manifest ready — opening download");
      } else {
        notifyOnSuccess(res?.message || "Manifest generated successfully");
      }
      onOrderUpdate?.();
    } catch (err) {
      notifyOnFail(err?.response?.data?.message || "Error generating manifest");
    } finally {
      setManifestLoading(false);
    }
  };

  const showActions =
    order.order_status !== "delivered" &&
    order.order_status !== "cancelled" &&
    order.order_status !== "rejected" &&
    order.order_status !== "returned" &&
    order.order_status !== "accepted" &&
    order.order_status !== "packed" &&
    order.order_status !== "shipped" &&
    order.order_status !== "intransit";

  // ── Accept ─────────────────────────────────────────────────────────────────
  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const res = await updateOrderStatus(order.id, {
        order_status: "accepted",
      });
      if (res?.status === 1) {
        setShowAcceptModal(false);
        onOrderUpdate?.();
        onAcceptSuccess?.(order.id);
      } else {
        notifyOnFail(res?.message || "Failed to accept order");
      }
    } catch (err) {
      notifyOnFail(err?.response?.data?.message || "Error accepting order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reject ─────────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await updateOrderStatus(order.id, {
        order_status: "rejected",
        reject_reason: rejectReason.trim(),
      });
      if (res?.status === 1) {
        notifyOnSuccess("Order rejected");
        setShowRejectModal(false);
        setRejectReason("");
        onOrderUpdate?.();
      } else {
        notifyOnFail(res?.message || "Failed to reject order");
      }
    } catch (err) {
      notifyOnFail(err?.response?.data?.message || "Error rejecting order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const riskInfo = getRiskScoreDetails(order);

  return (
    <>
      <div className="flex items-center gap-1.5" ref={dropdownRef}>
        <button
          onClick={() => onViewOrder(order)}
          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          title="View & Manage"
        >
          <Eye className="w-4 h-4" />
        </button>

        {canDownloadShippingDocs && (
          <>
            <button
              onClick={handleDownloadLabel}
              disabled={labelLoading}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Download shipping label"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadManifest}
              disabled={manifestLoading || order.is_manifested}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title={
                order.is_manifested
                  ? "Order already manifested"
                  : "Download manifest"
              }
            >
              <FileText className="w-4 h-4" />
            </button>
          </>
        )}

        {/* MoreHorizontal — dropdown menu */}
        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown((p) => !p)}
              className={`p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors ${
                showDropdown ? "bg-gray-100 text-gray-900" : ""
              }`}
              title="Action menu"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showDropdown && (
              <div
                className={`absolute right-0 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-[100] ${
                  openUpward ? "bottom-full mb-1" : "top-full mt-1"
                }`}
              >
                {order.order_status !== "accepted" && order.order_status !== "packed" && order.order_status !== "shipped" && order.order_status !== "intransit" && (
                  <>
                    <button
                      onClick={() => {
                        setShowAcceptModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors border-t border-gray-100"
                    >
                      <X className="w-3.5 h-3.5 text-red-600" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Accept Modal ──────────────────────────────────────────────────────── */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-150 relative">
            {/* Close */}
            <button
              onClick={() => setShowAcceptModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <div className="mb-4 pr-6">
              <h3 className="text-base font-bold text-gray-950">
                #{order.order_number}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {order.product?.name || "Premium Product"}
              </p>
            </div>

            {/* Status badge */}
            <div className="mb-4">
              <StatusBadge status={order.order_status} order={order} />
            </div>

            {/* Customer card */}
            <div className="bg-[#F8F9FA] rounded-xl p-3 mb-3 border border-gray-100 text-left">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider block mb-1">
                CUSTOMER
              </span>
              <div className="text-xs font-bold text-gray-950">
                {order.customer?.customerDetails?.first_name ||
                  order.Address?.first_name ||
                  "—"}{" "}
                {order.customer?.customerDetails?.last_name ||
                  order.Address?.last_name ||
                  ""}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {order.Address?.city || "—"}
              </div>
            </div>

            {/* Shipment card */}
            <div className="bg-[#F8F9FA] rounded-xl p-3 mb-3 border border-gray-100 text-left">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider block mb-2">
                SHIPMENT
              </span>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                <div>
                  <div className="text-gray-400 text-[9px] font-medium">
                    Courier
                  </div>
                  <div className="font-bold text-gray-950 mt-0.5">
                    {order.courier_name || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-[9px] font-medium">
                    AWB Number
                  </div>
                  <div
                    className="font-bold text-gray-950 mt-0.5 truncate"
                    title={order.tracking_id}
                  >
                    {order.tracking_id || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-[9px] font-medium">
                    Payment
                  </div>
                  <div className="font-bold text-gray-950 mt-0.5 capitalize">
                    {order.payment_type === "online"
                      ? "Prepaid"
                      : order.payment_type || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-[9px] font-medium">
                    Order Value
                  </div>
                  <div className="font-bold text-gray-950 mt-0.5">
                    ₹{Number(order.order_total || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Risk Assessment card */}
            <div className="bg-[#F8F9FA] rounded-xl p-3 mb-5 border border-gray-100 text-left">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider block mb-1">
                AI RISK ASSESSMENT
              </span>
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-gray-700">Return Risk Score</span>
                <span className={riskInfo.colorClass}>{riskInfo.score}</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${riskInfo.bgClass}`}
                  style={{ width: `${riskInfo.percent}%` }}
                />
              </div>
            </div>

            {/* Action grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={handleAccept}
                disabled={isSubmitting}
                className="bg-[#FF6012] hover:bg-[#e0500a] text-white py-2.5 px-3 rounded-lg text-center transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Accepting…" : "Accept & Process"}
              </button>
              <button
                onClick={() => {
                  onViewOrder(order);
                  setShowAcceptModal(false);
                }}
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg text-center transition-colors"
              >
                View Full Details
              </button>
              <button
                onClick={() => {
                  const doc = window.jsPDF ? new window.jsPDF() : null;
                  if (doc) {
                    doc.text(`Invoice - ${order.order_number}`, 20, 20);
                    doc.save(`invoice-${order.order_number}.pdf`);
                  } else alert("Printing Invoice…");
                }}
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg text-center transition-colors"
              >
                Print Invoice
              </button>
              <button
                onClick={() => {
                  setShowAcceptModal(false);
                  setShowRejectModal(true);
                }}
                className="bg-red-50 hover:bg-red-100 text-red-700 py-2.5 px-3 rounded-lg text-center transition-colors"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ──────────────────────────────────────────────────────── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-150">
            <h3 className="text-base font-bold text-gray-950 mb-2">
              Reject Order
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Are you sure you want to reject order{" "}
              <span className="font-bold text-gray-800">
                #{order.order_number}
              </span>
              ? Please provide a reason for the rejection.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason (e.g. Out of stock, pricing error)..."
              className="w-full min-h-[80px] p-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#FF6012] mb-5 resize-none"
            />
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting || !rejectReason.trim()}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



// ─── Sort icon ─────────────────────────────────────────────────────────────────
const SortIcon = ({ col, sortCol, sortDir }) => {
  if (sortCol !== col)
    return <ChevronsUpDown className="w-3 h-3 text-gray-400 inline ml-1" />;
  return sortDir === "asc" ? (
    <ChevronUp className="w-3 h-3 text-gray-600 inline ml-1" />
  ) : (
    <ChevronDown className="w-3 h-3 text-gray-600 inline ml-1" />
  );
};

// ─── Derive order type from order data ─────────────────────────────────────────
const getOrderType = (order) => {
  const provider = (order.shipping_provider || "").toLowerCase();
  if (provider === "self_ship") return "Pick Up";
  if (provider) return "Home Delivery";
  // Fallback: if address exists it's delivery, otherwise pickup
  return order.Address ? "Home Delivery" : "Pick Up";
};

// ─── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = () => (
  <tr>
    <td colSpan={9} className="px-6 py-16 text-center">
      <p className="text-gray-400 font-medium text-sm">No orders found</p>
      <p className="text-gray-300 text-xs mt-1">
        Try adjusting your filters or search term
      </p>
    </td>
  </tr>
);

// ─── Column definitions ────────────────────────────────────────────────────────
const COLS = [
  { key: "order", label: "Order" },
  { key: "customer", label: "Customer" },
  { key: "product", label: "Product" },
  { key: "sku", label: "SKU" },
  { key: "payment", label: "Payment" },
  { key: "shipping", label: "Shipping" },
  { key: "order_total", label: "Total" },
  { key: "status", label: "Status" },
  { key: "action", label: "Action" },
];

const SORTABLE = new Set([
  "order",
  "customer",
  "product",
  "sku",
  "payment",
  "shipping",
  "order_total",
  "status",
]);

// ─── Main table ────────────────────────────────────────────────────────────────
const OrderTable = ({
  orders = [],
  isLoading,
  selectedOrders = [],
  onSelectOrder,
  onSelectAll,
  onViewOrder,
  onOrderUpdate,
  onAcceptSuccess,
}) => {
  const [sortCol, setSortCol] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [trackingAwb, setTrackingAwb] = useState(null);

  const handleSort = (col) => {
    if (!SORTABLE.has(col)) return;
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  // Client-side sort of passed-in orders
  const sorted = [...orders].sort((a, b) => {
    let av, bv;
    if (sortCol === "order") {
      av = a.order_number || "";
      bv = b.order_number || "";
    } else if (sortCol === "customer") {
      av = `${a.Address?.first_name || ""} ${a.Address?.last_name || ""}`
        .trim()
        .toLowerCase();
      bv = `${b.Address?.first_name || ""} ${b.Address?.last_name || ""}`
        .trim()
        .toLowerCase();
    } else if (sortCol === "product") {
      av = a.product?.name || a.Product?.name || "";
      bv = b.product?.name || b.Product?.name || "";
    } else if (sortCol === "sku") {
      av = a.product_sku || "";
      bv = b.product_sku || "";
    } else if (sortCol === "payment") {
      av = a.payment_type || "";
      bv = b.payment_type || "";
    } else if (sortCol === "shipping") {
      av = a.courier_name || a.shipping_provider || "";
      bv = b.courier_name || b.shipping_provider || "";
    } else if (sortCol === "order_total") {
      av = Number(a.order_total || 0);
      bv = Number(b.order_total || 0);
    } else if (sortCol === "status") {
      av = a.order_status || "";
      bv = b.order_status || "";
    } else {
      av = "";
      bv = "";
    }

    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const allSelected =
    orders.length > 0 && selectedOrders.length === orders.length;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-12 text-center text-gray-400 font-medium text-sm">
          Loading orders…
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              {/* Checkbox */}
              <th className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-[#FF6012] focus:ring-[#FF6012] w-4 h-4 cursor-pointer"
                />
              </th>

              {COLS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-6 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap ${
                    SORTABLE.has(col.key)
                      ? "cursor-pointer hover:text-gray-900 select-none"
                      : ""
                  }`}
                >
                  {col.label}
                  {SORTABLE.has(col.key) && (
                    <SortIcon
                      col={col.key}
                      sortCol={sortCol}
                      sortDir={sortDir}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {sorted.length === 0 ? (
              <EmptyState />
            ) : (
              sorted.map((order, index) => {
                const isSelected = selectedOrders.includes(order.id);
                const openUpward = index >= sorted.length - 2;
                const customerName =
                  `${order.Address?.first_name || ""} ${
                    order.Address?.last_name || ""
                  }`.trim() || "—";

                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50/60 transition-colors ${
                      isSelected ? "bg-[#FF6012]/5" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectOrder(order.id)}
                        className="rounded border-gray-300 text-[#FF6012] focus:ring-[#FF6012] w-4 h-4 cursor-pointer"
                      />
                    </td>

                    {/* Order */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-xs font-semibold text-gray-800 leading-tight">
                        #{order.order_number}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatDate(order.created_at)}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-800">
                        {customerName}
                      </div>
                      <div className="text-xs text-gray-400">{order.Address?.phone || "—"}</div>
                    </td>

                    {/* Product */}
                    <td className="px-6 py-4 min-w-[280px]">
                      <ProductCell product={order.product || order.Product} />
                    </td>

                    {/* SKU */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-600 font-mono">
                        {order.product_sku || "—"}
                      </span>
                    </td>

                    {/* Payment */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          order.payment_type === "cod"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {(order.payment_type || "").toUpperCase()}
                      </span>
                      <p
                        className={`text-xs mt-1 font-medium ${
                          order.payment_status === "paid" ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {order.payment_status === "paid" ? "Paid" : "Unpaid"}
                      </p>
                    </td>

                    {/* Shipping */}
                    <td className="px-6 py-4 whitespace-nowrap min-w-[110px]">
                      <CourierCell 
                        name={order.courier_name} 
                        trackingId={order.tracking_id}
                        returnAwb={order.return_awb}
                        onShowTracking={setTrackingAwb}
                      />
                    </td>

                    {/* Order Total */}
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                      ₹{Number(order.order_total || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <StatusBadge status={order.order_status} order={order} />
                    </td>

                    {/* Action — badge + eye + dropdown + accept/reject modals */}
                    <td className="px-6 py-4 relative">
                      <OrderActions
                        order={order}
                        onViewOrder={onViewOrder}
                        onOrderUpdate={onOrderUpdate}
                        onAcceptSuccess={onAcceptSuccess}
                        openUpward={openUpward}
                        onShowTracking={setTrackingAwb}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tracking Modal */}
      {trackingAwb && (
        <TrackingModal 
          awb={trackingAwb} 
          onClose={() => setTrackingAwb(null)} 
        />
      )}
    </div>
  );
};

export default OrderTable;
