import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../../../components/Vendor/order/PageHeader";
import OrderStepper from "../../../../components/Vendor/orderDetails/OrderStepper";
import OrderDetailsStep from "../../../../components/Vendor/orderDetails/OrderDetailsStep";
import InvoiceStep from "../../../../components/Vendor/orderDetails/InvoiceStep";
import ShippingLabelStep from "../../../../components/Vendor/orderDetails/ShippingLabelStep";
import MarkShippedStep from "../../../../components/Vendor/orderDetails/MarkShippedStep";
import FooterNav from "../../../../components/Vendor/orderDetails/FooterNav";
import { useOrderFlow } from "../../../../components/Vendor/orderDetails/useOrderFlow";
import useDiscountPercentage from "../../../../hooks/useDiscountPercentage";

const OrderDetail = ({ orderId, onClose }) => {
  const { id: paramId } = useParams();
  const id = orderId || paramId;
  const isModal = !!orderId;

  const {
    step,
    data,
    loading,
    actLoading,
    handleNext: originalHandleNext,
    handleBack: originalHandleBack,
    handleCancel: originalHandleCancel,
  } = useOrderFlow(id);

  const handleNext = async () => {
    if (step === 4) {
      if (isModal && onClose) {
        onClose();
      } else {
        originalHandleNext();
      }
    } else {
      originalHandleNext();
    }
  };

  const handleBack = () => {
    if (step === 1 && isModal && onClose) {
      onClose();
    } else {
      originalHandleBack();
    }
  };

  const handleCancel = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      originalHandleCancel();
    }
  };

  const product = data?.products?.[0];
  const discount = useDiscountPercentage(
    product?.originalPrice,
    product?.discountedPrice
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
        whatsInBox: prod.whats_in_the_box || null,
        specifications: prod.specifications || null,
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

        price: `\u20B9${Number(
          prod?.discountedPrice || 0
        ).toLocaleString("en-IN")}`,

        orderTotal: `\u20B9${Number(
          prod?.originalPrice || 0
        ).toLocaleString("en-IN")}`,

        paymentType: data.paymentType || "Prepaid",

        discount: `${discount}% OFF`,
      },

      customer: {
        name:
          `${cust.firstName || ""} ${cust.lastName || ""}`.trim() || "",

        since: "",

        address: {
          line1: addr.streetAddress || "",
          line2: `${addr.city || ""} - ${addr.zip || ""}`,
        },

        phone: cust.phone || addr.phone || "",
        email: cust.email || addr.email || "",

        stats: {
          orders: "14",
          totalSpend: "\u20B982k",
          rating: "4.8",
        },
      },
    };
  }, [data, discount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Order not found
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-start w-full bg-[#F6F7F9] font-inter ${isModal ? "relative h-full overflow-hidden" : "min-h-screen pb-20"}`}>
      <PageHeader
        orderId={`#${orderData.id}`}
        productName={orderData.product.name}
        status={orderData.status}
        showBack={false}
      />
      <OrderStepper currentStep={step} />

      <div className={`w-full flex-grow border-t border-[#EDF0F4] ${isModal ? "overflow-y-auto min-h-0 pb-32" : ""}`}>
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
