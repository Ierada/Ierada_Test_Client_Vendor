import React, { useState } from "react";
import { Truck, Package } from "lucide-react";
import { createSelfShip } from "../../../../services/api.order";
import { initiateShipping } from "../../../../services/api.shipping";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../../utils/notification/toast";

const SelfShipForm = ({ orderId, onSuccess }) => {
  const [form, setForm] = useState({
    courier_name: "",
    tracking_id: "",
    expected_delivery_date: "",
    tracking_url: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.courier_name || !form.tracking_id || !form.expected_delivery_date) {
      notifyOnFail("Courier name, AWB, and expected delivery date are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await createSelfShip(orderId, form);
      if (res?.status === 1) {
        notifyOnSuccess("Order shipped via Self Ship!");
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
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm"
        placeholder="Courier partner name *"
        value={form.courier_name}
        onChange={(e) => setForm((p) => ({ ...p, courier_name: e.target.value }))}
      />
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm"
        placeholder="AWB / Tracking ID *"
        value={form.tracking_id}
        onChange={(e) => setForm((p) => ({ ...p, tracking_id: e.target.value }))}
      />
      <input
        type="date"
        className="w-full border rounded-lg px-3 py-2 text-sm"
        value={form.expected_delivery_date}
        onChange={(e) =>
          setForm((p) => ({ ...p, expected_delivery_date: e.target.value }))
        }
      />
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm"
        placeholder="Tracking URL (optional)"
        value={form.tracking_url}
        onChange={(e) => setForm((p) => ({ ...p, tracking_url: e.target.value }))}
      />
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

export const MarkShippedStep = ({ orderData, onRefresh }) => {
  const [mode, setMode] = useState(null);
  const [courierLoading, setCourierLoading] = useState(false);

  if (!orderData) return null;

  const selfShipAccess = orderData.selfShipAccess;
  const orderId = orderData.rowId;
  const isSelfShip = orderData.shippingProvider === "self_ship";
  const alreadyShipped = ["shipped", "intransit", "delivered"].includes(
    String(orderData.status || "").toLowerCase(),
  );

  const bookCourier = async () => {
    setCourierLoading(true);
    try {
      const res = await initiateShipping(orderId);
      if (res?.status === 1) {
        notifyOnSuccess("Order booked with courier!");
        onRefresh?.();
      } else {
        notifyOnFail(res?.message || "Courier booking failed");
      }
    } finally {
      setCourierLoading(false);
    }
  };

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

  return (
    <div className="p-6 space-y-4">
      <p className="text-sm text-gray-600">
        Choose how you want to ship this order.
      </p>

      {!mode && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("courier")}
            className="flex items-center gap-3 p-4 border rounded-xl hover:border-orange-400 hover:bg-orange-50 text-left"
          >
            <Truck className="w-5 h-5 text-orange-500" />
            <div>
              <p className="font-semibold text-sm">Courier (Auto)</p>
              <p className="text-xs text-gray-500">Shadowfax / Shri Maruti / Shipease</p>
            </div>
          </button>
          {selfShipAccess && (
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
          )}
        </div>
      )}

      {mode === "courier" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={bookCourier}
            disabled={courierLoading}
            className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold"
          >
            {courierLoading ? "Booking…" : "Book with Courier"}
          </button>
          <button type="button" onClick={() => setMode(null)} className="text-xs text-gray-500">
            ← Change method
          </button>
        </div>
      )}

      {mode === "self_ship" && (
        <div className="space-y-3">
          <SelfShipForm orderId={orderId} onSuccess={onRefresh} />
          <button type="button" onClick={() => setMode(null)} className="text-xs text-gray-500">
            ← Change method
          </button>
        </div>
      )}
    </div>
  );
};

export default MarkShippedStep;
