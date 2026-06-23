import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, MoreHorizontal, Check, X } from "lucide-react";
import { StatusBadge, PaymentBadge, RiskBadge } from "./OrderBadge";
import ProductCell from "./ProductCell";
import CustomerCell from "./CustomerCell";
import CourierCell from "./CourierCell";
import SLAProgress from "./SLAProgress";
import { useClickOutside } from "../../../hooks/useClickOutside";
import { useFormatDate } from "../../../hooks/useFormatDate";
import { useOrderActions } from "../../../hooks/useOrderActions";

const OrderTableRow = ({ order, isSelected, onSelect, onView, onOrderUpdate, index, total, onAcceptSuccess }) => {
  const navigate = useNavigate();
  const formatDate = useFormatDate();

  const {
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
  } = useOrderActions(order, onOrderUpdate, onAcceptSuccess);

  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, () => setShowDropdown(false));

  const getRisk = () => {
    if (order.payment_status === "failed" || order.order_status === "cancelled") return "high";
    if (order.payment_type === "cod" && order.payment_status === "unpaid") return "medium";
    return "low";
  };

  const getRiskScoreDetails = () => {
    const risk = getRisk();
    if (risk === "high") {
      return { score: "85%", colorClass: "text-red-650", bgClass: "bg-red-500", percent: 85 };
    }
    if (risk === "medium") {
      return { score: "42%", colorClass: "text-amber-600", bgClass: "bg-amber-500", percent: 42 };
    }
    return { score: "12%", colorClass: "text-green-600", bgClass: "bg-green-500", percent: 12 };
  };

  // Open dropdown upwards if it is one of the last 2 rows to prevent table bounds clipping
  const openUpward = total && index >= total - 2;

  // Actions are only available if the order is in placed/pending or not already completed/rejected/cancelled
  const showActions = order.order_status !== "delivered" &&
    order.order_status !== "cancelled" &&
    order.order_status !== "rejected" &&
    order.order_status !== "returned";

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${isSelected ? "bg-[#FF6012]/5" : ""}`}>
      <td className="px-6 py-4">
        <input type="checkbox" checked={isSelected} onChange={onSelect} className="rounded border-gray-300 text-[#FF6012] focus:ring-[#FF6012] w-4 h-4 cursor-pointer" />
      </td>
      <td
        className="px-6 py-4 whitespace-nowrap cursor-pointer group"
        onClick={() => navigate(`/orders/${order.id || order.order_number}`)}
      >
        <div className="font-semibold text-[#0164CE] hover:underline transition-colors">#{order.order_number}</div>
        <div className="text-xs text-gray-500 mt-0.5">{formatDate(order.created_at)}</div>
      </td>
      <td
        className="px-6 py-4 min-w-[280px] cursor-pointer"
        onClick={() => navigate(`/orders/${order.id || order.order_number}`)}
      >
        <div className="hover:opacity-80 transition-opacity">
          <ProductCell product={order.product} />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap"><CustomerCell customer={order.customer} address={order.Address} /></td>
      <td className="px-6 py-4 whitespace-nowrap min-w-[140px]"><CourierCell name={order.courier_name} trackingId={order.tracking_id} /></td>
      <td className="px-6 py-4 whitespace-nowrap"><PaymentBadge type={order.payment_type} /></td>
      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={order.order_status} /></td>
      <td className="px-6 py-4 whitespace-nowrap"><SLAProgress createdAt={order.created_at} status={order.order_status} /></td>
      <td className="px-6 py-4 whitespace-nowrap"><RiskBadge risk={getRisk()} /></td>
      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-950">₹{Number(order.order_total).toLocaleString("en-IN")}</td>
      <td className="px-6 py-4 whitespace-nowrap relative">
        <div className="flex items-center gap-2" ref={dropdownRef}>
          {order.accepted_at ? (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded border border-green-200">Accepted</span>
          ) : order.rejected_at ? (
            <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold uppercase rounded border border-red-200">Rejected</span>
          ) : (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded border border-amber-200">Pending</span>
          )}

          <button onClick={() => navigate(`/orders/${order.id || order.order_number}`)} className="p-1 hover:bg-gray-150 rounded text-gray-500 hover:text-gray-900" title="View details"><Eye className="w-4 h-4" /></button>

          {showActions && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-150 transition-colors ${showDropdown ? "bg-gray-150 text-gray-900" : ""}`}
                title="Action menu"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showDropdown && (
                <div
                  className={`absolute right-0 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-[100] ${openUpward ? "bottom-full mb-1" : "top-full mt-1"
                    }`}
                >
                  <button
                    onClick={() => { handleAccept(); setShowDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    Accept
                  </button>
                  <button
                    onClick={() => { setShowRejectModal(true); setShowDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors border-t border-gray-100"
                  >
                    <X className="w-3.5 h-3.5 text-red-600" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Accept Modal */}
        {showAcceptModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-150 relative transform scale-100 transition-transform">
              {/* Close Button */}
              <button
                onClick={() => setShowAcceptModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title & Product Name */}
              <div className="mb-4 pr-6">
                <h3 className="text-base font-bold text-gray-950">#{order.order_number}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{order.product?.name || "Premium Product"}</p>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <StatusBadge status={order.order_status} />
              </div>

              {/* Customer Details Card */}
              <div className="bg-[#F8F9FA] rounded-xl p-3 mb-3 border border-gray-100 text-left">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider block mb-1">CUSTOMER</span>
                <div className="text-xs font-bold text-gray-950">{order.customer?.customerDetails?.first_name} {order.customer?.customerDetails?.last_name}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{order.Address?.city || "Mumbai"}</div>
              </div>

              {/* Shipment Card */}
              <div className="bg-[#F8F9FA] rounded-xl p-3 mb-3 border border-gray-100 text-left">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider block mb-2">SHIPMENT</span>
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                  <div>
                    <div className="text-gray-400 text-[9px] font-medium">Courier</div>
                    <div className="font-bold text-gray-950 mt-0.5">{order.courier_name || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[9px] font-medium">AWB Number</div>
                    <div className="font-bold text-gray-950 mt-0.5 truncate" title={order.tracking_id}>{order.tracking_id || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[9px] font-medium">Payment</div>
                    <div className="font-bold text-gray-950 mt-0.5 capitalize">{order.payment_type === "online" ? "Prepaid" : order.payment_type}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[9px] font-medium">Order Value</div>
                    <div className="font-bold text-gray-950 mt-0.5">₹{Number(order.order_total).toLocaleString("en-IN")}</div>
                  </div>
                </div>
              </div>

              {/* AI Risk Assessment Card */}
              {(() => {
                const riskInfo = getRiskScoreDetails();
                return (
                  <div className="bg-[#F8F9FA] rounded-xl p-3 mb-5 border border-gray-100 text-left">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider block mb-1">AI RISK ASSESSMENT</span>
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="text-gray-700">Return Risk Score</span>
                      <span className={riskInfo.colorClass}>{riskInfo?.score}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${riskInfo.bgClass}`} style={{ width: `${riskInfo.percent}%` }}></div>
                    </div>
                  </div>
                );
              })()}

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  className="bg-[#FF6012] hover:bg-[#e0500a] text-white py-2.5 px-3 rounded-lg text-center transition-colors shadow-sm"
                >
                  {isSubmitting ? "Accepting..." : "Accept & Process"}
                </button>
                <button
                  onClick={() => { navigate(`/orders/${order.id || order.order_number}`); setShowAcceptModal(false); }}
                  className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg text-center transition-colors"
                >
                  View Full Details
                </button>
                <button
                  onClick={() => {
                    alert("Printing Invoice...");
                  }}
                  className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg text-center transition-colors"
                >
                  Print Invoice
                </button>
                <button
                  onClick={() => {
                    setShowAcceptModal(false);
                    setShowRejectModal(true);
                  }}
                  className="bg-red-50 hover:bg-red-100 text-red-700 py-2.5 px-3 rounded-lg text-center transition-colors"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-150 transform scale-100 transition-transform">
              <h3 className="text-base font-bold text-gray-950 mb-2">Reject Order</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Are you sure you want to reject order <span className="font-bold text-gray-800">#{order.order_number}</span>? Please provide a reason for the rejection.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason (e.g. Out of stock, pricing error)..."
                className="w-full min-h-[80px] p-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#FF6012] mb-5 resize-none"
              />
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isSubmitting || !rejectReason.trim()}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-750 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
};

export default OrderTableRow;
