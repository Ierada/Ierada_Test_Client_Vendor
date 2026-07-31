import React, { useState } from "react";
import { X, Package, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { getTrackingByAwb } from "../../../services/api.order";
import { notifyOnFail } from "../../../utils/notification/toast";

const TrackingModal = ({ awb, onClose }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchTracking = async () => {
      // If awb is "processing", show processing state without API call
      if (awb === "processing") {
        setTrackingData({ isProcessing: true });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await getTrackingByAwb(awb);
        if (result.status === 1) {
          setTrackingData(result.data);
        } else {
          notifyOnFail(result.message || "Failed to fetch tracking details");
        }
      } catch (error) {
        notifyOnFail("Error fetching tracking details");
      } finally {
        setLoading(false);
      }
    };

    if (awb) {
      fetchTracking();
    }
  }, [awb]);

  const getStatusIcon = (state) => {
    const stateUpper = state?.toUpperCase() || "";
    if (stateUpper.includes("CANCEL") || stateUpper.includes("FAIL")) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (stateUpper.includes("DELIVER") || stateUpper.includes("COMPLETE")) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (stateUpper.includes("PROCESS") || stateUpper.includes("PICK") || stateUpper.includes("TRANSIT")) {
      return <Clock className="w-5 h-5 text-blue-500" />;
    }
    return <AlertCircle className="w-5 h-5 text-amber-500" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-150">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6012]"></div>
            <span className="ml-3 text-gray-600">Loading tracking details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-150">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-950">Tracking Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8 text-gray-500">
            No tracking data available
          </div>
        </div>
      </div>
    );
  }

  // Show processing state for orders without tracking ID
  if (trackingData.isProcessing) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-150">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-950">Tracking Details</h3>
              <p className="text-sm text-gray-500 mt-1">Order Status</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Processing State */}
          <div className="bg-[#F8F9FA] rounded-xl p-6 border border-gray-100 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-blue-100">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Current Status</div>
                <div className="font-bold text-gray-950 capitalize">
                  Processing
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Your order is being processed. Tracking information will be available once the order is shipped.
            </p>
          </div>

          {/* Tracking Timeline */}
          <div>
            <h4 className="text-sm font-bold text-gray-950 mb-4">Order Timeline</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-950 capitalize">
                    Order Placed
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Your order has been received and is being processed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-950">Tracking Details</h3>
            <p className="text-sm text-gray-500 mt-1">AWB: {awb}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Info */}
        <div className="bg-[#F8F9FA] rounded-xl p-4 mb-6 border border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">
                Order Number
              </div>
              <div className="font-bold text-gray-950 mt-1">
                {trackingData.originalOrderNumber || trackingData.originalOrderId || "—"}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">
                Order Type
              </div>
              <div className="font-bold text-gray-950 mt-1">
                {trackingData.type || "—"}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">
                Payment Type
              </div>
              <div className="font-bold text-gray-950 mt-1 capitalize">
                {trackingData.paymentType || "—"}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">
                Amount
              </div>
              <div className="font-bold text-gray-950 mt-1">
                ₹{Number(trackingData.amount || 0).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${
              trackingData.orderStatus === "DELIVERED" ? "bg-green-100" :
              (trackingData.orderStatus === "CANCELLED" || trackingData.orderStatus === "CANCELED") ? "bg-red-100" :
              "bg-blue-100"
            }`}>
              <Package className={`w-5 h-5 ${
                trackingData.orderStatus === "DELIVERED" ? "text-green-600" :
                (trackingData.orderStatus === "CANCELLED" || trackingData.orderStatus === "CANCELED") ? "text-red-600" :
                "text-blue-600"
              }`} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Current Status</div>
              <div className="font-bold text-gray-950 capitalize">
                {trackingData.orderStatus || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div>
          <h4 className="text-sm font-bold text-gray-950 mb-4">Tracking Timeline</h4>
          <div className="space-y-3">
            {trackingData.orderStateInfo && trackingData.orderStateInfo.length > 0 ? (
              trackingData.orderStateInfo.map((event, index) => (
                <div key={event._id || index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(event.state)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-950 capitalize">
                      {event.state}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatDate(event.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No tracking events available
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        {trackingData.lineItems && trackingData.lineItems.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-bold text-gray-950 mb-4">Line Items</h4>
            <div className="space-y-2">
              {trackingData.lineItems.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="font-semibold text-gray-950">{item.name}</div>
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                    <span>Qty: {item.quantity}</span>
                    <span>₹{Number(item.unitPrice || 0).toLocaleString("en-IN")} × {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingModal;
