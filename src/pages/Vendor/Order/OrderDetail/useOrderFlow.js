import { useState, useEffect, useCallback } from "react";
import {
  getOrderByOrderId,
  updateOrderStatus,
} from "../../../../services/api.order";
import { initiateShipping } from "../../../../services/api.shipping";
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
    if (isShippedStatus(status)) return "View Invoice";
    return "Mark as Shipped";
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
      if (isShippedStatus(currentStatus)) {
        setStep(3);
        return;
      }

      setActLoading(true);
      try {
        const isSelfShip = data?.shippingProvider === "self_ship";
        const alreadyBooked = Boolean(
          data?.providerOrderId || data?.providerShipmentId,
        );

        if (isSelfShip) {
          const res = await updateOrderStatus(orderId, {
            order_status: "shipped",
            shipping_option: "self_ship",
            shipping_provider: "self_ship",
          });
          if (res?.status === 1) {
            notifyOnSuccess("Order marked as shipped!");
            await fetchOrder({ silent: true, keepStep: true });
            setStep(3);
          } else {
            notifyOnFail(res?.message || "Failed to mark as shipped");
          }
          return;
        }

        if (!alreadyBooked) {
          const shipRes = await initiateShipping(orderId);
          if (shipRes?.status === 1) {
            notifyOnSuccess("Order booked and marked as shipped!");
            await fetchOrder({ silent: true, keepStep: true });
            setStep(3);
          } else {
            notifyOnFail(
              shipRes?.message || "Failed to book order with shipping provider",
            );
          }
          return;
        }

        const res = await updateOrderStatus(orderId, {
          order_status: "shipped",
        });
        if (res?.status === 1) {
          notifyOnSuccess("Order marked as shipped!");
          await fetchOrder({ silent: true, keepStep: true });
          setStep(3);
        } else {
          notifyOnFail(res?.message || "Failed to mark as shipped");
        }
      } catch (err) {
        notifyOnFail(err?.response?.data?.message || "Error updating order");
      } finally {
        setActLoading(false);
      }
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

  const handleCancel = useCallback(async () => {}, []);

  return {
    step,
    setStep,
    data,
    loading,
    actLoading,
    handleNext,
    handleBack,
    handleCancel,
    refetch: fetchOrder,
    currentStatus,
    isTerminal: terminal,
    canGoNext,
    canGoBack,
    canCancel,
    nextLabel,
  };
};
