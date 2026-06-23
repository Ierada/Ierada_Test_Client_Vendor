import React from "react";
import SelfShipHeader from "./SelfShipComponents/SelfShipHeader";
import SelfShipTabs from "./SelfShipComponents/SelfShipTabs";
import SelfShipBulkUpload from "./SelfShipComponents/SelfShipBulkUpload";
import SelfShipOrderCard from "./SelfShipComponents/SelfShipOrderCard";
import CourierModal from "./SelfShipComponents/CourierModal";
import LabelModal from "./SelfShipComponents/LabelModal";
import { useSelfShipFlow } from "./SelfShipComponents/useSelfShipFlow";

const mapDbOrderToSelfShip = (ord) => {
  const prod = ord.product || ord.products?.[0] || {};
  const cust = ord.customer || {};
  const addr = ord.Address || ord.shippingAddress || {};
  
  let activeIndex = 0;
  const status = ord.orderStatus?.toLowerCase() || ord.order_status?.toLowerCase();
  if (status === "placed") activeIndex = 0;
  else if (status === "accepted") activeIndex = 1;
  else if (status === "invoice") activeIndex = 2;
  else if (status === "packed") activeIndex = 3;
  else if (status === "ready") activeIndex = 4;
  else if (status === "shipped") activeIndex = 6;
  else if (status === "delivered") activeIndex = 7;
  else activeIndex = 3;

  return {
    id: ord.orderNumber || ord.id,
    sku: prod.sku || "N/A",
    qty: ord.qty || 1,
    productName: prod.productName || prod.name || "Unknown Product",
    customer: `${cust.firstName || ""} ${cust.lastName || ""}, ${addr.city || ""}`.trim().replace(/^,/, "") || "Unknown Customer",
    price: ord.orderTotal || ord.price || 0,
    courier: ord.courier_name || ord.shipping_provider || "",
    trackingId: ord.tracking_id || "",
    activeIndex,
    created_at: ord.createdAt || new Date().toISOString(),
    rawOrder: ord
  };
};

const SelfShip = () => {
  const f = useSelfShipFlow(mapDbOrderToSelfShip);
  if (f.loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#FFF3EF] py-6 px-4 md:px-8">
      <SelfShipHeader />
      <SelfShipTabs activeTab={f.activeTab} setActiveTab={f.setActiveTab} />
      {f.activeTab === "workflow" ? (
        <div className="space-y-4">
          {f.orders.map((o) => (
            <SelfShipOrderCard key={o.id} order={o} onNextStep={f.handleNextStep} onViewLabel={f.handleViewLabel} />
          ))}
        </div>
      ) : (
        <SelfShipBulkUpload />
      )}
      <CourierModal show={f.showCourierModal} onClose={() => f.setShowCourierModal(false)} courierName={f.courierName} setCourierName={f.setCourierName} awbNumber={f.awbNumber} setAwbNumber={f.setAwbNumber} onSave={f.saveCourierDetails} currentOrder={f.currentOrder} />
      <LabelModal show={f.showLabelModal} onClose={() => f.setShowLabelModal(false)} order={f.labelOrderData} />
    </div>
  );
};

export default SelfShip;
