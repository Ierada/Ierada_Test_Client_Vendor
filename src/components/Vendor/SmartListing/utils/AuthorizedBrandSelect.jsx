import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { NEW_BRAND_AUTH_VALUE, normalizeBrandName } from "./brandAuthHelpers";

const NAVY = "#1A2B48";
const ORANGE = "#F56C43";

export default function AuthorizedBrandSelect({
  value = "",
  brands = [],
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const list = Array.isArray(brands) ? brands : [];
  const selected = list.find(
    (row) => normalizeBrandName(row?.name) === normalizeBrandName(value),
  );
  const isNew = value === NEW_BRAND_AUTH_VALUE;
  const label = isNew
    ? "Request authorization for a new brand"
    : selected?.name || "Select an authorized brand";

  useEffect(() => {
    const onDoc = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const pick = (next) => {
    try {
      onChange?.(next);
    } catch (err) {
      console.error("AuthorizedBrandSelect", err);
    }
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative mt-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium disabled:opacity-50"
        style={{
          color: selected || isNew ? NAVY : "#6B7280",
          background: "#fff",
          border: `1.5px solid ${open ? ORANGE : "#E5E7EB"}`,
          boxShadow: open ? "0 0 0 3px rgba(245, 108, 67, 0.12)" : "none",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: ORANGE }}
        />
      </button>
      {open ? (
        <div
          className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl bg-white"
          style={{
            border: `1.5px solid ${ORANGE}`,
            boxShadow: "0 10px 28px rgba(26, 43, 72, 0.12)",
          }}
          role="listbox"
        >
          <div className="max-h-64 overflow-y-auto">
            <button
              type="button"
              className="w-full px-3 py-2.5 text-left text-[13px] hover:bg-orange-50"
              style={{ color: "#6B7280" }}
              onClick={() => pick("")}
            >
              Select an authorized brand
            </button>
            {list.map((row) => {
              const name = row?.name;
              if (!name) return null;
              const active = normalizeBrandName(name) === normalizeBrandName(value);
              return (
                <button
                  type="button"
                  key={`${row.id || name}-${name}`}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-[13px] font-medium"
                  style={{
                    background: active ? ORANGE : "#fff",
                    color: active ? "#fff" : NAVY,
                  }}
                  onClick={() => pick(name)}
                >
                  <span className="truncate">{name}</span>
                  {active ? <Check className="w-4 h-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="w-full px-3 py-2.5 text-left text-[13px] font-semibold border-t"
            style={{
              color: isNew ? "#fff" : ORANGE,
              background: isNew ? ORANGE : "#FFF7F4",
              borderColor: "#FDE8E0",
            }}
            onClick={() => pick(NEW_BRAND_AUTH_VALUE)}
          >
            Request authorization for a new brand
          </button>
        </div>
      ) : null}
    </div>
  );
}
