import { useState } from "react";
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

// ---------------------------------------------------------------------------
// Static demo data — replace with API-backed data later
// ---------------------------------------------------------------------------
const HEADER = {
  advicNo: "PADV-2508-001",
  settlementId: "SET-2508-001",
  period: "01 Aug 2026 - 15 Aug 2026",
  cycle: "15 Days Cycle",
  paymentDate: "08 Aug 2026",
  status: "Paid",
  netAmount: 230530,
};

const TOP_CARDS = [
  { label: "Gross Sales", value: "₹2,48,500", sub: "152 Orders", link: "View Orders", icon: TrendingUp, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { label: "Total Deductions", value: "₹17,970", sub: "Fees & Adjustments", link: "View Breakup", icon: MinusCircle, iconBg: "bg-red-50", iconColor: "text-red-500" },
  { label: "Net Payable", value: "₹2,30,530", sub: "Final Settlement", link: "View Details", icon: CheckCircle2, iconBg: "bg-green-50", iconColor: "text-green-600" },
  { label: "TDS Deducted", value: "₹1,020", sub: "1% of Gross amount", link: "View Details", icon: FileText, iconBg: "bg-orange-50", iconColor: "text-orange-500" },
  { label: "GST Collected", value: "₹3,850", sub: "CGST + SGST Details", link: "View Breakup", icon: Receipt, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
  { label: "Payment Mode", value: "NEFT", sub: "HDFC Bank Transfer", link: null, icon: Landmark, iconBg: "bg-teal-50", iconColor: "text-teal-600" },
];

const BANK_DETAILS = [
  ["Beneficiary Name", "Fashion Hub"],
  ["Bank Name", "HDFC Bank"],
  ["Account Number", "XXXXXXXX1234"],
  ["IFSC Code", "HDFC0001234"],
  ["UTR Number", "HDFCD826D987451"],
  ["Transfer Date", "08 Aug 2026"],
  ["Transfer Time", "11:32 AM"],
  ["Transfer Mode", "NEFT"],
];

const SETTLEMENT_BREAKDOWN = {
  credits: [
    ["Gross Sales", 248500, "+"],
    ["Shipping Charges Collected", 15420, "+"],
    ["Other Credits / Adjustments", 250, "+"],
  ],
  totalCredits: 264170,
  deductions: [
    ["Marketplace Commission", 12850, "-"],
    ["Collection Fee", 8250, "-"],
    ["Shipping Charges", 15420, "-"],
    ["Reverse Logistics / Return Charges", 1200, "-"],
    ["Return / RTO Adjustment", 950, "-"],
    ["Other Adjustments", 250, "-"],
    ["TDS (Section 194-O)", 1020, "-"],
  ],
  totalDeductions: 39940,
  net: 230530,
};

const GST_SUMMARY = [
  { head: "CGST (9%)", taxable: 21389, amount: 1925 },
  { head: "SGST (9%)", taxable: 21389, amount: 1925 },
  { head: "IGST (18%)", taxable: 0, amount: 0 },
];

const TDS_SUMMARY = {
  gross: 248500,
  rate: "0.1%",
  deducted: 1020,
};

const ORDER_ROWS = [
  { orderId: "ORD-123456", invoice: "INV-100245", date: "01 Aug 2026", sku: "Men Solid T-Shirt (M / Blue)", value: 899, comm: 44.95, shipping: 40, gst: 40.46, tds: 8.09, adj: -5, net: 800.5, status: "Delivered" },
  { orderId: "ORD-123457", invoice: "INV-100246", date: "01 Aug 2026", sku: "Women Kurti (L / White)", value: 1299, comm: 64.95, shipping: 50, gst: 58.46, tds: 11.69, adj: 0, net: 1158.9, status: "Delivered" },
  { orderId: "ORD-123458", invoice: "INV-100247", date: "02 Aug 2026", sku: "Denim Jeans (32)", value: 1499, comm: 74.95, shipping: 60, gst: 67.46, tds: 13.49, adj: -5, net: 1338.1, status: "Delivered" },
  { orderId: "ORD-123459", invoice: "INV-100248", date: "03 Aug 2026", sku: "Casual Shirt (L)", value: 899, comm: 44.95, shipping: 40, gst: 40.46, tds: 8.09, adj: -5, net: 800.5, status: "Delivered" },
  { orderId: "ORD-123460", invoice: "INV-100249", date: "03 Aug 2026", sku: "Women Top (M / Black)", value: 699, comm: 34.95, shipping: 30, gst: 31.46, tds: 6.29, adj: -5, net: 620.85, status: "Delivered" },
];

const ORDER_TOTALS = {
  orders: 152,
  orderValue: 248500,
  commission: 12850,
  shipping: 15420,
  adjustments: 250,
  tds: 1020,
  netPaid: 230530,
};

const TABS = [
  "Order Wise Details",
  "GST Summary",
  "TDS Summary",
  "Commission Report",
  "Adjustments",
  "Attachments",
];

// ---------------------------------------------------------------------------
// Shared styling tokens
// ---------------------------------------------------------------------------
const card = "bg-white rounded-2xl border border-gray-100 shadow-sm";
const secondaryBtn =
  "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors";
const primaryBtn =
  "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm";

const money = (n) =>
  `₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PaymentAdvice = () => {
  const [activeTab, setActiveTab] = useState("Order Wise Details");

  return (
    <div className="min-h-screen bg-[#FBF3EC]">
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          <span>Home</span>
          <ChevronRight className="w-3 h-3" />
          <span>Payments</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 font-medium">Payment Advice · PADV-2508-001</span>
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
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
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
                  <span>3,850.00</span>
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
                  {ORDER_ROWS.map((r) => (
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
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Showing 1 to 5 of 152 entries</p>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                      p === 1
                        ? "bg-orange-500 text-white"
                        : "text-gray-600 hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <span className="px-1 text-gray-400">...</span>
                <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  31
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">
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

const TABLE_HEAD = "text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide bg-gray-50";

export default PaymentAdvice;