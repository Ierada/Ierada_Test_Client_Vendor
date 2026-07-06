import React, { useState, useMemo, useEffect } from "react";

import OrderHeader from "../../../components/Vendor/order/OrderHeader";
import OrderFilterTabs from "../../../components/Vendor/order/OrderFilterTabs";
import OrderTable from "../../../components/Vendor/order/OrderTable";
import OrderPagination from "../../../components/Vendor/order/OrderPagination";
import OrderModal from "../../../components/Vendor/Models/OrderModal";
import OrderDetailModal from "../../../components/Vendor/Models/OrderDetailModal";

import { useAppContext } from "../../../context/AppContext";
import { getOrdersByVendorId } from "../../../services/api.order";
import { exportToPDF } from "./utils/pdfExport";

// ─── Main Component ────────────────────────────────────────────────────────────
const Order = () => {
  const { user } = useAppContext();

  // ── Data state ─────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modalData, setModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Multi-step accept flow ─────────────────────────────────────────────────
  const [activeFlowOrderId, setActiveFlowOrderId] = useState(null);

  // ── Filter / search / pagination state ────────────────────────────────────
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [filters, setFilters] = useState({
    orderStatus: "",
    startDate: "",
    endDate: "",
  });

  // ── Fetch orders ───────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await getOrdersByVendorId(user?.id);
      setOrders(res?.data?.orders || []);
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ── Client-side filtering (matches doc-8 logic exactly) ───────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search: order number, customer name, product name
      const matchesSearch =
        !search ||
        o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
        `${o.Address?.first_name || ""} ${o.Address?.last_name || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        o.product?.name?.toLowerCase().includes(search.toLowerCase());

      // Tab filter
      let matchesTab = false;
      const s = (o.order_status || "").toLowerCase();
      if (activeTab === "") {
        matchesTab = true;
      } else if (activeTab === "placed") {
        matchesTab = s === "placed" || s === "pending";
      } else if (activeTab === "shipped") {
        matchesTab = s === "shipped" || s === "packed";
      } else if (activeTab === "in transit") {
        matchesTab =
          s === "intransit" || s === "in transit" || s === "out for delivery";
      } else if (activeTab === "delivered") {
        matchesTab = s === "delivered";
      } else if (activeTab === "cancelled") {
        matchesTab = s === "cancelled" || s === "rejected";
      } else if (activeTab === "returned") {
        matchesTab =
          s === "returned" || s === "return" || s === "return pending";
      } else {
        matchesTab = s === activeTab;
      }

      // Advanced filter panel
      const matchesStatus =
        !filters.orderStatus || o.order_status === filters.orderStatus;
      const matchesDate =
        (!filters.startDate ||
          new Date(o.created_at) >= new Date(filters.startDate)) &&
        (!filters.endDate ||
          new Date(o.created_at) <= new Date(filters.endDate + "T23:59:59Z"));

      return matchesSearch && matchesTab && matchesStatus && matchesDate;
    });
  }, [orders, search, activeTab, filters]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, filters]);

  // ── Selection helpers ──────────────────────────────────────────────────────
  const handleSelectOrder = (id) =>
    setSelectedOrders((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const handleSelectAll = () => {
    const pageIds = paginatedOrders.map((o) => o.id);
    setSelectedOrders((p) => (p.length === pageIds.length ? [] : pageIds));
  };

  // ── Derived counts ─────────────────────────────────────────────────────────
  const unshipped = filteredOrders.filter(
    (o) =>
      !o.shipping_provider && !o.courier_name && o.order_status === "placed",
  ).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <OrderHeader
        onExport={() => exportToPDF(filteredOrders)}
        totalOrders={filteredOrders.length}
        unshipped={unshipped}
      />

      {/* Tabs + search + filter toggle */}
      <OrderFilterTabs
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1);
        }}
        search={search}
        setSearch={(s) => {
          setSearch(s);
          setCurrentPage(1);
        }}
        onToggleFilters={() => setShowFilters((p) => !p)}
        orders={orders}
      />

      {/* Advanced filter panel */}
      {showFilters && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Status
            </label>
            <select
              value={filters.orderStatus}
              onChange={(e) =>
                setFilters((p) => ({ ...p, orderStatus: e.target.value }))
              }
              className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="placed">Placed</option>
              <option value="shipped">Shipped</option>
              <option value="intransit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
              <option value="return pending">Return Pending</option>
              <option value="return initiated">Return Initiated</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, startDate: e.target.value }))
              }
              className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, endDate: e.target.value }))
              }
              className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <OrderTable
        orders={paginatedOrders}
        isLoading={isLoading}
        selectedOrders={selectedOrders}
        onSelectOrder={handleSelectOrder}
        onSelectAll={handleSelectAll}
        onViewOrder={(o) => {
          setModalData(o);
          setIsModalOpen(true);
        }}
        onOrderUpdate={fetchOrders}
        onAcceptSuccess={(orderId) => setActiveFlowOrderId(orderId)}
      />

      {/* Pagination */}
      <OrderPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalOrders={filteredOrders.length}
        pageSize={pageSize}
      />

      {/* Full detail + shipping modal */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalData(null);
        }}
        order={modalData}
        onOrderUpdate={fetchOrders}
      />

      {/* Multi-step accept flow modal */}
      <OrderDetailModal
        isOpen={!!activeFlowOrderId}
        onClose={() => {
          setActiveFlowOrderId(null);
          fetchOrders();
        }}
        orderId={activeFlowOrderId}
      />
    </div>
  );
};

export default Order;
