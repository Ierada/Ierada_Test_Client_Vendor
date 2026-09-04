import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getPaymentsDashboardData, getOrderPaymentDetails } from "../../../../services/api.paymentsDashboard";
import {
  ChevronDown,
  Wallet2,
  ShoppingCart,
  Truck,
  RotateCcw,
  RefreshCcw,
  Percent,
  Receipt,
  Banknote,
  Info,
  Calendar,
} from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];
const CYCLES = [
  { value: 1, label: "Cycle 1 (1st–15th)" },
  { value: 2, label: "Cycle 2 (16th–EOM)" },
];
const CURRENT_MONTH = new Date().getMonth() + 1;
const CURRENT_CYCLE = new Date().getDate() <= 15 ? 1 : 2;

const ORANGE = "#F97350";

const statusStyle = {
  Pending: "bg-amber-50 text-amber-600",
  Processing: "bg-blue-50 text-blue-600",
  Approved: "bg-indigo-50 text-indigo-600",
  Initiated: "bg-purple-50 text-purple-600",
  Successful: "bg-green-50 text-green-600",
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
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedCycle, setSelectedCycle] = useState(CURRENT_CYCLE);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getPaymentsDashboardData({ month: selectedMonth, year: selectedYear, cycle: selectedCycle });
      if (data) setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear, selectedCycle]);

  // Use dynamic data from API, fall back to zeros
  const cycleInfo = dashboardData?.cycleInfo || {
    currentCycle: "N/A",
    nextSettlement: "N/A",
    status: "N/A",
    lastSettlement: "N/A",
    lastSettlementAmount: "₹0.00"
  };

  const statistics = dashboardData?.statistics || {
    grossSales: { value: "₹0.00", delta: "0%", up: true },
    orders: { value: 0, delta: "0%", up: true },
    delivered: { value: 0, delta: "0%", up: true },
    rto: { value: 0, delta: "0%", up: false },
    returns: { value: 0, delta: "0%", up: false },
    commission: { value: "₹0.00", delta: "0%", up: true },
    gst: { value: "₹0.00", delta: "0%", up: true },
    netPayable: { value: "₹0.00", delta: "0%", up: true, highlight: true }
  };

  const salesTrend = dashboardData?.weeklyTrend || [];
  
  const paymentMethodsData = dashboardData?.paymentMethods || [];
  const paymentMethods = paymentMethodsData.map((pm, index) => ({
    ...pm,
    color: pm.color || ["#F97350", "#3B82F6", "#22C55E"][index % 3]
  }));

  const settlements = dashboardData?.recentSettlements || [];
  const orders = dashboardData?.recentOrders || [];
  
  const walletInfo = dashboardData?.walletInfo || {
    availableBalance: 0,
    upcomingSettlement: "₹0.00",
    holdAmount: "₹0.00",
    releasedToday: "₹0.00"
  };

  // Format wallet values
  const formatWalletValue = (val) => {
    if (typeof val === "number") return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return val;
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
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
        {/* Cycle summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 mb-4 flex items-center justify-between gap-6">
          {/* Left: Cycle selectors */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer"
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center bg-gray-50 rounded-full p-0.5 border border-gray-100">
              {CYCLES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setSelectedCycle(c.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                    selectedCycle === c.value
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Info items */}
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Active Cycle</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{cycleInfo.currentCycle}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Next Settlement</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{cycleInfo.nextSettlement}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Status</p>
              <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                cycleInfo.status === "Paid" ? "bg-green-50 text-green-600" :
                cycleInfo.status === "Processing" ? "bg-orange-50 text-orange-600" :
                cycleInfo.status === "On Hold" ? "bg-yellow-50 text-yellow-600" :
                cycleInfo.status === "No Payments" ? "bg-gray-100 text-gray-500" :
                "bg-blue-50 text-blue-600"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  cycleInfo.status === "Paid" ? "bg-green-500" :
                  cycleInfo.status === "Processing" ? "bg-orange-500" :
                  cycleInfo.status === "On Hold" ? "bg-yellow-500" :
                  cycleInfo.status === "No Payments" ? "bg-gray-400" : "bg-blue-500"
                }`} />
                {cycleInfo.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Last Settlement</p>
              <p className="text-sm font-semibold text-green-600 mt-0.5">{cycleInfo.lastSettlementAmount}</p>
            </div>
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
          <div className="flex items-center px-2 py-4 text-center text-sm text-gray-400 w-full">
            No settlement journey data available
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
              {salesTrend.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-10">No trend data</p>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrend}>
                  <XAxis dataKey="x" hide />
                  <Line type="monotone" dataKey="gross" stroke="#F97350" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="net" stroke="#22C55E" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              )}
            </div>
            {salesTrend.length > 0 && (
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> Gross Sales
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Net Payable
              </span>
            </div>
            )}
          </Card>

          <Card title="Payment Methods" className="lg:col-span-1">
            <div className="h-36 relative flex items-center justify-center">
              {paymentMethods.length === 0 ? (
                <p className="text-xs text-gray-400">No payment data</p>
              ) : (
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
              )}
              {paymentMethods.length > 0 && (
              <span className="absolute text-xs font-semibold text-gray-700">
                {paymentMethods[0].name}
              </span>
              )}
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
                { label: "Available Balance", value: formatWalletValue(walletInfo.availableBalance), tag: "Live", color: "text-green-500", dot: "bg-green-500" },
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
            {settlements.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No settlements found</p>
            ) : (
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
            )}
          </div>
        </Card>

        {/* Bottom utility row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card title="Quick Reports">
            <p className="text-xs text-gray-400 text-center py-2">No reports available</p>
          </Card>
          <Card title="GST Center">
            <p className="text-xs text-gray-400 text-center py-2">No reports available</p>
          </Card>
          <Card title="Escalations">
            <p className="text-xs text-gray-400 text-center py-2">No escalations</p>
          </Card>
          <Card title="Wallet">
            <p className="text-xs text-gray-400 text-center py-2">No wallet data</p>
          </Card>
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
            {orders.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No orders found</p>
            ) : (
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
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}