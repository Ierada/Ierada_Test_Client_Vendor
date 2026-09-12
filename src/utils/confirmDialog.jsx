import { useCallback, useEffect, useRef, useState } from "react";
import ConfirmModal from "../components/Vendor/modals/ConfirmModal";

let openConfirm = null;

export function confirmDialog({
  title = "Confirm",
  message = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "brand",
} = {}) {
  if (typeof openConfirm !== "function") {
    return Promise.resolve(
      window.confirm([title, message].filter(Boolean).join("\n\n")),
    );
  }
  return openConfirm({
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant,
  });
}

export function ConfirmDialogHost() {
  const resolveRef = useRef(null);
  const [state, setState] = useState({
    open: false,
    title: "Confirm",
    message: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "brand",
  });

  const settle = useCallback((value) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setState((s) => ({ ...s, open: false }));
    resolve?.(value);
  }, []);

  useEffect(() => {
    openConfirm = (opts) =>
      new Promise((resolve) => {
        resolveRef.current = resolve;
        setState({
          open: true,
          title: opts.title || "Confirm",
          message: opts.message || "",
          confirmLabel: opts.confirmLabel || "Confirm",
          cancelLabel: opts.cancelLabel || "Cancel",
          variant: opts.variant || "brand",
        });
      });
    return () => {
      openConfirm = null;
    };
  }, []);

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e) => {
      if (e.key === "Escape") settle(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.open, settle]);

  return (
    <ConfirmModal
      isOpen={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );
}
