import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Loader2,
  AlertTriangle,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Package,
  Truck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Zap,
} from "lucide-react";
import {
  formatDate,
  formatTime,
} from "../../../utils/date&Time/dateAndTimeFormatter";
import {
  initiateShipping,
  manifestOrder,
  cancelShipping,
  getShippingRates,
  getTrackingDetails,
} from "../../../services/api.shipping";
import { updateOrderStatus } from "../../../services/api.order";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../utils/notification/toast";

// ─── Micro helpers ─────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n || 0);

const cap = (s) => (!s ? "—" : s.charAt(0).toUpperCase() + s.slice(1));
const fmtPh = (p) => (!p ? "—" : p.startsWith("+") ? p : `+91 ${p}`);

// Provider colour tokens
const PC = {
  self_ship: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  innofulfill: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  shadowfax: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  shiprocket: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
};
const pc = (n) =>
  PC[(n || "").toLowerCase()] || {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-700",
    dot: "bg-gray-400",
  };

// ─── Copy button ───────────────────────────────────────────────────────────────
const CopyBtn = ({ text }) => {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
      className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
      title="Copy"
    >
      {done ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
};

// ─── Collapsible section wrapper ───────────────────────────────────────────────
const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
};

// ─── Detail item ───────────────────────────────────────────────────────────────
const DI = ({ label, value, mono = false }) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p
      className={`text-sm font-medium text-gray-800 break-all ${
        mono ? "font-mono" : ""
      }`}
    >
      {value ?? "—"}
    </p>
  </div>
);

// ─── Shipping Panel ────────────────────────────────────────────────────────────
const ShippingPanel = ({ order, onOrderUpdate, onClose }) => {
  const [open, setOpen] = useState(true);
  const [showRates, setShowRates] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    order_status: "",
    tracking_id: "",
    tracking_url: "",
    courier_name: "",
    vendor_comment: "",
  });
  const [rates, setRates] = useState([]);
  const [zone, setZone] = useState(null);
  const [weightKg, setWeightKg] = useState(null);
  const [warehouseSource, setWarehouseSource] = useState(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [initiating, setInitiating] = useState(false);
  const [manifesting, setManifesting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [loadingLive, setLoadingLive] = useState(false);

  // Derive shipping mode from order data
  const [shippingMode, setShippingMode] = useState(
    order?.shipping_provider === "self_ship"
      ? "self_ship"
      : "shipping_provider",
  );

  const isSelfShipMode = shippingMode === "self_ship";
  const isShipped = Boolean(
    order?.shipping_provider || order?.provider_order_id,
  );
  const isManifested = Boolean(order?.is_manifested);
  const failures = parseInt(order?.pickup_failure_count || 0);
  const canShip =
    order?.order_status === "placed" || order?.order_status === "pending";

  const clear = () => {
    setErr(null);
    setOk(null);
  };

  // Fetch live tracking events when panel opens
  useEffect(() => {
    if (!open || !order?.id) return;
    const fetchLive = async () => {
      setLoadingLive(true);
      try {
        const resp = await getTrackingDetails(order.id);
        const payload = resp?.data || resp;
        const rawEvents =
          payload?.events ||
          payload?.data?.events ||
          payload?.orderStateInfo ||
          payload?.raw?.orderStateInfo ||
          payload?.data ||
          payload ||
          [];
        const eventArray = Array.isArray(rawEvents) ? rawEvents : [];
        setLiveEvents(
          eventArray.map((e) => ({
            status:
              e.status ||
              e.orderStatus ||
              e.state ||
              e.key ||
              e.name ||
              e.title ||
              "Update",
            message:
              e.description ||
              e.message ||
              e.remark ||
              e.note ||
              e.reason ||
              "",
            when:
              e.statusUpdatedAt ||
              e.timestamp ||
              e.time ||
              e.createdAt ||
              e.updatedAt ||
              e.date
                ? new Date(
                    e.statusUpdatedAt ||
                      e.timestamp ||
                      e.time ||
                      e.createdAt ||
                      e.updatedAt ||
                      e.date,
                  )
                : null,
          })),
        );
      } catch {
        /* ignore – tracking might not exist yet */
      } finally {
        setLoadingLive(false);
      }
    };
    fetchLive();
  }, [open, order?.id]);

  // Fetch rates when rate panel opens
  const loadRates = useCallback(async () => {
    if (!order?.id) return;
    setLoadingRates(true);
    clear();
    try {
      const res = await getShippingRates(order.id);
      setRates(res?.data?.rates || []);
      setZone(res?.data?.zone);
      setWeightKg(res?.data?.weightKg);
      setWarehouseSource(res?.data?.warehouseSource || null);
    } catch {
      setErr("Failed to load shipping rates");
    } finally {
      setLoadingRates(false);
    }
  }, [order?.id]);

  useEffect(() => {
    if (showRates) loadRates();
  }, [showRates, loadRates]);

  // ── Self-ship form helpers ────────────────────────────────────────────────
  const handleEdit = () => {
    setFormData({
      order_status: "shipped",
      tracking_id: order.tracking_id || "",
      tracking_url: order.tracking_url || "",
      courier_name: order.courier_name || "",
      vendor_comment: order.vendor_comment || "",
    });
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        shipping_option: "self_ship",
        shipping_provider: "self_ship",
      };
      const response = await updateOrderStatus(order.id, payload);
      if (response?.status === 1) {
        notifyOnSuccess("Order marked as shipped!");
        onOrderUpdate?.({
          ...order,
          ...formData,
          shipping_provider: "self_ship",
        });
        setIsEditing(false);
        onClose?.();
      } else {
        notifyOnFail("Failed to update order");
      }
    } catch (error) {
      notifyOnFail(error?.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ── Provider action helpers ───────────────────────────────────────────────
  const doInitiate = async () => {
    setInitiating(true);
    clear();
    try {
      const res = await initiateShipping(order.id, selectedProvider);
      if (res?.status === 1) {
        setOk(
          `✅ Shipped via ${res.data?.provider} · AWB: ${
            res.data?.awb || "—"
          } · Zone: ${res.data?.zone || "—"}`,
        );
        notifyOnSuccess("Shipping initiated successfully!");
        onOrderUpdate?.();
        onClose?.();
      } else {
        setErr(res?.message || "Failed to initiate shipping");
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setInitiating(false);
    }
  };

  const doManifest = async () => {
    if (
      !window.confirm(
        "Manifest this order?\n\n• Order will be LOCKED on courier side\n• Cannot be edited or cancelled via API\n• Pickup will be scheduled\n\nOnly proceed when order is packed and ready.",
      )
    )
      return;
    setManifesting(true);
    clear();
    try {
      const res = await manifestOrder(order.id);
      if (res?.status === 1) {
        setOk("✅ Order manifested. Courier will schedule pickup.");
        notifyOnSuccess("Order manifested successfully!");
        onOrderUpdate?.();
        onClose?.();
      } else {
        setErr(res?.message || "Manifest failed");
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setManifesting(false);
    }
  };

  const doCancel = async () => {
    if (
      !window.confirm(
        "Cancel shipping? This will cancel on the courier side. You can re-initiate after.",
      )
    )
      return;
    setCancelling(true);
    clear();
    try {
      const res = await cancelShipping(order.id);
      if (res?.success || res?.status === 1) {
        setOk("✅ Shipping cancelled.");
        notifyOnSuccess("Shipping cancelled successfully!");
        onOrderUpdate?.();
        onClose?.();
      } else {
        setErr(res?.message || "Cancel failed");
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Panel header */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <Truck className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">
            Shipping Management
          </span>
          {isManifested && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              <Lock className="w-2.5 h-2.5" /> Manifested
            </span>
          )}
          {isShipped && !isManifested && !isSelfShipMode && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Shipped · Editable
            </span>
          )}
          {failures > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-2.5 h-2.5" /> Pickup Failed ×
              {failures}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="p-4 space-y-4">
          {/* Pickup failure alert */}
          {failures > 0 && (
            <div className="flex gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Pickup Failure Reset
                </p>
                <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
                  Innofulfill failed {failures} pickup attempt
                  {failures > 1 ? "s" : ""} and reset the order to NEW.
                  Re-manifest after confirming, or contact support.
                </p>
                {order?.pickup_reset_at && (
                  <p className="text-xs text-red-400 mt-1">
                    Last reset: {formatDate(order.pickup_reset_at)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Shipping mode selector — only when not yet shipped */}
          {!isShipped && canShip && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Shipping Mode
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="shippingMode"
                    value="self_ship"
                    checked={shippingMode === "self_ship"}
                    onChange={(e) => setShippingMode(e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  Self Ship
                </label>
                <label className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="shippingMode"
                    value="shipping_provider"
                    checked={shippingMode === "shipping_provider"}
                    onChange={(e) => setShippingMode(e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  Auto Ship
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {shippingMode === "self_ship"
                  ? "Use the self-ship form below to record manual delivery details."
                  : "Use the existing provider flow for auto shipping."}
              </p>
            </div>
          )}

          {/* Self-ship form */}
          {isSelfShipMode && canShip && (
            <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-3">
              {!isEditing ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      Self-Ship Update
                    </p>
                    <p className="text-xs text-blue-700">
                      Add courier, tracking, and delivery notes for this order.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Mark as Shipped
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="hidden"
                    name="order_status"
                    value={formData.order_status}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Courier Name *
                      </label>
                      <input
                        type="text"
                        name="courier_name"
                        value={formData.courier_name}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            courier_name: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. FedEx, DTDC, Delhivery"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Tracking ID *
                      </label>
                      <input
                        type="text"
                        name="tracking_id"
                        value={formData.tracking_id}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            tracking_id: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter tracking number"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Tracking URL
                      </label>
                      <input
                        type="url"
                        name="tracking_url"
                        value={formData.tracking_url}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            tracking_url: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/track/..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Shipping Notes
                    </label>
                    <textarea
                      name="vendor_comment"
                      value={formData.vendor_comment}
                      rows="3"
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          vendor_comment: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any notes about shipping or delivery..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {loading ? "Updating…" : "Save Shipment"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Self-ship mode notice (already shipped via self-ship) */}
          {isSelfShipMode && isShipped && (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                Self-Ship Mode
              </p>
              <p className="text-sm text-amber-800">
                This order is being handled directly by the vendor. Provider
                actions are disabled.
              </p>
            </div>
          )}

          {/* Shipped details chips */}
          {isShipped && (
            <div className="grid grid-cols-2 gap-2.5">
              {order.shipping_provider && (
                <div
                  className={`p-3 rounded-xl border ${
                    pc(order.shipping_provider).bg
                  } ${pc(order.shipping_provider).border}`}
                >
                  <p className="text-xs text-gray-500 mb-1">Provider</p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        pc(order.shipping_provider).dot
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold capitalize ${
                        pc(order.shipping_provider).text
                      }`}
                    >
                      {order.shipping_provider}
                    </span>
                  </div>
                </div>
              )}
              {order.shipping_zone && (
                <div className="p-3 rounded-xl border bg-gray-50 border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Zone</p>
                  <p className="text-sm font-semibold capitalize text-gray-700">
                    {order.shipping_zone?.replace(/_/g, " ")}
                  </p>
                </div>
              )}
              {order.tracking_id && (
                <div className="col-span-2 p-3 rounded-xl border bg-blue-50 border-blue-200">
                  <p className="text-xs text-blue-500 mb-1">
                    AWB / Tracking ID
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-mono font-semibold text-blue-800">
                      {order.tracking_id}
                    </span>
                    <CopyBtn text={order.tracking_id} />
                    {order.tracking_url && (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        Track <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live tracking events */}
          {loadingLive && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Fetching live
              tracking…
            </p>
          )}
          {!loadingLive && liveEvents.length > 0 && (
            <div className="p-3 rounded-xl border border-gray-100 bg-white">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Live Tracking Events
              </p>
              <ul className="text-xs text-gray-700 space-y-2">
                {liveEvents.map((ev, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <div>
                      <div className="font-medium">{ev.status}</div>
                      {ev.message && (
                        <div className="text-gray-500">{ev.message}</div>
                      )}
                    </div>
                    <div className="text-gray-400 whitespace-nowrap">
                      {ev.when ? formatDate(ev.when) : "N/A"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rate comparison */}
          {(canShip || (isShipped && failures > 0 && !isManifested)) && (
            <div>
              <button
                type="button"
                onClick={() => setShowRates((p) => !p)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0164CE] hover:text-blue-800 transition-colors"
              >
                <Zap className="w-4 h-4" />
                {showRates ? "Hide" : "Compare"} Provider Rates
                {showRates ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showRates && (
                <div className="mt-3 space-y-2">
                  {loadingRates ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading
                      rates…
                    </div>
                  ) : rates.length === 0 ? (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      No rate cards found for this route. Please contact admin
                      to add shipping rate cards.
                    </p>
                  ) : (
                    <>
                      {zone && weightKg && (
                        <p className="text-xs text-gray-400">
                          Zone:{" "}
                          <b className="text-gray-600 capitalize">
                            {zone.replace(/_/g, " ")}
                          </b>
                          &nbsp;·&nbsp;Weight:{" "}
                          <b className="text-gray-600">{weightKg} kg</b>
                          {warehouseSource === "shop_address" && (
                            <span className="ml-2 inline-flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-xs">
                              <MapPin className="w-2.5 h-2.5" /> Using shop
                              address as pickup
                            </span>
                          )}
                        </p>
                      )}
                      {rates.map((rate, i) => (
                        <button
                          key={rate.provider}
                          type="button"
                          onClick={() =>
                            setSelectedProvider((p) =>
                              p === rate.provider ? null : rate.provider,
                            )
                          }
                          className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                            selectedProvider === rate.provider
                              ? "border-[#0164CE] bg-blue-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {i === 0 && (
                              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                CHEAPEST
                              </span>
                            )}
                            <span
                              className={`w-2 h-2 rounded-full ${
                                pc(rate.provider).dot
                              }`}
                            />
                            <span
                              className={`text-sm font-semibold capitalize ${
                                pc(rate.provider).text
                              }`}
                            >
                              {rate.provider}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-800">
                              {fmt(rate.total)}
                            </p>
                            <p className="text-xs text-gray-400">
                              +GST {fmt(rate.gst)}
                            </p>
                          </div>
                        </button>
                      ))}
                      <p className="text-xs text-gray-400">
                        {selectedProvider
                          ? `Using ${selectedProvider} (manual). Click again to deselect.`
                          : rates[0]
                          ? `Auto: ${rates[0].provider} @ ${fmt(
                              rates[0].total,
                            )}`
                          : ""}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Feedback messages */}
          {err && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {err}
            </div>
          )}
          {ok && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {ok}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Initiate shipping */}
            {!isShipped && canShip && !isSelfShipMode && (
              <button
                type="button"
                onClick={doInitiate}
                disabled={initiating}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0164CE] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {initiating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Truck className="w-3.5 h-3.5" />
                )}
                {initiating
                  ? "Initiating…"
                  : selectedProvider
                  ? `Ship via ${selectedProvider}`
                  : "Initiate Shipping"}
              </button>
            )}

            {/* Re-initiate after pickup failure */}
            {isShipped && failures > 0 && !isManifested && !isSelfShipMode && (
              <button
                type="button"
                onClick={doInitiate}
                disabled={initiating}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {initiating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                {initiating ? "Re-initiating…" : "Re-initiate Shipping"}
              </button>
            )}

            {/* Manifest */}
            {isShipped && !isManifested && !isSelfShipMode && (
              <button
                type="button"
                onClick={doManifest}
                disabled={manifesting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {manifesting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Package className="w-3.5 h-3.5" />
                )}
                {manifesting ? "Manifesting…" : "Manifest Order"}
              </button>
            )}

            {/* Cancel shipping */}
            {isShipped && !isManifested && !isSelfShipMode && (
              <button
                type="button"
                onClick={doCancel}
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {cancelling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                {cancelling ? "Cancelling…" : "Cancel Shipping"}
              </button>
            )}

            {/* Manifested lock */}
            {isManifested && (
              <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl">
                <Lock className="w-3.5 h-3.5" /> Manifested — Contact courier to
                cancel
              </div>
            )}

            {/* Cannot ship yet */}
            {!isShipped && !canShip && (
              <p className="text-xs text-gray-400 italic">
                Shipping can only be initiated for orders in "Placed" status.
              </p>
            )}
          </div>

          {isShipped && !isManifested && !isSelfShipMode && (
            <p className="text-xs text-gray-400 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
              Manifest only when order is packed and ready. Action is
              irreversible via API.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main OrderModal ───────────────────────────────────────────────────────────
const OrderModal = ({ isOpen, onClose, order, onOrderUpdate }) => {
  if (!isOpen || !order) return null;

  const failures = parseInt(order?.pickup_failure_count || 0);
  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price || 0);
  const toUpper = (str) =>
    !str || typeof str !== "string"
      ? "N/A"
      : str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Order Details
              </h2>
              <p className="text-xs font-mono text-gray-500">
                {order.order_number}
              </p>
            </div>
            {failures > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Pickup Failed ×{failures}
              </span>
            )}
            {order.is_manifested && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                <Lock className="w-3 h-3" /> Manifested
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Order Information */}
          <Section title="Order Information">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DI label="Order ID" value={order.order_number} mono />
              <DI
                label="Order Date"
                value={`${formatDate(order.created_at)} ${formatTime(
                  order.created_at,
                )}`}
              />
              <DI label="Order Status" value={toUpper(order.order_status)} />
              <DI
                label="Payment Type"
                value={
                  order.payment_type === "cod" ? "COD" : cap(order.payment_type)
                }
              />
              <DI
                label="Payment Status"
                value={toUpper(order.payment_status)}
              />
              <DI label="Payment ID" value={order.payment_id || "N/A"} mono />
              {order.shipping_provider && (
                <DI
                  label="Shipping Provider"
                  value={
                    order.shipping_provider === "self_ship"
                      ? "Self Ship"
                      : cap(order.shipping_provider)
                  }
                />
              )}
              <DI
                label="Return Type"
                value={
                  order.instant_return_checked
                    ? "Instant Return"
                    : "Normal Return"
                }
              />
            </div>
          </Section>

          {/* Shipping Address */}
          <Section title="Shipping Address" defaultOpen={false}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DI
                label="Name"
                value={`${order?.Address?.first_name || ""} ${
                  order?.Address?.last_name || ""
                }`.trim()}
              />
              <DI label="Phone" value={fmtPh(order?.Address?.phone)} />
              <DI label="Email" value={order?.Address?.email} />
              <DI label="Address" value={order?.Address?.street_address} />
              <DI label="City" value={order?.Address?.city} />
              <DI label="State" value={order?.Address?.state} />
              <DI label="ZIP" value={order?.Address?.zip} />
            </div>
          </Section>

          {/* Billing Address */}
          {order?.BillingAddress && (
            <Section title="Billing Address" defaultOpen={false}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DI
                  label="Name"
                  value={`${order.BillingAddress.first_name || ""} ${
                    order.BillingAddress.last_name || ""
                  }`.trim()}
                />
                <DI label="Phone" value={fmtPh(order.BillingAddress.phone)} />
                <DI label="Email" value={order.BillingAddress.email} />
                <DI
                  label="Address"
                  value={order.BillingAddress.street_address}
                />
                <DI label="City" value={order.BillingAddress.city} />
                <DI label="State" value={order.BillingAddress.state} />
                <DI label="ZIP" value={order.BillingAddress.zip} />
              </div>
            </Section>
          )}

          {/* Product Details */}
          <Section title="Product Details" defaultOpen={false}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DI label="Quantity" value={order?.qty} />
              {order.product && (
                <>
                  <DI label="Product" value={order.product?.name} />
                  <DI label="SKU" value={order.product?.variations?.sku} mono />
                  {order.product?.variations && (
                    <>
                      <DI
                        label="Color"
                        value={cap(order.product.variations?.color_name)}
                      />
                      <DI label="Size" value={order.product.variations?.size} />
                    </>
                  )}
                  {order.product?.images?.[0] && (
                    <div className="col-span-2 md:col-span-3">
                      <img
                        src={order.product.images[0]}
                        alt={order.product.name}
                        className="h-32 object-contain rounded-xl border bg-gray-50"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </Section>

          {/* Price Breakdown */}
          <Section title="Price Breakdown" defaultOpen={false}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DI label="Base Price" value={formatPrice(order?.price)} />
              <DI label="Tax" value={formatPrice(order?.tax)} />
              <DI
                label="Shipping Charges"
                value={formatPrice(order?.shipping_charges)}
              />
              <DI
                label="Product Discount"
                value={formatPrice(order?.product_discount_amount)}
              />
              {order?.coupon_discount_amount > 0 && (
                <DI
                  label="Coupon Discount"
                  value={formatPrice(order?.coupon_discount_amount)}
                />
              )}
              <DI label="Order Total" value={formatPrice(order?.order_total)} />
              {order?.Coupon && (
                <DI label="Coupon" value={order.Coupon?.coupon_name} />
              )}
              {order?.product?.total_discount > 0 && (
                <DI
                  label="Total Discount"
                  value={formatPrice(order.product?.total_discount)}
                />
              )}
            </div>
          </Section>

          {/* Manual tracking read-only (self-ship orders already shipped) */}
          {(order?.tracking_id || order?.tracking_url || order?.courier_name) &&
            !order?.shipping_provider && (
              <Section title="Manual Tracking Info" defaultOpen={false}>
                <div className="grid grid-cols-2 gap-4">
                  {order.courier_name && (
                    <DI label="Courier" value={order.courier_name} />
                  )}
                  {order.tracking_id && (
                    <DI label="Tracking ID" value={order.tracking_id} mono />
                  )}
                  {order.tracking_url && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        Tracking Link
                      </p>
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Track Package <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                  {order.vendor_comment && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-0.5">
                        Shipping Notes
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {order.vendor_comment}
                      </p>
                    </div>
                  )}
                </div>
              </Section>
            )}

          {/* ── Shipping Panel ── */}
          <ShippingPanel
            order={order}
            onOrderUpdate={onOrderUpdate}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
