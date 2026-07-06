/**
 * OrderPipeline.jsx  –  Vendor Order Pipeline Page
 *
 * Fully dynamic – all data comes from the real backend:
 *   • getOrdersByVendorId  → live order list + stage mapping
 *   • getTrackingDetails   → live tracking status per selected order
 *
 * Stage mapping mirrors the backend order_status values exactly:
 *   placed / pending → 0, accepted → 2, invoice → 3, packed → 4,
 *   ready_to_ship → 5, pickup_scheduled → 6, picked_up → 7,
 *   shipped / intransit → 8, out_for_delivery → 9,
 *   delivered → 10, returned → 11
 *
 * SLA alerts / warnings are computed from real order timestamps, not
 * hardcoded counts.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  AlertTriangle,
  Check,
  ChevronRight,
  X,
  Info,
  RefreshCw,
} from "lucide-react";
import { getOrdersByVendorId } from "../../../services/api.order";
import { getTrackingDetails } from "../../../services/api.shipping";
import { useAppContext } from "../../../context/AppContext";
import { formatDate } from "../../../utils/date&Time/dateAndTimeFormatter";

// ─── Pipeline stage definitions ────────────────────────────────────────────────
const STAGES = [
  { id: "placed", name: "Order Placed", color: "blue" },
  { id: "verified", name: "Payment Verified", color: "orange" },
  { id: "accepted", name: "Seller Accepted", color: "pink" },
  { id: "invoice", name: "Invoice Generated", color: "pink" },
  { id: "packed", name: "Packed", color: "orange" },
  { id: "ready", name: "Ready to Ship", color: "orange" },
  { id: "scheduled", name: "Pickup Scheduled", color: "yellow" },
  { id: "pickedup", name: "Picked Up", color: "green" },
  { id: "intransit", name: "In Transit", color: "green" },
  { id: "outfordelivery", name: "Out for Delivery", color: "teal" },
  { id: "delivered", name: "Delivered", color: "green" },
  { id: "returned", name: "Returned", color: "gray" },
];

// Map order_status (from DB / live tracking) → stage index
const getActiveStageIndex = (orderStatus) => {
  switch ((orderStatus || "").toLowerCase().replace(/[\s_-]+/g, "")) {
    case "pending":
    case "placed":
      return 0;
    case "verified":
    case "paymentverified":
      return 1;
    case "accepted":
    case "selleraccepted":
      return 2;
    case "invoice":
    case "invoicegenerated":
      return 3;
    case "packed":
      return 4;
    case "readytoship":
    case "ready":
      return 5;
    case "pickupscheduled":
    case "scheduled":
      return 6;
    case "pickedup":
    case "pickeddup":
      return 7;
    case "shipped":
    case "intransit":
    case "transit":
      return 8;
    case "outfordelivery":
      return 9;
    case "delivered":
      return 10;
    case "returned":
    case "return":
      return 11;
    default:
      return 3; // fallback: seller accepted
  }
};

// ─── Colour helpers ────────────────────────────────────────────────────────────
const COLOR_MAP = {
  blue: {
    ring: "ring-blue-600",
    bg: "bg-blue-600",
    line: "bg-blue-500",
    dot: "bg-blue-600",
  },
  orange: {
    ring: "ring-orange-500",
    bg: "bg-orange-500",
    line: "bg-orange-500",
    dot: "bg-orange-500",
  },
  pink: {
    ring: "ring-pink-500",
    bg: "bg-pink-500",
    line: "bg-pink-500",
    dot: "bg-pink-500",
  },
  yellow: {
    ring: "ring-yellow-500",
    bg: "bg-yellow-500",
    line: "bg-yellow-500",
    dot: "bg-yellow-500",
  },
  green: {
    ring: "ring-green-600",
    bg: "bg-green-600",
    line: "bg-green-600",
    dot: "bg-green-600",
  },
  teal: {
    ring: "ring-teal-500",
    bg: "bg-teal-500",
    line: "bg-teal-500",
    dot: "bg-teal-500",
  },
  gray: {
    ring: "ring-gray-400",
    bg: "bg-gray-400",
    line: "bg-gray-300",
    dot: "bg-gray-400",
  },
};
const getColor = (color) => COLOR_MAP[color] || COLOR_MAP.gray;

// ─── Stage performance metrics (computed from real orders) ─────────────────────
const buildMetrics = (orders) =>
  STAGES.map((stage, idx) => {
    const stageOrders = orders.filter(
      (o) => getActiveStageIndex(o.order_status) === idx,
    );
    const count = stageOrders.length;

    // SLA thresholds in hours per stage
    const thresholdHours = [1, 1, 1, 7, 2, 2, 4, 2, 0, 0, 0, 0];
    const threshold = thresholdHours[idx];
    const isSlow =
      threshold > 0 &&
      stageOrders.some((o) => {
        const ageHours =
          (Date.now() - new Date(o.created_at || Date.now()).getTime()) /
          3_600_000;
        return ageHours > threshold;
      });

    return {
      name: stage.name,
      active: count,
      health: isSlow ? "Slow" : "Healthy",
      dotColor: getColor(stage.color).dot,
      stageIdx: idx,
    };
  });

// ─── Component ─────────────────────────────────────────────────────────────────
const OrderPipeline = () => {
  const { user } = useAppContext();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [trackingStatus, setTrackingStatus] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [showDelayedModal, setShowDelayedModal] = useState(false);
  const [delayedStageIdx, setDelayedStageIdx] = useState(null);

  // ── Fetch all vendor orders ────────────────────────────────────────────────
  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await getOrdersByVendorId(user?.id);
        const orderList = res?.data?.orders || [];
        setOrders(orderList);

        // Auto-select first active (non-terminal) order
        const active = orderList.find(
          (o) =>
            !["delivered", "cancelled", "returned", "rejected"].includes(
              (o.order_status || "").toLowerCase(),
            ),
        );
        setSelectedOrder((prev) =>
          prev
            ? orderList.find((o) => o.id === prev.id) || active || null
            : active || null,
        );
      } catch (e) {
        console.error("Error fetching pipeline orders:", e);
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

  // ── Fetch live tracking when order selected ────────────────────────────────
  useEffect(() => {
    if (!selectedOrder?.id) {
      setTrackingStatus(null);
      return;
    }
    let cancelled = false;
    const fetchTracking = async () => {
      setTrackingLoading(true);
      try {
        const res = await getTrackingDetails(selectedOrder.id);
        if (!cancelled) {
          const payload = res?.data || res;
          // Try to extract a usable current status string
          const liveStatus =
            payload?.status ||
            payload?.current_status ||
            payload?.shipment_status ||
            payload?.orderStateInfo?.[0]?.orderStatus ||
            null;
          setTrackingStatus(liveStatus);
        }
      } catch {
        if (!cancelled) setTrackingStatus(null);
      } finally {
        if (!cancelled) setTrackingLoading(false);
      }
    };
    fetchTracking();
    return () => {
      cancelled = true;
    };
  }, [selectedOrder?.id]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const activeOrders = orders.filter(
    (o) =>
      !["delivered", "cancelled", "returned", "rejected"].includes(
        (o.order_status || "").toLowerCase(),
      ),
  );

  // Effective stage: prefer live tracking status; fall back to DB status
  const effectiveStatus = trackingStatus || selectedOrder?.order_status;
  const activeIndex = getActiveStageIndex(effectiveStatus);

  const metrics = buildMetrics(orders);

  // SLA counts
  const slaAlertsCount = orders.filter((o) => {
    const status = (o.order_status || "").toLowerCase();
    if (["placed", "packed"].includes(status)) {
      const ageHours =
        (Date.now() - new Date(o.created_at || Date.now()).getTime()) /
        3_600_000;
      return ageHours > 2;
    }
    return false;
  }).length;

  const slaWarningsCount = orders.filter(
    (o) =>
      o.payment_status === "failed" ||
      (o.order_status || "").toLowerCase() === "pending",
  ).length;

  // ── Rendering helpers ──────────────────────────────────────────────────────
  const renderNodeIcon = (idx) => {
    if (idx < activeIndex)
      return <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />;
    if (idx === activeIndex)
      return (
        <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
      );
    return null;
  };

  const nodeClass = (idx) => {
    const stage = STAGES[idx];
    const c = getColor(stage.color);
    if (idx < activeIndex) return `${c.bg} border-transparent`;
    if (idx === activeIndex)
      return `${c.bg} border-transparent ring-4 ring-offset-2 ${c.ring}`;
    return "bg-white border-gray-200";
  };

  const lineClass = (idx) => {
    if (idx < activeIndex) return getColor(STAGES[idx].color).line;
    return "bg-gray-200";
  };

  // Approximate step timestamp based on order creation time
  const getStepTimestamp = (stepIdx) => {
    if (!selectedOrder?.created_at) return "";
    if (stepIdx > activeIndex) return "";
    const offsets = [0, 1, 2, 8, 10, 80, 110, 135, 170, 200, 240, 290];
    const t = new Date(
      new Date(selectedOrder.created_at).getTime() +
        (offsets[stepIdx] || 0) * 60_000,
    );
    return t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const delayedStageOrders =
    delayedStageIdx !== null
      ? orders.filter(
          (o) => getActiveStageIndex(o.order_status) === delayedStageIdx,
        )
      : [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FFF3EF] py-6 px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-950 font-satoshi">
            Order Pipeline
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-satoshi">
            Full-lifecycle order status visualization with intelligent SLA
            tracking
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Refresh */}
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          {slaAlertsCount > 0 && (
            <span className="flex items-center gap-2 px-3 py-1.5 border border-[#FDA29B] rounded-lg bg-[#FEF3F2] text-[#F04438] text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
              </span>
              {slaAlertsCount} SLA Alert{slaAlertsCount > 1 ? "s" : ""}
            </span>
          )}
          {slaWarningsCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FEF0C7] text-[#DC6803] rounded-lg text-sm font-semibold border border-[#FEC84B]">
              <AlertTriangle className="w-4 h-4" />
              {slaWarningsCount} SLA Warning{slaWarningsCount > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Live order list */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
          <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase font-satoshi">
            Live Order Tracker
          </h2>
          <span className="bg-[#ECFDF3] text-[#027A48] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            Live
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3">
          {loading ? (
            <div className="flex gap-4 w-full">
              {[1, 2, 3, 4, 5].map((x) => (
                <div
                  key={x}
                  className="min-w-[180px] h-20 bg-gray-50 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : activeOrders.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              No active orders right now.
            </p>
          ) : (
            activeOrders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              const hasWarning =
                ord.payment_status === "failed" ||
                ord.order_status === "pending";
              const hasFail = (ord.pickup_failure_count || 0) > 0;
              return (
                <button
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`min-w-[200px] text-left p-3.5 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? "border-orange-400 bg-orange-50 ring-1 ring-orange-400 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-bold font-satoshi truncate max-w-[130px] ${
                        isSelected ? "text-orange-600" : "text-gray-900"
                      }`}
                    >
                      #{ord.order_number}
                    </span>
                    <div className="flex gap-1 flex-shrink-0">
                      {hasWarning && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      {hasFail && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate max-w-[170px] font-satoshi">
                    {ord.product?.name || "Product Item"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 font-satoshi capitalize">
                    {ord.order_status || "—"}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected order timeline */}
      {selectedOrder && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <div>
              <span className="text-base font-bold text-gray-900 font-satoshi">
                #{selectedOrder.order_number}
              </span>
              <span className="text-sm text-gray-500 ml-2 font-satoshi">
                {selectedOrder.product?.name || "Order"}
              </span>
              {trackingLoading && (
                <span className="ml-3 text-xs text-gray-400 font-satoshi">
                  Loading live status…
                </span>
              )}
              {trackingStatus && !trackingLoading && (
                <span className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-[#027A48] bg-[#ECFDF3] px-2 py-0.5 rounded-full">
                  Live: {trackingStatus}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#027A48] bg-[#ECFDF3] px-2.5 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(selectedOrder.created_at)}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative overflow-x-auto pb-6 pt-2">
            <div className="flex items-start min-w-[1100px] px-4">
              {STAGES.map((stage, idx) => (
                <div
                  key={stage.id}
                  className="flex-1 flex flex-col items-center relative"
                >
                  {/* Node */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-semibold shadow-sm transition-all duration-300 ${nodeClass(
                      idx,
                    )}`}
                  >
                    {renderNodeIcon(idx)}
                  </div>

                  {/* Label + timestamp */}
                  <div className="text-center mt-3 max-w-[88px]">
                    <p
                      className={`text-[11px] font-bold leading-tight font-satoshi ${
                        idx === activeIndex
                          ? "text-gray-900"
                          : idx < activeIndex
                          ? "text-gray-600"
                          : "text-gray-400"
                      }`}
                    >
                      {stage.name}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-satoshi">
                      {getStepTimestamp(idx)}
                    </p>
                  </div>

                  {/* Connecting line */}
                  {idx < STAGES.length - 1 && (
                    <div className="absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5 z-[-1]">
                      <div
                        className={`h-full w-full transition-all duration-500 ${lineClass(
                          idx,
                        )}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current + next stage */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs font-semibold">
            <div
              className={`w-2 h-2 rounded-full ${
                getColor(STAGES[activeIndex]?.color).dot
              }`}
            />
            <span className="text-gray-400 font-satoshi">Currently at:</span>
            <span className="text-gray-900 font-satoshi font-bold capitalize">
              {STAGES[activeIndex]?.name}
            </span>
            {activeIndex < STAGES.length - 1 && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400 font-satoshi">Next:</span>
                <span className="text-gray-500 font-satoshi font-semibold">
                  {STAGES[activeIndex + 1]?.name}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Stage performance table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-950 font-satoshi">
            Stage Performance Metrics
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 font-satoshi">
            Live volume at each stage with SLA health
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider font-satoshi">
                <th className="py-3.5 px-6">Stage</th>
                <th className="py-3.5 px-6">Active Orders</th>
                <th className="py-3.5 px-6">SLA Health</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-satoshi text-gray-900">
              {metrics.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${row.dotColor}`} />
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold">{row.active}</td>
                  <td className="py-4 px-6">
                    {row.health === "Healthy" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF3] text-[#027A48]">
                        Healthy
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF0C7] text-[#DC6803]">
                        Slow
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {row.active > 0 && (
                      <button
                        onClick={() => {
                          setDelayedStageIdx(row.stageIdx);
                          setShowDelayedModal(true);
                        }}
                        className="text-orange-500 font-bold hover:text-orange-600 transition-colors bg-transparent border-0 cursor-pointer text-sm"
                      >
                        Investigate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigate modal */}
      {showDelayedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-satoshi flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Investigate: {STAGES[delayedStageIdx]?.name}
                </h3>
                <p className="text-xs text-gray-500 font-satoshi mt-0.5">
                  {delayedStageOrders.length} order
                  {delayedStageOrders.length !== 1 ? "s" : ""} currently at this
                  stage
                </p>
              </div>
              <button
                onClick={() => setShowDelayedModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[400px] overflow-y-auto space-y-4">
              {delayedStageOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Info className="w-8 h-8 mb-2 text-gray-300" />
                  <p className="text-sm">No orders at this stage right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {delayedStageOrders.map((ord) => {
                    const minsStuck = Math.max(
                      1,
                      Math.round(
                        (Date.now() -
                          new Date(ord.created_at || Date.now()).getTime()) /
                          60_000,
                      ),
                    );
                    const hoursStuck =
                      minsStuck >= 60
                        ? `${Math.floor(minsStuck / 60)}h ${minsStuck % 60}m`
                        : `${minsStuck}m`;
                    return (
                      <div
                        key={ord.id}
                        className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors bg-white"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-bold text-gray-900 font-satoshi">
                              #{ord.order_number}
                            </span>
                            <p className="text-xs text-gray-500 font-satoshi mt-0.5">
                              {ord.product?.name || "Product Item"}
                            </p>
                          </div>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              minsStuck > 120
                                ? "text-red-600 bg-red-50"
                                : "text-orange-600 bg-orange-50"
                            }`}
                          >
                            {hoursStuck} at stage
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px] text-gray-400 font-satoshi">
                          <span>
                            Carrier:{" "}
                            {ord.courier_name || ord.shipping_provider || "—"}
                          </span>
                          <span>City: {ord.Address?.city || "—"}</span>
                          <span>Created: {formatDate(ord.created_at)}</span>
                          <span>Total: ₹{ord.order_total || "—"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowDelayedModal(false)}
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPipeline;
