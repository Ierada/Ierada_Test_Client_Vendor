import React from "react";
import { Check } from "lucide-react";
import { SELF_SHIP_STAGES } from "./constants";

const getNodeColorClass = (idx, activeIdx) => {
  if (idx < activeIdx) return SELF_SHIP_STAGES[idx].bgClass;
  if (idx === activeIdx) return `ring-4 ring-offset-2 ring-${SELF_SHIP_STAGES[idx].color}-500 bg-${SELF_SHIP_STAGES[idx].color}-500 text-white`;
  return "border-gray-200 text-gray-300 bg-white";
};

const getLineBgClass = (idx, activeIdx) => {
  if (idx >= activeIdx) return "bg-gray-200";
  const color = SELF_SHIP_STAGES[idx].color;
  return color === "blue" ? "bg-blue-600" : color === "orange" ? "bg-orange-500" : color === "purple" ? "bg-purple-600" : color === "pink" ? "bg-pink-500" : color === "green" ? "bg-green-600" : "bg-gray-300";
};

const SelfShipTimeline = ({ activeIndex }) => {
  return (
    <div className="relative overflow-x-auto py-6">
      <div className="flex items-center min-w-[950px] px-2">
        {SELF_SHIP_STAGES.map((stage, idx) => (
          <div key={stage.id} className="flex-1 flex flex-col items-center relative z-10">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-[10px] font-bold shadow-sm transition-all duration-300 ${getNodeColorClass(idx, activeIndex)}`}>
              {idx < activeIndex ? <Check className="w-3.5 h-3.5 text-white stroke-[3.5px]" /> : idx === activeIndex ? <div className="w-2 h-2 bg-white rounded-full" /> : null}
            </div>
            <span className={`text-[11px] font-bold mt-2.5 font-satoshi ${idx === activeIndex ? "text-gray-900 font-extrabold" : "text-gray-400"}`}>
              {stage.name}
            </span>
            {idx < SELF_SHIP_STAGES.length - 1 && (
              <div className="absolute top-3.5 left-[calc(50%+14px)] right-[calc(-50%+14px)] h-[1.5px] z-[-1]">
                <div className={`h-full w-full transition-all duration-300 ${getLineBgClass(idx, activeIndex)}`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(SelfShipTimeline);
