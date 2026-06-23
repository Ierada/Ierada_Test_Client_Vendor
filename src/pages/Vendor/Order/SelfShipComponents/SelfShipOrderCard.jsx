import React, { useMemo } from "react";
import { Package, Eye, Check } from "lucide-react";
import SelfShipTimeline from "./SelfShipTimeline";
import { SELF_SHIP_STAGES } from "./constants";

const getActionDetails = (idx) => {
  if (idx === 1) return { label: "Accept Order", textColor: "text-orange-500", actionText: "Accept Order" };
  if (idx === 2) return { label: "Generate Invoice", textColor: "text-purple-600", actionText: "Generate Invoice" };
  if (idx === 3) return { label: "Add Courier & AWB", textColor: "text-pink-500", actionText: "Add Courier Partner" };
  if (idx === 4) return { label: "Enter AWB Number", textColor: "text-pink-500", actionText: "Enter AWB Number" };
  if (idx === 5) return { label: "Upload Tracking Info", textColor: "text-blue-500", actionText: "Upload Tracking" };
  if (idx === 6) return { label: "Mark as Shipped", textColor: "text-green-600", actionText: "Mark as Shipped" };
  return { label: "Delivery Details", textColor: "text-gray-500", actionText: "Delivery Confirmed" };
};

const SelfShipOrderCard = ({ order, onNextStep, onViewLabel }) => {
  const act = useMemo(() => getActionDetails(order.activeIndex), [order.activeIndex]);
  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl"><Package className="w-6 h-6 text-gray-400" /></div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-gray-950 font-satoshi">#{order.id}</span>
              <span className="bg-[#EFF8FF] text-[#175CD3] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#B2DDFF] font-satoshi uppercase">{order.sku}</span>
              <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-100 font-satoshi">Qty: {order.qty}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 mt-1 font-satoshi">{order.productName}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-satoshi">{order.customer}</p>
          </div>
        </div>
        <div className="text-right flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 font-satoshi">
          <span className="text-lg font-bold text-gray-950">₹{order.price.toLocaleString("en-IN")}</span>
          {order.courier ? (
            <span className="bg-[#EFF8FF] text-[#175CD3] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#B2DDFF]">{order.courier} {order.trackingId && `(${order.trackingId})`}</span>
          ) : (
            <span className="bg-gray-50 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">No Courier Assigned</span>
          )}
        </div>
      </div>
      <SelfShipTimeline activeIndex={order.activeIndex} />
      <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
        <div className="flex items-center gap-3.5 font-satoshi">
          {order.activeIndex < SELF_SHIP_STAGES.length - 1 ? (
            <button onClick={() => onNextStep(order)} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors shadow-sm">{act.label}</button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#027A48] bg-[#ECFDF3] px-3 py-1.5 rounded-lg border border-[#B2DDFF]"><Check className="w-4 h-4 text-green-600" />Order Fully Processed</div>
          )}
          <button onClick={() => onViewLabel(order)} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-bold text-xs bg-white hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1.5"><Eye className="w-4 h-4 text-gray-400" />View Label</button>
        </div>
        <span className={`text-xs font-bold font-satoshi uppercase tracking-wider ${act.textColor}`}>{act.actionText}</span>
      </div>
    </div>
  );
};

export default React.memo(SelfShipOrderCard);
