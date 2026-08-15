import { useState } from "react";
import {
  Calendar,
  Download,
  SlidersHorizontal,
  HelpCircle,
  Bell,
  ChevronDown,
  Receipt,
  Landmark,
  Percent,
  FileText,
  ShieldCheck,
  Info,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Static demo data — replace with API-backed data later
// ---------------------------------------------------------------------------
const GST_SUMMARY_CARDS = [
  { label: "Taxable Value", value: "₹2,48,500.00", icon: Receipt, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { label: "CGST Collected (9%)", value: "₹11,925.00", icon: Landmark, iconBg: "bg-green-50", iconColor: "text-green-600" },
  { label: "SGST Collected (9%)", value: "₹11,925.00", icon: Landmark, iconBg: "bg-orange-50", iconColor: "text-orange-500" },
  { label: "IGST Collected (18%)", value: "₹0.00", icon: Landmark, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
  { label: "Total GST Collected", value: "₹23,850.00", icon: Percent, iconBg: "bg-teal-50", iconColor: "text-teal-600" },
];

const GST_BREAKUP = [
  { type: "CGST", taxable: 132500, rate: "9%", amount: 11925 },
  { type: "SGST", taxable: 132500, rate: "9%", amount: 11925 },
  { type: "IGST", taxable: 0, rate: "18%", amount: 0 },
];

const GST_INVOICE_SUMMARY = [
  { type: "B2B Invoices", count: 85, taxable: 220000, amount: 18900 },
  { type: "B2C (Large) Invoice", count: 12, taxable: 18500, amount: 1665 },
  { type: "B2C (Others)", count: 55, taxable: 200000, amount: 3285 },
];

const TDS_CARDS = [
  { label: "Total Gross Amount", value: "₹2,48,500.00", icon: Receipt, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { label: "TDS Rate", value: "0.1%", icon: Percent, iconBg: "bg-orange-50", iconColor: "text-orange-500" },
  { label: "Total TDS Deducted", value: "₹1,020.00", icon: Landmark, iconBg: "bg-red-50", iconColor: "text-red-500" },
  { label: "Net Amount After TDS", value: "₹2,47,480.00", icon: ShieldCheck, iconBg: "bg-green-50", iconColor: "text-green-600" },
];

const TDS_DEDUCTIONS = [
  { settlement: "SET-2508-001", date: "08 Aug 2026", gross: 132500, tds: 530, rate: "0.1%" },
  { settlement: "SET-2508-002", date: "15 Aug 2026", gross: 116000, tds: 490, rate: "0.1%" },
];

const COMMISSION_CARDS = [
  { label: "Total Order Value", value: "₹2,48,500.00", icon: Receipt, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { label: "Average Commission Rate", value: "5.17%", icon: Percent, iconBg: "bg-orange-50", iconColor: "text-orange-500" },
  { label: "Total Commission", value: "₹12,850.00", icon: Landmark, iconBg: "bg-red-50", iconColor: "text-red-500" },
  { label: "Total Orders", value: "152", icon: FileText, iconBg: "bg-green-50", iconColor: "text-green-600" },
];

const COMMISSION_BY_CATEGORY = [
  { category: "Men Fashion", orderValue: 120000, rate: "5%", commission: 6000 },
  { category: "Women Fashion", orderValue: 98500, rate: "5.5%", commission: 5417.5 },
  { category: "Footwear", orderValue: 30000, rate: "4.5%", commission: 1350 },
];

const ORDER_WISE_COMMISSION = [
  { orderId: "ORD-123456", date: "01 Aug 2026", value: 599, rate: "7.5%", commission: 44.95 },
  { orderId: "ORD-123457", date: "01 Aug 2026", value: 1299, rate: "5.5%", commission: 71.45 },
  { orderId: "ORD-123458", date: "02 Aug 2026", value: 1499, rate: "5%", commission: 74.95 },
  { orderId: "ORD-123459", date: "03 Aug 2026", value: 599, rate: "6.5%", commission: 38.45 },
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
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const StatCard = ({ label, value, icon: Icon, iconBg, iconColor }) => (
  <div className={`${card} p-4`}>
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <span className="text-xs font-medium text-gray-500">{label}</span>
    </div>
    <p className="text-xl font-semibold text-gray-900">{value}</p>
  </div>
);

const TABLE_HEAD = "text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide bg-gray-50";

const GstTaxCenter = () => {
  const [activeTab, setActiveTab] = useState("gst");

  const TABS = [
    { key: "gst", label: "GST Summary" },
    { key: "tds", label: "TDS Reports" },
    { key: "commission", label: "Commission Report" },
  ];

  return (
    <div className="min-h-screen bg-[#FBF3EC]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">GST & Tax Center</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              View and download your GST, TDS, and Commission reports
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800">
              <HelpCircle className="w-4 h-4" />
              Help Center
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <Bell className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-xs font-semibold text-orange-600">
                FH
              </div>
              <span className="text-sm font-medium text-gray-800">Fashion Hub</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
        {/* Tabs + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="inline-flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className={secondaryBtn}>
              <Calendar className="w-4 h-4" />
              01 Aug 2026 - 15 Aug 2026
            </button>
            <button className={secondaryBtn}>
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className={primaryBtn}>
              <SlidersHorizontal className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {/* ---------------- GST SUMMARY ---------------- */}
        {activeTab === "gst" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-1.5">
                GST Summary <Info className="w-3.5 h-3.5 text-gray-400" />
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Summary of your GST collected and classified during this financial period.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {GST_SUMMARY_CARDS.map((c) => (
                <StatCard key={c.label} {...c} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className={`${card} p-4`}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">GST Breakup</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={TABLE_HEAD}>
                      <th className="py-2 px-2">Tax Type</th>
                      <th className="py-2 px-2 text-right">Taxable Value</th>
                      <th className="py-2 px-2 text-right">Rate</th>
                      <th className="py-2 px-2 text-right">GST Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GST_BREAKUP.map((r) => (
                      <tr key={r.type} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 px-2 font-medium text-gray-800">{r.type}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{money(r.taxable)}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{r.rate}</td>
                        <td className="py-2 px-2 text-right text-gray-800">{money(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-gray-900">
                      <td className="py-2 px-2">Total</td>
                      <td className="py-2 px-2 text-right">{money(265000)}</td>
                      <td className="py-2 px-2 text-right">—</td>
                      <td className="py-2 px-2 text-right">{money(23850)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className={`${card} p-4`}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">GST Invoice Summary</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={TABLE_HEAD}>
                      <th className="py-2 px-2">Invoice Type</th>
                      <th className="py-2 px-2 text-right">Count</th>
                      <th className="py-2 px-2 text-right">Taxable Value</th>
                      <th className="py-2 px-2 text-right">GST Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GST_INVOICE_SUMMARY.map((r) => (
                      <tr key={r.type} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 px-2 font-medium text-gray-800">{r.type}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{r.count}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{money(r.taxable)}</td>
                        <td className="py-2 px-2 text-right text-gray-800">{money(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-gray-900">
                      <td className="py-2 px-2">Total</td>
                      <td className="py-2 px-2 text-right">152</td>
                      <td className="py-2 px-2 text-right">{money(248500)}</td>
                      <td className="py-2 px-2 text-right">{money(23850)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className={`${card} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">GSTR Filing Summary</h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-600">
                    Ready to File
                  </span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Return Type</span>
                    <span className="text-gray-400 text-xs">Taxable Value</span>
                    <span className="text-gray-400 text-xs">GST Amount</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">GSTR-1</span>
                    <span className="text-gray-600">{money(248500)}</span>
                    <span className="text-gray-800">{money(23850)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">GSTR-3B</span>
                    <span className="text-gray-600">{money(248500)}</span>
                    <span className="text-gray-800">{money(23850)}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-gray-500">Next Filing Due Date</span>
                    <span className="font-semibold text-gray-900">20 Aug 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---------------- TDS REPORTS ---------------- */}
        {activeTab === "tds" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">TDS Reports (Section 194-O)</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                TDS deducted on your payouts as mandated under Section 194-O of the Income Tax Act.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {TDS_CARDS.map((c) => (
                <StatCard key={c.label} {...c} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className={`${card} p-4 lg:col-span-2`}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">TDS Deduction Summary</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={TABLE_HEAD}>
                      <th className="py-2 px-2">Settlement ID</th>
                      <th className="py-2 px-2">Settlement Date</th>
                      <th className="py-2 px-2 text-right">Gross Amount</th>
                      <th className="py-2 px-2 text-right">TDS (₹)</th>
                      <th className="py-2 px-2 text-right">TDS Rate</th>
                      <th className="py-2 px-2 text-right">Certificate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TDS_DEDUCTIONS.map((r) => (
                      <tr key={r.settlement} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 px-2 font-medium text-gray-800">{r.settlement}</td>
                        <td className="py-2 px-2 text-gray-600">{r.date}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{money(r.gross)}</td>
                        <td className="py-2 px-2 text-right text-gray-800">{money(r.tds)}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{r.rate}</td>
                        <td className="py-2 px-2 text-right">
                          <button className="text-blue-600 hover:underline text-xs font-medium inline-flex items-center gap-1">
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-gray-900">
                      <td className="py-2 px-2" colSpan={2}>Total</td>
                      <td className="py-2 px-2 text-right">{money(248500)}</td>
                      <td className="py-2 px-2 text-right">{money(1020)}</td>
                      <td className="py-2 px-2 text-right">0.1%</td>
                      <td className="py-2 px-2 text-right">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className={`${card} p-4`}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">TDS Certificate (Annual)</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Financial Year 2026-27 — Annual TDS Certificate Form 16A will be available for
                  download after 31st March 2027.
                </p>
                <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg cursor-not-allowed opacity-70">
                  <Download className="w-4 h-4" />
                  Download TDS Certificate
                </button>
                <p className="mt-3 text-[11px] text-gray-400 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  TDS is deducted as per Section 194-O of the Income Tax Act.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ---------------- COMMISSION REPORT ---------------- */}
        {activeTab === "commission" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Commission Report</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Breakdown of marketplace commission charges on your orders.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {COMMISSION_CARDS.map((c) => (
                <StatCard key={c.label} {...c} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={`${card} p-4`}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Commission Breakup by Category</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={TABLE_HEAD}>
                      <th className="py-2 px-2">Category</th>
                      <th className="py-2 px-2 text-right">Order Value (₹)</th>
                      <th className="py-2 px-2 text-right">Commission Rate</th>
                      <th className="py-2 px-2 text-right">Commission (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMMISSION_BY_CATEGORY.map((r) => (
                      <tr key={r.category} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 px-2 font-medium text-gray-800">{r.category}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{money(r.orderValue)}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{r.rate}</td>
                        <td className="py-2 px-2 text-right text-gray-800">{money(r.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-gray-900">
                      <td className="py-2 px-2">Total</td>
                      <td className="py-2 px-2 text-right">{money(248500)}</td>
                      <td className="py-2 px-2 text-right">—</td>
                      <td className="py-2 px-2 text-right">{money(12850)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className={`${card} p-4`}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Wise Commission</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={TABLE_HEAD}>
                      <th className="py-2 px-2">Order ID</th>
                      <th className="py-2 px-2">Order Date</th>
                      <th className="py-2 px-2 text-right">Order Value (₹)</th>
                      <th className="py-2 px-2 text-right">Commission Rate</th>
                      <th className="py-2 px-2 text-right">Commission (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ORDER_WISE_COMMISSION.map((r) => (
                      <tr key={r.orderId} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 px-2 font-medium text-blue-600">{r.orderId}</td>
                        <td className="py-2 px-2 text-gray-600">{r.date}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{money(r.value)}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{r.rate}</td>
                        <td className="py-2 px-2 text-right text-gray-800">{money(r.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default GstTaxCenter;