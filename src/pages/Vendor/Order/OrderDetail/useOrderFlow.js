import { useState, useEffect, useCallback } from "react";
import {
  getOrderByOrderId,
  updateOrderStatus,
} from "../../../../services/api.order";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../../utils/notification/toast";

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
  // Right after accept, the vendor should land on the Invoice step — invoices
  // are visible/downloadable from here on, well before shipping.
  if (s === "accepted" || s === "packed") return 2;
  if (["shipped", "intransit", "outfordelivery"].includes(s)) return 3;
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

const getNextLabel = (step, status) => {
  if (step === 1) {
    if (isPlacedStatus(status)) return "Accept Order";
    if (isTerminalStatus(status)) return null;
    return "Next";
  }
  if (step === 2) {
    // Invoice step: just advance to shipping, no side effect here.
    if (isShippedStatus(status) || isTerminalStatus(status)) return null;
    return "Next";
  }
  if (step === 3) {
    if (isShippedStatus(status) || isTerminalStatus(status)) return null;
    return null;
  }
  return null;
};

export const useOrderFlow = (orderId, forceStep1 = false, onClose) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(false);

  const fetchOrder = useCallback(async ({ silent = false, keepStep = false } = {}) => {
    if (!orderId) return;
    if (!silent) setLoading(true);
    try {
      const res = await getOrderByOrderId(orderId);
      if (res?.status === 1) {
        setData(res.data);
        if (!keepStep) {
          setStep(statusToInitialStep(res.data?.orderStatus));
        }
      } else {
        notifyOnFail("Failed to load order details");
      }
    } catch (err) {
      console.error("useOrderFlow fetchOrder error:", err);
      notifyOnFail("Error loading order");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const currentStatus = data?.orderStatus || "";
  const terminal = isTerminalStatus(currentStatus);
  const nextLabel = getNextLabel(step, currentStatus);
  const canGoNext = !terminal && !!nextLabel;
  const canGoBack = step > 1;
  const canCancel = ["placed", "accepted"].includes(
    currentStatus.toLowerCase(),
  );

  const handleNext = useCallback(async () => {
    if (!canGoNext) return;

    if (step === 1) {
      if (isPlacedStatus(currentStatus)) {
        setActLoading(true);
        try {
          const res = await updateOrderStatus(orderId, {
            order_status: "accepted",
          });
          if (res?.status === 1) {
            notifyOnSuccess("Order accepted!");
            await fetchOrder();
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
        setStep(2);
      }
      return;
    }

    if (step === 2) {
      // Invoice step: nothing to submit, just move on to shipping.
      setStep(3);
      return;
    }

    if (step === 3) {
      return;
    }
  }, [
    step,
    currentStatus,
    canGoNext,
    orderId,
    fetchOrder,
    data,
  ]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  return {
    step,
    setStep,
    data,
    loading,
    actLoading,
    handleNext,
    handleBack,
    refetch: fetchOrder,
    currentStatus,
    isTerminal: terminal,
    canGoNext,
    canGoBack,
    canCancel,
    nextLabel,
  };
};
