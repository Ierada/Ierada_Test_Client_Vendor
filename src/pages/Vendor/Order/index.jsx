import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import OrderHeader from "../../../components/Vendor/order/OrderHeader";
import OrderSummaryCards from "../../../components/Vendor/order/OrderSummaryCards";
import OrderTableHeader from "../../../components/Vendor/order/OrderTableHeader";
import OrderTable from "../../../components/Vendor/order/OrderTable";
import OrderPagination from "../../../components/Vendor/order/OrderPagination";
import OrderModal from "../../../components/Vendor/Models/OrderModal";
import OrderDetailModal from "../../../components/Vendor/Models/OrderDetailModal";

import { useAppContext } from "../../../context/AppContext";
import {
  getOrdersByVendorId,
  updateOrderStatus,
} from "../../../services/api.order";
import { exportToPDF } from "./utils/pdfExport";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../utils/notification/toast";

const Order = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();

  // ── Data ───────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [modalData, setModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFlowOrderId, setActiveFlowOrderId] = useState(null);

  // ── Filters / search / pagination ──────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filters, setFilters] = useState({
    orderStatus: "",
    startDate: "",
    endDate: "",
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !search ||
        o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
        `${o.Address?.first_name || ""} ${o.Address?.last_name || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        o.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        (o.tracking_id || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        !filters.orderStatus || o.order_status === filters.orderStatus;

      const matchesDate =
        (!filters.startDate ||
          new Date(o.created_at) >= new Date(filters.startDate)) &&
        (!filters.endDate ||
          new Date(o.created_at) <= new Date(filters.endDate + "T23:59:59Z"));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, search, filters]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  // Reset to page 1 on filter/search/pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, pageSize]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const handleSelectOrder = (id) =>
    setSelectedOrders((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const handleSelectAll = () => {
    const pageIds = paginatedOrders.map((o) => o.id);
    setSelectedOrders((p) => (p.length === pageIds.length ? [] : pageIds));
  };

  // ── Bulk action ────────────────────────────────────────────────────────────
  const handleBulkAction = async (action) => {
    if (action === "export") {
      exportToPDF(
        selectedOrders.length > 0
          ? filteredOrders.filter((o) => selectedOrders.includes(o.id))
          : filteredOrders,
      );
      return;
    }
    if (selectedOrders.length === 0) {
      notifyOnFail("Select at least one order first");
      return;
    }
    let successCount = 0;
    await Promise.all(
      selectedOrders.map(async (id) => {
        try {
          const res = await updateOrderStatus(id, { order_status: action });
          if (res?.status === 1) successCount++;
        } catch {
          /* continue */
        }
      }),
    );
    if (successCount > 0) {
      notifyOnSuccess(
        `${successCount} order${successCount > 1 ? "s" : ""} updated`,
      );
      setSelectedOrders([]);
      fetchOrders();
    } else {
      notifyOnFail("Bulk update failed");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAFA] p-5">
      {/* 1. Header */}
      <OrderHeader
        onCreateOrder={() => navigate("/vendor/orders/create")}
        onExport={() => exportToPDF(filteredOrders)}
      />

      {/* 2. Summary stat cards */}
      <OrderSummaryCards orders={orders} />

      {/* 3. Table controls */}
      <OrderTableHeader
        search={search}
        setSearch={(s) => {
          setSearch(s);
          setCurrentPage(1);
        }}
        onToggleFilters={() => setShowFilters((p) => !p)}
        selectedOrders={selectedOrders}
        onBulkAction={handleBulkAction}
        onExport={() => exportToPDF(filteredOrders)}
      />

      {/* 4. Advanced filter panel */}
      {showFilters && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 mb-4 grid grid-cols-1 md:grid-cols-3 gap-5 shadow-sm">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
              Order Status
            </label>
            <select
              value={filters.orderStatus}
              onChange={(e) =>
                setFilters((p) => ({ ...p, orderStatus: e.target.value }))
              }
              className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6012]"
            >
              <option value="">All Statuses</option>
              <option value="placed">Placed / Pending</option>
              <option value="shipped">Shipped</option>
              <option value="intransit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
              <option value="returned">Returned</option>
              <option value="return pending">Return Pending</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, startDate: e.target.value }))
              }
              className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6012]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, endDate: e.target.value }))
              }
              className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6012]"
            />
          </div>
          <div className="md:col-span-3 flex justify-end gap-2">
            <button
              onClick={() => {
                setFilters({ orderStatus: "", startDate: "", endDate: "" });
                setSearch("");
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#FF6012] rounded-xl hover:bg-[#e0500a] transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* 5. Table */}
      <OrderTable
        orders={paginatedOrders}
        isLoading={isLoading}
        selectedOrders={selectedOrders}
        onSelectOrder={handleSelectOrder}
        onSelectAll={handleSelectAll}
        onViewOrder={(o) => navigate(`/orders/${o.id}`)}
        onOrderUpdate={fetchOrders}
        onAcceptSuccess={(orderId) => setActiveFlowOrderId(orderId)}
      />

      {/* 6. Pagination — rendered inside table's bottom border */}
      <OrderPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalOrders={filteredOrders.length}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* 7. Full detail + shipping modal */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalData(null);
        }}
        order={modalData}
        onOrderUpdate={fetchOrders}
      />

      {/* 8. Multi-step accept flow modal */}
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
