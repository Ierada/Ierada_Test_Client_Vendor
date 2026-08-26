import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export const STATUS_FILTER_OPTIONS = [
  { value: "placed", label: "Placed / Pending" },
  { value: "shipped", label: "Shipped" },
  { value: "intransit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
  { value: "returned", label: "Returned" },
  { value: "return pending", label: "Return Pending" },
];

// Multiple statuses can be picked at once (e.g. Shipped + In Transit together)
// so vendors can filter/export a combined view instead of one status at a time.
const StatusMultiSelect = ({ selected = [], onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (value) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  const label =
    selected.length === 0
      ? "All Statuses"
      : selected.length === 1
        ? STATUS_FILTER_OPTIONS.find((o) => o.value === selected[0])?.label ||
          selected[0]
        : `${selected.length} statuses selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between p-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6012]"
      >
        <span className={selected.length ? "text-gray-800" : "text-gray-500"}>
          {label}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-40 max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => onChange([])}
            className="w-full text-left px-3 py-2 text-xs font-bold text-[#FF6012] hover:bg-gray-50 border-b border-gray-100"
          >
            Clear (All Statuses)
          </button>
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="rounded border-gray-300 text-[#FF6012] focus:ring-[#FF6012] w-3.5 h-3.5 cursor-pointer"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusMultiSelect;
