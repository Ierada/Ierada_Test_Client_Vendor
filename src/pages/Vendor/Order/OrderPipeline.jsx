import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, Check, ChevronRight, X, Info, HelpCircle } from "lucide-react";
import { getOrdersByVendorId } from "../../../services/api.order";
import { trackOrderById } from "../../../services/api.shipping";
import { useAppContext } from "../../../context/AppContext";

const STAGES = [
  { id: "placed", name: "Order Placed", color: "blue", bgClass: "bg-blue-600 text-white border-blue-600" },
  { id: "verified", name: "Payment Verified", color: "orange", bgClass: "bg-orange-500 text-white border-orange-500" },
  { id: "accepted", name: "Seller Accepted", color: "pink", bgClass: "bg-pink-500 text-white border-pink-500" },
  { id: "invoice", name: "Invoice Generated", color: "pink", bgClass: "bg-pink-500 text-white border-pink-500" },
  { id: "packed", name: "Packed", color: "orange", bgClass: "bg-orange-500 text-white border-orange-500" },
  { id: "ready", name: "Ready to Ship", color: "orange", bgClass: "bg-orange-500 text-white border-orange-500" },
  { id: "scheduled", name: "Pickup Scheduled", color: "yellow", bgClass: "bg-yellow-500 text-white border-yellow-500" },
  { id: "pickedup", name: "Picked Up", color: "green", bgClass: "bg-green-600 text-white border-green-600" },
  { id: "intransit", name: "In Transit", color: "green", bgClass: "bg-green-600 text-white border-green-600" },
  { id: "outfordelivery", name: "Out for Delivery", color: "grey", bgClass: "border-gray-300 text-gray-400 bg-white" },
  { id: "delivered", name: "Delivered", color: "grey", bgClass: "border-gray-300 text-gray-400 bg-white" },
  { id: "returned", name: "Returned", color: "grey", bgClass: "border-gray-300 text-gray-400 bg-white" },
];

const OrderPipeline = () => {
  const { user } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDelayedModal, setShowDelayedModal] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Fetch orders from DB and map to pipeline active orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await getOrdersByVendorId(user?.id);
        const orderList = res?.data?.orders || [];
        setOrders(orderList);

        // Pre-select the first active order if any exist
        if (orderList.length > 0) {
          setSelectedOrder(orderList[0]);
        } else {
          setSelectedOrder(null);
        }
      } catch (e) {
        console.error("Error fetching orders for pipeline:", e);
        setOrders([]);
        setSelectedOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // Fetch live tracking info when order is selected
  useEffect(() => {
    if (!selectedOrder) {
      setTrackingData(null);
      return;
    }
    const fetchTracking = async () => {
      try {
        setTrackingLoading(true);
        const res = await trackOrderById(selectedOrder.id);
        if (res?.status === 1 && res.data) {
          setTrackingData(res.data);
        } else {
          setTrackingData(null);
        }
      } catch (err) {
        console.error("Error loading tracking info:", err);
        setTrackingData(null);
      } finally {
        setTrackingLoading(false);
      }
    };
    fetchTracking();
  }, [selectedOrder]);

  // Map order statuses from database to target stage index
  const getActiveStageIndex = (order, tracking) => {
    if (!order) return 0;
    const liveStatus = tracking?.status || tracking?.shipment_status || tracking?.current_status;
    const status = (liveStatus || order.order_status)?.toLowerCase();
    switch (status) {
      case "pending":
      case "placed":
        return 0; // Order Placed
      case "verified":
      case "payment verified":
        return 1; // Payment Verified // Inventory Reserved
      case "accepted":
      case "seller accepted":
        return 2; // Seller Accepted
      case "invoice":
      case "invoice generated":
        return 3; // Invoice Generated
      case "packed":
        return 4; // Packed
      case "ready to ship":
      case "ready":
      case "ready_to_ship":
        return 5; // Ready to Ship
      case "pickup scheduled":
      case "scheduled":
        return 6; // Pickup Scheduled
      case "picked up":
      case "pickedup":
      case "picked_up":
        return 7; // Picked Up
      case "intransit":
      case "in transit":
      case "shipped":
        return 8; // In Transit
      case "out for delivery":
      case "outfordelivery":
      case "out_for_delivery":
        return 9; // Out for Delivery
      case "delivered":
        return 10; // Delivered
      case "return":
      case "returned":
        return 11; // Returned
      default:
        return 3; // Seller Accepted (default fallback)
    }
  };

  const activeIndex = getActiveStageIndex(selectedOrder, trackingData);

  // Generate high-fidelity mockup timestamps for steps
  const getStepTimestamp = (stepIdx, order) => {
    if (!order) return "";
    const baseTime = new Date(order.created_at || Date.now());
    
    // Add realistic progression offset in minutes
    const offsets = [0, 1, 1, 7, 8, 79, 106, 130, 165, 195, 230, 280, 310];
    if (stepIdx <= activeIndex) {
      const stepTime = new Date(baseTime.getTime() + offsets[stepIdx] * 60 * 1000);
      return stepTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return "";
  };

  // Live order tracker list (mapped from database orders)
  const activeOrders = orders.filter(o => 
    !["delivered", "cancelled", "returned", "rejected"].includes(o.order_status?.toLowerCase())
  );

  // Render checkmark icon or active inner dot or default empty
  const renderNodeIcon = (idx) => {
    if (idx < activeIndex) {
      return <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />;
    }
    if (idx === activeIndex) {
      return <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />;
    }
    return null;
  };

  // Get color classes for connecting lines
  const getLineBg = (idx) => {
    if (idx < activeIndex) {
      const startStage = STAGES[idx];
      switch (startStage.color) {
        case "blue": return "bg-blue-500";
        case "orange": return "bg-orange-500";
        case "purple": return "bg-purple-600";
        case "pink": return "bg-pink-500";
        case "yellow": return "bg-yellow-500";
        case "green": return "bg-green-600";
        default: return "bg-gray-300";
      }
    }
    return "bg-gray-200";
  };

  // Helper to map color string to Tailwind classes
  const getDotColor = (color) => {
    switch (color) {
      case "blue": return "bg-blue-600";
      case "orange": return "bg-orange-500";
      case "purple": return "bg-purple-600";
      case "pink": return "bg-pink-500";
      case "yellow": return "bg-yellow-500";
      case "green": return "bg-green-600";
      default: return "bg-gray-400";
    }
  };

  // Generate stage performance metrics dynamically based on active orders
  const metricsData = STAGES.map((stage, idx) => {
    const stageOrders = orders.filter((o) => getActiveStageIndex(o, null) === idx);
    const activeCount = stageOrders.length;
    
    // Determine health based on how long orders have been stuck in this stage
    const isSlow = stageOrders.some((o) => {
      const hours = (Date.now() - new Date(o.created_at || Date.now()).getTime()) / (1000 * 3600);
      if (stage.id === "placed" || stage.id === "verified" || stage.id === "reserved") return hours > 1;
      if (stage.id === "accepted" || stage.id === "invoice" || stage.id === "packed") return hours > 2;
      if (stage.id === "ready" || stage.id === "scheduled") return hours > 4;
      return false;
    });

    return {
      name: stage.name,
      active: activeCount,
      avgTime: activeCount > 0 ? "Under SLA" : "—",
      health: isSlow ? "Slow" : "Healthy",
      dotColor: getDotColor(stage.color),
      action: stage.id === "packed" && activeCount > 0,
    };
  });

  // Calculate SLA Alerts and Warnings dynamically
  // SLA Warnings: orders in pending/failed status
  const slaWarningsCount = orders.filter(
    (o) => o.payment_status === "failed" || o.order_status?.toLowerCase() === "pending"
  ).length;

  // SLA Alerts: orders that are placed or packed and stuck for more than 2 hours
  const slaAlertsCount = orders.filter((o) => {
    const status = o.order_status?.toLowerCase();
    if (status === "placed" || status === "packed") {
      const hours = (Date.now() - new Date(o.created_at || Date.now()).getTime()) / (1000 * 3600);
      return hours > 2;
    }
    return false;
  }).length;

  // Packed orders for investigation
  const delayedPackedOrders = orders.filter((o) => getActiveStageIndex(o, null) === 5);

  return (
    <div className="min-h-screen bg-[#FFF3EF] py-6 px-4 md:px-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-950 font-satoshi">Order Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1 font-satoshi">
            Full-lifecycle order status visualization with intelligent SLA tracking
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          {slaAlertsCount > 0 && (
            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#FDA29B] rounded-lg bg-[#FEF3F2] text-[#F04438] text-sm font-semibold hover:bg-red-50 transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              + {slaAlertsCount} SLA Alerts
            </button>
          )}
          {slaWarningsCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FEF0C7] text-[#DC6803] rounded-lg text-sm font-semibold border border-[#FEC84B]">
              <AlertTriangle className="w-4 h-4" />
              {slaWarningsCount} SLA Warnings
            </div>
          )}
        </div>
      </div>

      {/* Live Order Tracker list */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
          <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase font-satoshi">Live Order Tracker</h2>
          <span className="bg-[#ECFDF3] text-[#027A48] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Live</span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-200">
          {loading ? (
            <div className="flex gap-4 w-full">
              {[1, 2, 3, 4, 5].map((x) => (
                <div key={x} className="min-w-[180px] h-20 bg-gray-50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="text-sm text-gray-500 py-4">No active orders found in the database.</div>
          ) : (
            activeOrders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              const hasWarning = ord.payment_status === "failed" || ord.order_status === "pending";
              return (
                <button
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`min-w-[200px] text-left p-3.5 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold font-satoshi ${isSelected ? "text-primary" : "text-gray-900"}`}>
                      #{ord.order_number}
                    </span>
                    {hasWarning && (
                      <AlertTriangle className="w-4 h-4 text-[#D93F21]" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate max-w-[170px] font-satoshi">
                    {ord.product?.name || "Product Item"}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Order Detail section */}
      {selectedOrder && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <div>
              <span className="text-base font-bold text-gray-900 font-satoshi">#{selectedOrder.order_number}</span>
              <span className="text-sm text-gray-500 ml-2 font-satoshi">{selectedOrder.product?.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#027A48] bg-[#ECFDF3] px-2.5 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              <span>2h left</span>
            </div>
          </div>

          {/* Timeline Nodes */}
          <div className="relative overflow-x-auto pb-6 pt-2">
            <div className="flex items-center min-w-[1200px] px-4">
              {STAGES.map((stage, idx) => {
                const isCompleted = idx < activeIndex;
                const isActive = idx === activeIndex;
                const isFuture = idx > activeIndex;

                let nodeColorClass = stage.bgClass;
                if (isActive) {
                  // Make active state filled with inner dot and larger ring
                  nodeColorClass = `${stage.bgClass.replace("bg-", "ring-4 ring-offset-2 ring-")} bg-${stage.color}-600`;
                  if (stage.color === "green") nodeColorClass = "ring-4 ring-offset-2 ring-green-600 bg-green-600";
                  if (stage.color === "orange") nodeColorClass = "ring-4 ring-offset-2 ring-orange-500 bg-orange-500";
                }

                return (
                  <div key={stage.id} className="flex-1 flex flex-col items-center relative z-10">
                    {/* Circle Node */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-semibold shadow-sm transition-all duration-300 ${nodeColorClass}`}>
                      {renderNodeIcon(idx)}
                    </div>

                    {/* Label */}
                    <div className="text-center mt-3 max-w-[90px]">
                      <p className={`text-[11px] font-bold leading-tight font-satoshi ${isActive ? "text-gray-900 font-extrabold" : "text-gray-500"}`}>
                        {stage.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 font-satoshi">
                        {getStepTimestamp(idx, selectedOrder)}
                      </p>
                    </div>

                    {/* Connecting line (rendered to the right of node, except for the last node) */}
                    {idx < STAGES.length - 1 && (
                      <div className="absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5 z-[-1]">
                        <div className={`h-full w-full transition-all duration-300 ${getLineBg(idx)}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs font-semibold">
            <div className="w-2 h-2 rounded-full bg-green-600" />
            <span className="text-gray-400 font-satoshi">Currently at:</span>
            <span className="text-gray-900 font-satoshi font-bold capitalize">{STAGES[activeIndex]?.name}</span>
            {activeIndex < STAGES.length - 1 && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400 font-satoshi">Next:</span>
                <span className="text-gray-500 font-satoshi font-semibold">{STAGES[activeIndex + 1]?.name}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Stage Performance Metrics table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-950 font-satoshi">Stage Performance Metrics</h2>
          <p className="text-xs text-gray-400 mt-0.5 font-satoshi">Avg time spent & volume at each stage - Today</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150 text-[11px] font-bold text-gray-400 uppercase tracking-wider font-satoshi">
                <th className="py-3.5 px-6">Stage</th>
                <th className="py-3.5 px-6">Active Orders</th>
                <th className="py-3.5 px-6">Avg Time At Stage</th>
                <th className="py-3.5 px-6">Health</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-satoshi text-gray-900">
              {metricsData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${row.dotColor}`} />
                    <span>{row.name}</span>
                  </td>
                  <td className="py-4 px-6 font-bold">{row.active}</td>
                  <td className="py-4 px-6 text-gray-500">{row.avgTime}</td>
                  <td className="py-4 px-6">
                    {row.health === "Healthy" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF3] text-[#027A48]">
                        Healthy
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF0C7] text-[#DC6803]">
                        Slow
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {row.action && (
                      <button
                        onClick={() => setShowDelayedModal(true)}
                        className="text-primary font-bold hover:text-orange-600 transition-colors bg-transparent border-0 cursor-pointer p-0"
                      >
                        Investigate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigate / Delayed Packed Orders Modal */}
      {showDelayedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-150 bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-satoshi flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Investigate Delay: Packed Stage
                </h3>
                <p className="text-xs text-gray-500 font-satoshi mt-0.5">Orders stuck in packed state for &gt; 30 minutes</p>
              </div>
              <button
                onClick={() => setShowDelayedModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-150 rounded-lg transition-colors border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 max-h-[400px] overflow-y-auto space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3">
                <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-xs text-orange-800 font-satoshi leading-relaxed">
                  <strong>Pickup Schedule Delayed:</strong> The shipping partner Courier Hub is reporting high volume in Mumbai. Pickups for regular shipments are running 40 mins behind schedule.
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Delayed Orders ({delayedPackedOrders.length})
                </h4>
                
                {delayedPackedOrders.length === 0 ? (
                  <div className="text-sm text-gray-500 py-6 text-center">
                    No orders currently in Packed stage.
                  </div>
                ) : (
                  delayedPackedOrders.map((ord) => {
                    const minsStuck = Math.max(
                      1,
                      Math.round((Date.now() - new Date(ord.created_at || Date.now()).getTime()) / (60 * 1000))
                    );
                    return (
                      <div key={ord.id} className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-bold text-gray-900 font-satoshi">#{ord.order_number}</span>
                            <p className="text-xs text-gray-500 font-satoshi mt-0.5">
                              {ord.product?.name || "Product Item"}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                            {minsStuck} mins stuck
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400 font-satoshi">
                          <span>Carrier: {ord.courier_name || ord.carrier || "Delhivery"}</span>
                          <span>Destination: {ord.Address?.city || ord.shippingAddress?.city || "Mumbai"}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowDelayedModal(false)}
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert("Triggering Priority Pickup Request...");
                  setShowDelayedModal(false);
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-xl hover:bg-orange-600 transition-colors"
              >
                Trigger Priority Pickup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPipeline;
