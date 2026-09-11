import React, { useEffect, useMemo, useState } from "react";
import { HelpCircle, Info, Lightbulb, Plus, Ruler, Trash2, X } from "lucide-react";
import SizeChartGuide from "./SizeChartGuide";
import {
  SIZE_FORMATS,
  blankSizeRow,
  chartHasNumericMeasurements,
  commitEditorDraft,
  examplePlaceholder,
  labelsForSizeFormat,
  suggestedSizeChartColumns,
  workingSizeChart,
} from "./utils/sizeChart";

const NAVY = "#1A2B48";
const SELECTED_BG = "#F3F8FF";
const SELECTED_BORDER = "#BFDBFE";
const RADIO = "#2563EB";

const inputCls =
  "w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[12px] leading-snug text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

function RadioCard({ checked, onSelect, title, badge, children }) {
  return (
    <div
      className="w-full rounded-xl border px-3 py-2.5 transition-colors"
      style={{
        background: checked ? SELECTED_BG : "#FFFFFF",
        borderColor: checked ? SELECTED_BORDER : "#E5E7EB",
      }}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-2 text-left">
        <span
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
          style={{ borderColor: checked ? RADIO : "#CBD5E1" }}
        >
          {checked ? (
            <span className="h-2 w-2 rounded-full" style={{ background: RADIO }} />
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[13px] font-semibold" style={{ color: NAVY }}>
              {title}
            </p>
            {badge}
          </div>
        </div>
      </button>
      {children}
    </div>
  );
}

export default function SizeChartPanel({
  sizeChart,
  categoryHint = "",
  sizeLabels = [],
  sizeChartUrl,
  aiSuggested = false,
  onChange,
}) {
  const chart = sizeChart || { status: "not_applicable", applicable: false };
  const [draft, setDraft] = useState(() => workingSizeChart(chart, categoryHint, sizeLabels));
  const [savedSnap, setSavedSnap] = useState(() => workingSizeChart(chart, categoryHint, sizeLabels));
  const [helpOpen, setHelpOpen] = useState(false);
  const sizeKey = sizeLabels.join("\0");

  const rowsKey = JSON.stringify(chart.rows || []);
  useEffect(() => {
    const next = workingSizeChart(chart, categoryHint, sizeLabels);
    setDraft(next);
    setSavedSnap(next);
  }, [chart.status, chart.applicable, rowsKey, categoryHint, sizeKey]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedSnap),
    [draft, savedSnap],
  );

  const setMode = (mode) => {
    setDraft((prev) => {
      if (mode !== "applicable") return { ...prev, mode };
      const columns = prev.columns?.length ? prev.columns : suggestedSizeChartColumns(categoryHint);
      const labels = (prev.rows || []).some((r) => r.Size)
        ? prev.rows.map((r) => r.Size)
        : labelsForSizeFormat(prev.sizeFormat || "standard", sizeLabels);
      return {
        ...prev,
        mode,
        columns,
        rows: labels.map((Size, i) => ({
          ...blankSizeRow(columns, Size),
          ...(prev.rows?.[i] || {}),
          Size,
        })),
      };
    });
  };

  const applyFormat = (sizeFormat) => {
    setDraft((prev) => {
      const columns = prev.columns?.length ? prev.columns : suggestedSizeChartColumns(categoryHint);
      if (chartHasNumericMeasurements(prev)) {
        return { ...prev, sizeFormat };
      }
      const labels = labelsForSizeFormat(sizeFormat, sizeLabels);
      return {
        ...prev,
        sizeFormat,
        columns,
        rows: labels.map((Size) => blankSizeRow(columns, Size)),
      };
    });
  };

  const save = () => {
    const committed = commitEditorDraft(draft, categoryHint);
    setSavedSnap(draft);
    onChange?.(committed);
  };

  const cancel = () => {
    setDraft(savedSnap);
  };

  const unitSuffix = draft.unit === "inches" ? "in" : draft.unit === "cm" ? "cm" : "";

  return (
    <>
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700">
            <Ruler className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-[15px] font-bold" style={{ color: NAVY }}>
                Size Chart
              </h3>
              {aiSuggested ? (
                <span className="inline-flex rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  AI Suggested
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[12px] leading-snug text-slate-500">
              Help your customers choose the right size. Add size information as
              per manufacturer or your own measurements.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          How to add size chart?
        </button>
      </div>

      <RadioCard
        checked={draft.mode === "applicable"}
        onSelect={() => setMode("applicable")}
        title="Size chart applicable"
        badge={
          <span className="inline-flex rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            Recommended
          </span>
        }
      >
        <p className="mt-0.5 pl-6 text-[12px] text-slate-500">
          This product requires size selection. Please add the measurements below.
        </p>
        {draft.mode === "applicable" ? (
        <div className="mt-2 pl-6">
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="space-y-1 text-[11px] font-medium text-slate-600">
              <span>Measurement Type</span>
              <select
                className={inputCls}
                value={draft.measurementType || ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, measurementType: e.target.value }))
                }
              >
                <option value="Garment Measurements">Garment Measurements</option>
                <option value="Body Measurements">Body Measurements</option>
                <option value="">Not specified</option>
              </select>
            </label>
            <label className="space-y-1 text-[11px] font-medium text-slate-600">
              <span>Unit</span>
              <select
                className={inputCls}
                value={draft.unit || ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, unit: e.target.value }))}
              >
                <option value="cm">Centimetres (cm)</option>
                <option value="inches">Inches</option>
                <option value="">Not specified</option>
              </select>
            </label>
            <label className="space-y-1 text-[11px] font-medium text-slate-600">
              <span>Size Format</span>
              <select
                className={inputCls}
                value={draft.sizeFormat || "standard"}
                onChange={(e) => applyFormat(e.target.value)}
              >
                {SIZE_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-[12px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {(draft.columns || []).map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-2 py-1.5 text-left font-semibold"
                    >
                      {col}
                      {unitSuffix &&
                      col !== "Size" &&
                      col !== "Ring Size" &&
                      col !== "Recommended Age"
                        ? ` (${unitSuffix})`
                        : ""}
                    </th>
                  ))}
                  <th className="px-2 py-1.5 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {(draft.rows || []).map((row, idx) => (
                  <tr key={`${row.Size || "row"}-${idx}`} className="border-t border-slate-100">
                    {(draft.columns || []).map((col) => (
                      <td key={col} className="px-1.5 py-1">
                        <input
                          className={inputCls}
                          value={row[col] || ""}
                          placeholder={examplePlaceholder(row.Size, col)}
                          onChange={(e) => {
                            const rows = draft.rows.map((r, i) =>
                              i === idx ? { ...r, [col]: e.target.value } : r,
                            );
                            setDraft((prev) => ({ ...prev, rows }));
                          }}
                        />
                      </td>
                    ))}
                    <td className="px-1.5 py-1">
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-rose-600"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            rows: prev.rows.filter((_, i) => i !== idx),
                          }))
                        }
                        aria-label="Remove size"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                rows: [...(prev.rows || []), blankSizeRow(prev.columns)],
              }))
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add Size
          </button>

          <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50/70 p-2.5">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-800">
                <Lightbulb className="h-3.5 w-3.5" />
                Size Guide Note
              </p>
              <span className="text-[11px] text-slate-500">
                {String(draft.note || "").length}/200
              </span>
            </div>
            <textarea
              className={`${inputCls} min-h-[40px] resize-y`}
              maxLength={200}
              rows={2}
              value={draft.note || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Compare these measurements with a similar well-fitting garment before selecting your size."
            />
          </div>
        </div>
        ) : null}
      </RadioCard>

      <RadioCard
        checked={draft.mode === "data_unavailable"}
        onSelect={() => setMode("data_unavailable")}
        title="Size chart applicable, but data not available"
      >
        <p className="mt-0.5 pl-6 text-[12px] text-slate-500">
          This product requires size selection, but size information is not
          available at the moment.
        </p>
        {draft.mode === "data_unavailable" ? (
          <div className="mt-2 ml-6 flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-2 text-[12px] text-sky-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Please add manufacturer or seller provided measurements to help
              your customers choose the right size.
            </p>
          </div>
        ) : null}
      </RadioCard>

      <RadioCard
        checked={draft.mode === "not_applicable"}
        onSelect={() => setMode("not_applicable")}
        title="Size chart not applicable"
      >
        <p className="mt-0.5 pl-6 text-[12px] text-slate-500">
          This product does not require size selection (e.g. electronics, home
          decor, etc.).
        </p>
      </RadioCard>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={cancel}
          disabled={!dirty}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          className="rounded-md px-3 py-1.5 text-[12px] font-semibold text-white"
          style={{ background: NAVY }}
        >
          Save Size Chart
        </button>
      </div>
    </div>

      {helpOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-bold" style={{ color: NAVY }}>
                  How to add a size chart
                </p>
                <p className="mt-1 text-[13px] text-slate-500">
                  Use manufacturer or your own garment measurements. Do not guess
                  from photos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ol className="mb-4 list-decimal space-y-1.5 pl-4 text-[13px] text-slate-600">
              <li>AI selects whether a size chart applies after you generate the listing.</li>
              <li>If measurements are known, they appear in the table automatically.</li>
              <li>If not, keep the recommended option and type verified measurements only.</li>
              <li>Choose Body or Garment measurements — do not mix them.</li>
              <li>Save the size chart before publishing.</li>
            </ol>
            <SizeChartGuide sizeChartUrl={sizeChartUrl} categoryHint={categoryHint} />
          </div>
        </div>
      ) : null}
    </>
  );
}
