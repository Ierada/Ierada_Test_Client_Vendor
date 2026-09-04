import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Search,
  ChevronLeft,
  ChevronDown,
  FileText,
  Download,
  Filter,
} from "lucide-react";
import { getPaymentAdviceList } from "../../../../services/api.paymentAdvice";

const card = "bg-white rounded-2xl border border-gray-100 shadow-sm";
const secondaryBtn =
  "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const PaymentAdviceList = () => {
  const navigate = useNavigate();
  const [adviceList, setAdviceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadAdvice();
  }, [page, statusFilter]);

  const loadAdvice = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await getPaymentAdviceList(params);
      if (res.status === 1) {
        setAdviceList(res.data?.paymentAdvices || []);
        setPagination(res.data?.pagination || {});
      }
    } catch (err) {
      console.error("Error loading payment advice list:", err);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setPage(1);
      loadAdvice();
    }
  };

  const totalPages = pagination.total_pages || 1;

  return (
    <div className="min-h-screen bg-[#FBF3EC]">
      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 py-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <span>Home</span>
          <ChevronRight className="w-3 h-3" />
          <span>Payments</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">Payment Advice</span>
        </div>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Payment Advice</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              View and download payment advice for your settlements
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className={`${card} p-4 mb-5`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search by advice number or cycle..."
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 placeholder:text-gray-400 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 bg-white"
              >
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Processing">Processing</option>
                <option value="Pending">Pending</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={`${card} overflow-hidden`}>
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading payment advice...</div>
          ) : adviceList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No Payment Advice Found</h3>
              <p className="text-sm text-gray-500">
                Payment advice will appear here once settlements are processed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide bg-gray-50">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Advice Number</th>
                    <th className="py-3 px-4">Settlement ID</th>
                    <th className="py-3 px-4">Settlement Cycle</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4 text-right">Gross Sales</th>
                    <th className="py-3 px-4 text-right">TDS Deducted</th>
                    <th className="py-3 px-4 text-right">Net Payable</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adviceList.map((a, idx) => (
                    <tr
                      key={a.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/payments/payment-advice/${a.id}`)}
                    >
                      <td className="py-3 px-4 text-gray-400">
                        {(page - 1) * 10 + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-medium text-orange-500">
                        {a.advice_number}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {a.settlement?.settlement_id || "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {a.settlement_cycle || "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {a.settlement_period_start && a.settlement_period_end
                          ? `${formatDate(a.settlement_period_start)} - ${formatDate(a.settlement_period_end)}`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-800">
                        {money(a.gross_sales)}
                      </td>
                      <td className="py-3 px-4 text-right text-red-500">
                        -{money(a.tds_deducted)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">
                        {money(a.net_payable)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            a.payment_status === "Paid"
                              ? "bg-green-50 text-green-600"
                              : a.payment_status === "Processing"
                              ? "bg-blue-50 text-blue-600"
                              : a.payment_status === "On Hold"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {a.payment_status || "Pending"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/payments/payment-advice/${a.id}`);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View
                          <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {((page - 1) * 10) + 1}-
                {Math.min(page * 10, pagination.total || 0)} of{" "}
                {pagination.total || 0}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                        p === page
                          ? "bg-orange-500 text-white"
                          : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentAdviceList;
