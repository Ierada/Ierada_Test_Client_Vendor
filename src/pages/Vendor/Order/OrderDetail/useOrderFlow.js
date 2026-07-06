import { useState, useEffect, useCallback } from "react";
import {
  getOrderByOrderId,
  updateOrderStatus,
} from "../../../../services/api.order";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../../utils/notification/toast";

export const useOrderFlow = (orderId) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(false);

  // ── Fetch full order data ─────────────────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await getOrderByOrderId(orderId);
      if (res?.status === 1) {
        setData(res.data);
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
    setStep(1);
    fetchOrder();
  }, [fetchOrder]);

  // ── Step actions ──────────────────────────────────────────────────────────
  const handleNext = async () => {
    // Step 1 → 2: accept the order
    if (step === 1) {
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
      return;
    }

    // Step 2 → 3: invoice confirmed (no status change needed, just advance)
    if (step === 2) {
      setStep(3);
      return;
    }

    // Step 3 → 4: shipping label generated (no status change, just advance)
    if (step === 3) {
      setStep(4);
      return;
    }

    // Step 4: final confirm — mark as packed/ready
    if (step === 4) {
      setActLoading(true);
      try {
        const res = await updateOrderStatus(orderId, {
          order_status: "packed",
        });
        if (res?.status === 1) {
          notifyOnSuccess("Order marked as packed and ready!");
          await fetchOrder();
        } else {
          notifyOnFail(res?.message || "Failed to update order");
        }
      } catch (err) {
        notifyOnFail(err?.response?.data?.message || "Error updating order");
      } finally {
        setActLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleCancel = async () => {
    // No status mutation on cancel — just close (parent handles navigation)
  };

  return {
    step,
    data,
    loading,
    actLoading,
    handleNext,
    handleBack,
    handleCancel,
    refetch: fetchOrder,
  };
};
