import React, { useMemo } from "react";

const defaultSpecs = [
  { key: "Display", value: '6.74" AMOLED, 120Hz, 2772x1240' },
  { key: "Battery", value: "5500mAh, 100W SUPERVOOC" },
  { key: "Front Camera", value: "16MP" },
  { key: "Connectivity", value: "5G, Wi-Fi 6E, Bluetooth 5.4" },
  { key: "Processor", value: "Snapdragon 7+ Gen 3" },
  { key: "Camera", value: "50MP Sony IMX890 + 8MP Ultra-wide" },
  { key: "OS", value: "OxygenOS 14.1 (Android 14)" },
  { key: "Dimensions", value: "162.6 x 75.1 x 7.99mm, 198g" },
];

const ProductSpecs = ({ specifications }) => {
  const specsList = useMemo(() => {
    if (!specifications) return defaultSpecs;
    try {
      const parsed = typeof specifications === "string" ? JSON.parse(specifications) : specifications;
      if (Array.isArray(parsed)) return parsed.map(item => ({ key: item.key || item.feature, value: item.value || item.specification }));
      if (typeof parsed === "object" && parsed !== null) {
        return Object.entries(parsed).map(([key, value]) => ({ key, value }));
      }
    } catch (e) {
      console.warn("Failed to parse specifications", e);
    }
    return defaultSpecs;
  }, [specifications]);

  return (
    <div className="flex w-full flex-col rounded-2xl border border-[#E4E8EF] bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#101828]">
        <span className="h-4 w-1 rounded-full bg-[#FF6012]" />
        Specifications
      </h3>
      <div className="grid grid-cols-1 gap-x-6 gap-y-0 text-[12px] md:grid-cols-2">
        {specsList.map((spec, idx) => (
          <div key={idx} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 rounded-lg px-3 py-3 odd:bg-[#FBFCFE]">
            <span className="font-medium text-[#8A94A6]">{spec.key}</span>
            <span className="font-semibold text-[#101828]">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(ProductSpecs);
