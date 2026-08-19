import React, { useCallback, useEffect, useRef, useState } from "react";
import { Truck, Package, Loader2 } from "lucide-react";
import { createSelfShip } from "../../../../services/api.order";
import { initiateShipping } from "../../../../services/api.shipping";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../../utils/notification/toast";
import {
  formatDdMmYyyyDisplay,
  sanitizeDdMmYyyy,
  todayDdMmYyyy,
  validateSelfShipPayload,
} from "../utils/selfShipForm";

const SelfShipForm = ({ orderId, onSuccess }) => {
  const [form, setForm] = useState({
    courier_name: "",
    tracking_id: "",
    expected_delivery_date: todayDdMmYyyy(),
    tracking_url: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const check = validateSelfShipPayload(form);
    if (!check.ok) {
      notifyOnFail(check.message);
      return;
    }
    setLoading(true);
    try {
      const res = await createSelfShip(orderId, check.payload);
      if (res?.status === 1) {
        notifyOnSuccess("Order marked as shipped via Self Ship.");
        onSuccess?.();
      } else {
        notifyOnFail(res?.message || "Failed to self-ship");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/50 space-y-3">
      <p className="text-sm font-bold text-gray-900">Self Ship details</p>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Courier partner name *
        </label>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="e.g. Delhivery, DTDC"
          value={form.courier_name}
          onChange={(e) => setForm((p) => ({ ...p, courier_name: e.target.value }))}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          AWB / Tracking ID *
        </label>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Enter AWB number"
          value={form.tracking_id}
          onChange={(e) => setForm((p) => ({ ...p, tracking_id: e.target.value }))}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Expected delivery date (DDMMYYYY) *
        </label>
        <input
          inputMode="numeric"
          className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
          placeholder="DDMMYYYY"
          value={formatDdMmYyyyDisplay(form.expected_delivery_date)}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              expected_delivery_date: sanitizeDdMmYyyy(e.target.value),
            }))
          }
        />
        <p className="text-[11px] text-gray-500 mt-1">
          Pre-filled with today&apos;s date — change if delivery is later.
        </p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Tracking URL *
        </label>
        <input
          type="url"
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="https://track.courier.com/..."
          value={form.tracking_url}
          onChange={(e) => setForm((p) => ({ ...p, tracking_url: e.target.value }))}
        />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? "Shipping…" : "Submit Self Ship"}
      </button>
    </div>
  );
};

export const MarkShippedStep = ({ orderData, onShipSuccess }) => {
  const selfShipAccess = Boolean(orderData?.selfShipAccess);
  const [mode, setMode] = useState(selfShipAccess ? null : "courier");
  const [courierLoading, setCourierLoading] = useState(false);
  const [courierError, setCourierError] = useState("");
  const bookedRef = useRef(false);

  const orderId = orderData?.rowId;
  const isSelfShip = orderData?.shippingProvider === "self_ship";
  const alreadyShipped = ["shipped", "intransit", "delivered"].includes(
    String(orderData?.status || "").toLowerCase(),
  );

  const bookCourier = useCallback(async () => {
    if (!orderId || bookedRef.current) return;
    bookedRef.current = true;
    setCourierLoading(true);
    setCourierError("");
    try {
      const res = await initiateShipping(orderId);
      if (res?.status === 1) {
        notifyOnSuccess("Order marked as shipped.");
        onShipSuccess?.();
      } else {
        bookedRef.current = false;
        const msg = res?.message || "Courier booking failed";
        setCourierError(msg);
        notifyOnFail(msg);
      }
    } catch (err) {
      bookedRef.current = false;
      const msg = err?.response?.data?.message || err?.message || "Courier booking failed";
      setCourierError(msg);
      notifyOnFail(msg);
    } finally {
      setCourierLoading(false);
    }
  }, [orderId, onShipSuccess]);

  useEffect(() => {
    bookedRef.current = false;
    setCourierError("");
  }, [orderId]);

  useEffect(() => {
    if (alreadyShipped || mode !== "courier" || !orderId) return;
    bookCourier();
  }, [alreadyShipped, mode, orderId, bookCourier]);

  if (!orderData) return null;

  if (alreadyShipped) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">
          Order is already shipped
          {isSelfShip ? " via Self Ship" : " with courier partner"}.
        </p>
        {isSelfShip && orderData.trackingId && (
          <p className="text-sm mt-2">
            AWB: <span className="font-mono font-semibold">{orderData.trackingId}</span>
            {orderData.courierName ? ` · ${orderData.courierName}` : ""}
          </p>
        )}
      </div>
    );
  }

  if (mode === "courier") {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-3 min-h-[180px]">
        {courierLoading ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-sm text-gray-600">Booking courier…</p>
          </>
        ) : courierError ? (
          <div className="w-full max-w-md space-y-3 text-center">
            <p className="text-sm text-red-600">{courierError}</p>
            <button
              type="button"
              onClick={() => {
                bookedRef.current = false;
                bookCourier();
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold"
            >
              Retry booking
            </button>
            {selfShipAccess && (
              <button
                type="button"
                onClick={() => {
                  bookedRef.current = false;
                  setMode(null);
                  setCourierError("");
                }}
                className="block w-full text-xs text-gray-500"
              >
                ← Use Self Ship instead
              </button>
            )}
          </div>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-sm text-gray-600">Starting courier booking…</p>
          </>
        )}
      </div>
    );
  }

  if (mode === "self_ship") {
    return (
      <div className="p-6 space-y-4">
        <SelfShipForm orderId={orderId} onSuccess={onShipSuccess} />
        <button type="button" onClick={() => setMode(null)} className="text-xs text-gray-500">
          ← Choose a different shipping method
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <p className="text-sm text-gray-600">Choose how you want to ship this order.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("courier")}
          className="flex items-center gap-3 p-4 border rounded-xl hover:border-orange-400 hover:bg-orange-50 text-left"
        >
          <Truck className="w-5 h-5 text-orange-500" />
          <div>
            <p className="font-semibold text-sm">Courier (Auto)</p>
            <p className="text-xs text-gray-500">Platform books automatically</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMode("self_ship")}
          className="flex items-center gap-3 p-4 border rounded-xl hover:border-orange-400 hover:bg-orange-50 text-left"
        >
          <Package className="w-5 h-5 text-orange-500" />
          <div>
            <p className="font-semibold text-sm">Self Ship</p>
            <p className="text-xs text-gray-500">Your own courier + AWB</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default MarkShippedStep;
