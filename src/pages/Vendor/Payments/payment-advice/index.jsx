import { useState, useEffect } from "react";
import {
  ChevronRight,
  Download,
  TrendingUp,
  MinusCircle,
  CheckCircle2,
  FileText,
  Receipt,
  Landmark,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  Copy,
} from "lucide-react";
import { useParams } from "react-router-dom";
import {
  getPaymentAdviceById,
  getOrderWiseDetails,
} from "../../../../services/api.paymentAdvice";

// ---------------------------------------------------------------------------
// Shared styling tokens
// ---------------------------------------------------------------------------
const card = "bg-white rounded-2xl border border-gray-100 shadow-sm";
const secondaryBtn =
  "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors";
const primaryBtn =
  "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm";

const TABLE_HEAD = "text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide bg-gray-50";

const money = (n) =>
  `₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (time) => {
  if (!time) return "—";
  return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const TABS = [
  "Order Wise Details",
  "GST Summary",
  "TDS Summary",
  "Commission Report",
  "Adjustments",
  "Attachments",
];

const PaymentAdvice = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Order Wise Details");
  const [loading, setLoading] = useState(true);
  const [paymentAdvice, setPaymentAdvice] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [orderSummary, setOrderSummary] = useState({});
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 10, total: 0, total_pages: 0 });

  useEffect(() => {
    if (id) {
      fetchPaymentAdvice();
    } else {
      setLoading(false);
      setError("No payment advice ID provided");
    }
  }, [id]);

  useEffect(() => {
    if (paymentAdvice && id) {
      fetchOrderDetails();
    }
  }, [paymentAdvice, search, id, page]);

  const fetchPaymentAdvice = async () => {
    try {
      setLoading(true);
      const response = await getPaymentAdviceById(id);
      if (response.status === 1) {
        setPaymentAdvice(response.data);
      } else {
        setError(response.message || "Failed to fetch payment advice");
      }
    } catch (err) {
      console.error("Error fetching payment advice:", err);
      setError("Error fetching payment advice");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      const response = await getOrderWiseDetails(id, { search, page, limit: 10 });
      if (response.status === 1) {
        setOrderDetails(response.data.orderDetails);
        setOrderSummary(response.data.summary);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF3EC] flex items-center justify-center">
        <div className="text-gray-500">Loading payment advice...</div>
      </div>
    );
  }

  if (error || !paymentAdvice) {
    return (
      <div className="min-h-screen bg-[#FBF3EC] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Payment Advice Found</h2>
          <p className="text-sm text-gray-500 mb-6">
            {error || "Payment advice has not been generated for this settlement yet. Please check back later or contact support."}
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Prepare dynamic data from API response
  const HEADER = {
    advicNo: paymentAdvice.advice_number,
    settlementId: paymentAdvice.settlement?.settlement_id || "—",
    period: paymentAdvice.settlement_period_start && paymentAdvice.settlement_period_end
      ? `${formatDate(paymentAdvice.settlement_period_start)} - ${formatDate(paymentAdvice.settlement_period_end)}`
      : "—",
    cycle: paymentAdvice.settlement_cycle || "—",
    paymentDate: formatDate(paymentAdvice.transfer_date),
    status: paymentAdvice.payment_status,
    netAmount: paymentAdvice.net_payable,
  };

  const TOP_CARDS = [
    { label: "Gross Sales", value: money(paymentAdvice.gross_sales), sub: `${paymentAdvice.settlement?.orders_count || 0} Orders`, link: "View Orders", icon: TrendingUp, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "Total Deductions", value: money(paymentAdvice.total_deductions), sub: "Fees & Adjustments", link: "View Breakup", icon: MinusCircle, iconBg: "bg-red-50", iconColor: "text-red-500" },
    { label: "Net Payable", value: money(paymentAdvice.net_payable), sub: "Final Settlement", link: "View Details", icon: CheckCircle2, iconBg: "bg-green-50", iconColor: "text-green-600" },
    { label: "TDS Deducted", value: money(paymentAdvice.tds_deducted), sub: `${(paymentAdvice.tds_rate || 0).toFixed(1)}% of Gross amount`, link: "View Details", icon: FileText, iconBg: "bg-orange-50", iconColor: "text-orange-500" },
    { label: "GST Collected", value: money(paymentAdvice.gst_collected), sub: "CGST + SGST Details", link: "View Breakup", icon: Receipt, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
    { label: "Payment Mode", value: paymentAdvice.transfer_mode || "—", sub: `${paymentAdvice.bank_name || "Bank"} Transfer`, link: null, icon: Landmark, iconBg: "bg-teal-50", iconColor: "text-teal-600" },
  ];

  const BANK_DETAILS = [
    ["Beneficiary Name", paymentAdvice.beneficiary_name || "—"],
    ["Bank Name", paymentAdvice.bank_name || "—"],
    ["Account Number", paymentAdvice.account_number || "—"],
    ["IFSC Code", paymentAdvice.ifsc_code || "—"],
    ["UTR Number", paymentAdvice.utr_number || "—"],
    ["Transfer Date", formatDate(paymentAdvice.transfer_date)],
    ["Transfer Time", formatTime(paymentAdvice.transfer_time)],
    ["Transfer Mode", paymentAdvice.transfer_mode || "—"],
  ];

  const credits_summary = paymentAdvice.credits_summary || {};
  const deductions_summary = paymentAdvice.deductions_summary || {};

  const SETTLEMENT_BREAKDOWN = {
    credits: [
      ["Gross Sales", credits_summary.gross_sales || paymentAdvice.gross_sales, "+"],
      ["Shipping Charges Collected", credits_summary.shipping_charges || 0, "+"],
      ["Other Credits / Adjustments", credits_summary.other_credits || 0, "+"],
    ],
    totalCredits: (credits_summary.gross_sales || paymentAdvice.gross_sales) + (credits_summary.shipping_charges || 0) + (credits_summary.other_credits || 0),
    deductions: [
      ["Marketplace Commission", deductions_summary.commission || 0, "-"],
      ["Collection Fee", deductions_summary.collection_fee || 0, "-"],
      ["Shipping Charges", deductions_summary.shipping || 0, "-"],
      ["Reverse Logistics / Return Charges", deductions_summary.returns || 0, "-"],
      ["Return / RTO Adjustment", 0, "-"],
      ["Other Adjustments", deductions_summary.other || paymentAdvice.adjustments || 0, "-"],
      ["TDS (Section 194-O)", deductions_summary.tds || paymentAdvice.tds_deducted || 0, "-"],
    ],
    totalDeductions: Object.values(deductions_summary).reduce((sum, val) => sum + (parseFloat(val) || 0), 0) + (paymentAdvice.adjustments || 0),
    net: paymentAdvice.net_payable,
  };

  const GST_SUMMARY = [
    { head: "CGST (9%)", taxable: paymentAdvice.cgst_taxable || 0, amount: paymentAdvice.cgst_amount || 0 },
    { head: "SGST (9%)", taxable: paymentAdvice.sgst_taxable || 0, amount: paymentAdvice.sgst_amount || 0 },
    { head: "IGST (18%)", taxable: paymentAdvice.igst_taxable || 0, amount: paymentAdvice.igst_amount || 0 },
  ];

  const TDS_SUMMARY = {
    gross: paymentAdvice.tds_gross_amount || paymentAdvice.gross_sales,
    rate: `${(paymentAdvice.tds_rate || 0).toFixed(1)}%`,
    deducted: paymentAdvice.tds_deducted,
  };

  const ORDER_ROWS = orderDetails.map((detail) => ({
    orderId: detail.order?.order_number || `ORD-${detail.id}`,
    invoice: detail.invoice_number || "—",
    date: formatDate(detail.order_date),
    sku: detail.product_sku || detail.product_name || "—",
    value: detail.order_value || 0,
    comm: detail.commission || 0,
    shipping: detail.shipping_charges || 0,
    gst: detail.gst || 0,
    tds: detail.tds || 0,
    adj: detail.adjustments || 0,
    net: detail.net_payable || 0,
    status: detail.order?.vendor_payment_status || detail.vendor_payment_status || detail.order_status || "Pending",
  }));

  const ORDER_TOTALS = ORDER_ROWS.reduce(
    (acc, r) => ({
      orders: acc.orders + 1,
      orderValue: acc.orderValue + r.value,
      commission: acc.commission + r.comm,
      shipping: acc.shipping + r.shipping,
      adjustments: acc.adjustments + r.adj,
      tds: acc.tds + r.tds,
      gst: acc.gst + r.gst,
      netPaid: acc.netPaid + r.net,
    }),
    { orders: 0, orderValue: 0, commission: 0, shipping: 0, adjustments: 0, tds: 0, gst: 0, netPaid: 0 }
  );

  return (
    <div className="min-h-screen bg-[#FBF3EC]">
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          <span>Home</span>
          <ChevronRight className="w-3 h-3" />
          <span>Payments</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 font-medium">Payment Advice · {HEADER.advicNo}</span>
        </div>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Payment Advice</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              View settlement payment details and download payment advice.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className={secondaryBtn}>
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className={primaryBtn}>
              <Download className="w-4 h-4" />
              Download Payment Advice
            </button>
          </div>
        </div>

        {/* Info strip */}
        <div className={`${card} p-4 mb-4`}>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Payment Advice No.</p>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                {HEADER.advicNo} <Copy className="w-3 h-3 text-gray-300" />
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Settlement ID</p>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                {HEADER.settlementId} <Copy className="w-3 h-3 text-gray-300" />
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Settlement Period</p>
              <p className="text-sm font-semibold text-gray-900">{HEADER.period}</p>
              <p className="text-[11px] text-gray-400">{HEADER.cycle}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Payment Date</p>
              <p className="text-sm font-semibold text-gray-900">{HEADER.paymentDate}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Payment Status</p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                HEADER.status === "Paid" ? "bg-green-50 text-green-600" :
                HEADER.status === "Processing" ? "bg-blue-50 text-blue-600" :
                HEADER.status === "Pending" ? "bg-yellow-50 text-yellow-600" :
                HEADER.status === "Failed" ? "bg-red-50 text-red-600" :
                "bg-gray-100 text-gray-600"
              }`}>
                {HEADER.status}
              </span>
            </div>
            <div className="ml-auto">
              <p className="text-[11px] text-gray-400 mb-0.5 text-right">Net Amount Transferred</p>
              <p className="text-xl font-semibold text-green-600">{money(HEADER.netAmount)}</p>
            </div>
          </div>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {TOP_CARDS.map(({ label, value, sub, link, icon: Icon, iconBg, iconColor }) => (
            <div key={label} className={`${card} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <span className="text-xs font-medium text-gray-500">{label}</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-gray-400">{sub}</p>
                {link && (
                  <button className="text-[11px] text-blue-600 hover:underline font-medium whitespace-nowrap">
                    {link}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bank / Settlement / GST / TDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className={`${card} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Bank Transfer Details</h3>
            </div>
            <dl className="space-y-2.5 text-sm mb-4">
              {BANK_DETAILS.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <dt className="text-gray-400">{k}</dt>
                  <dd className="text-gray-800 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Payment successfully transferred to your bank account.
            </div>
          </div>

          <div className={`${card} p-4`}>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Settlement Breakdown</h3>
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">
              <span>Particulars</span>
              <span>Amount (₹)</span>
            </div>
            <div className="space-y-1.5 text-sm">
              {SETTLEMENT_BREAKDOWN.credits.map(([label, amt]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-gray-600">(+) {label}</span>
                  <span className="text-gray-800">{amt.toLocaleString("en-IN")}.00</span>
                </div>
              ))}
              <div className="flex items-center justify-between font-semibold text-gray-900 pt-1.5 mt-1.5 border-t border-gray-100">
                <span>Total Credits</span>
                <span>{SETTLEMENT_BREAKDOWN.totalCredits.toLocaleString("en-IN")}.00</span>
              </div>
              <div className="pt-2 space-y-1.5">
                {SETTLEMENT_BREAKDOWN.deductions.map(([label, amt]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-600">(-) {label}</span>
                    <span className="text-red-500">{amt.toLocaleString("en-IN")}.00</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between font-semibold text-gray-900 pt-1.5 mt-1.5 border-t border-gray-100">
                <span>Total Deductions</span>
                <span>{SETTLEMENT_BREAKDOWN.totalDeductions.toLocaleString("en-IN")}.00</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-green-600 pt-2 mt-1 border-t border-gray-200 text-base">
                <span>Net Amount Transferred</span>
                <span>{SETTLEMENT_BREAKDOWN.net.toLocaleString("en-IN")}.00</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`${card} p-4`}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">GST Summary</h3>
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">
                <span>Tax Head</span>
                <span className="flex gap-8">
                  <span>Taxable Value</span>
                  <span>Tax Amount</span>
                </span>
              </div>
              <div className="space-y-2 text-sm">
                {GST_SUMMARY.map((r) => (
                  <div key={r.head} className="flex items-center justify-between">
                    <span className="text-gray-600">{r.head}</span>
                    <span className="flex gap-8">
                      <span className="text-gray-700 w-16 text-right">{r.taxable.toLocaleString("en-IN")}.00</span>
                      <span className="text-gray-800 w-16 text-right">{r.amount.toLocaleString("en-IN")}.00</span>
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between font-semibold text-gray-900 pt-1.5 mt-1.5 border-t border-gray-100">
                  <span>Total GST</span>
                  <span>{(GST_SUMMARY.reduce((s, r) => s + r.amount, 0)).toLocaleString("en-IN")}.00</span>
                </div>
              </div>
            </div>

            <div className={`${card} p-4`}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">TDS Summary (Section 194-O)</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Gross Amount</dt>
                  <dd className="text-gray-800 font-medium">{TDS_SUMMARY.gross.toLocaleString("en-IN")}.00</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">TDS Rate</dt>
                  <dd className="text-gray-800 font-medium">{TDS_SUMMARY.rate}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">TDS Deducted</dt>
                  <dd className="text-gray-800 font-medium">{TDS_SUMMARY.deducted.toLocaleString("en-IN")}.00</dd>
                </div>
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100">
                  <dt className="text-gray-500">TDS Certificate</dt>
                  <dd>
                    <button className="text-blue-600 hover:underline text-xs font-medium inline-flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Order wise details */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className={`${card} flex-1 min-w-0 overflow-hidden`}>
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-gray-100 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    activeTab === tab
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by Order ID, Invoice No., SKU"
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className={secondaryBtn}>
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>
                <button className={secondaryBtn}>
                  <Download className="w-4 h-4" />
                  Export Table
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className={TABLE_HEAD}>
                    <th className="py-2.5 px-4">Order ID</th>
                    <th className="py-2.5 px-4">Invoice No.</th>
                    <th className="py-2.5 px-4">Order Date</th>
                    <th className="py-2.5 px-4">SKU / Product</th>
                    <th className="py-2.5 px-4 text-right">Order Value</th>
                    <th className="py-2.5 px-4 text-right">Comm.</th>
                    <th className="py-2.5 px-4 text-right">Shipping</th>
                    <th className="py-2.5 px-4 text-right">GST</th>
                    <th className="py-2.5 px-4 text-right">TDS</th>
                    <th className="py-2.5 px-4 text-right">Adjustment</th>
                    <th className="py-2.5 px-4 text-right">Net Payable</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ORDER_ROWS.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-gray-500">
                        No order details found
                      </td>
                    </tr>
                  ) : (
                    ORDER_ROWS.map((r) => (
                      <tr key={r.orderId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="py-2.5 px-4 font-medium text-blue-600">{r.orderId}</td>
                        <td className="py-2.5 px-4 text-gray-500">{r.invoice}</td>
                        <td className="py-2.5 px-4 text-gray-500">{r.date}</td>
                        <td className="py-2.5 px-4 text-gray-700">{r.sku}</td>
                        <td className="py-2.5 px-4 text-right text-gray-700">₹{r.value.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right text-gray-700">₹{r.comm.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right text-gray-700">₹{r.shipping.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right text-gray-700">₹{r.gst.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right text-gray-700">₹{r.tds.toFixed(2)}</td>
                        <td className={`py-2.5 px-4 text-right ${r.adj < 0 ? "text-red-500" : "text-gray-700"}`}>
                          {r.adj < 0 ? `-₹${Math.abs(r.adj).toFixed(2)}` : `₹${r.adj.toFixed(2)}`}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium text-gray-900">₹{r.net.toFixed(2)}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            r.status === "Successful" ? "bg-green-50 text-green-600" :
                            r.status === "Initiated" ? "bg-purple-50 text-purple-600" :
                            r.status === "Approved" ? "bg-indigo-50 text-indigo-600" :
                            r.status === "Processing" ? "bg-blue-50 text-blue-600" :
                            "bg-amber-50 text-amber-600"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold text-gray-800">
                    <td className="py-3 px-4" colSpan={4}>Total Summary</td>
                    <td className="py-3 px-4 text-right">{money(orderSummary.total_order_value || 0)}</td>
                    <td className="py-3 px-4 text-right">{money(orderSummary.total_commission || 0)}</td>
                    <td className="py-3 px-4 text-right">{money(orderSummary.total_shipping || 0)}</td>
                    <td className="py-3 px-4 text-right">{money(orderSummary.total_gst || 0)}</td>
                    <td className="py-3 px-4 text-right">{money(orderSummary.total_tds || 0)}</td>
                    <td className="py-3 px-4 text-right">{money(orderSummary.total_net_payable || 0)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1}-{Math.min(pagination.current_page * pagination.per_page, pagination.total || 0)} of {pagination.total || 0} entries
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, pagination.total_pages || 1) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const p = start + i;
                  if (p > (pagination.total_pages || 1)) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                        p === page
                          ? "bg-orange-500 text-white"
                          : "text-gray-600 hover:bg-gray-50 border border-gray-200"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(pagination.total_pages || 1, p + 1))}
                  disabled={page >= (pagination.total_pages || 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Total summary side card */}
          <aside className={`${card} w-full lg:w-[260px] shrink-0 h-fit p-4`}>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Total Summary (This Settlement)</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-gray-400">Total Orders</dt>
                <dd className="text-gray-800 font-medium">{ORDER_TOTALS.orders}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-400">Total Order Value</dt>
                <dd className="text-gray-800 font-medium">{money(ORDER_TOTALS.orderValue)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-400">Total Commission</dt>
                <dd className="text-red-500 font-medium">- {money(ORDER_TOTALS.commission)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-400">Total Shipping</dt>
                <dd className="text-red-500 font-medium">- {money(ORDER_TOTALS.shipping)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-400">Total Adjustments</dt>
                <dd className="text-red-500 font-medium">- {money(ORDER_TOTALS.adjustments)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-400">Total TDS</dt>
                <dd className="text-red-500 font-medium">- {money(ORDER_TOTALS.tds)}</dd>
              </div>
              <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-gray-100">
                <dt className="text-green-600 font-semibold">Net Paid Amount</dt>
                <dd className="text-green-600 font-semibold">{money(ORDER_TOTALS.netPaid)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default PaymentAdvice;