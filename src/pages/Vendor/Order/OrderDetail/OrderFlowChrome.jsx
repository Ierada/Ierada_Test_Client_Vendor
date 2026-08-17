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
    return 3;
  if (s === "accepted" || s === "packed") return 1;
  return 0;
};

// ─── Page Header ──────────────────────────────────────────────────────────────
export const PageHeader = ({
  orderId,
  productName,
  status,
  showBack = true,
  onBack,
  orderData,
  onInvoiceClick,
}) => {
  const navigate = useNavigate();
  const cls =
    STATUS_COLORS[(status || "").toLowerCase()] || "bg-gray-100 text-gray-600";

  const handlePrint = () => window.print();

  const handleInvoice = () => {
    if (onInvoiceClick) {
      onInvoiceClick();
    }
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
        {/* <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 hover:bg-gray-50 rounded-lg"
        >
          <Printer className="w-4 h-4" />
          Print
        </button> */}
        {onInvoiceClick && (
          <button
            onClick={handleInvoice}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 hover:bg-gray-50 rounded-lg"
          >
            <FileText className="w-4 h-4" />
            Invoice
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Stepper ──────────────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: "Order Details" },
  { n: 2, label: "Mark Shipped" },
  { n: 3, label: "Invoice" },
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
    <div className="w-full bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {canGoBack && (
          <button
            onClick={onBack}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EF] rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        {canCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EF] rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>

      {canGoNext && (
        <button
          onClick={onNext}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-[#FF6012] text-white rounded-lg hover:bg-orange-600 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            <>
              {nextLabel || "Next"}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
export const ModalWrapper = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};
