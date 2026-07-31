import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { PageHeader, OrderStepper, FooterNav } from "./OrderFlowChrome";
import OrderDetailsStep from "./OrderDetailsStep";
import { InvoiceStep, MarkShippedStep } from "./OrderSteps";
import { useOrderFlow } from "./useOrderFlow";
import useDiscountPercentage from "../../../../hooks/useDiscountPercentage";

// ─── Main Component ────────────────────────────────────────────────────────────
const OrderDetail = ({ orderId: propOrderId, onClose }) => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const id = propOrderId || paramId;
  const isModal = !!propOrderId;

  const {
    step,
    data,
    loading,
    actLoading,
    handleNext: flowNext,
    handleBack: flowBack,
    handleCancel: flowCancel,
    currentStatus,
    isTerminal,
    canGoNext,
    canGoBack,
    canCancel,
    nextLabel,
  } = useOrderFlow(id, isModal, onClose);

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

  // ── Cancel: close modal or let useOrderFlow handle ────────────────────────
  const handleCancel = () => {
    if (isModal && onClose) onClose();
    else flowCancel();
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
        },
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
      },
    };
  }, [data, discount]);

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
        {step === 3 && <MarkShippedStep orderData={orderData} />}
      </div>

      {/* Footer: Back | Cancel Order | Next (hidden for terminal orders) */}
      <FooterNav
        currentStep={step}
        onBack={handleBack}
        onCancel={onClose}
        onNext={handleNext}
        loading={actLoading}
        isModal={isModal}
        nextLabel={nextLabel}
        canGoNext={canGoNext}
        canGoBack={canGoBack}
        canCancel={canCancel}
      />
    </div>
  );
};

export default React.memo(OrderDetail);

// ─── OrderDetailModal wrapper ─────────────────────────────────────────────────
export const OrderDetailModal = ({ isOpen, onClose, orderId }) => {
  if (!isOpen || !orderId) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#F6F7F9] rounded-2xl w-full max-w-[1320px] h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <OrderDetail orderId={orderId} onClose={onClose} />
      </div>
    </div>
  );
};
