import React, { useState, useMemo, useEffect } from "react";

import OrderHeader from "../../../components/Vendor/order/OrderHeader";
import OrderSummaryCards from "../../../components/Vendor/order/OrderSummaryCards";
import OrderTableHeader from "../../../components/Vendor/order/OrderTableHeader";
import OrderTable from "../../../components/Vendor/order/OrderTable";
import OrderPagination from "../../../components/Vendor/order/OrderPagination";
import OrderDetailModal from "../../../components/Vendor/Models/OrderDetailModal";
import StatusMultiSelect from "../../../components/Vendor/order/StatusMultiSelect";

import { useAppContext } from "../../../context/AppContext";
import {
  getOrdersByVendorId,
  updateOrderStatus,
} from "../../../services/api.order";
import { exportToPDF } from "./utils/pdfExport";
import { exportToExcel } from "./utils/excelExport";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../utils/notification/toast";
import { getApiErrorMessage } from "../../../utils/apiError";

const Order = () => {
  const { user } = useAppContext();

  // ── Data ───────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [activeFlowOrderId, setActiveFlowOrderId] = useState(null);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // ── Filters / search / pagination ──────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filters, setFilters] = useState({
    orderStatuses: [], // multi-select — empty means "all statuses"
    startDate: "",
    endDate: "",
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const res = await getOrdersByVendorId(user.id);
      setOrders(res?.data?.orders || []);
    } catch (e) {
      console.error("Error fetching orders:", e);
      notifyOnFail(getApiErrorMessage(e, "Failed to load orders"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

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
        filters.orderStatuses.length === 0 ||
        filters.orderStatuses.includes(
          String(o.order_status || "").toLowerCase(),
        );

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

  // Clear selection whenever the filtered set changes — otherwise a bulk
  // action could silently include orders that are no longer even visible.
  useEffect(() => {
    setSelectedOrders([]);
  }, [search, filters]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const handleSelectOrder = (id) =>
    setSelectedOrders((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  // "Select all" spans every order matching the current filters (not just the
  // visible page) — otherwise "select all → export selected" after filtering
  // would silently only grab the current page.
  const allFilteredIds = useMemo(
    () => filteredOrders.map((o) => o.id),
    [filteredOrders],
  );
  const allFilteredSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedOrders.includes(id));
  const someFilteredSelected = allFilteredIds.some((id) =>
    selectedOrders.includes(id),
  );

  const handleSelectAll = () => {
    setSelectedOrders(allFilteredSelected ? [] : allFilteredIds);
  };

  // Full order objects for the current selection — bulk action eligibility
  // (reject / deliver) is computed from real status + shipping_provider, not
  // just the id list.
  const selectedOrderObjects = useMemo(
    () => orders.filter((o) => selectedOrders.includes(o.id)),
    [orders, selectedOrders],
  );

  // ── Bulk action ────────────────────────────────────────────────────────────
  const runBulkStatusUpdate = async (action, extra = {}) => {
    let successCount = 0;
    let firstErrorMessage = null;
    await Promise.all(
      selectedOrders.map(async (id) => {
        try {
          const res = await updateOrderStatus(id, {
            order_status: action,
            ...extra,
          });
          if (res?.status === 1) {
            successCount++;
          } else if (!firstErrorMessage) {
            firstErrorMessage = res?.message || null;
          }
        } catch (err) {
          if (!firstErrorMessage) {
            firstErrorMessage = getApiErrorMessage(err, null);
          }
        }
      }),
    );

    if (successCount > 0) {
      const failedCount = selectedOrders.length - successCount;
      notifyOnSuccess(
        `${successCount} order${successCount > 1 ? "s" : ""} updated` +
          (failedCount > 0 ? ` — ${failedCount} failed` : ""),
      );
      setSelectedOrders([]);
      fetchOrders();
    }
    if (successCount < selectedOrders.length) {
      notifyOnFail(firstErrorMessage || "Bulk update failed");
    }
  };

  const handleBulkAction = async (action) => {
    if (action === "export_pdf" || action === "export_excel") {
      const rows =
        selectedOrders.length > 0
          ? filteredOrders.filter((o) => selectedOrders.includes(o.id))
          : filteredOrders;
      if (action === "export_pdf") exportToPDF(rows);
      else exportToExcel(rows);
      return;
    }
    if (selectedOrders.length === 0) {
      notifyOnFail("Select at least one order first");
      return;
    }
    // Reject needs a reason from the vendor — collect it first.
    if (action === "rejected") {
      setBulkRejectOpen(true);
      return;
    }
    await runBulkStatusUpdate(action);
  };

  const confirmBulkReject = async () => {
    if (!bulkRejectReason.trim()) {
      notifyOnFail("Please enter a reason for rejecting these orders");
      return;
    }
    setBulkSubmitting(true);
    await runBulkStatusUpdate("rejected", {
      reject_reason: bulkRejectReason.trim(),
    });
    setBulkSubmitting(false);
    setBulkRejectOpen(false);
    setBulkRejectReason("");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAFA] p-5">
      {/* 1. Header */}
      <OrderHeader />

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
        selectedOrderObjects={selectedOrderObjects}
        onBulkAction={handleBulkAction}
      />

      {/* 4. Advanced filter panel */}
      {showFilters && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 mb-4 grid grid-cols-1 md:grid-cols-3 gap-5 shadow-sm">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
              Order Status
            </label>
            <StatusMultiSelect
              selected={filters.orderStatuses}
              onChange={(orderStatuses) =>
                setFilters((p) => ({ ...p, orderStatuses }))
              }
            />
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
                setFilters({ orderStatuses: [], startDate: "", endDate: "" });
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
        allSelected={allFilteredSelected}
        someSelected={someFilteredSelected}
        onSelectOrder={handleSelectOrder}
        onSelectAll={handleSelectAll}
        onViewOrder={(o) => setActiveFlowOrderId(o.id)}
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

      {/* Multi-step accept flow modal (accept/reject → invoice → ship) */}
      <OrderDetailModal
        isOpen={!!activeFlowOrderId}
        onClose={() => {
          setActiveFlowOrderId(null);
          fetchOrders();
        }}
        orderId={activeFlowOrderId}
        onOrderUpdate={fetchOrders}
      />

      {/* Bulk reject reason modal */}
      {bulkRejectOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-150">
            <h3 className="text-base font-bold text-gray-950 mb-2">
              Reject {selectedOrders.length} order
              {selectedOrders.length > 1 ? "s" : ""}
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Please provide a reason. This is for your records only — the
              customer will just see that the order was cancelled.
            </p>
            <textarea
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              placeholder="Enter reason (e.g. Out of stock, pricing error)..."
              className="w-full min-h-[80px] p-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#FF6012] mb-5 resize-none"
            />
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setBulkRejectOpen(false);
                  setBulkRejectReason("");
                }}
                disabled={bulkSubmitting}
                className="px-3.5 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkReject}
                disabled={bulkSubmitting || !bulkRejectReason.trim()}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkSubmitting ? "Rejecting…" : "Reject Orders"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;
