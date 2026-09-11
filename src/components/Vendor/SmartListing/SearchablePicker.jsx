import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

const NAVY = "#1A2B48";
const ORANGE = "#F56C43";

/**
 * Searchable picker. Pass `multiple` for a checkbox list that stays open until Done.
 * options: [{ id, label, hint? }]
 */
export default function SearchablePicker({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  searchPlaceholder = "Search…",
  required = false,
  error,
  disabled = false,
  allowClear = true,
  emptyText = "No matches",
  compact = false,
  multiple = false,
  defaultOpen = false,
  hideTrigger = false,
  onClose,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const selectedIds = useMemo(() => {
    if (multiple) {
      const arr = Array.isArray(value) ? value : value != null && value !== "" ? [value] : [];
      return arr.map((id) => String(id));
    }
    return value != null && value !== "" ? [String(value)] : [];
  }, [value, multiple]);

  const selectedOptions = useMemo(
    () => options.filter((o) => selectedIds.includes(String(o.id))),
    [options, selectedIds],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => {
      const hay = `${o.label || ""} ${o.hint || ""} ${o.id}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [options, q]);

  const triggerText = () => {
    if (!selectedOptions.length) return placeholder;
    if (!multiple) return selectedOptions[0].label;
    if (selectedOptions.length <= 3) {
      return selectedOptions.map((o) => o.label).join(", ");
    }
    return `${selectedOptions
      .slice(0, 2)
      .map((o) => o.label)
      .join(", ")} +${selectedOptions.length - 2}`;
  };

  const close = () => {
    setOpen(false);
    onClose?.();
  };

  const pick = (id) => {
    if (!multiple) {
      onChange(id);
      // Delay unmount so the same click cannot fall through onto a file input below.
      window.setTimeout(close, 50);
      return;
    }
    const sid = String(id);
    const nextSet = new Set(selectedIds);
    if (nextSet.has(sid)) nextSet.delete(sid);
    else nextSet.add(sid);
    const ordered = options.filter((o) => nextSet.has(String(o.id))).map((o) => o.id);
    onChange(ordered);
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : "");
  };

  return (
    <div className="w-full min-w-0">
      {hideTrigger ? null : label ? (
        <p className={`font-medium mb-1 ${compact ? "text-[11px] text-slate-400" : "text-sm text-gray-700"}`}>
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </p>
      ) : null}
      {hideTrigger ? null : (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`w-full flex items-center gap-2 rounded-lg border text-left transition-colors ${
          compact ? "px-2.5 py-2 text-[13px]" : "px-3 py-2.5 text-sm"
        } ${
          disabled
            ? "bg-slate-50 cursor-not-allowed border-gray-200"
            : error
              ? "bg-white border-red-300"
              : "bg-white border-gray-200 hover:border-[#F56C43]/50"
        } focus:outline-none focus:ring-2 focus:ring-[#F56C43]/20`}
      >
        <span
          className={`flex-1 truncate ${
            selectedOptions.length ? "font-medium" : "text-slate-400"
          }`}
          style={selectedOptions.length ? { color: NAVY } : undefined}
        >
          {triggerText()}
        </span>
        {allowClear && selectedOptions.length && !disabled ? (
          <span
            role="button"
            tabIndex={0}
            className="text-slate-400 hover:text-slate-700"
            onClick={clear}
          >
            <X className="w-3.5 h-3.5" />
          </span>
        ) : null}
        {disabled ? null : <ChevronsUpDown className="w-4 h-4 shrink-0 text-slate-400" />}
      </button>
      )}
      {hideTrigger ? null : error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}

      {open ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-[#1A2B48]/45 backdrop-blur-[2px]"
            onClick={close}
            aria-hidden="true"
          />
          <div
            className="relative bg-white flex flex-col overflow-hidden w-full"
            style={{
              width: "min(100%, 420px)",
              height: "min(72vh, 560px)",
              borderRadius: "20px",
              border: "1px solid #EEF1F5",
              boxShadow: "0 28px 80px rgba(26, 43, 72, 0.22)",
            }}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
              <p className="text-[17px] font-semibold tracking-tight" style={{ color: NAVY }}>
                {label || placeholder}
              </p>
              <button
                type="button"
                onClick={close}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-[#F4F6F8] transition-colors"
                aria-label="Close"
              >
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>

            <div className="px-5 pb-3 shrink-0">
              <div className="relative">
                <Search className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-11 pl-11 pr-3.5 border border-[#E5E7EB] rounded-xl text-[14px] text-[#1A2B48] placeholder:text-slate-400 bg-[#FAFBFC] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F56C43]/20 focus:border-[#F56C43] transition-shadow"
                />
              </div>
              <p className="text-[12px] mt-2.5 font-medium text-slate-400">
                {filtered.length} of {options.length}
                {multiple && selectedIds.length ? ` · ${selectedIds.length} selected` : ""}
              </p>
            </div>

            <div className="h-px bg-[#EEF1F5] shrink-0" />

            <div className="flex-1 overflow-y-auto min-h-0 py-1">
              {filtered.map((o) => {
                const on = selectedIds.includes(String(o.id));
                return (
                  <button
                    key={o.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(o.id)}
                    className="w-full flex items-center gap-3.5 px-5 py-[13px] text-left transition-colors"
                    style={{
                      backgroundColor: on ? "#FFF5F0" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!on) e.currentTarget.style.backgroundColor = "#F7F8FA";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = on ? "#FFF5F0" : "transparent";
                    }}
                  >
                    <span
                      className="w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        backgroundColor: on ? ORANGE : "#fff",
                        borderColor: on ? ORANGE : "#D1D5DB",
                        color: "#fff",
                      }}
                    >
                      {on ? <Check className="w-3 h-3" strokeWidth={3} /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block text-[15px] font-medium leading-snug truncate"
                        style={{ color: NAVY }}
                      >
                        {o.label}
                      </span>
                      {o.hint ? (
                        <span className="block text-[12px] text-slate-400 truncate mt-0.5">
                          {o.hint}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
              {!filtered.length ? (
                <p className="p-10 text-center text-[14px] text-slate-400">{emptyText}</p>
              ) : null}
            </div>

            <div
              className="shrink-0 flex items-center justify-between gap-3 px-5 py-3.5"
              style={{ borderTop: "1px solid #EEF1F5", background: "#FAFBFC" }}
            >
              {multiple && selectedIds.length ? (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-[13px] font-medium text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={close}
                className="inline-flex items-center justify-center min-w-[108px] h-10 px-6 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: ORANGE }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
