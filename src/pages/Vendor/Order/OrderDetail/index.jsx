import React, { useMemo } from "react";
import { useParams } from "react-router-dom";

import { PageHeader, OrderStepper, FooterNav } from "./OrderFlowChrome";
import OrderDetailsStep from "./OrderDetailsStep";
import { InvoiceStep, ShippingLabelStep, MarkShippedStep } from "./OrderSteps";
import { useOrderFlow } from "./useOrderFlow";
import useDiscountPercentage from "../../../../hooks/useDiscountPercentage";

// ─── Main Component ────────────────────────────────────────────────────────────
const OrderDetail = ({ orderId: propOrderId, onClose }) => {
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
    handleCancel: flowCancel,
  } = useOrderFlow(id);

  // ── Step 4 close: if modal, close the modal instead of advancing ──────────
  const handleNext = async () => {
    if (step === 4 && isModal && onClose) {
      await flowNext(); // still fires the API (mark packed)
      onClose();
    } else {
      flowNext();
    }
  };

  const handleBack = () => {
    if (step === 1 && isModal && onClose) {
      onClose();
    } else {
      flowBack();
    }
  };

  const handleCancel = () => {
    if (isModal && onClose) onClose();
    else flowCancel();
  };

  // ── Shape API data into the orderData object all steps consume ────────────
  const product = data?.products?.[0];
  const discount = useDiscountPercentage(
    product?.originalPrice,
    product?.discountedPrice,
  );

  const orderData = useMemo(() => {
    if (!data) return null;

    const prod = data.products?.[0] || {};
    const cust = data.customer || {};
    const addr = data.shippingAddress || {};
    const orderedAt = data.createdAt ? new Date(data.createdAt) : new Date();

    return {
      id: data.orderNumber || data.id || "",
      status: data.orderStatus || "",

      product: {
        name: prod.productName || "",
        sku: prod.sku || "",
        quantity: data.qty || 1,
        image: prod.images?.[0] || null,
        images: prod.images || [],
        color: prod.variations?.color?.variation || "",
        colorCode: prod.variations?.color?.colorCode || null,
        size: prod.variations?.size?.variation || null,
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
        orderTotal: `₹${Number(prod?.originalPrice || 0).toLocaleString(
          "en-IN",
        )}`,
        paymentType: data.paymentType || "Prepaid",
        discount: `${discount}% OFF`,
      },

      customer: {
        name: `${cust.firstName || ""} ${cust.lastName || ""}`.trim() || "",
        phone: cust.phone || addr.phone || "",
        email: cust.email || addr.email || "",
        address: {
          line1: addr.streetAddress || "",
          line2: `${addr.city || ""}${addr.zip ? ` - ${addr.zip}` : ""}`,
        },
        stats: {
          orders: "—",
          totalSpend: "—",
          rating: "—",
        },
      },
    };
  }, [data, discount]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-8 h-8 animate-spin text-[#0164CE]"
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
          <p className="text-sm text-gray-500">Loading order details…</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-gray-500">Order not found</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`flex flex-col items-start w-full bg-[#F6F7F9] font-inter ${
        isModal ? "relative h-full overflow-hidden" : "min-h-screen pb-20"
      }`}
    >
      <PageHeader
        orderId={`#${orderData.id}`}
        productName={orderData.product.name}
        status={orderData.status}
        showBack={!isModal}
      />

      <OrderStepper currentStep={step} />

      <div
        className={`w-full flex-grow border-t border-[#EDF0F4] ${
          isModal ? "overflow-y-auto min-h-0 pb-32" : ""
        }`}
      >
        {step === 1 && <OrderDetailsStep orderData={orderData} />}
        {step === 2 && <InvoiceStep orderData={orderData} />}
        {step === 3 && <ShippingLabelStep orderData={orderData} />}
        {step === 4 && <MarkShippedStep orderData={orderData} />}
      </div>

      <FooterNav
        currentStep={step}
        onBack={handleBack}
        onCancel={handleCancel}
        onNext={handleNext}
        loading={actLoading}
        isModal={isModal}
      />
    </div>
  );
};

export default React.memo(OrderDetail);
