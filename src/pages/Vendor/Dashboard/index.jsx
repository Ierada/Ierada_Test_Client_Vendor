import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getDesignerDashboard } from "../../../services/api.dashboard";
import { getOrdersByVendorId } from "../../../services/api.order";
import { getReviewsByVendorId } from "../../../services/api.review";
import { useAppContext } from "../../../context/AppContext";
import { lastSevenDays } from "../../../components/Vendor/Dashboard/dashboardDates";
import DashboardKpiStrip from "../../../components/Vendor/Dashboard/DashboardKpiStrip.jsx";
import DashboardSalesRow from "../../../components/Vendor/Dashboard/DashboardSalesRow.jsx";
import DashboardInsights from "../../../components/Vendor/Dashboard/DashboardInsights.jsx";
import DashboardOpsRow from "../../../components/Vendor/Dashboard/DashboardOpsRow.jsx";
import DashboardPerformanceRow from "../../../components/Vendor/Dashboard/DashboardPerformanceRow.jsx";
import DashboardFinanceRow from "../../../components/Vendor/Dashboard/DashboardFinanceRow.jsx";
import DashboardGrowPromo from "../../../components/Vendor/Dashboard/DashboardGrowPromo.jsx";
import DashboardQuickActions from "../../../components/Vendor/Dashboard/DashboardQuickActions.jsx";
import DashboardCalendarRow from "../../../components/Vendor/Dashboard/DashboardCalendarRow.jsx";

const countByStatus = (orders, matchers) =>
  orders.filter((order) => {
    const status = String(order.status || order.order_status || "").toLowerCase();
    return matchers.some((m) => status.includes(m));
  }).length;

export default function ECommerce() {
  const { user } = useAppContext();
  const outlet = useOutletContext() || {};
  const dateRange = outlet.dateRange || lastSevenDays();
  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    total_products: 0,
    total_sales: 0,
    completed_order: 0,
    return_order: 0,
    cancelled_order: 0,
    processing_order: 0,
    shipped_order: 0,
    total_revenue: 0,
    total_users: 0,
    new_users: 0,
    donutChartData: {},
    stateData: [],
    topSellingProducts: [],
    topRentingProducts: [],
    customerRetentionData: [],
  });

  useEffect(() => {
    if (!user?.id) return;
    const fetchDashboardData = async () => {
      const response = await getDesignerDashboard(user.id);
      const payload = response?.data?.dashboardData;
      if (payload) setDashboardData((prev) => ({ ...prev, ...payload }));
    };
    const fetchOrders = async () => {
      try {
        const res = await getOrdersByVendorId(user.id, { silent: true });
        const list = Array.isArray(res?.data) ? res.data : [];
        setAllOrders(list);
        setRecentOrders(list.slice(0, 4));
      } catch {
        setAllOrders([]);
        setRecentOrders([]);
      }
    };
    const fetchReviews = async () => {
      try {
        const res = await getReviewsByVendorId(user.id);
        setReviews(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setReviews([]);
      }
    };

    fetchDashboardData();
    fetchOrders();
    fetchReviews();
  }, [user?.id]);

  const mergedData = useMemo(() => {
    const processing = countByStatus(allOrders, ["process", "pending", "confirm"]);
    const shipped = countByStatus(allOrders, ["ship", "dispatch"]);
    return {
      ...dashboardData,
      processing_order: dashboardData.processing_order || processing,
      shipped_order: dashboardData.shipped_order || shipped,
    };
  }, [dashboardData, allOrders]);

  return (
    <div className="px-4 pb-6 pt-3 text-[black] lg:px-6">
      <DashboardKpiStrip data={mergedData} />
      <div className="mb-2.5 grid grid-cols-1 gap-2.5 xl:grid-cols-12">
        <DashboardSalesRow data={mergedData} dateRange={dateRange} />
        <DashboardInsights insights={dashboardData.insights} data={mergedData} />
      </div>
      <DashboardOpsRow
        orders={recentOrders}
        inventory={{
          in_stock: dashboardData.in_stock,
          low_stock: dashboardData.low_stock,
          out_of_stock: dashboardData.out_of_stock,
        }}
        categories={(dashboardData.top_categories || dashboardData.topSellingProducts || []).map(
          (item) => ({
            name: item.name || item.category || item.product_name || "Category",
            amount: item.amount || item.revenue || item.total || 0,
          }),
        )}
      />
      <DashboardPerformanceRow
        performance={dashboardData.product_performance}
        reviews={reviews}
      />
      <DashboardFinanceRow data={mergedData} />
      <DashboardGrowPromo />
      <DashboardQuickActions />
      <DashboardCalendarRow
        dateRange={dateRange}
        series={dashboardData.sales_revenue_series || []}
      />
    </div>
  );
}
