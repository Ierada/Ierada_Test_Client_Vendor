import React from "react";
import { ArrowLeft, ArrowRight, Printer, FileText, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";

// ─── Status pill colours ───────────────────────────────────────────────────────
const STATUS_COLORS = {
  placed: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  packed: "bg-indigo-100 text-indigo-700",
  shipped: "bg-green-100 text-green-700",
  intransit: "bg-cyan-100 text-cyan-700",
  "in transit": "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  rejected: "bg-gray-100 text-gray-600",
  returned: "bg-purple-100 text-purple-700",
};

const statusLabel = (s) => {
  const map = { intransit: "In Transit", "in transit": "In Transit" };
  return (
    map[(s || "").toLowerCase()] ||
    (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—")
  );
};

// ─── Which step number is "done" given live order_status ──────────────────────
// Used so the stepper shows the correct done/active/future state on first open,
// even before the user clicks "Next".
const statusToCompletedStep = (status) => {
  const s = (status || "").toLowerCase().replace(/[\s_]+/g, "");
  if (
    [
      "shipped",
      "intransit",
      "outfordelivery",
      "delivered",
      "returned",
      "return initiated",
      "returnpending",
      "replaced",
      "replacementpending",
      "replacementinitiated",
    ].includes(s)
  )
    return 4;
  if (s === "packed") return 3;
  if (s === "accepted") return 2;
  return 0; // placed/pending/unknown → nothing done yet
};

// ─── Page Header ──────────────────────────────────────────────────────────────
export const PageHeader = ({
  orderId,
  productName,
  status,
  showBack = true,
  onBack,
  orderData,
}) => {
  const navigate = useNavigate();
  const cls =
    STATUS_COLORS[(status || "").toLowerCase()] || "bg-gray-100 text-gray-600";

  const handlePrint = () => window.print();

  const handleInvoice = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Invoice — Order ${orderId}`, 14, 20);
    if (orderData) {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`Product: ${orderData.product?.name || "—"}`, 14, 32);
      doc.text(`Customer: ${orderData.customer?.name || "—"}`, 14, 38);
      doc.text(`Total: ${orderData.orderInfo?.orderTotal || "—"}`, 14, 44);
      doc.text(`Payment: ${orderData.orderInfo?.paymentType || "—"}`, 14, 50);
      doc.text(
        `Date: ${orderData.orderInfo?.orderedDate || "—"} ${
          orderData.orderInfo?.orderedTime || ""
        }`,
        14,
        56,
      );
    }
    doc.save(`invoice-${orderId}.pdf`);
  };

  return (
    <div className="w-full bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 text-sm min-w-0">
        <button
          onClick={onBack || (() => navigate(-1))}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors font-medium flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>
        <span className="text-gray-300 flex-shrink-0">/</span>
        <span className="text-gray-500 font-medium flex-shrink-0">
          {orderId}
        </span>
        {productName && (
          <>
            <span className="text-gray-300 flex-shrink-0">/</span>
            <span className="text-gray-700 font-semibold truncate">
              {productName}
            </span>
          </>
        )}
      </div>

      {/* Right: status pill + Print + Invoice */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {status && (
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${cls}`}>
            {statusLabel(status)}
          </span>
        )}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 hover:bg-gray-50 rounded-lg"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
        <button
          onClick={handleInvoice}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 hover:bg-gray-50 rounded-lg"
        >
          <FileText className="w-4 h-4" />
          Invoice
        </button>
      </div>
    </div>
  );
};

// ─── Stepper ──────────────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: "Order Details" },
  { n: 2, label: "Invoice" },
  { n: 3, label: "Shipping Label" },
  { n: 4, label: "Mark Shipped" },
];

export const OrderStepper = ({ currentStep, currentStatus }) => {
  // Steps that are "done" according to the backend status (independent of local step)
  const backendDoneUpTo = statusToCompletedStep(currentStatus);

  return (
    <div className="w-full bg-white border-b border-gray-100 px-8 py-5">
      <div className="flex items-center justify-center max-w-lg mx-auto">
        {STEPS.map((s, i) => {
          // A step is "done" if:
          //   • The user has clicked past it (currentStep > s.n), OR
          //   • The backend status already implies it's complete (backendDoneUpTo >= s.n)
          const done = currentStep > s.n || backendDoneUpTo >= s.n;
          // Active: the step the user is currently viewing
          const active = currentStep === s.n && backendDoneUpTo < s.n;
          // Active when backend status already at this step or past it — show current
          const activeCurrent = currentStep === s.n;

          return (
            <React.Fragment key={s.n}>
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
                    done
                      ? "bg-[#FF6012] border-[#FF6012] text-white"
                      : activeCurrent
                      ? "bg-[#FF6012] border-[#FF6012] text-white shadow-md shadow-orange-200"
                      : "bg-white border-gray-200 text-gray-400"
                  }`}
                >
                  {done && !activeCurrent ? (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8l3.5 3.5L13 4.5"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    s.n
                  )}
                </div>

                {/* Label */}
                <p
                  className={`text-[11px] font-semibold mt-2 whitespace-nowrap ${
                    activeCurrent || done ? "text-[#FF6012]" : "text-gray-400"
                  }`}
                >
                  {s.label}
                </p>
              </div>

              {/* Connecting line */}
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-3 mb-5 transition-all ${
                    done ? "bg-[#FF6012]" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const FooterNav = ({
  currentStep,
  onBack,
  onCancel,
  onNext,
  loading,
  isModal,
  nextLabel,
  canGoBack,
  canCancel,
  canGoNext,
}) => {
  return (
    <div
      className={`${
        isModal
          ? "absolute bottom-0 left-0 right-0"
          : "fixed bottom-0 left-0 right-0"
      } bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-end gap-4 z-10`}
    >
      {/* Back — based on canGoBack */}
      {canGoBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}

      {/* Cancel Order — center */}
      {canCancel && (
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel Order
        </button>
      )}

      {/* Next / Accept / Mark as Shipped — hidden for terminal orders */}
      {canGoNext && nextLabel ? (
        <button
          onClick={onNext}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#FF6012] hover:bg-[#e0500a] rounded-xl disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? (
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
          ) : null}
          {loading ? "Processing…" : nextLabel}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      ) : null}
    </div>
  );
};
