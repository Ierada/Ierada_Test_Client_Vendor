import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CircleX,
  Columns3,
  Download,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Info,
  LayoutGrid,
  Lightbulb,
  Link2Off,
  MoreHorizontal,
  Play,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  AI_FIELD_KEYS,
  IGNORE_FIELD,
  MAP_FIELDS,
  decorateMapping,
  deriveMapStatus,
  fieldLabel,
  imagesForSku,
  isMappingImageColumn,
  isUnusedCustomAttrHeader,
  mappingConfidence,
  mappingInsights,
  wizardImageSrc,
} from "./wizardEngine";

const FIELD_OPTIONS = [
  { value: "", label: "— Select Field —" },
  { value: IGNORE_FIELD, label: "Ignore Column" },
  ...MAP_FIELDS.map((f) => ({ value: f.key, label: `${f.label}${f.required ? " *" : ""}` })),
  ...AI_FIELD_KEYS.map((k) => ({ value: k, label: fieldLabel(k) })),
];

function optionLabel(value) {
  return FIELD_OPTIONS.find((opt) => opt.value === value)?.label || "— Select Field —";
}

function FieldSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 200),
      });
    };
    place();
    const onDoc = (e) => {
      if (btnRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Map spreadsheet column to product field"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-w-[168px] items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-left"
      >
        <span
          className="truncate text-[13px] font-medium leading-5 text-[#1A2B48]"
          style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        >
          {optionLabel(value)}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
      </button>
      {open && pos
        ? createPortal(
            <div
              ref={menuRef}
              className="max-h-56 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                width: pos.width,
                zIndex: 80,
                fontFamily: "Arial, Helvetica, sans-serif",
              }}
            >
              {FIELD_OPTIONS.map((opt) => (
                <button
                  key={opt.value || "empty"}
                  type="button"
                  className={`block w-full px-3 py-1.5 text-left text-[13px] leading-5 ${
                    opt.value === value ? "bg-[#FFF5F0] font-semibold text-[#F56C43]" : "text-[#1A2B48] hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function ConfidencePill({ value }) {
  if (!value) return <span className="text-gray-300">—</span>;
  const cls =
    value === "High"
      ? "bg-emerald-50 text-emerald-600"
      : value === "Medium"
        ? "bg-orange-50 text-[#F56C43]"
        : "bg-rose-50 text-rose-500";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {value}
    </span>
  );
}

function StatusCell({ status }) {
  if (status === "Mapped") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-2.5 w-2.5" />
        </span>
        Mapped
      </span>
    );
  }
  if (status === "Needs Review") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#F56C43]">
        <span className="h-3.5 w-3.5 rounded-full border-[1.5px] border-[#F56C43]" />
        Needs Review
      </span>
    );
  }
  if (status === "Ignored") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400">
        <span className="h-3.5 w-3.5 rounded-full border-[1.5px] border-gray-300" />
        Ignored
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-500">
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-rose-400 text-[9px]">
        ×
      </span>
      Unmapped
    </span>
  );
}

function SampleThumbs({ images, size = "h-6 w-6" }) {
  if (!images?.length) return <span className="text-gray-300">N/A</span>;
  const shown = images.slice(0, 2);
  const extra = images.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((img, i) => (
        <img
          key={`${img.filename || img.url || i}`}
          src={wizardImageSrc(img)}
          alt=""
          className={`${size} rounded-full bg-gray-100 object-cover ring-2 ring-white ${i ? "-ml-2" : ""}`}
        />
      ))}
      {extra > 0 ? (
        <span className="ml-1 text-[10px] font-semibold text-[#F56C43]">+{extra}</span>
      ) : null}
    </div>
  );
}

function SampleDataCell({ map, sample, images }) {
  const value = String(sample?.raw?.[map.excel] ?? sample?.[map.ierada] ?? "").trim();
  if (isMappingImageColumn(map)) return <SampleThumbs images={images} />;
  if (!value || value.toLowerCase() === "n/a") return <span className="text-gray-300">N/A</span>;
  return <span className="line-clamp-2 max-w-[140px] text-[11px] leading-snug text-[#1A2B48]">{value}</span>;
}

function InsightIcon({ kind }) {
  if (kind === "ok") {
    return (
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-2.5 w-2.5" />
      </span>
    );
  }
  if (kind === "warn") {
    return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />;
  }
  if (kind === "bad") {
    return (
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
        <CircleX className="h-3 w-3" />
      </span>
    );
  }
  return <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />;
}

function StructureStat({ icon: Icon, value, label, tone }) {
  const tones = {
    blue: "text-sky-500",
    green: "text-emerald-500",
    orange: "text-[#F56C43]",
    gray: "text-gray-400",
    red: "text-rose-500",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
      <Icon className={`h-3.5 w-3.5 ${tones[tone]}`} />
      <strong className="text-[13px] font-semibold text-[#1A2B48]">{value}</strong>
      {label}
    </span>
  );
}

export default function MapFieldsStep({
  headers,
  mapping,
  rawRows,
  imagesBySku,
  missingMandatory,
  onChangeMapping,
  onAutoMap,
  onGuide,
  onDownloadMapped,
  onProceed,
  busy,
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [menu, setMenu] = useState(null);

  const rows = useMemo(() => {
    const decorated = decorateMapping(headers, mapping);
    return decorated.filter((row) => !isUnusedCustomAttrHeader(row.excel, rawRows));
  }, [headers, mapping, rawRows]);
  const sample = rawRows[0] || null;
  const imageSkuMap = rows.find((row) => row.ierada === "image_sku");
  const skuMap = rows.find((row) => row.ierada === "sku");
  const sampleSku = imageSkuMap
    ? sample?.raw?.[imageSkuMap.excel] || sample?.image_sku || sample?.sku
    : skuMap
      ? sample?.raw?.[skuMap.excel] || sample?.sku
      : sample?.image_sku || sample?.sku;
  const sampleImages = imagesForSku(imagesBySku, sampleSku);
  const insights = useMemo(() => mappingInsights(rows, sample), [rows, sample]);

  const chips = [
    { id: "all", label: "All", count: insights.total },
    { id: "mapped", label: "Mapped", count: insights.mapped },
    { id: "unmapped", label: "Unmapped", count: insights.footerUnmapped },
    { id: "mandatory", label: "Mandatory", count: insights.mandatory },
    { id: "ai", label: "AI Optional", count: insights.aiOptional },
  ];

  const visible = rows.filter((row, i) => {
    if (filter === "mapped" && row.status !== "Mapped") return false;
    if (filter === "unmapped" && row.status !== "Unmapped" && row.status !== "Needs Review") return false;
    if (filter === "mandatory" && !row.required) return false;
    if (filter === "ai" && !row.aiOptional) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = `${row.letter} ${row.excel} ${fieldLabel(row.ierada)}`.toLowerCase();
    return hay.includes(q) || String(i + 1).includes(q);
  });

  const updateRow = (index, patch) => {
    const next = mapping.slice();
    const current = next[index] || { excel: headers[index] };
    const ierada = patch.ierada !== undefined ? patch.ierada : current.ierada;
    if (ierada && ierada !== IGNORE_FIELD) {
      next.forEach((row, j) => {
        if (j !== index && row.ierada === ierada) {
          next[j] = { ...row, ierada: "", confidence: "", status: "Unmapped" };
        }
      });
    }
    const merged = {
      ...current,
      ...patch,
      excel: current.excel || headers[index],
      ierada,
    };
    if (patch.ierada !== undefined && patch.confidence === undefined) {
      merged.confidence = mappingConfidence(merged.excel, patch.ierada);
    }
    next[index] = { ...merged, status: deriveMapStatus(merged) };
    onChangeMapping(next);
    setMenu(null);
  };

  return (
    <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_248px]">
      <div className="space-y-3">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-3">
            <div>
              <h2 className="text-[13px] font-semibold text-[#1A2B48]">
                Map Your File Columns with IERADA Fields
              </h2>
              <p className="mt-0.5 text-[10px] text-gray-400">
                Match each column from your Excel file with the corresponding IERADA product field.
              </p>
            </div>
            <button
              type="button"
              onClick={onAutoMap}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3B6FF5] hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Auto Map Columns
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5">
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1.5 h-3.5 w-3.5 text-gray-400" />
              <input
                className="h-7 w-full rounded-md border border-gray-200 bg-white pl-8 pr-2 text-[11px] focus:border-[#F56C43] focus:outline-none"
                placeholder="Search columns (e.g., name, price, sku…)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                  filter === chip.id
                    ? "border-[#F56C43] bg-white text-[#1A2B48]"
                    : "border-gray-200 bg-white text-gray-500"
                }`}
              >
                {chip.label}
                <span>{chip.count}</span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead className="border-y border-gray-100 bg-white text-[10px] text-gray-400">
                <tr>
                  <th className="px-2 py-1.5 font-medium">#</th>
                  <th className="px-2 py-1.5 font-medium">
                    Excel Column
                    <p className="font-normal text-gray-300">From your file</p>
                  </th>
                  <th className="px-2 py-1.5 font-medium">
                    IERADA Field
                    <p className="font-normal text-gray-300">Map to this field</p>
                  </th>
                  <th className="px-2 py-1.5 font-medium">
                    <span className="inline-flex items-center gap-0.5">
                      Confidence
                      <CircleHelp className="h-3 w-3 text-gray-300" />
                    </span>
                  </th>
                  <th className="px-2 py-1.5 font-medium">Sample Data (Row 2)</th>
                  <th className="px-2 py-1.5 font-medium">Rule / Validation</th>
                  <th className="px-2 py-1.5 font-medium">Status</th>
                  <th className="px-2 py-1.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((map) => {
                  const index = rows.findIndex((row) => row.excel === map.excel && row.letter === map.letter);
                  const loose = map.status === "Unmapped" || map.status === "Ignored";
                  return (
                    <tr key={`${map.letter}-${map.excel}`} className="border-t border-gray-100">
                      <td className="px-2 py-1.5 text-gray-400">{index + 1}</td>
                      <td className="px-2 py-1.5">
                        <p className="font-medium text-[#1A2B48]">
                          {map.letter} - {map.excel}
                        </p>
                        {map.required ? (
                          <p className="text-[9px] font-semibold text-[#F56C43]">Mandatory</p>
                        ) : null}
                      </td>
                      <td className="min-w-[176px] px-2 py-1.5">
                        <FieldSelect
                          value={map.ierada}
                          onChange={(ierada) => updateRow(index, { ierada })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <ConfidencePill value={map.confidence} />
                      </td>
                      <td className="px-2 py-1.5">
                        <SampleDataCell map={map} sample={sample} images={sampleImages} />
                      </td>
                      <td className="max-w-[140px] px-2 py-1.5 leading-snug text-gray-400">{map.rule}</td>
                      <td className="px-2 py-1.5">
                        <StatusCell status={map.status} />
                      </td>
                      <td className="relative px-2 py-1.5">
                        {loose ? (
                          <button
                            type="button"
                            className="p-0.5 text-gray-300 hover:text-gray-500"
                            onClick={() => updateRow(index, { ierada: IGNORE_FIELD, confidence: "" })}
                            aria-label="Ignore column"
                          >
                            <Link2Off className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-[#1A2B48]"
                              onClick={() => setMenu(menu === index ? null : index)}
                              aria-label="Column actions"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                            {menu === index ? (
                              <div className="absolute right-2 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                <button
                                  type="button"
                                  className="block w-full px-3 py-1.5 text-left text-[11px] hover:bg-gray-50"
                                  onClick={() => updateRow(index, { ierada: IGNORE_FIELD, confidence: "" })}
                                >
                                  Ignore column
                                </button>
                                <button
                                  type="button"
                                  className="block w-full px-3 py-1.5 text-left text-[11px] hover:bg-gray-50"
                                  onClick={() => updateRow(index, { ierada: "", confidence: "" })}
                                >
                                  Clear mapping
                                </button>
                              </div>
                            ) : null}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1A2B48]">
                <LayoutGrid className="h-4 w-4 text-sky-500" />
                Detected File Structure
              </p>
              <p className="pl-[22px] text-[10px] text-gray-400">Overview of your uploaded file.</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <StructureStat icon={Columns3} value={insights.total} label="Total Columns" tone="blue" />
              <StructureStat icon={Check} value={insights.mapped} label="Mapped" tone="green" />
              <StructureStat icon={Wrench} value={insights.unmapped} label="Manual Mapping Needed" tone="orange" />
              <StructureStat icon={EyeOff} value={insights.ignored} label="Ignored Columns" tone="gray" />
              <StructureStat icon={AlertTriangle} value={insights.warnings} label="Warnings" tone="red" />
            </div>
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1A2B48]">
              <Eye className="h-4 w-4 text-[#3B6FF5]" />
              Sample Row Preview
            </p>
            <p className="pl-[22px] text-[10px] text-gray-400">
              See how your data will be interpreted after mapping (Row 2 from your file).
            </p>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr>
                    {rows.map((map) => (
                      <th
                        key={`h-${map.letter}`}
                        className="whitespace-nowrap px-2.5 py-1.5 text-[10px] font-medium text-gray-400"
                      >
                        {map.ierada && map.ierada !== IGNORE_FIELD ? fieldLabel(map.ierada) : map.excel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {rows.map((map) => (
                      <td key={`s-${map.letter}`} className="whitespace-nowrap px-2.5 py-1 text-[11px] text-[#1A2B48]">
                        {isMappingImageColumn(map) ? (
                          <SampleThumbs images={sampleImages} />
                        ) : (
                          String(sample?.raw?.[map.excel] || sample?.[map.ierada] || "N/A")
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1A2B48]">
            <Lightbulb className="h-4 w-4 fill-amber-300 text-amber-500" />
            Smart Mapping Insights
          </p>
          <ul className="mt-2.5 space-y-2 text-[11px] leading-snug text-gray-600">
            <li className="flex gap-2">
              <InsightIcon kind="ok" />
              {insights.mapped} columns auto-mapped successfully
            </li>
            <li className="flex gap-2">
              <InsightIcon kind="warn" />
              {insights.review} columns need your review
            </li>
            <li className="flex gap-2">
              {missingMandatory.length ? (
                <>
                  <InsightIcon kind="bad" />
                  {missingMandatory.length} mandatory field{missingMandatory.length > 1 ? "s" : ""} missing
                </>
              ) : (
                <>
                  <InsightIcon kind="ok" />
                  All mandatory fields mapped
                </>
              )}
            </li>
            {insights.priceOk ? (
              <li className="flex gap-2">
                <InsightIcon kind="ok" />
                Price format verified
              </li>
            ) : null}
            {insights.extraIgnorable ? (
              <li className="flex gap-2">
                <InsightIcon kind="info" />
                We found {insights.extraIgnorable} extra column{insights.extraIgnorable > 1 ? "s" : ""} that can be ignored.
              </li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-xl border border-[#FDE4D8] bg-[#FFF8F4] p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#F56C43]">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#F56C43] text-white">
              <AlertTriangle className="h-2.5 w-2.5" />
            </span>
            Mandatory Fields
          </p>
          <p className="mt-1 text-[10px] text-gray-500">These fields are required to proceed:</p>
          <div className="mt-2 space-y-1.5">
            {missingMandatory.length ? (
              missingMandatory.map((f) => (
                <div
                  key={f.key}
                  className="rounded-md border border-[#FDE4D8] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#F56C43]"
                >
                  {f.label}
                </div>
              ))
            ) : (
              <div className="rounded-md border border-emerald-100 bg-white px-2.5 py-1.5 text-[11px] font-medium text-emerald-600">
                All mandatory columns are mapped.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3 text-[11px] leading-snug text-gray-600">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1A2B48]">
            <FileText className="h-4 w-4 text-gray-400" />
            Field Rules
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4">
            <li>Price must be a numeric value (e.g., 99 or 99.00).</li>
            <li>SKU must be unique for each product.</li>
            <li>Images must be in JPG, PNG or WebP format (max 10 images).</li>
            <li>AI fields (e.g., AI Mode) are optional and can be used for auto generation.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1A2B48]">
            <HelpCircle className="h-4 w-4 text-[#F56C43]" />
            Need Help?
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            Watch our step-by-step guide to map fields correctly.
          </p>
          <button
            type="button"
            onClick={onGuide}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[#F56C43] px-3 py-1.5 text-[11px] font-semibold text-[#F56C43]"
          >
            <Play className="h-3 w-3 fill-current" />
            Watch Guide
          </button>
          <button
            type="button"
            onClick={onDownloadMapped}
            className="mt-1.5 inline-flex w-full items-center justify-center gap-1.5 px-3 py-1 text-[11px] font-medium text-gray-500 hover:text-[#1A2B48]"
          >
            <Download className="h-3.5 w-3.5" />
            Download Sample Mapped File
          </button>
        </div>

        {onProceed ? (
          <button
            type="button"
            onClick={onProceed}
            disabled={Boolean(busy)}
            className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-[#F56C43] px-3 py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            Proceed to Validate Data <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
      </aside>
    </div>
  );
}

export function MapFieldsFooterStats({ mapping, headers, rawRows = [] }) {
  const rows = decorateMapping(headers, mapping).filter(
    (row) => !isUnusedCustomAttrHeader(row.excel, rawRows),
  );
  const insights = mappingInsights(rows);
  return (
    <div className="hidden flex-1 items-center justify-center gap-5 text-[11px] text-gray-500 sm:flex">
      <span className="inline-flex items-center gap-1.5">
        <Columns3 className="h-3.5 w-3.5 text-sky-500" />
        <strong className="text-[13px] text-[#1A2B48]">{insights.total}</strong> Total Columns
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        <strong className="text-[13px] text-[#1A2B48]">{insights.mapped}</strong> Mapped
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-rose-300 text-[9px] font-bold text-rose-500">!</span>
        <strong className="text-[13px] text-[#1A2B48]">{insights.footerUnmapped}</strong> Unmapped
      </span>
      <span className="inline-flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        <strong className="text-[13px] text-[#1A2B48]">{insights.footerWarnings}</strong> Warnings
      </span>
    </div>
  );
}
