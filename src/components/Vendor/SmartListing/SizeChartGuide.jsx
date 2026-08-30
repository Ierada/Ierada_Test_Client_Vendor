import React from "react";
import standards from "./utils/size-chart-standards.json";

/**
 * Shows IERADA size-chart label standards + category size_chart image,
 * falling back to bundled standard chart SVGs by category family.
 */
export default function SizeChartGuide({ sizeChartUrl, categoryHint = "" }) {
  const groups = standards?.standards || {};
  const images = standards?.images || {};

  const hint = String(categoryHint || "").toLowerCase();
  let fallbackKey = null;
  if (/\b(shoe|sandal|sneaker|boot|footwear|loafer|slipper|heel)\b/.test(hint)) {
    fallbackKey = "footwear";
  } else if (/\b(kids?|infant|baby|toddler|boys?|girls?)\b/.test(hint)) {
    fallbackKey = "kids";
  } else if (/\b(jeans|trouser|pant|short|skirt|legging|bottom|chino)\b/.test(hint)) {
    fallbackKey = "apparel_bottoms";
  } else if (
    /\b(t-?shirt|shirt|top|hoodie|sweat|kurta|jacket|dress|apparel|clothing|wear|blouse|tee)\b/.test(
      hint,
    )
  ) {
    fallbackKey = "apparel_tops";
  }

  const standardRel = fallbackKey ? images[fallbackKey] : null;
  // Bundled charts live on Server assets; when category has no image, show label tables.
  // If sizeChartUrl is present it is the authoritative chart for this inner category.

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div>
        <h3 className="font-semibold text-gray-900">Size chart standards</h3>
        <p className="text-xs text-gray-500">
          {standards?.note ||
            "Use these labels for apparel / footwear. Upload a clear chart image on Inner Subcategory (Ops)."}
        </p>
      </div>
      {sizeChartUrl ? (
        <div className="rounded-lg border bg-white p-2">
          <p className="text-xs font-medium text-gray-600 mb-1">
            Category size chart
          </p>
          <img
            src={sizeChartUrl}
            alt="Size chart"
            className="max-h-72 w-full object-contain mx-auto"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          No size-chart image on this inner category yet
          {fallbackKey ? ` (suggested family: ${fallbackKey.replace(/_/g, " ")})` : ""}
          . Ops: upload under Inner Subcategory, or run{" "}
          <code className="text-[10px]">node scripts/applyDefaultSizeCharts.js</code>{" "}
          on Test to attach IERADA standard charts.
          {standardRel ? (
            <span className="block mt-1 text-gray-500">
              Standard file: {standardRel}
            </span>
          ) : null}
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        {Object.entries(groups).map(([key, labels]) => (
          <div
            key={key}
            className={`rounded-lg border bg-white px-3 py-2 ${
              fallbackKey === key ? "ring-2 ring-blue-400" : ""
            }`}
          >
            <p className="font-medium text-gray-800 capitalize mb-1">
              {key.replace(/_/g, " ")}
            </p>
            <p className="text-gray-600">{(labels || []).join(" · ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
