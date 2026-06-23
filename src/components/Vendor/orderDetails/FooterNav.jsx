import React from "react";
import { ArrowLeft, X, ArrowRight, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FooterNav = ({ currentStep, onBack, onCancel, onNext, loading, isModal }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div className={`${isModal ? "absolute" : "fixed"} inset-x-0 bottom-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center border-t border-[#E4E8EF] bg-white px-8 py-5 font-inter text-[13px] font-semibold shadow-[0_-8px_24px_rgba(16,24,40,0.04)]`}>
      {/* Col 1 — empty spacer to balance the right side */}
      <div />

      {/* Col 2 — Back + Cancel centered */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-14 min-w-[120px] items-center justify-center gap-2 rounded-lg border border-[#E4E8EF] px-6 text-sm font-semibold text-[#667085] transition-colors hover:border-[#D0D5DD] hover:bg-gray-50 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{currentStep === 1 ? "Back to Orders" : "Back"}</span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-14 min-w-[206px] items-center justify-center gap-3 rounded-lg border border-red-200 px-8 text-base font-semibold text-red-500 transition-colors hover:bg-red-50"
        >
          <X className="h-5 w-5" />
          <span>Cancel Order</span>
        </button>
      </div>

      {/* Col 3 — Next or Mark as Shipped, right-aligned */}
      {currentStep < 4 ? (
        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className="justify-self-end inline-flex h-14 min-w-[144px] items-center justify-center gap-3 rounded-lg bg-[#FF6012] px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#E0500F] disabled:opacity-50"
        >
          <span>{loading ? "Processing..." : "Next"}</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className="justify-self-end inline-flex h-14 min-w-[170px] items-center justify-center gap-3 rounded-lg bg-[#00B560] px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#009E52] disabled:opacity-50"
        >
          <Truck className="h-5 w-5" />
          <span>{loading ? "Processing..." : "Mark as Shipped"}</span>
        </button>
      )}
    </div>
  );
};

export default React.memo(FooterNav);