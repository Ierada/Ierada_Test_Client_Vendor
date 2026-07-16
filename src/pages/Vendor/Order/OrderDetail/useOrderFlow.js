import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getOrderByOrderId,
  updateOrderStatus,
} from "../../../../services/api.order";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../../utils/notification/toast";

// ─── Status classification ─────────────────────────────────────────────────────
const TERMINAL_STATUSES = new Set([
  "delivered",
  "cancelled",
  "rejected",
  "returned",
  "replaced",
  "return initiated",
  "return pending",
  "replacement initiated",
  "replacement pending",
]);

const statusToInitialStep = (status) => {
  const s = (status || "").toLowerCase().replace(/[\s_]+/g, "");
  if (["placed", "pending"].includes(s)) return 1;
  if (s === "accepted") return 2;
  if (s === "packed") return 3;
  if (["shipped", "intransit", "outfordelivery"].includes(s)) return 4;
  // Terminal or unknown → step 1 read-only
  return 1;
};

const isTerminalStatus = (status) =>
  TERMINAL_STATUSES.has((status || "").toLowerCase());

const isPlacedStatus = (status) =>
  ["placed", "pending"].includes((status || "").toLowerCase());

const isShippedStatus = (status) =>
  ["shipped", "intransit", "outfordelivery"].includes(
    (status || "").toLowerCase(),
  );

// ─── Next button label per step + status ──────────────────────────────────────
const getNextLabel = (step, status) => {
  if (step === 1) {
    if (isPlacedStatus(status)) return "Accept Order";
    if (isTerminalStatus(status)) return null; // no button
    return "Next";
  }
  if (step === 2) return "Confirm Invoice";
  if (step === 3) return "Generate Label";
  if (step === 4) {
    if (isShippedStatus(status)) return null; // no button
    return "Mark as Shipped";
  }
  return "Next";
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useOrderFlow = (orderId) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(false);

  // ── Fetch order ─────────────────────────────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await getOrderByOrderId(orderId);
      if (res?.status === 1) {
        setData(res.data);
        // Set the initial step from the live order status ONLY on first load
        // (after that the user drives step navigation)
        setStep((prev) => {
          // If this is initial load (step still 1 and data was null), set from status
          const derivedStep = statusToInitialStep(res.data?.orderStatus);
          // Always jump to the correct step on fresh load
          return derivedStep;
        });
      } else {
        notifyOnFail("Failed to load order details");
      }
    } catch (err) {
      console.error("useOrderFlow fetchOrder error:", err);
      notifyOnFail("Error loading order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const currentStatus = data?.orderStatus || "";
  const terminal = isTerminalStatus(currentStatus);
  const canGoNext = !terminal;
  const canGoBack = step > 1;
  const canCancel = ["placed", "accepted"].includes(
    currentStatus.toLowerCase(),
  );
  const nextLabel = getNextLabel(step, currentStatus);

  // ── handleNext ─────────────────────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    if (!canGoNext) return;

    // STEP 1 → 2
    if (step === 1) {
      if (isPlacedStatus(currentStatus)) {
        // Must accept via API
        setActLoading(true);
        try {
          const res = await updateOrderStatus(orderId, {
            order_status: "accepted",
          });
          if (res?.status === 1) {
            notifyOnSuccess("Order accepted!");
            await fetchOrder(); // refreshes data + updates currentStatus
            setStep(2);
          } else {
            notifyOnFail(res?.message || "Failed to accept order");
          }
        } catch (err) {
          notifyOnFail(err?.response?.data?.message || "Error accepting order");
        } finally {
          setActLoading(false);
        }
      } else {
        // Already accepted/packed/shipped — just navigate forward
        setStep(2);
      }
      return;
    }

    // STEP 2 → 3: no API, just advance
    if (step === 2) {
      setStep(3);
      return;
    }

    // STEP 3 → 4: no API, just advance
    if (step === 3) {
      setStep(4);
      return;
    }

    // STEP 4: mark as shipped (if not already shipped/beyond)
    if (step === 4) {
      const alreadyShipped = [
        "shipped",
        "intransit",
        "out_for_delivery",
        "outfordelivery",
        "delivered",
      ].includes(currentStatus.toLowerCase().replace(/[\s_]+/g, ""));

      if (alreadyShipped) {
        // Nothing to do — just show success or close
        notifyOnSuccess("Order is already shipped.");
        return;
      }

      setActLoading(true);
      try {
        const res = await updateOrderStatus(orderId, {
          order_status: "shipped",
        });
        if (res?.status === 1) {
          notifyOnSuccess("Order marked as shipped!");
          await fetchOrder();
        } else {
          notifyOnFail(res?.message || "Failed to mark as shipped");
        }
      } catch (err) {
        notifyOnFail(err?.response?.data?.message || "Error updating order");
      } finally {
        setActLoading(false);
      }
    }
  }, [step, currentStatus, canGoNext, orderId, fetchOrder]);

  // ── handleBack ─────────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
    // step === 1 → parent handles (close modal / navigate back)
  }, [step]);

  // ── handleCancel ───────────────────────────────────────────────────────────
  const handleCancel = useCallback(async () => {
    // No status mutation — parent handles navigation/close
  }, []);

  return {
    step,
    setStep, // exposed so parent can jump to a specific step if needed
    data,
    loading,
    actLoading,
    handleNext,
    handleBack,
    handleCancel,
    refetch: fetchOrder,
    // Derived helpers consumed by FooterNav + OrderStepper
    currentStatus,
    isTerminal: terminal,
    canGoNext,
    canGoBack,
    canCancel,
    nextLabel,
  };
};
