import React, { useState, useEffect, useMemo } from "react";
import OrderHeader from "../../../components/Vendor/order/OrderHeader";
import OrderFilterTabs from "../../../components/Vendor/order/OrderFilterTabs";
import OrderTable from "../../../components/Vendor/order/OrderTable";
import OrderPagination from "../../../components/Vendor/order/OrderPagination";
import OrderModal from "../../../components/Vendor/Models/OrderModal";
import OrderDetailModal from "../../../components/Vendor/Models/OrderDetailModal";
import { useAppContext } from "../../../context/AppContext";
import { getOrdersByVendorId } from "../../../services/api.order";
import { exportToPDF } from "./utils/pdfExport";

const Order = () => {
  const { user } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFlowOrderId, setActiveFlowOrderId] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [filters, setFilters] = useState({ orderStatus: "", startDate: "", endDate: "" });

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

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch = o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
        o.customer?.customerDetails?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.product?.name?.toLowerCase().includes(search.toLowerCase());

      let matchesTab = false;
      if (activeTab === "") {
        matchesTab = true;
      } else {
        const orderStatus = o.order_status?.toLowerCase();
        if (activeTab === "placed") {
          matchesTab = orderStatus === "placed" || orderStatus === "pending";
        } else if (activeTab === "shipped") {
          matchesTab = orderStatus === "shipped" || orderStatus === "packed";
        } else if (activeTab === "in transit") {
          matchesTab = orderStatus === "intransit" || orderStatus === "in transit" || orderStatus === "out for delivery";
        } else if (activeTab === "delivered") {
          matchesTab = orderStatus === "delivered";
        } else if (activeTab === "cancelled") {
          matchesTab = orderStatus === "cancelled" || orderStatus === "rejected";
        } else if (activeTab === "returned") {
          matchesTab = orderStatus === "returned" || orderStatus === "return" || orderStatus === "return pending";
        } else {
          matchesTab = orderStatus === activeTab;
        }
      }

      const matchesStatus = !filters.orderStatus || o.order_status === filters.orderStatus;
      const matchesDate = (!filters.startDate || new Date(o.created_at) >= new Date(filters.startDate)) &&
        (!filters.endDate || new Date(o.created_at) <= new Date(filters.endDate + "T23:59:59Z"));
      return matchesSearch && matchesTab && matchesStatus && matchesDate;
    });
  }, [orders, search, activeTab, filters]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  const handleSelectOrder = (id) => {
    setSelectedOrders((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  };

  const handleSelectAll = () => {
    const pageIds = paginatedOrders.map((o) => o.id);
    setSelectedOrders((p) => p.length === paginatedOrders.length ? [] : pageIds);
  };

  return (
    <div className="min-h-screen p-4">
      <OrderHeader onExport={() => exportToPDF(filteredOrders)} />
      <OrderFilterTabs
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setCurrentPage(1); }}
        search={search}
        setSearch={(s) => { setSearch(s); setCurrentPage(1); }}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {showFilters && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
            <select value={filters.orderStatus} onChange={(e) => setFilters(p => ({ ...p, orderStatus: e.target.value }))} className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">All Statuses</option>
              <option value="placed">Placed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters(p => ({ ...p, startDate: e.target.value }))} className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">End Date</label>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters(p => ({ ...p, endDate: e.target.value }))} className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
      )}

      <OrderTable
        orders={paginatedOrders}
        isLoading={isLoading}
        selectedOrders={selectedOrders}
        onSelectOrder={handleSelectOrder}
        onSelectAll={handleSelectAll}
        onViewOrder={(o) => { setModalData(o); setIsModalOpen(true); }}
        onOrderUpdate={fetchOrders}
        onAcceptSuccess={(orderId) => setActiveFlowOrderId(orderId)}
      />

      <OrderPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalOrders={filteredOrders.length} pageSize={pageSize} />

      <OrderModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setModalData(null); }} order={modalData} onOrderUpdate={fetchOrders} />

      <OrderDetailModal
        isOpen={!!activeFlowOrderId}
        onClose={() => { setActiveFlowOrderId(null); fetchOrders(); }}
        orderId={activeFlowOrderId}
      />
    </div>
  );
};

export default Order;
