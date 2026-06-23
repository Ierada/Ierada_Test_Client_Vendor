import React, { useMemo } from "react";
import { Check } from "lucide-react";

const defaultItems = [
  "OnePlus Nord 4 Handset",
  "SUPERVOOC 100W Charger",
  "USB-A to USB-C Cable",
  "Protective Case",
  "Screen Protector (Pre-applied)",
  "SIM Tray Ejector Tool",
  "Quick Start Guide",
];

const WhatsInBox = ({ whatsInBox }) => {
  const items = useMemo(() => {
    if (!whatsInBox) return defaultItems;
    try {
      const parsed = typeof whatsInBox === "string" ? JSON.parse(whatsInBox) : whatsInBox;
      if (Array.isArray(parsed)) return parsed.map(item => typeof item === "object" ? item.name || item.title || JSON.stringify(item) : String(item));
    } catch (e) {
      console.warn("Failed to parse whatsInBox", e);
    }
    return defaultItems;
  }, [whatsInBox]);

  return (
    <div className="flex w-full flex-col rounded-2xl border border-[#E4E8EF] bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#101828]">
        <span className="h-4 w-1 rounded-full bg-[#FF6012]" />
        What's in the Box
      </h3>
      <div className="grid grid-cols-1 gap-2 text-[12px] md:grid-cols-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 rounded-lg border border-[#FFE3C7] bg-[#FFFAF5] px-3 py-2">
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#FFD7AD] bg-white">
              <Check className="h-2.5 w-2.5 text-[#FF6012] stroke-[3]" />
            </div>
            <span className="font-medium text-[#344054]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(WhatsInBox);
