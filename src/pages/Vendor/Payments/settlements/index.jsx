import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Download,
  SlidersHorizontal,
  Search,
  RotateCcw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  getSettlements,
  getSettlementSummary,
} from "../../../../services/api.settlement";
import {
  getPaymentAdviceBySettlement,
} from "../../../../services/api.paymentAdvice";


// ---------------------------------------------------------------------------
// Shared styling tokens (kept consistent with the Seller Profile page)
// ---------------------------------------------------------------------------
const card = "bg-white rounded-2xl border border-gray-100 shadow-sm";
const inputBase =
  "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition-colors";
const primaryBtn =
  "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm";
const secondaryBtn =
  "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors";

const currency = (n) => `₹${n.toLocaleString("en-IN")}`;

const StatusPill = ({ status }) => {
  const styles = {
    Paid: "bg-green-50 text-green-600",
    Processing: "bg-orange-50 text-orange-500",
    Failed: "bg-red-50 text-red-500",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
};

const Sparkline = ({ trend }) => {
  if (!trend) return null;
  const up = trend === "up";
  const path = up
    ? "M2 20 L14 14 L26 16 L38 6 L50 2"
    : "M2 4 L14 8 L26 6 L38 16 L50 20";
  return (
    <svg viewBox="0 0 52 22" className="w-14 h-6" fill="none">
      <path
        d={path}
        stroke={up ? "#22c55e" : "#ef4444"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const Settlements = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState([]);
  const [summaryCards, setSummaryCards] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [totals, setTotals] = useState({});
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
  });
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    status: "all",
    cycle: "all",
    bankName: "all",
    paymentMode: "all",
  });

  useEffect(() => {
    fetchSettlements();
  }, [activeTab, search, filters, pagination.current_page, pagination.per_page]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const params = {
        status: activeTab === "all" ? undefined : activeTab,
        search: search || undefined,
        page: pagination.current_page,
        limit: pagination.per_page,
      };
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.cycle !== "all") params.cycle = filters.cycle;
      if (filters.bankName !== "all") params.bankName = filters.bankName;
      if (filters.paymentMode !== "all") params.paymentMode = filters.paymentMode;
      const response = await getSettlements(params);
      if (response.status === 1) {
        setSettlements(response.data.settlements);
        setTabs(response.data.tabs);
        setTotals(response.data.summary);
        setPagination(response.data.pagination);
        if (response.data.settlements.length > 0 && !selectedSettlement) {
          setSelectedSettlement(response.data.settlements[0]);
        } else if (response.data.settlements.length === 0) {
          setSelectedSettlement(null);
        }
      }
    } catch (error) {
      console.error("Error fetching settlements:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await getSettlementSummary();
      if (response.status === 1) {
        const data = response.data;
        setSummaryCards([
          {
            key: "total",
            label: "Total Settlements",
            value: data.total_settlements.toString(),
            sub: `₹${data.total_amount.toLocaleString("en-IN")}`,
            icon: Wallet,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            trend: "up",
          },
          {
            key: "settled",
            label: "Total Settled",
            value: "—",
            sub: `₹${data.total_settled.toLocaleString("en-IN")}`,
            icon: CheckCircle2,
            iconBg: "bg-green-50",
            iconColor: "text-green-600",
            trend: "up",
          },
          {
            key: "processing",
            label: "Processing",
            value: "—",
            sub: `₹${data.total_processing.toLocaleString("en-IN")}`,
            icon: Clock,
            iconBg: "bg-orange-50",
            iconColor: "text-orange-500",
            trend: "up",
          },
          {
            key: "failed",
            label: "Failed / On Hold",
            value: "—",
            sub: `₹${data.total_failed.toLocaleString("en-IN")}`,
            icon: AlertTriangle,
            iconBg: "bg-red-50",
            iconColor: "text-red-500",
            trend: "down",
          },
          {
            key: "avg",
            label: "Average Settlement Amount",
            value: `₹${Math.round(data.average_net_payable).toLocaleString("en-IN")}`,
            sub: "Per Settlement",
            icon: Wallet,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
            trend: null,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        status: activeTab === "all" ? undefined : activeTab,
        search: search || undefined,
        limit: 10000, // Get all settlements for export
      };
      const response = await getSettlements(params);
      if (response.status === 1 && response.data.settlements.length > 0) {
        const exportData = response.data.settlements.map((s) => ({
          "Settlement ID": s.settlement_id,
          "Settlement Date": s.settlement_date ? new Date(s.settlement_date).toLocaleDateString("en-IN") : "—",
          "Period Start": s.settlement_period_start ? new Date(s.settlement_period_start).toLocaleDateString("en-IN") : "—",
          "Period End": s.settlement_period_end ? new Date(s.settlement_period_end).toLocaleDateString("en-IN") : "—",
          "Settlement Cycle": s.settlement_cycle || "—",
          "Orders": s.orders_count || 0,
          "Order Value (₹)": parseFloat(s.order_value) || 0,
          "Commission (₹)": parseFloat(s.commission) || 0,
          "GST (₹)": parseFloat(s.gst) || 0,
          "TDS (₹)": parseFloat(s.tds) || 0,
          "Adjustments (₹)": parseFloat(s.adjustments) || 0,
          "Net Payable (₹)": parseFloat(s.net_payable) || 0,
          "Status": s.status,
          "UTR Number": s.utr_number || "—",
          "Bank Name": s.bank_name || "—",
          "Payment Mode": s.payment_mode || "—",
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Settlements");
        XLSX.writeFile(wb, `settlements_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (error) {
      console.error("Error exporting settlements:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF3EC]">
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Settlements</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Track and manage all your settlement cycles and payouts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className={secondaryBtn}>
              <Calendar className="w-4 h-4" />
              {filters.dateFrom && filters.dateTo
                ? `${new Date(filters.dateFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} - ${new Date(filters.dateTo).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
                : "All Dates"}
            </button>
            <button 
              onClick={handleExport}
              disabled={settlements.length === 0}
              className={`${secondaryBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className={primaryBtn}>
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
              {summaryCards.map(({ key, label, value, sub, icon: Icon, iconBg, iconColor, trend }) => (
                <div key={key} className={`${card} p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-500">{label}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-semibold text-gray-900 leading-none">{value}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{sub}</p>
                    </div>
                    <Sparkline trend={trend} />
                  </div>
                </div>
              ))}
            </div>

            {/* Filters row */}
            <div className={`${card} p-4 mb-3`}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">From Date</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">To Date</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Settlement Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className={inputBase}
                  >
                    <option value="all">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Processing">Processing</option>
                    <option value="Failed">Failed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Settlement Cycle</label>
                  <select
                    value={filters.cycle}
                    onChange={(e) => setFilters({ ...filters, cycle: e.target.value })}
                    className={inputBase}
                  >
                    <option value="all">All Cycles</option>
                    <option value="1">Cycle 1 (1st-15th)</option>
                    <option value="2">Cycle 2 (16th-EOM)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Payment Mode</label>
                    <select
                      value={filters.paymentMode}
                      onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}
                      className={inputBase}
                    >
                      <option value="all">All</option>
                      <option value="NEFT">NEFT</option>
                      <option value="IMPS">IMPS</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setFilters({ dateFrom: "", dateTo: "", status: "all", cycle: "all", bankName: "all", paymentMode: "all" })}
                    className="mb-0.5 self-end inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className={`${card} p-2.5 mb-4`}>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by Settlement ID, UTR, UTR2, Invoice No, Bank Name, Payment Mode"
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Tabs + table */}
            <div className={`${card} overflow-hidden`}>
              <div className="flex items-center gap-1 px-4 pt-3 border-b border-gray-100 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                      activeTab === tab.key
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label} <span className="text-gray-400">({tab.count})</span>
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide bg-gray-50">
                      <th className="py-2.5 px-4">Settlement ID</th>
                      <th className="py-2.5 px-4">Payment Date</th>
                      <th className="py-2.5 px-4">Settlement Period</th>
                      <th className="py-2.5 px-4">Cycle ID</th>
                      <th className="py-2.5 px-4 text-right">Orders</th>
                      <th className="py-2.5 px-4 text-right">Gross Sales (₹)</th>
                      <th className="py-2.5 px-4 text-right">Commission (₹)</th>
                      <th className="py-2.5 px-4 text-right">GST (₹)</th>
                      <th className="py-2.5 px-4 text-right">TDS (₹)</th>
                      <th className="py-2.5 px-4 text-right">Net Payable (₹)</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">UTR No.</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Wallet className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No settlements to show</p>
                            <p className="text-gray-400 text-sm mt-1">
                              {activeTab === "all" ? "You don't have any settlements yet." : `No ${activeTab} settlements found.`}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      settlements.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedSettlement(s)}
                        className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                          selectedSettlement?.id === s.id ? "bg-orange-50/50" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="py-2.5 px-4 font-medium text-gray-800">{s.settlement_id}</td>
                        <td className="py-2.5 px-4 text-gray-500">
                          {s.settlement_date ? new Date(s.settlement_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="py-2.5 px-4 text-gray-500">
                          {s.settlement_period_start && s.settlement_period_end
                            ? `${new Date(s.settlement_period_start).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - ${new Date(s.settlement_period_end).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
                            : "—"}
                        </td>
                        <td className="py-2.5 px-4 text-gray-500">{s.settlement_cycle || "—"}</td>
                        <td className="py-2.5 px-4 text-right text-gray-700">{s.orders_count || 0}</td>
                        <td className="py-2.5 px-4 text-right text-gray-700">{parseFloat(s.order_value).toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4 text-right text-gray-700">{parseFloat(s.commission).toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4 text-right text-gray-700">{parseFloat(s.gst).toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4 text-right text-gray-700">{parseFloat(s.tds).toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-gray-900">{parseFloat(s.net_payable).toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4"><StatusPill status={s.status} /></td>
                        <td className="py-2.5 px-4 text-gray-500">{s.utr_number || "—"}</td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSettlement(s);
                            }}
                            className="text-gray-400 hover:text-orange-500 transition-colors"
                          >
                            <Eye className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold text-gray-800">
                      <td className="py-3 px-4" colSpan={5}>Total Summary</td>
                      <td className="py-3 px-4 text-right">{parseFloat(totals.total_order_value || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right">{parseFloat(totals.total_commission || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right">{parseFloat(totals.total_gst || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right">{parseFloat(totals.total_tds || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right">{parseFloat(totals.total_net_payable || 0).toLocaleString("en-IN")}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing {pagination.current_page * pagination.per_page - pagination.per_page + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} entries
                </p>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setPagination({ ...pagination, current_page: Math.max(1, pagination.current_page - 1) })}
                    disabled={pagination.current_page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination({ ...pagination, current_page: pageNum })}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                          pageNum === pagination.current_page
                            ? "bg-orange-500 text-white"
                            : "text-gray-600 hover:bg-gray-50 border border-gray-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {pagination.total_pages > 5 && <span className="px-1 text-gray-400">...</span>}
                  <button 
                    onClick={() => setPagination({ ...pagination, current_page: Math.min(pagination.total_pages, pagination.current_page + 1) })}
                    disabled={pagination.current_page === pagination.total_pages}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <select 
                    value={pagination.per_page}
                    onChange={(e) => setPagination({ ...pagination, per_page: parseInt(e.target.value), current_page: 1 })}
                    className="ml-2 text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 outline-none"
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — Settlement Details */}
          {selectedSettlement && (
            <aside className={`${card} w-full xl:w-[340px] shrink-0 h-fit`}>
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Settlement Details</h3>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                    {selectedSettlement.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSettlement(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-5">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Settlement Information
                  </p>
                  <dl className="space-y-2 text-sm">
                    {[
                      ["Settlement ID", selectedSettlement.settlement_id],
                      ["Settlement Period", selectedSettlement.settlement_period_start && selectedSettlement.settlement_period_end
                        ? `${new Date(selectedSettlement.settlement_period_start).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - ${new Date(selectedSettlement.settlement_period_end).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
                        : "—"],
                      ["Settlement Cycle", selectedSettlement.settlement_cycle || "—"],
                      ["Payment Date", selectedSettlement.settlement_date ? new Date(selectedSettlement.settlement_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"],
                      ["UTR Number", selectedSettlement.utr_number || "—"],
                      ["Bank Name", selectedSettlement.bank_name || "—"],
                      ["Payment Mode", selectedSettlement.payment_mode || "—"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <dt className="text-gray-400">{k}</dt>
                        <dd className="text-gray-800 font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Amount Breakdown
                  </p>
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-400">Order Count</dt>
                      <dd className="text-gray-800 font-medium">{selectedSettlement.orders_count || 0}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-400">Gross Sales</dt>
                      <dd className="text-gray-800 font-medium">{currency(parseFloat(selectedSettlement.order_value))}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-400">Commission</dt>
                      <dd className="text-red-500 font-medium">- {currency(parseFloat(selectedSettlement.commission))}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-400">GST</dt>
                      <dd className="text-red-500 font-medium">- {currency(parseFloat(selectedSettlement.gst))}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-400">TDS</dt>
                      <dd className="text-red-500 font-medium">- {currency(parseFloat(selectedSettlement.tds))}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-400">Adjustment</dt>
                      <dd className="text-gray-500 font-medium">{selectedSettlement.adjustments ? `- ${currency(parseFloat(selectedSettlement.adjustments))}` : "- ₹0"}</dd>
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100">
                      <dt className="text-green-600 font-semibold">Net Payable</dt>
                      <dd className="text-green-600 font-semibold">{currency(parseFloat(selectedSettlement.net_payable))}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Remarks</p>
                  <p className="text-sm text-gray-400">{selectedSettlement.remarks || "—"}</p>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 space-y-2">
                <button
                  onClick={async () => {
                    if (!selectedSettlement?.id) return;
                    try {
                      const res = await getPaymentAdviceBySettlement(selectedSettlement.id);
                      if (res.status === 1 && res.data?.id) {
                        navigate(`/payments/payment-advice/${res.data.id}`);
                      } else {
                        alert("No payment advice found for this settlement");
                      }
                    } catch {
                      alert("No payment advice found for this settlement");
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Payment Advice
                </button>
                <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Download Advice
                </button>
                <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Download Invoice
                </button>
                <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <AlertTriangle className="w-4 h-4" />
                  Raise Settlement Query
                </button>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settlements;