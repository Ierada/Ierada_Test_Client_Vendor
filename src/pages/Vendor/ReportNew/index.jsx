import { useEffect, useState } from "react";
import {
  ChevronRight,
  HelpCircle,
  Calendar,
  Download,
  ShoppingCart,
  CheckCircle2,
  MinusCircle,
  CreditCard,
  Clock,
  ArrowRight,
  Search,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { getReportsSummary, getGeneratedReports } from "../../../services/api.paymentsDashboard";
import { downloadPaymentAdvice } from "../../../services/api.paymentAdvice";
import { notifyOnSuccess, notifyOnFail } from "../../../utils/notification/toast";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ---------------------------------------------------------------------------
// Card config — values are filled from the reports-summary API
// ---------------------------------------------------------------------------
const SUMMARY_CARD_CONFIG = [
  {
    key: "totalSales",
    label: "Total Sales",
    icon: ShoppingCart,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    link: "View Details",
    fallback: { value: "₹0.00", sub: "No orders yet" },
  },
  {
    key: "totalPayouts",
    label: "Total Payouts",
    icon: CheckCircle2,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    link: "View Details",
    fallback: { value: "₹0.00", sub: "No settlements made" },
  },
  {
    key: "totalDeductions",
    label: "Total Deductions",
    icon: MinusCircle,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    link: "View Breakup",
    fallback: { value: "₹0.00", sub: "Commission & Adjustments" },
  },
  {
    key: "walletBalance",
    label: "Wallet Balance",
    icon: CreditCard,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    link: "View Wallet",
    fallback: { value: "₹0.00", sub: "Available for instant release" },
  },
  {
    key: "outstandingAmount",
    label: "Outstanding Amount",
    icon: Clock,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    link: "View Outstanding",
    fallback: { value: "₹0.00", sub: "Pending next cycle payout" },
  },
];

const buildSummaryCards = (summary) =>
  SUMMARY_CARD_CONFIG.map(({ key, label, icon, iconBg, iconColor, link, fallback }) => {
    const item = summary?.[key];
    let value = fallback.value;
    let sub = fallback.sub;

    if (item) {
      value = money(item.amount);
      if (key === "totalSales") sub = `${item.orders ?? 0} Orders processed`;
      else if (key === "totalPayouts") sub = `${item.settlements ?? 0} Settlements made`;
      else if (key === "outstandingAmount")
        sub = `${item.settlements ?? 0} pending settlement${(item.settlements ?? 0) === 1 ? "" : "s"}`;
      else if (key === "totalDeductions") sub = "Commission, GST, TDS & Adjustments";
      else if (key === "walletBalance") sub = "Available for instant release";
    }

    return { key, label, value, sub, link, icon, iconBg, iconColor };
  });

const CATEGORY_STYLES = {
  "Settlement & Payments": "bg-blue-50 text-blue-600",
  "Tax Reports": "bg-purple-50 text-purple-600",
  "Deductions & Adjustments": "bg-orange-50 text-orange-500",
  Others: "bg-gray-100 text-gray-600",
};

const TABS = [
  { key: "all", label: "All Reports" },
  { key: "settlement", label: "Settlement & Payments", category: "Settlement & Payments" },
  { key: "tax", label: "Tax Reports", category: "Tax Reports" },
  { key: "deductions", label: "Deductions & Adjustments", category: "Deductions & Adjustments" },
  { key: "others", label: "Others", category: "Others" },
];

// Static catalog shown only if the reports API fails
const FALLBACK_REPORTS = [
  { name: "Settlement Report", description: "Complete summary of all settlements", category: "Settlement & Payments", range: "-", generated: "-" },
  { name: "Transaction Report", description: "All transactions and payment details", category: "Settlement & Payments", range: "-", generated: "-" },
  { name: "Payment Advice Report", description: "Detailed payment advice and breakup", category: "Settlement & Payments", range: "-", generated: "-" },
  { name: "GST Summary Report", description: "GST collected and invoice summary", category: "Tax Reports", range: "-", generated: "-" },
  { name: "TDS Summary Report", description: "TDS deducted and certificate details", category: "Tax Reports", range: "-", generated: "-" },
];

// ---------------------------------------------------------------------------
// Shared styling tokens (kept consistent with the Seller Profile page)
// ---------------------------------------------------------------------------
const card = "bg-white rounded-2xl border border-gray-100 shadow-sm";
const secondaryBtn =
  "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors";
const primaryBtn =
  "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm";

const CategoryPill = ({ category }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
      CATEGORY_STYLES[category] || CATEGORY_STYLES.Others
    }`}
  >
    {category}
  </span>
);

const ReportsCenter = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState(null); // null = not loaded / failed
  const [downloadingId, setDownloadingId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchSummary = async () => {
      const data = await getReportsSummary();
      if (data) setSummary(data);
    };
    const fetchReports = async () => {
      const data = await getGeneratedReports();
      if (data) setReports(data);
    };
    fetchSummary();
    fetchReports();
  }, []);

  const summaryCards = buildSummaryCards(summary);

  const allReports = reports ?? FALLBACK_REPORTS;

  const filteredReports = allReports.filter((r) => {
    const tab = TABS.find((t) => t.key === activeTab);
    const matchesTab = activeTab === "all" || !tab?.category || r.category === tab.category;
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      String(r.ref_id || "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedReports = filteredReports.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, search, pageSize]);

  const handleDownload = async (r) => {
    if (!r.downloadable || downloadingId) return;
    setDownloadingId(r.id);
    try {
      if (r.download_type === "payment-advice" && r.download_ref_id) {
        const res = await downloadPaymentAdvice(r.download_ref_id);
        if (res?.status === 1) notifyOnSuccess("Payment advice report downloaded");
        else notifyOnFail("Failed to download report");
      } else {
        notifyOnFail("Download not available yet");
      }
    } catch {
      notifyOnFail("Error downloading report");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF3EC]">
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <span>Payments</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 font-medium">Reports Center</span>
        </div>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Reports Center</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Download and manage your financial, settlement, and tax related statements.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800">
              <HelpCircle className="w-4 h-4" />
              Help Center
            </button>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-xs font-semibold text-orange-600 overflow-hidden">
                FH
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 leading-tight">Fashion Hub</p>
                <p className="text-[11px] text-gray-400 leading-tight">Seller ID: 123456</p>
              </div>
            </div>
          </div>
        </div>

        {/* Date range + export */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <button className={secondaryBtn}>
            <Calendar className="w-4 h-4" />
            01 Aug 2026 - 15 Aug 2026
          </button>
          <button className={primaryBtn}>
            <Download className="w-4 h-4" />
            Export All
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          {summaryCards.map(({ key, label, value, sub, link, icon: Icon, iconBg, iconColor }) => (
            <div key={key} className={`${card} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                  {label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-1 mb-3">{sub}</p>
              <button className="text-xs font-medium text-orange-500 hover:text-orange-600 inline-flex items-center gap-1">
                {link}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Tabs + table */}
        <div className={`${card} overflow-hidden`}>
          <div className="flex items-center justify-between gap-3 px-4 pt-3 border-b border-gray-100 flex-wrap">
            <div className="flex items-center gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    activeTab === tab.key
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative mb-2.5">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports..."
                className="pl-9 pr-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder:text-gray-400 w-48"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide bg-gray-50">
                  <th className="py-2.5 px-4">Report Name</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Date Range</th>
                  <th className="py-2.5 px-4">Generated On</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedReports.map((r) => (
                  <tr key={r.id || r.name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-800 whitespace-nowrap">{r.name}</span>
                        {r.ref_id && (
                          <span className="text-[11px] text-gray-400">#{r.ref_id}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{r.description}</td>
                    <td className="py-3 px-4">
                      <CategoryPill category={r.category} />
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{r.range}</td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{r.generated}</td>
                    <td className="py-3 px-4 text-right">
                      {r.downloadable ? (
                        <button
                          onClick={() => handleDownload(r)}
                          disabled={downloadingId === r.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {downloadingId === r.id ? "Downloading..." : "Download"}
                        </button>
                      ) : (
                        <button
                          disabled
                          title="This report type is not generated yet"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-sm text-gray-400">
                      No reports generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {filteredReports.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredReports.length)} of {filteredReports.length} reports
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                    p === currentPage
                      ? "bg-orange-500 text-white"
                      : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="ml-2 text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 outline-none"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsCenter;