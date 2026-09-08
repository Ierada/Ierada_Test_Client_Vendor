import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

/**
 * Single-select popup with search — use anywhere a native <select> list is long.
 * options: [{ id, label, hint? }]
 * tone="brand" — orange / primary accents for Smart Listing size picker.
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
  tone = "default",
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const brand = tone === "brand";

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const selected = useMemo(
    () => options.find((o) => String(o.id) === String(value)) || null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => {
      const hay = `${o.label || ""} ${o.hint || ""} ${o.id}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [options, q]);

  const pick = (id) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="w-full min-w-0">
      {label ? (
        <p className={`font-medium text-gray-700 mb-1 ${compact ? "text-[11px]" : "text-sm"}`}>
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </p>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`w-full flex items-center gap-2 rounded-lg border bg-white text-left disabled:opacity-50 ${
          compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
        } ${
          error
            ? "border-red-300"
            : brand
              ? "border-orange-200 hover:border-primary-100 focus:ring-primary-100/40"
              : "border-gray-200"
        } focus:outline-none focus:ring-2 focus:ring-primary-100/30`}
      >
        <span
          className={`flex-1 truncate ${
            selected
              ? brand
                ? "text-primary-100 font-medium"
                : "text-gray-900"
              : "text-gray-400"
          }`}
        >
          {selected?.label || placeholder}
        </span>
        {allowClear && selected && !disabled ? (
          <span
            role="button"
            tabIndex={0}
            className="text-gray-400 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          >
            <X className="w-3.5 h-3.5" />
          </span>
        ) : null}
        <ChevronsUpDown
          className={`w-3.5 h-3.5 shrink-0 ${brand ? "text-primary-100" : "text-gray-400"}`}
        />
      </button>
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}

      {open ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden ${
              brand ? "ring-2 ring-primary-100/30" : ""
            }`}
          >
            <div
              className={`flex items-center justify-between px-4 py-3 border-b ${
                brand ? "bg-orange-50 border-orange-100" : ""
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  brand ? "text-primary-100" : "text-gray-900"
                }`}
              >
                {label || placeholder}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`p-1.5 rounded-full ${
                  brand ? "hover:bg-orange-100 text-primary-100" : "hover:bg-gray-100"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div
              className={`px-4 py-3 border-b ${
                brand ? "bg-orange-50/40 border-orange-100" : ""
              }`}
            >
              <div className="relative">
                <Search
                  className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                    brand ? "text-primary-100" : "text-gray-400"
                  }`}
                />
                <input
                  autoFocus
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-100/30 ${
                    brand ? "border-orange-200 bg-white" : "border-gray-200"
                  }`}
                />
              </div>
              <p
                className={`text-[11px] mt-2 ${
                  brand ? "text-primary-100/80 font-medium" : "text-gray-400"
                }`}
              >
                {filtered.length} of {options.length}
                {brand && options.length ? " · this category" : ""}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {filtered.map((o) => {
                const on = String(o.id) === String(value);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => pick(o.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${
                      on
                        ? "bg-orange-50"
                        : brand
                          ? "hover:bg-orange-50/60"
                          : "hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        on
                          ? "bg-primary-100 border-primary-100 text-white"
                          : brand
                            ? "border-orange-200 bg-white"
                            : "border-gray-300 bg-white"
                      }`}
                    >
                      {on ? <Check className="w-3.5 h-3.5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-medium truncate ${
                          on ? "text-primary-100" : "text-gray-900"
                        }`}
                      >
                        {o.label}
                      </span>
                      {o.hint ? (
                        <span className="block text-xs text-gray-400 truncate">{o.hint}</span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
              {!filtered.length ? (
                <p className="p-8 text-center text-sm text-gray-400">{emptyText}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
