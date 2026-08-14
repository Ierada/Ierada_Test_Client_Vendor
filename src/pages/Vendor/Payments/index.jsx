import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getPaymentsDashboardData, getOrderPaymentDetails } from "../../../services/api.paymentsDashboard";
import {
  Search,
  Bell,
  ChevronDown,
  Wallet2,
  ShoppingCart,
  Truck,
  RotateCcw,
  RefreshCcw,
  Percent,
  Receipt,
  Banknote,
  CheckCircle2,
  Circle,
  Info,
  Zap,
} from "lucide-react";

const ORANGE = "#F97350";

// Default/fallback data (will be replaced by API data)
const defaultSalesTrend = [
  { x: "W1", gross: 118000, net: 92000 },
  { x: "W2", gross: 142000, net: 108000 },
  { x: "W3", gross: 129000, net: 121000 },
  { x: "W4", gross: 168000, net: 118000 },
  { x: "W5", gross: 146000, net: 132000 },
  { x: "W6", gross: 139000, net: 127000 },
];

const defaultPaymentMethods = [
  { name: "UPI", value: 58, color: "#F97350" },
  { name: "Cards", value: 32, color: "#3B82F6" },
  { name: "Net Banking", value: 10, color: "#22C55E" },
];

const journeySteps = [
  { label: "Order Delivered", sub: "298 Orders", done: true },
  { label: "Return Window", sub: "15 Days", done: true },
  { label: "Settlement Generated", sub: "02 Aug 2026", done: true },
  { label: "GST Invoice Generated", sub: "03 Aug 2026", done: true },
  { label: "Bank Transfer", sub: "08 Aug 2026", done: true, active: true },
  { label: "Completed", sub: "", done: false },
];

const defaultSettlements = [
  { id: "SET-2508-001", date: "01 Aug 2026", orders: 152, gross: "₹2,48,500", commission: "₹12,850", tax: "₹3,850", tds: "₹1,020", adj: "-₹250", net: "₹2,30,930", status: "Processing" },
  { id: "SET-2507-002", date: "15 Jul 2026", orders: 145, gross: "₹2,25,400", commission: "₹11,250", tax: "₹3,420", tds: "₹980", adj: "-₹180", net: "₹2,09,770", status: "Paid" },
  { id: "SET-2507-001", date: "01 Jul 2026", orders: 138, gross: "₹1,98,600", commission: "₹9,850", tax: "₹3,150", tds: "₹860", adj: "-₹120", net: "₹1,84,760", status: "Paid" },
  { id: "SET-2506-002", date: "15 Jun 2026", orders: 120, gross: "₹1,75,800", commission: "₹8,750", tax: "₹2,780", tds: "₹720", adj: "-₹110", net: "₹1,63,440", status: "Paid" },
  { id: "SET-2506-001", date: "01 Jun 2026", orders: 110, gross: "₹1,45,600", commission: "₹7,250", tax: "₹2,320", tds: "₹610", adj: "-₹90", net: "₹1,35,330", status: "Paid" },
];

const defaultOrders = [
  { id: "ORD-123456", date: "01 Aug 2026", sku: "Men Solid T-Shirt (M/Blue)", invoice: "INV-100245", value: "₹899", commission: "₹64.95", gst: "₹40.46", tds: "₹8.09", net: "₹800.50", status: "Delivered" },
  { id: "ORD-123457", date: "01 Aug 2026", sku: "Women Kurti (L / White)", invoice: "INV-100246", value: "₹1,299", commission: "₹64.95", gst: "₹58.46", tds: "₹11.69", net: "₹1,158.90", status: "Delivered" },
  { id: "ORD-123458", date: "02 Aug 2026", sku: "Denim Jeans (32)", invoice: "INV-100247", value: "₹1,499", commission: "₹74.95", gst: "₹67.46", tds: "₹13.49", net: "₹1,338.10", status: "Delivered" },
  { id: "ORD-123459", date: "03 Aug 2026", sku: "Casual Shirt (L)", invoice: "INV-100248", value: "₹999", commission: "₹49.95", gst: "₹44.96", tds: "₹8.99", net: "₹890.10", status: "Returned" },
];

const statusStyle = {
  Processing: "bg-amber-50 text-amber-600",
  Paid: "bg-green-50 text-green-600",
  Delivered: "bg-green-50 text-green-600",
  Returned: "bg-red-50 text-red-500",
  "return pending": "bg-amber-50 text-amber-600",
  "return initiated": "bg-amber-50 text-amber-600",
  cancelled: "bg-red-50 text-red-500",
  placed: "bg-blue-50 text-blue-600",
  shipped: "bg-purple-50 text-purple-600",
  intransit: "bg-indigo-50 text-indigo-600",
};

const StatChip = ({ label, value, delta, up = true, icon: Icon, highlight }) => (
  <div
    className={`bg-white rounded-2xl border p-4 flex flex-col gap-2 ${
      highlight ? "border-orange-200 shadow-sm ring-1 ring-orange-100" : "border-gray-100 shadow-sm"
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
        {label}
      </span>
      {Icon && (
        <span
          className={`w-6 h-6 rounded-md flex items-center justify-center ${
            highlight ? "bg-orange-100 text-orange-500" : "bg-gray-50 text-gray-400"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
    <span className="text-xl font-semibold text-gray-900">{value}</span>
    {delta && (
      <span className={`text-xs font-medium flex items-center gap-1 ${up ? "text-green-600" : "text-red-500"}`}>
        {up ? "▲" : "▼"} {delta} vs last cycle
      </span>
    )}
  </div>
);

const Card = ({ title, subtitle, right, children, className = "" }) => (
  <section className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${className}`}>
    <div className="flex items-start justify-between mb-3 gap-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </section>
);

export default function PaymentsDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getPaymentsDashboardData();
        if (data) {
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Use dynamic data if available, otherwise use defaults
  const cycleInfo = dashboardData?.cycleInfo || {
    currentCycle: "01 Aug - 15 Aug 2026",
    nextSettlement: "08 Aug 2026",
    status: "Processing",
    lastSettlement: "15 Jul 2026",
    lastSettlementAmount: "₹1,42,580"
  };

  const statistics = dashboardData?.statistics || {
    grossSales: { value: "₹5,42,000", delta: "18.5%", up: true },
    orders: { value: 325, delta: "12.8%", up: true },
    delivered: { value: 298, delta: "10.3%", up: true },
    rto: { value: 15, delta: "4.2%", up: false },
    returns: { value: 12, delta: "2.6%", up: false },
    commission: { value: "₹28,500", delta: "8.6%", up: true },
    gst: { value: "₹8,420", delta: "11.7%", up: true },
    netPayable: { value: "₹4,98,250", delta: "19.4%", up: true, highlight: true }
  };

  const salesTrend = dashboardData?.weeklyTrend || defaultSalesTrend;
  
  const paymentMethodsData = dashboardData?.paymentMethods || defaultPaymentMethods;
  const paymentMethods = paymentMethodsData.map((pm, index) => ({
    ...pm,
    color: pm.color || ["#F97350", "#3B82F6", "#22C55E"][index % 3]
  }));

  const settlements = dashboardData?.recentSettlements || defaultSettlements;
  const orders = dashboardData?.recentOrders || defaultOrders;
  
  const walletInfo = dashboardData?.walletInfo || {
    availableBalance: "₹12,500",
    upcomingSettlement: "₹4,98,250",
    holdAmount: "₹4,350",
    releasedToday: "₹2,100"
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FDF1EA" }}>
        <div className="text-gray-600">Loading payments dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDF1EA" }}>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Payments Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Real-time analytics, cycle tracking, and order-level breakdown.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 w-64">
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Search transaction ID...</span>
            </div>
            <Bell className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=fashionhub"
                className="w-8 h-8 rounded-full object-cover border border-gray-100"
                alt="avatar"
              />
              <div className="leading-tight hidden sm:block">
                <p className="text-xs font-semibold text-gray-800">Fashion Hub</p>
                <p className="text-[10px] text-gray-400">Seller Panel</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
        {/* Cycle summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-8">
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">Active Cycle</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{cycleInfo.currentCycle}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">Next Settlement</p>
              <p className="text-sm font-semibold text-gray-800 mt-1 flex items-center gap-2">
                {cycleInfo.nextSettlement}
                <span className="text-[10px] font-medium bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                  in 2 days
                </span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">Status</p>
              <p className="text-sm font-semibold text-gray-800 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                {cycleInfo.status}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">Last Settlement</p>
            <p className="text-lg font-semibold text-green-600 mt-1">{cycleInfo.lastSettlementAmount}</p>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatChip label="Gross Sales" value={statistics.grossSales.value} delta={statistics.grossSales.delta} up={statistics.grossSales.up} icon={Wallet2} />
          <StatChip label="Orders" value={statistics.orders.value} delta={statistics.orders.delta} up={statistics.orders.up} icon={ShoppingCart} />
          <StatChip label="Delivered" value={statistics.delivered.value} delta={statistics.delivered.delta} up={statistics.delivered.up} icon={Truck} />
          <StatChip label="RTO" value={statistics.rto.value} delta={statistics.rto.delta} up={statistics.rto.up} icon={RotateCcw} />
          <StatChip label="Returns" value={statistics.returns.value} delta={statistics.returns.delta} up={statistics.returns.up} icon={RefreshCcw} />
          <StatChip label="Commission" value={statistics.commission.value} delta={statistics.commission.delta} up={statistics.commission.up} icon={Percent} />
          <StatChip label="GST Collected" value={statistics.gst.value} delta={statistics.gst.delta} up={statistics.gst.up} icon={Receipt} />
          <StatChip label="Net Payable" value={statistics.netPayable.value} delta={statistics.netPayable.delta} up={statistics.netPayable.up} icon={Banknote} highlight={statistics.netPayable.highlight} />
        </div>

        {/* Settlement journey */}
        <Card
          title="Settlement Journey"
          className="mb-4"
          right={
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Info className="w-3.5 h-3.5" /> How it works?
            </span>
          }
        >
          <div className="flex items-center px-2 py-4">
            {journeySteps.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-2 min-w-[92px]">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      step.active
                        ? "bg-orange-500 border-orange-500 text-white"
                        : step.done
                        ? "bg-white border-orange-500 text-orange-500"
                        : "bg-white border-gray-200 text-gray-300"
                    }`}
                  >
                    {step.done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-medium text-gray-700">{step.label}</p>
                    {step.sub && <p className="text-[10px] text-gray-400">{step.sub}</p>}
                  </div>
                </div>
                {i < journeySteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-6 ${step.done ? "bg-orange-400" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </Card>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <Card
            title="Sales & Payment Trend"
            className="lg:col-span-1"
            right={
              <span className="text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                This Cycle
              </span>
            }
          >
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrend}>
                  <XAxis dataKey="x" hide />
                  <Line type="monotone" dataKey="gross" stroke="#F97350" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="net" stroke="#22C55E" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> Gross Sales
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Net Payable
              </span>
            </div>
          </Card>

          <Card title="Payment Methods" className="lg:col-span-1">
            <div className="h-36 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    dataKey="value"
                    innerRadius={38}
                    outerRadius={56}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    {paymentMethods.map((m) => (
                      <Cell key={m.name} fill={m.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <span className="absolute text-xs font-semibold text-gray-700">
                {paymentMethods.length > 0 ? paymentMethods[0].name : 'Payment Methods'}
              </span>
            </div>
            <div className="space-y-1.5 mt-1">
              {paymentMethods.map((m) => (
                <div key={m.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                    {m.name}
                  </span>
                  <span className="font-medium text-gray-800">{m.percentage || m.value}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Wallet & Ledgers" className="lg:col-span-1">
            <div className="space-y-2.5">
              {[
                { label: "Available Balance", value: walletInfo.availableBalance, tag: "Live", color: "text-green-500", dot: "bg-green-500" },
                { label: "Upcoming Settlement", value: walletInfo.upcomingSettlement, tag: "Pending", color: "text-blue-500", dot: "bg-blue-500" },
                { label: "Hold Amount", value: walletInfo.holdAmount, tag: "On Hold", color: "text-amber-500", dot: "bg-amber-500" },
                { label: "Released Today", value: walletInfo.releasedToday, tag: "Disbursed", color: "text-orange-500", dot: "bg-orange-500" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                    {row.label}
                  </span>
                  <span className="font-semibold text-gray-800">{row.value}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg py-2 transition-colors">
              View Transaction Ledger
            </button>
          </Card>
        </div>

        {/* Recent settlements */}
        <Card
          title="Recent Cycle Settlements"
          className="mb-4"
          right={
            <button className="text-xs font-medium text-orange-500 hover:underline">
              View All Settlements
            </button>
          }
        >
          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Orders</th>
                  <th className="py-2 px-3">Gross Sales</th>
                  <th className="py-2 px-3">Commission</th>
                  <th className="py-2 px-3">Tax &amp; GST</th>
                  <th className="py-2 px-3">TDS</th>
                  <th className="py-2 px-3">Adjustment</th>
                  <th className="py-2 px-3">Net Payout</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 px-3 text-xs font-semibold text-gray-800">{s.id}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">{s.date}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">{s.orders}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">{s.gross}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">{s.commission}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">{s.tax}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">{s.tds}</td>
                    <td className="py-2.5 px-3 text-xs text-red-500">{s.adj}</td>
                    <td className="py-2.5 px-3 text-xs font-semibold text-green-600">{s.net}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${statusStyle[s.status] || 'bg-gray-50 text-gray-600'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bottom utility row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card title="Quick Reports">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Commission Report</span>
                <button className="text-orange-500 font-medium hover:underline">Download</button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Settlement Summary</span>
                <button className="text-orange-500 font-medium hover:underline">Download</button>
              </div>
            </div>
          </Card>
          <Card title="GST Center">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">GSTR-1 Monthly</span>
                <span className="text-green-600 font-medium">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">TCS Report (Sec 52)</span>
                <span className="text-green-600 font-medium">Available</span>
              </div>
            </div>
          </Card>
          <Card title="Escalations">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Missing Settlements</span>
                <span className="text-red-500 font-medium">2 Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Taxation Disputes</span>
                <span className="text-gray-400 font-medium">0 Disputes</span>
              </div>
            </div>
          </Card>
          <div className="bg-white rounded-2xl border border-orange-200 ring-1 ring-orange-100 shadow-sm p-4 flex flex-col justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-500 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Get Paid Faster
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Shorten settlement period from 15 to 3 days instantly.
              </p>
            </div>
            <button className="text-xs font-medium text-orange-500 hover:underline text-left mt-3">
              Configure AutoPay →
            </button>
          </div>
        </div>

        {/* Order-wise payment details */}
        <Card
          title="Order-wise Payment Details"
          className="mb-6"
          right={
            <div className="flex items-center gap-2">
              <button className="text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center gap-1">
                Filters <ChevronDown className="w-3 h-3" />
              </button>
              <button className="text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md px-3 py-1.5">
                Export CSV
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                  <th className="py-2 px-3">Order ID</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Product SKU</th>
                  <th className="py-2 px-3">Invoice No</th>
                  <th className="py-2 px-3">Order Value</th>
                  <th className="py-2 px-3">Commission</th>
                  <th className="py-2 px-3">GST</th>
                  <th className="py-2 px-3">TDS</th>
                  <th className="py-2 px-3">Net Payable</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 px-3 text-xs font-semibold text-orange-500">{o.id}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">{o.date}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-700">{o.sku}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">{o.invoice}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">{o.value}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">{o.commission}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">{o.gst}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">{o.tds}</td>
                    <td className="py-2.5 px-3 text-xs font-semibold text-gray-800">{o.net}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${statusStyle[o.status] || 'bg-gray-50 text-gray-600'}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}