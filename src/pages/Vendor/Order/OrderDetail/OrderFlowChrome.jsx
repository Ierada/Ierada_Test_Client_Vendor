/**
 * PageHeader.jsx – Top bar for OrderDetail flow
 */
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS = {
  placed: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  packed: "bg-indigo-100 text-indigo-700",
  shipped: "bg-green-100 text-green-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  rejected: "bg-gray-100 text-gray-600",
};

export const PageHeader = ({
  orderId,
  productName,
  status,
  showBack = true,
  onBack,
}) => {
  const navigate = useNavigate();
  const cls =
    STATUS_COLORS[(status || "").toLowerCase()] || "bg-gray-100 text-gray-600";

  return (
    <div className="w-full bg-white border-b border-[#EDF0F4] px-6 py-4 flex items-center gap-4">
      {showBack && (
        <button
          onClick={onBack || (() => navigate(-1))}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-base font-bold text-gray-900">Order {orderId}</h1>
          {status && (
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${cls}`}
            >
              {status}
            </span>
          )}
        </div>
        {productName && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{productName}</p>
        )}
      </div>
    </div>
  );
};

/**
 * OrderStepper.jsx – 4-step horizontal stepper
 */
const STEPS = [
  { n: 1, label: "Order Details" },
  { n: 2, label: "Invoice" },
  { n: 3, label: "Shipping Label" },
  { n: 4, label: "Mark Shipped" },
];

export const OrderStepper = ({ currentStep }) => (
  <div className="w-full bg-white border-b border-[#EDF0F4] px-6 py-4">
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = currentStep > s.n;
        const active = currentStep === s.n;
        return (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  done
                    ? "bg-green-500 border-green-500 text-white"
                    : active
                    ? "bg-[#0164CE] border-[#0164CE] text-white"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8l3.5 3.5L13 4.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  s.n
                )}
              </div>
              <p
                className={`text-[10px] font-semibold mt-1.5 whitespace-nowrap ${
                  active
                    ? "text-[#0164CE]"
                    : done
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {s.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${
                  done ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

/**
 * FooterNav.jsx – Bottom navigation bar for the flow
 */
export const FooterNav = ({
  currentStep,
  onBack,
  onCancel,
  onNext,
  loading,
  isModal,
}) => {
  const isLastStep = currentStep === 4;

  const NEXT_LABELS = {
    1: "Accept Order",
    2: "Confirm Invoice",
    3: "Generate Label",
    4: "Mark as Packed",
  };

  return (
    <div
      className={`${
        isModal
          ? "absolute bottom-0 left-0 right-0"
          : "fixed bottom-0 left-0 right-0"
      } bg-white border-t border-[#EDF0F4] px-6 py-4 flex items-center justify-between z-10 shadow-lg`}
    >
      <div className="flex items-center gap-3">
        {currentStep > 1 && (
          <button
            onClick={onBack}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-sm font-semibold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
        >
          {isModal ? "Close" : "Cancel"}
        </button>
      </div>

      <button
        onClick={onNext}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#0164CE] rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading && (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
        )}
        {loading ? "Processing…" : NEXT_LABELS[currentStep]}
      </button>
    </div>
  );
};
