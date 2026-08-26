import React, { useMemo, useCallback, useState } from "react";
import { useParams } from "react-router-dom";

import { PageHeader, OrderStepper, FooterNav } from "./OrderFlowChrome";
import OrderDetailsStep from "./OrderDetailsStep";
import { InvoiceStep } from "./OrderSteps";
import { MarkShippedStep } from "./SelfShipStep";
import { useOrderFlow } from "./useOrderFlow";
import useDiscountPercentage from "../../../../hooks/useDiscountPercentage";
import {
  downloadTaxInvoicesForOrder,
  updateOrderStatus,
} from "../../../../services/api.order";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../../utils/notification/toast";
import { getApiErrorMessage } from "../../../../utils/apiError";

// ─── Main Component ────────────────────────────────────────────────────────────
const OrderDetail = ({ orderId: propOrderId, onClose, onOrderUpdate }) => {
  const { id: paramId } = useParams();
  const id = propOrderId || paramId;
  const isModal = !!propOrderId;
  const {
    step,
    data,
    loading,
    actLoading,
    handleNext: flowNext,
    handleBack: flowBack,
    currentStatus,
    isTerminal,
    canGoNext,
    canGoBack,
    canCancel,
    nextLabel,
    refetch,
  } = useOrderFlow(id, isModal, onClose);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // ── Step 3 done: close modal or navigate back ───────────────────────────────
   const handleNext = async () => {
    flowNext();
  };

  // ── Back: step 1 → close/navigate ─────────────────────────────────────────
  const handleBack = () => {
    if (step === 1 && isModal && onClose) {
      onClose();
    } else {
      flowBack();
    }
  };

  // ── Reject (only offered by useOrderFlow while status is placed/accepted,
  // i.e. strictly before shipping) ───────────────────────────────────────────
  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      notifyOnFail("Please enter a reason for rejecting this order");
      return;
    }
    setRejectSubmitting(true);
    try {
      const res = await updateOrderStatus(id, {
        order_status: "rejected",
        reject_reason: rejectReason.trim(),
      });
      if (res?.status === 1) {
        notifyOnSuccess("Order rejected");
        setShowRejectModal(false);
        setRejectReason("");
        await refetch();
        onOrderUpdate?.();
        if (isModal && onClose) onClose();
      } else {
        notifyOnFail(res?.message || "Failed to reject order");
      }
    } catch (err) {
      notifyOnFail(getApiErrorMessage(err, "Error rejecting order"));
    } finally {
      setRejectSubmitting(false);
    }
  };

  // ── Shape API data → orderData for all step components ────────────────────
  const product = data?.products?.[0];
  const discount = useDiscountPercentage(
    product?.originalPrice,
    product?.discountedPrice,
  );

  const orderData = useMemo(() => {
    if (!data) return null;

    const prod = data.products?.[0] || {};
    const cust = data.customer || {};
    const shippingAddress = data.shippingAddress || {};
    const addr = data.shippingAddress || {};
    const orderedAt = data.createdAt ? new Date(data.createdAt) : new Date();
    
    return {
      id: data.orderNumber || data.id || "",
      rowId: data.id,
      status: data.orderStatus || "",

      product: {
        name: prod.productName || prod.name || "",
        slug: prod.slug || "",
        sku: prod.sku || "",
        quantity: data.qty || 1,
        image: prod.images?.[0] || null,
        images: prod.images || [],
        color: prod.variations?.color?.variation || prod.color_name || "",
        colorCode: prod.variations?.color?.colorCode || null,
        size: prod.variations?.size?.variation || prod.size || null,
        brand: prod.brand || "",
        category: prod.category || prod.type || "",
        storage: prod.storage || "",
        ram: prod.ram || "",
        mrp: prod.originalPrice || 0,
        originalPrice: prod.originalPrice || 0,
        discountedPrice: prod.discountedPrice || 0,
        specifications: prod.specifications || [],
        whatsInTheBox: prod.whatsInTheBox || prod.whats_in_the_box || [],
        codAmount: prod.codAmount || 0,
        codTotal: prod.codTotal || 0,
        hsn: prod.hsn || "",
        grossAmount: prod.discountedPrice || 0,
        taxableValue: prod.discountedPrice || 0,
        gst: prod.gst || 0,
        discount: Number(data.productDiscountAmount || 0),
      },

      orderInfo: {
        orderedDate: orderedAt.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        orderedTime: orderedAt.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        price: `₹${Number(prod?.discountedPrice || 0).toLocaleString("en-IN")}`,
        orderTotal: `₹${Number(
          data.orderTotal || prod?.originalPrice || 0,
        ).toLocaleString("en-IN")}`,
        paymentType:
          data.paymentType === "cod"
            ? "COD"
            : data.paymentType === "online"
            ? "Prepaid"
            : data.paymentType || "Prepaid",
        discount: `${discount}% OFF`,
        orderNumber: data.orderNumber || data.id || "",
        invoiceNo: `INV-${data.id}`,
        invoiceDate: orderedAt.toLocaleDateString("en-IN"),
        invoiceNo2: `INV2-${data.id}`,
        invoiceDate2: orderedAt.toLocaleDateString("en-IN"),
      },

      customer: {
        name: `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim() || "",
        phone: cust.phone || addr.phone || "",
        email: cust.email || addr.email || "",
        since: cust.createdAt
          ? new Date(cust.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
            })
          : "",
        address: {
          line1: addr.streetAddress || "",
          line2: [addr.city, addr.state, addr.zip].filter(Boolean).join(" — "),
          line3: addr.zip || "",
        },
        billingAddress: data.billingAddress ? {
          name: `${data.billingAddress.first_name || ""} ${data.billingAddress.last_name || ""}`.trim() || "",
          address: {
            line1: data.billingAddress.street_address || "",
            line2: [data.billingAddress.city, data.billingAddress.state].filter(Boolean).join(", "),
            line3: data.billingAddress.zip || "",
          },
        } : null,
        stats: {
          orders: cust.orderCount || "—",
          totalSpend: cust.totalSpend
            ? `₹${Number(cust.totalSpend).toLocaleString("en-IN")}`
            : "—",
          rating: cust.rating || "—",
        },
      },

      vendor: {
        name: `${data.vendor?.firstName || ""} ${data.vendor?.lastName || ""}`.trim() || "",
        shopName: data.vendor?.shopName || "",
        email: data.vendor?.email || "",
        phone: data.vendor?.phone || "",
        gstin: data.vendor?.gstin || "",
        address: {
          line1: data.vendor?.shopAddress || "",
          line2: [
            data.vendor?.shopCity,
            data.vendor?.shopState,
            data.vendor?.shopZipCode,
          ].filter(Boolean).join(" — "),
        },
        pickupAddress: data.vendor?.pickupAddress ? {
          line1: data.vendor?.pickupAddress?.line1 || data.vendor?.pickupAddress?.streetAddress || "",
          line2: [
            data.vendor?.pickupAddress?.city || data.vendor?.pickupAddress?.shopCity,
            data.vendor?.pickupAddress?.state || data.vendor?.pickupAddress?.shopState,
            data.vendor?.pickupAddress?.zipCode || data.vendor?.pickupAddress?.shopZipCode,
          ].filter(Boolean).join(" — "),
        } : null,
        pickupAddressLines: data.vendor?.pickupAddressLines || [],
      },
    };
  }, [data, discount]);

  // Invoice becomes visible right after the order is accepted — well before
  // shipping — and stays available afterwards. Never before accept, never for
  // cancelled/rejected orders.
  const invoiceReady = !["", "placed", "pending", "cancelled", "rejected"].includes(
    String(orderData?.status || "").toLowerCase(),
  );

  const handleInvoiceDownload = useCallback(async () => {
    if (!orderData?.rowId || !invoiceReady) return;
    try {
      const res = await downloadTaxInvoicesForOrder(orderData.rowId);
      if (res.status !== 1) {
        console.error(res.message || "Could not download invoice");
      }
    } catch (error) {
      console.error("Error downloading invoice PDF:", error);
    }
  }, [orderData, invoiceReady]);

  const handleShipSuccess = useCallback(() => {
    onOrderUpdate?.();
    onClose?.();
  }, [onClose, onOrderUpdate]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#F6F7F9]">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-9 h-9 animate-spin text-[#FF6012]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <p className="text-sm text-gray-500 font-medium">
            Loading order details…
          </p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#F6F7F9]">
        <p className="text-sm text-gray-500">Order not found</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={`flex flex-col w-full bg-[#F6F7F9] ${
        isModal ? "relative h-full overflow-hidden" : "min-h-screen pb-20"
      }`}
    >
      {/* Top bar: breadcrumb + status pill + Print + Invoice */}
      <PageHeader
        orderId={`#${orderData.id}`}
        productName={orderData.product.name}
        status={orderData.status}
        showBack={true}
        onBack={isModal ? onClose : undefined}
        orderData={orderData}
        onInvoiceClick={invoiceReady ? handleInvoiceDownload : undefined}
      />

      {/* 3-step stepper — reflects both local step and backend status */}
      <OrderStepper currentStep={step} currentStatus={currentStatus} />

      {/* Step content (scrollable) */}
      <div
        className={`flex-1 w-full ${
          isModal ? "overflow-y-auto min-h-0" : "overflow-y-auto"
        }`}
      >
        {step === 1 && <OrderDetailsStep orderData={orderData} />}
        {step === 2 && <InvoiceStep orderData={orderData} />}
        {step === 3 && (
          <MarkShippedStep
            orderData={{
              ...orderData,
              selfShipAccess: data?.selfShipAccess,
              shippingProvider: data?.shippingProvider,
              trackingId: data?.trackingId,
              courierName: data?.courierName,
            }}
            onShipSuccess={handleShipSuccess}
          />
        )}
      </div>

      {/* Footer: Back | Reject Order (pre-ship only) | Next (hidden for terminal orders) */}
      <FooterNav
        currentStep={step}
        onBack={handleBack}
        onCancel={() => setShowRejectModal(true)}
        onNext={handleNext}
        loading={actLoading}
        isModal={isModal}
        nextLabel={nextLabel}
        canGoNext={canGoNext}
        canGoBack={canGoBack}
        canCancel={canCancel}
      />

      {/* Reject reason modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-150">
            <h3 className="text-base font-bold text-gray-950 mb-2">
              Reject Order
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Are you sure you want to reject order{" "}
              <span className="font-bold text-gray-800">
                #{orderData.id}
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
                disabled={rejectSubmitting}
                className="px-3.5 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={rejectSubmitting || !rejectReason.trim()}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectSubmitting ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(OrderDetail);

// ─── OrderDetailModal wrapper ─────────────────────────────────────────────────
export const OrderDetailModal = ({ isOpen, onClose, orderId, onOrderUpdate }) => {
  if (!isOpen || !orderId) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#F6F7F9] rounded-2xl w-full max-w-[1320px] h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <OrderDetail orderId={orderId} onClose={onClose} onOrderUpdate={onOrderUpdate} />
      </div>
    </div>
  );
};
