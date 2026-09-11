/** Isolated size-chart helpers. Never invent numerical measurements. */

export function emptySizeChart(status = "not_applicable") {
  if (status === "seller_data_required") {
    return {
      applicable: true,
      status: "seller_data_required",
      measurementType: "",
      unit: "",
      columns: [],
      rows: [],
      note: "",
    };
  }
  return {
    applicable: false,
    status: "not_applicable",
    measurementType: "",
    unit: "",
    columns: [],
    rows: [],
    note: "",
  };
}

export function parseSizeChart(raw) {
  if (!raw || typeof raw !== "object") return emptySizeChart("not_applicable");
  const status = String(raw.status || "").trim();
  if (status === "generated") {
    return {
      applicable: raw.applicable !== false,
      status: "generated",
      measurementType: String(raw.measurementType || ""),
      unit: String(raw.unit || ""),
      columns: Array.isArray(raw.columns) ? raw.columns.map(String) : [],
      rows: Array.isArray(raw.rows) ? raw.rows : [],
      note: String(raw.note || ""),
      sizeFormat: String(raw.sizeFormat || ""),
    };
  }
  if (status === "seller_data_required" || raw.applicable === true) {
    return {
      ...emptySizeChart("seller_data_required"),
      measurementType: String(raw.measurementType || ""),
      unit: String(raw.unit || ""),
    };
  }
  return emptySizeChart("not_applicable");
}

const APPLICABLE_RE =
  /\b(kurta|kurti|anarkali|suit\s*set|dress|gown|saree|blouse|shirt|t-?shirt|\btee\b|top\b|jacket|sweatshirt|hoodie|sweater|jeans|trouser|pants?\b|shorts?\b|skirt|legging|nightwear|innerwear|lingerie|\bbra\b|apparel|clothing|garment|ethnic|western\s+wear|kids?\s+(wear|apparel)|infant|toddler|shoe|sandal|sneaker|slipper|clog|heels?|flats?|boots?|footwear|loafer|belt|rings?\b|bracelet|helmet|caps?\b|hats?\b|gloves?|socks?|knee\s+support|elbow\s+support|wrist\s+support|waist\s+support|compression|protective\s+wear)\b/i;

const NOT_APPLICABLE_RE =
  /\b(electronics?|mobile\s+accessor|phone\s+case|charger|power\s+bank|earbud|headphone|speaker|appliance|kitchen\s+appliance|home\s+appliance|decorat|stationery|\bpen\b|notebook|beauty|skincare|cosmetic|shampoo|serum|lotion|personal\s+care|automotive|car\s+accessor|storage\s+box|container|gadget)\b/i;

export function sizeLabelsFromState(state) {
  const fromGroups = (state.colorGroups || [])
    .flatMap((g) =>
      (g.sizes || []).map((s) => s.size_name || s.sizeName || s.label || ""),
    )
    .map((x) => String(x).trim())
    .filter(Boolean);
  const fromLabels = (Array.isArray(state.size_labels) ? state.size_labels : [])
    .map((x) => String(x).trim())
    .filter(Boolean);
  const fromChart = (state.sizeChart?.rows || [])
    .map((r) => String(r?.Size || r?.size || "").trim())
    .filter(Boolean);
  return [...new Set([...fromGroups, ...fromLabels, ...fromChart])];
}

export function categoryHintFromState(state) {
  return [
    state.innerSubCategoryTitle,
    state.subCategoryTitle,
    state.categoryTitle,
    state.name,
  ]
    .filter(Boolean)
    .join(" ");
}

export function isSizeChartLikelyApplicable(state) {
  const hint = categoryHintFromState(state);
  const labels = sizeLabelsFromState(state);
  const hasSizes = labels.length > 0 || state.listingType === "color_size";
  if (NOT_APPLICABLE_RE.test(hint) && !hasSizes) return false;
  if (APPLICABLE_RE.test(hint)) return true;
  return hasSizes;
}

export function suggestedSizeChartColumns(categoryHint) {
  const h = String(categoryHint || "");
  if (/\b(shoe|sandal|sneaker|slipper|clog|heel|flat|boot|footwear|loafer)\b/i.test(h)) {
    return ["Size", "Foot Length"];
  }
  if (/\b(belt)\b/i.test(h)) {
    return ["Size", "Recommended Waist", "Belt Length"];
  }
  if (/\b(ring)\b/i.test(h)) {
    return ["Ring Size", "Inner Diameter", "Inner Circumference"];
  }
  if (/\b(helmet|cap|hat|headwear)\b/i.test(h)) {
    return ["Size", "Head Circumference"];
  }
  if (/\b(glove)\b/i.test(h)) {
    return ["Size", "Palm Width", "Hand Circumference"];
  }
  if (/\b(knee|elbow|wrist|waist)\s+support|compression\b/i.test(h)) {
    return ["Size", "Applicable Circumference"];
  }
  if (/\b(jeans|trouser|pant|short|skirt|legging|chino|bottom)\b/i.test(h)) {
    return ["Size", "Waist", "Hip", "Inseam", "Length"];
  }
  if (/\b(kids?|infant|baby|toddler|boys?|girls?)\b/i.test(h)) {
    return ["Size", "Recommended Age", "Chest", "Waist", "Garment Length"];
  }
  if (/\b(shirt|t-?shirt|tee|men'?s?\s+kurta|hoodie|sweatshirt|sweater)\b/i.test(h)) {
    return ["Size", "Chest", "Shoulder", "Length", "Sleeve Length"];
  }
  return ["Size", "Bust", "Waist", "Hip", "Shoulder", "Garment Length"];
}

export function suggestedSizeChartNote(categoryHint) {
  const h = String(categoryHint || "");
  if (/\b(shoe|sandal|sneaker|slipper|clog|heel|flat|boot|footwear|loafer)\b/i.test(h)) {
    return "Measure your foot from heel to longest toe and compare it with the foot-length column.";
  }
  if (/\b(belt)\b/i.test(h)) {
    return "Compare the recommended waist or belt length with a well-fitting belt you already wear.";
  }
  if (/\b(ring)\b/i.test(h)) {
    return "Match the inner diameter or circumference with a ring that already fits the intended finger.";
  }
  if (/\b(helmet|cap|hat|headwear)\b/i.test(h)) {
    return "Measure head circumference just above the ears and compare it with the size range.";
  }
  if (/\b(glove)\b/i.test(h)) {
    return "Measure palm width or hand circumference and compare it with the chart before selecting a size.";
  }
  if (/\b(knee|elbow|wrist|waist)\s+support|compression\b/i.test(h)) {
    return "Measure the applicable body circumference and choose the manufacturer size that covers that range.";
  }
  return "Compare these measurements with a similar well-fitting garment before selecting your size.";
}

export function chartHasNumericMeasurements(chart) {
  if (!chart || !Array.isArray(chart.rows)) return false;
  for (const row of chart.rows) {
    for (const [k, v] of Object.entries(row || {})) {
      if (/^size$/i.test(k)) continue;
      if (/\d/.test(String(v || ""))) return true;
    }
  }
  return false;
}

export function inferLocalSizeChart(state) {
  const existing = parseSizeChart(state.sizeChart);
  if (existing.status === "generated" && chartHasNumericMeasurements(existing)) {
    return existing;
  }
  const labels = sizeLabelsFromState(state);
  const freeOnly =
    labels.length > 0 &&
    labels.every((l) => /^(free\s*size|one\s*size|os|freesize)$/i.test(l));
  if (freeOnly) {
    return {
      applicable: true,
      status: "generated",
      measurementType: "",
      unit: "",
      columns: ["Size"],
      rows: labels.map((Size) => ({ Size })),
      note: suggestedSizeChartNote(categoryHintFromState(state)),
    };
  }
  if (isSizeChartLikelyApplicable(state)) {
    return emptySizeChart("seller_data_required");
  }
  return emptySizeChart("not_applicable");
}

export function sellerSizeChartPayload(state) {
  const existing = parseSizeChart(state.sizeChart);
  return {
    selectedSizeLabels: sizeLabelsFromState(state),
    sellerSizeChart: existing.status === "generated" ? existing : null,
    hasNumericMeasurements: chartHasNumericMeasurements(existing),
    sizeMeasurementType: existing.measurementType || "",
    sizeMeasurementUnit: existing.unit || "",
  };
}

export function commitWorkingSizeChart(working, categoryHint) {
  const columns = (working.columns || []).filter(Boolean);
  const rows = (working.rows || []).filter((r) => String(r?.Size || "").trim());
  const draft = { ...working, columns, rows };
  if (!chartHasNumericMeasurements(draft) && columns.length === 1 && /^size$/i.test(columns[0])) {
    const labels = rows.map((r) => String(r.Size || "").trim());
    const freeOnly =
      labels.length > 0 &&
      labels.every((l) => /^(free\s*size|one\s*size|os|freesize)$/i.test(l));
    if (freeOnly) {
      return {
        applicable: true,
        status: "generated",
        measurementType: "",
        unit: "",
        columns: ["Size"],
        rows: labels.map((Size) => ({ Size })),
        note: suggestedSizeChartNote(categoryHint),
      };
    }
  }
  if (!chartHasNumericMeasurements(draft)) {
    return {
      ...emptySizeChart("seller_data_required"),
      measurementType: working.measurementType || "",
      unit: working.unit || "",
    };
  }
  return {
    applicable: true,
    status: "generated",
    measurementType: working.measurementType || "",
    unit: working.unit || "",
    columns,
    rows,
    note: working.note || suggestedSizeChartNote(categoryHint),
  };
}

export const SIZE_FORMATS = [
  { id: "standard", label: "Standard (S, M, L, XL, etc.)", labels: ["S", "M", "L", "XL"] },
  { id: "numeric", label: "Numeric (28, 30, 32, …)", labels: ["28", "30", "32", "34"] },
  { id: "free", label: "Free Size / One Size", labels: ["Free Size"] },
];

export function detectSizeFormat(labels) {
  const list = (labels || []).map((l) => String(l).trim()).filter(Boolean);
  if (!list.length) return "standard";
  if (list.every((l) => /^(free\s*size|one\s*size|os|freesize)$/i.test(l))) return "free";
  if (list.every((l) => /^\d+(\.\d+)?$/.test(l))) return "numeric";
  return "standard";
}

export function labelsForSizeFormat(formatId, preferred = []) {
  const preferredClean = (preferred || []).map((l) => String(l).trim()).filter(Boolean);
  if (preferredClean.length) return preferredClean;
  return SIZE_FORMATS.find((f) => f.id === formatId)?.labels || SIZE_FORMATS[0].labels;
}

export function blankSizeRow(columns, size = "") {
  const row = { Size: size };
  for (const col of columns || []) {
    if (!/^size$/i.test(col) && col !== "Ring Size") row[col] = "";
  }
  return row;
}

/** Placeholder examples only — never written into saved values. */
const EXAMPLE_BY_SIZE = {
  S: { Bust: "92", Waist: "72", Hip: "98", Shoulder: "36", "Garment Length": "135", Chest: "96", Length: "68", "Sleeve Length": "22", Inseam: "76" },
  M: { Bust: "96", Waist: "76", Hip: "102", Shoulder: "37", "Garment Length": "136", Chest: "100", Length: "70", "Sleeve Length": "23", Inseam: "78" },
  L: { Bust: "100", Waist: "80", Hip: "106", Shoulder: "38", "Garment Length": "137", Chest: "104", Length: "72", "Sleeve Length": "24", Inseam: "80" },
  XL: { Bust: "104", Waist: "84", Hip: "110", Shoulder: "39", "Garment Length": "138", Chest: "108", Length: "74", "Sleeve Length": "25", Inseam: "82" },
};

export function examplePlaceholder(sizeLabel, column) {
  if (/^size$/i.test(column) || column === "Ring Size") return "Label";
  const sample = EXAMPLE_BY_SIZE[String(sizeLabel || "").toUpperCase()]?.[column];
  return sample ? `e.g. ${sample}` : "e.g. —";
}

export function editorModeFromChart(sizeChart) {
  if (!sizeChart || sizeChart.status === "not_applicable" || sizeChart.applicable === false) {
    return "not_applicable";
  }
  if (sizeChart.status === "seller_data_required") return "applicable";
  return "applicable";
}

export function commitEditorDraft(draft, categoryHint) {
  if (draft.mode === "not_applicable") return emptySizeChart("not_applicable");
  if (draft.mode === "data_unavailable") {
    return {
      ...emptySizeChart("seller_data_required"),
      measurementType: draft.measurementType || "",
      unit: draft.unit || "",
    };
  }
  const saved = commitWorkingSizeChart(draft, categoryHint);
  if (saved.status === "generated") {
    return { ...saved, sizeFormat: draft.sizeFormat || detectSizeFormat(draft.rows?.map((r) => r.Size)) };
  }
  return { ...saved, sizeFormat: draft.sizeFormat || "" };
}

export function workingSizeChart(sizeChart, categoryHint, sizeLabels) {
  const columns =
    sizeChart?.status === "generated" && Array.isArray(sizeChart.columns) && sizeChart.columns.length
      ? sizeChart.columns.map(String)
      : suggestedSizeChartColumns(categoryHint);
  const format = sizeChart?.sizeFormat || detectSizeFormat(sizeLabels);
  const labels =
    sizeChart?.status === "generated" && Array.isArray(sizeChart.rows) && sizeChart.rows.length
      ? sizeChart.rows.map((r) => String(r.Size || r.size || "").trim()).filter(Boolean)
      : labelsForSizeFormat(format, sizeLabels);
  const bySize = new Map(
    (sizeChart?.rows || []).map((r) => [String(r.Size || r.size || "").trim(), r]),
  );
  return {
    mode: editorModeFromChart(sizeChart),
    sizeFormat: format,
    applicable: sizeChart?.applicable !== false && sizeChart?.status !== "not_applicable",
    status: sizeChart?.status || "seller_data_required",
    measurementType: sizeChart?.measurementType || "Garment Measurements",
    unit: sizeChart?.unit || "cm",
    columns,
    rows: labels.map((Size) => {
      const existing = bySize.get(Size) || {};
      const row = blankSizeRow(columns, Size);
      for (const col of columns) {
        if (/^size$/i.test(col)) continue;
        row[col] = existing[col] != null ? String(existing[col]) : "";
      }
      return row;
    }),
    note: sizeChart?.note || suggestedSizeChartNote(categoryHint),
  };
}
