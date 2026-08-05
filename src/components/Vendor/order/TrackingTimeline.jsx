"use client";

import React, { useMemo } from "react";
import {
  PackageSearch,
  PackageCheck,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
} from "lucide-react";

const NEGATIVE_KEYWORDS = ["CANCEL", "FAIL", "RTO", "RETURN", "REJECT"];

const STEP_DEFINITIONS = [
  {
    key: "PLACED",
    label: "Order Placed",
    match: ["PLACED", "IN_PROCESS", "CREATED", "CONFIRMED"],
    defaultSubtitle: "Order confirmed",
    icon: <PackageSearch className="w-4 h-4" />,
  },
  {
    key: "PACKED",
    label: "Packed",
    match: ["READY_FOR_DISPATCH", "PACKED"],
    defaultSubtitle: "Inventory packed",
    icon: <PackageCheck className="w-4 h-4" />,
  },
  {
    key: "PICKED_UP",
    label: "Picked Up",
    match: ["PICKED_UP", "DISPATCHED"],
    defaultSubtitle: "Handed to carrier",
    icon: <Truck className="w-4 h-4" />,
  },
  {
    key: "IN_TRANSIT",
    label: "In Transit",
    match: ["IN_TRANSIT", "TRANSIT", "SHIPPED"],
    defaultSubtitle: "On the way",
    icon: <Truck className="w-4 h-4" />,
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    match: ["OUT_FOR_DELIVERY", "READY_FOR_DELIVERY"],
    defaultSubtitle: "Assigned to rider",
    icon: <Clock className="w-4 h-4" />,
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    match: ["DELIVERED", "COMPLETE"],
    defaultSubtitle: "Order completed",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

function isNegative(state) {
  const s = state?.toUpperCase() || "";
  return NEGATIVE_KEYWORDS.some((k) => s.includes(k));
}

function matchStepIndex(state) {
  const s = state?.toUpperCase() || "";
  for (let i = 0; i < STEP_DEFINITIONS.length; i++) {
    if (STEP_DEFINITIONS[i].match.some((k) => s.includes(k))) return i;
  }
  return -1;
}

function formatLabel(state) {
  return (
    state
      ?.toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || "Cancelled"
  );
}

function formatTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrackingTimeline({ events }) {
  const { steps, progressPercent, terminalNegative } = useMemo(() => {
    const sorted = [...(events || [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const lastEvent = sorted[sorted.length - 1];
    const isTerminalNegative = !!lastEvent && isNegative(lastEvent.state);

    const stepData = {};
    let maxIndex = -1;
    sorted.forEach((e) => {
      if (isNegative(e.state)) return;
      const idx = matchStepIndex(e.state);
      if (idx >= 0) {
        stepData[idx] = e;
        if (idx > maxIndex) maxIndex = idx;
      }
    });

    const list = [];

    STEP_DEFINITIONS.forEach((def, idx) => {
      if (isTerminalNegative && idx > maxIndex) return;

      let status = "upcoming";
      if (idx < maxIndex) status = "completed";
      else if (idx === maxIndex) status = isTerminalNegative ? "completed" : "current";

      const event = stepData[idx];

      list.push({
        key: def.key,
        label: def.label,
        subtitle: event?.location || def.defaultSubtitle,
        status,
        timestamp: event?.createdAt,
        icon: def.icon,
      });
    });

    let percent = 0;
    if (list.length > 1) {
      const completedCount = list.filter(
        (s) => s.status === "completed" || s.status === "current",
      ).length;
      percent = ((completedCount - 1) / Math.max(list.length - 1, 1)) * 100;
    }

    if (isTerminalNegative) {
      list.push({
        key: "CANCELLED",
        label: formatLabel(lastEvent.state),
        subtitle: lastEvent.location || "Shipment could not proceed",
        status: "cancelled",
        timestamp: lastEvent.createdAt,
        icon: <XCircle className="w-4 h-4" />,
      });
      percent = 100;
    }

    return { steps: list, progressPercent: percent, terminalNegative: isTerminalNegative };
  }, [events]);

  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-400 text-sm">
        No tracking events available
      </div>
    );
  }

  const circleClasses = (status) => {
    switch (status) {
      case "completed":
        return "bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-200";
      case "current":
        return "bg-white border-orange-500 text-orange-500 shadow-[0_0_0_5px_rgba(249,115,22,0.15)]";
      case "cancelled":
        return "bg-red-500 border-red-500 text-white shadow-sm shadow-red-200";
      default:
        return "bg-white border-neutral-200 text-neutral-300";
    }
  };

  return (
    <div className="w-full">
      {/* ── Desktop / tablet: horizontal ── */}
      <div className="hidden sm:block">
        <div className="relative px-2">
          {/* base track */}
          <div className="absolute left-6 right-6 top-[19px] h-[3px] rounded-full bg-neutral-100" />
          {/* filled progress */}
          <div
            className={`absolute left-6 top-[19px] h-[3px] rounded-full transition-all duration-700 ease-out ${
              terminalNegative
                ? "bg-gradient-to-r from-orange-400 to-red-500"
                : "bg-gradient-to-r from-orange-400 to-orange-500"
            }`}
            style={{
              width: `calc((100% - 48px) * ${progressPercent / 100})`,
            }}
          />

          <div className="relative flex justify-between">
            {steps.map((step) => (
              <div
                key={step.key}
                className="flex flex-col items-center text-center"
                style={{ width: `${100 / steps.length}%` }}
              >
                <div
                  className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${circleClasses(
                    step.status,
                  )}`}
                >
                  {step.status === "current" && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-20 animate-ping" />
                  )}
                  {step.icon}
                </div>

                <div className="mt-3 px-1 max-w-[110px]">
                  <div
                    className={`text-xs font-semibold leading-snug ${
                      step.status === "upcoming"
                        ? "text-neutral-400"
                        : step.status === "cancelled"
                          ? "text-red-600"
                          : "text-neutral-900"
                    }`}
                  >
                    {step.label}
                  </div>

                  {step.status !== "upcoming" && (
                    <>
                      <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center justify-center gap-1">
                        {step.subtitle && (
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {step.subtitle}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {formatTime(step.timestamp)}
                      </div>
                    </>
                  )}

                  {step.status === "upcoming" && (
                    <div className="text-[11px] text-neutral-300 mt-0.5">Pending</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile: vertical ── */}
      <div className="sm:hidden">
        {steps.map((step, i) => (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-500 ${circleClasses(
                  step.status,
                )}`}
              >
                {step.status === "current" && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-20 animate-ping" />
                )}
                {step.icon}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-[3px] flex-1 min-h-[32px] rounded-full transition-colors duration-500 ${
                    steps[i + 1].status === "cancelled"
                      ? "bg-red-400"
                      : steps[i + 1].status === "completed" || steps[i + 1].status === "current"
                        ? "bg-gradient-to-b from-orange-400 to-orange-500"
                        : "bg-neutral-150"
                  }`}
                />
              )}
            </div>
            <div className="pb-6 -mt-0.5">
              <div
                className={`text-sm font-semibold ${
                  step.status === "upcoming"
                    ? "text-neutral-400"
                    : step.status === "cancelled"
                      ? "text-red-600"
                      : "text-neutral-900"
                }`}
              >
                {step.label}
              </div>
              {step.status !== "upcoming" ? (
                <div className="flex items-center gap-2 mt-0.5">
                  {step.subtitle && (
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {step.subtitle}
                    </span>
                  )}
                  <span className="text-xs text-neutral-400">
                    {formatTime(step.timestamp)}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-neutral-300 mt-0.5">Pending</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrackingTimeline;