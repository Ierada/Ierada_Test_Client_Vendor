import { Loader2 } from "lucide-react";

/**
 * Centered branded confirm dialog (replaces native window.confirm).
 * variant: "brand" (orange) | "danger" (red destructive)
 */
const ConfirmModal = ({
  isOpen,
  title = "Confirm",
  message = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "brand",
  busy = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-[#F56C43] hover:bg-[#e55f38] text-white";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ierada-confirm-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel?.();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-[#F3D9CF]">
        <h3
          id="ierada-confirm-title"
          className="text-lg font-semibold text-[#1A2B48] mb-2"
        >
          {title}
        </h3>
        {message ? (
          <p className="text-sm text-gray-600 mb-6 whitespace-pre-line leading-relaxed">
            {message}
          </p>
        ) : (
          <div className="mb-6" />
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-lg border border-gray-200 text-[#1A2B48] hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${confirmClass}`}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
