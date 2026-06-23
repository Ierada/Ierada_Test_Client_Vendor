import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateOrderStatus } from '../services/api.order';

export const useOrderActions = (order, onOrderUpdate, onAcceptSuccess) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await updateOrderStatus(order.id, {
        order_status: "packed",
        vendor_comment: "Accepted by Vendor"
      });
      setShowAcceptModal(false);
      if (onOrderUpdate) onOrderUpdate();
      
      if (onAcceptSuccess) {
        onAcceptSuccess(order.id);
      } else {
        navigate(`/orders/${order.id || order.order_number}`);
      }
    } catch (err) {
      console.error("Error accepting order:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [order.id, order.order_number, onOrderUpdate, onAcceptSuccess, navigate]);

  const handleReject = useCallback(async () => {
    if (!rejectReason.trim()) return;
    try {
      setIsSubmitting(true);
      await updateOrderStatus(order.id, {
        order_status: "rejected",
        vendor_comment: rejectReason
      });
      setShowRejectModal(false);
      setRejectReason("");
      if (onOrderUpdate) onOrderUpdate();
    } catch (err) {
      console.error("Error rejecting order:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [order.id, rejectReason, onOrderUpdate]);

  return {
    showDropdown,
    setShowDropdown,
    showAcceptModal,
    setShowAcceptModal,
    showRejectModal,
    setShowRejectModal,
    rejectReason,
    setRejectReason,
    isSubmitting,
    handleAccept,
    handleReject
  };
};
