import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  Download,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { getCategories, getSubCategories, getInnerSubCategories } from "../../../../services/api.category";
import { addProduct, updateProduct } from "../../../../services/api.product";
import { generateListingAiDraft } from "../../../../services/api.smartListing";
import { notifyOnFail, notifyOnSuccess } from "../../../../utils/notification/toast";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { useAppContext } from "../../../../context/AppContext";
import { buildSmartListingFormData } from "../utils/buildFormData";
import LabeledPhotoBoxes from "../LabeledPhotoBoxes";
import {
  buildListingAiPayload,
  mergeAiDraft,
} from "../utils/aiDraft";
import {
  BULK_GRID_COLUMNS,
  BULK_PASTE_HEADER,
  clearBulkSession,
  downloadCsvTemplate,
  downloadFailedRows,
  loadBulkSession,
  newBulkRow,
  parseBulkPaste,
  polishBulkName,
  rowToSmartListingState,
  saveBulkSession,
  validateBulkRow,
} from "./bulkGridUtils";

const STEPS = [
  { id: "fill", label: "Fill sheet" },
  { id: "photos", label: "Add photos" },
  { id: "ai", label: "AI details" },
  { id: "review", label: "Review" },
  { id: "submit", label: "Save listings" },
];

export default function BulkCreateGrid({
  vendorId,
  mode = "vendor",
  onJobComplete,
  disabled = false,
}) {
  const { user } = useAppContext();
  const [step, setStep] = useState("fill");
  const [rows, setRows] = useState(() => [newBulkRow(), newBulkRow(), newBulkRow()]);
  const [pasteText, setPasteText] = useState("");
  const [taxonomy, setTaxonomy] = useState({
    categories: [],
    subCategories: [],
    innerSubCategories: [],
  });
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [submitMode, setSubmitMode] = useState("draft");
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, subRes, innerRes] = await Promise.all([
          getCategories(),
          getSubCategories(),
          getInnerSubCategories(),
        ]);
        if (cancelled) return;
        setTaxonomy({
          categories: (catRes?.data || []).map((c) => ({
            id: c.id,
            name: c.title,
          })),
          subCategories: (subRes?.data || []).map((c) => ({
            id: c.id,
            name: c.title,
            categoryId: c.cat_id,
          })),
          innerSubCategories: (innerRes?.data || []).map((c) => ({
            id: c.id,
            name: c.title,
            subCategoryId: c.sub_cat_id,
          })),
        });
      } catch {
        notifyOnFail("Could not load categories for bulk grid");
      } finally {
        if (!cancelled) setLoadingTaxonomy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const saved = loadBulkSession();
    if (saved?.rows?.length) {
      setRows(saved.rows);
      setStep(saved.step || "fill");
    }
  }, []);

  useEffect(() => {
    saveBulkSession(rows, step);
  }, [rows, step]);

  const patchRow = useCallback((rowId, patch) => {
    setRows((prev) =>
      prev.map((r) => (r.row_id === rowId ? { ...r, ...patch, errors: {} } : r)),
    );
  }, []);

  const addRows = (count = 1) => {
    setRows((prev) => [...prev, ...Array.from({ length: count }, () => newBulkRow())]);
  };

  const removeRow = (rowId) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.row_id !== rowId)));
  };

  const applyPaste = () => {
    const parsed = parseBulkPaste(pasteText);
    if (!parsed.length) {
      notifyOnFail("Paste Excel/Sheets rows — tab or comma separated with a header row");
      return;
    }
    setRows(parsed);
    setPasteText("");
    notifyOnSuccess(`Loaded ${parsed.length} rows from paste`);
    setStep("fill");
  };

  const validatedRows = useMemo(() => {
    return rows.map((row) => ({
      row,
      errors: validateBulkRow(row, taxonomy),
    }));
  }, [rows, taxonomy]);

  const validCount = validatedRows.filter((v) => !Object.keys(v.errors).length).length;

  const goPhotos = () => {
    if (!validCount) {
      notifyOnFail("Fix validation errors before adding photos");
      return;
    }
    setStep("photos");
  };

  const runBulkAi = async () => {
    setAiBusy(true);
    let done = 0;
    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const errors = validateBulkRow(row, taxonomy);
        if (Object.keys(errors).length || !row.files?.length) continue;
        setProgress(`AI ${i + 1}/${rows.length}`);
        const base = rowToSmartListingState(row, taxonomy, vendorId);
        let draft = null;
        try {
          const res = await generateListingAiDraft(buildListingAiPayload(base, user || {}));
          if (res?.status === 1 && res?.data?.draft) draft = res.data.draft;
        } catch {
          /* mergeAiDraft uses localAiDraft when draft is null */
        }
        const merged = mergeAiDraft(base, { draft, vendorContext: user || {} });
        patchRow(row.row_id, {
          name: merged.name || polishBulkName(row),
          shortDescription: merged.shortDescription || "",
          keyFeatures: merged.keyFeatures || [],
          productDetails: merged.productDetails || "",
          specifications: merged.specifications || [],
          whatsInTheBox: merged.whatsInTheBox || [],
          benefits: merged.benefits || [],
          sku: merged.sku || row.sku,
          ai_done: true,
        });
        done += 1;
      }
      notifyOnSuccess(
        done
          ? `AI filled ${done} listing(s) — review before save`
          : "No rows ready for AI — check photos and validation",
      );
      setStep("review");
    } finally {
      setAiBusy(false);
      setProgress("");
    }
  };

  const runSubmit = async () => {
    if (!vendorId) {
      notifyOnFail(mode === "admin" ? "Select a vendor first" : "Vendor account required");
      return;
    }
    const requestPublish = submitMode === "publish";
    const failed = [];
    let success = 0;
    setBusy(true);
    try {
      for (let i = 0; i < validatedRows.length; i++) {
        const { row, errors } = validatedRows[i];
        setProgress(`Saving ${i + 1}/${validatedRows.length}`);
        if (Object.keys(errors).length) {
          failed.push({ ...row, error: Object.values(errors).join("; ") });
          continue;
        }
        if (!row.files?.length) {
          failed.push({ ...row, error: "Add at least a front photo" });
          continue;
        }
        try {
          const state = rowToSmartListingState(row, taxonomy, vendorId);
          if (mode === "admin" && requestPublish) {
            state.visibility = "Public";
            state.listing_status = "published";
          }
          const { formData } = buildSmartListingFormData(state, {
            asDraft: !requestPublish,
            ...(mode === "vendor" ? { requestPublish } : {}),
          });
          const res = row.product_id
            ? await updateProduct(row.product_id, formData)
            : await addProduct(formData);
          if (res?.status === 1) {
            success += 1;
            patchRow(row.row_id, {
              product_id: res?.data?.id || row.product_id,
              status: "saved",
            });
          } else {
            failed.push({ ...row, error: res?.message || "Save failed" });
          }
        } catch (e) {
          failed.push({
            ...row,
            error: getApiErrorMessage(e, "Save error"),
          });
        }
      }
      onJobComplete?.({
        type: requestPublish ? "bulk_create_publish" : "bulk_create_draft",
        success,
        failed: failed.length,
        errors: failed,
        vendor_id: vendorId,
      });
      if (success) {
        notifyOnSuccess(
          requestPublish
            ? mode === "admin"
              ? `${success} published${failed.length ? `, ${failed.length} failed` : ""}`
              : `${success} sent for admin review${failed.length ? `, ${failed.length} failed` : ""}`
            : `${success} saved as draft${failed.length ? `, ${failed.length} failed` : ""}`,
        );
      }
      if (failed.length) downloadFailedRows(failed);
      if (success && !failed.length) {
        clearBulkSession();
        setRows([newBulkRow(), newBulkRow(), newBulkRow()]);
        setStep("fill");
      }
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  if (loadingTaxonomy) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading categories…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BulkStepper step={step} />

      {step === "fill" ? (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-900 space-y-2">
            <p className="font-semibold">Bulk create — like Excel, inside the app</p>
            <ol className="list-decimal pl-5 text-xs sm:text-sm space-y-1">
              <li>Paste from Excel/Google Sheets or edit rows below.</li>
              <li>Use <strong>Audience</strong> (Men/Women/Kids) + <strong>Color</strong> — name auto-formats like marketplace titles.</li>
              <li>Category columns must match your taxonomy titles exactly.</li>
              <li>Next step: add front photo per row (labeled slots, no filename tricks).</li>
            </ol>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium"
            >
              <Download className="w-4 h-4" /> Download template
            </button>
            <button
              type="button"
              onClick={() => addRows(5)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add 5 rows
            </button>
          </div>

          <div className="bg-white border rounded-2xl p-4 space-y-2">
            <label className="text-sm font-medium text-gray-800 flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4" /> Paste from Excel / Sheets
            </label>
            <p className="text-xs text-gray-500 font-mono break-all">{BULK_PASTE_HEADER}</p>
            <textarea
              className="w-full h-28 border rounded-xl p-3 font-mono text-xs"
              placeholder="Paste rows here (include header row)…"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <button
              type="button"
              onClick={applyPaste}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold"
            >
              Load pasted rows
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-sm">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-slate-50 text-gray-600">
                <tr>
                  <th className="px-2 py-2 text-left w-8">#</th>
                  {BULK_GRID_COLUMNS.map((c) => (
                    <th key={c.key} className="px-2 py-2 text-left whitespace-nowrap">
                      {c.label}
                      {c.required ? " *" : ""}
                    </th>
                  ))}
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {validatedRows.map(({ row, errors }, idx) => (
                  <tr key={row.row_id} className="border-t align-top">
                    <td className="px-2 py-2 text-gray-400">{idx + 1}</td>
                    {BULK_GRID_COLUMNS.map((col) => (
                      <td key={col.key} className="px-1 py-1">
                        <input
                          className={`w-full min-w-[88px] px-2 py-1.5 border rounded-lg text-xs ${
                            errors[col.key] ? "border-red-400 bg-red-50" : "border-gray-200"
                          }`}
                          value={row[col.key] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = { ...row, [col.key]: val };
                            const patch = { [col.key]: val };
                            if (
                              col.key === "name" ||
                              col.key === "audience" ||
                              col.key === "color"
                            ) {
                              patch.name =
                                col.key === "name"
                                  ? val
                                  : polishBulkName({
                                      ...next,
                                      name: next.name || next.sub_category,
                                    });
                            }
                            patchRow(row.row_id, patch);
                          }}
                          placeholder={col.hint || ""}
                        />
                        {errors[col.key] ? (
                          <p className="text-[10px] text-red-600 mt-0.5">{errors[col.key]}</p>
                        ) : null}
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeRow(row.row_id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              {validCount}/{rows.length} rows ready · session auto-saved locally
            </p>
            <button
              type="button"
              disabled={disabled || !validCount}
              onClick={goPhotos}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              Next: Add photos
            </button>
          </div>
        </>
      ) : null}

      {step === "photos" ? (
        <>
          <p className="text-sm text-gray-600">
            Upload photos into labeled slots per product. Use <strong>front</strong> first — order is
            front → back → side for the listing gallery.
          </p>
          <div className="space-y-3">
            {validatedRows.map(({ row, errors }, idx) => (
              <div
                key={row.row_id}
                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-left"
                  onClick={() =>
                    setExpandedRow(expandedRow === row.row_id ? null : row.row_id)
                  }
                >
                  <div>
                    <p className="font-medium text-sm">{polishBulkName(row) || `Row ${idx + 1}`}</p>
                    <p className="text-xs text-gray-500">
                      SKU: {row.sku || "auto"} · {row.category} › {row.sub_category}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {(row.files || []).length} photo(s)
                    {Object.keys(errors).length ? (
                      <span className="text-red-600 ml-2">Fix errors</span>
                    ) : null}
                  </span>
                </button>
                {expandedRow === row.row_id || validatedRows.length <= 5 ? (
                  <div className="mt-3">
                    <LabeledPhotoBoxes
                      state={{
                        ...row,
                        name: polishBulkName(row),
                      }}
                      patch={(partial) => patchRow(row.row_id, partial)}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 justify-between">
            <button
              type="button"
              onClick={() => setStep("fill")}
              className="px-4 py-2 rounded-xl border text-sm font-medium"
            >
              Back to sheet
            </button>
            <button
              type="button"
              onClick={() => setStep("ai")}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
            >
              Next: AI details
            </button>
          </div>
        </>
      ) : null}

      {step === "ai" ? (
        <>
          <p className="text-sm text-gray-600">
            Same AI as Smart Listing — descriptions, specs, features for each row with photos.
          </p>
          {progress ? (
            <p className="text-sm text-blue-700 bg-blue-50 rounded-xl px-3 py-2">{progress}</p>
          ) : null}
          <button
            type="button"
            disabled={aiBusy || disabled}
            onClick={runBulkAi}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate AI for all rows
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("photos")} className="px-4 py-2 rounded-xl border text-sm">
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep("review")}
              className="px-4 py-2 rounded-xl border text-sm text-gray-600"
            >
              Skip to review
            </button>
          </div>
        </>
      ) : null}

      {step === "review" ? (
        <>
          <p className="text-sm text-gray-600">Quick review — edit title or description before save.</p>
          <div className="space-y-4">
            {validatedRows.map(({ row }, idx) => (
              <div key={row.row_id} className="border rounded-2xl p-4 bg-white space-y-2">
                <p className="text-sm font-medium">
                  {idx + 1}. {polishBulkName(row)}
                  {row.ai_done ? (
                    <span className="ml-2 text-xs text-indigo-600">AI</span>
                  ) : null}
                </p>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={row.name || ""}
                  onChange={(e) => patchRow(row.row_id, { name: e.target.value })}
                  placeholder="Product name"
                />
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-xs h-20"
                  value={row.shortDescription || ""}
                  onChange={(e) => patchRow(row.row_id, { shortDescription: e.target.value })}
                  placeholder="Short description"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-between">
            <button type="button" onClick={() => setStep("ai")} className="px-4 py-2 rounded-xl border text-sm">
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep("submit")}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
            >
              Next: Save listings
            </button>
          </div>
        </>
      ) : null}

      {step === "submit" ? (
        <>
          <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-sm">
            <p className="text-sm text-gray-700">
              {validCount} listings ready · each row saves independently (partial success OK).
            </p>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="submitMode"
                  checked={submitMode === "draft"}
                  onChange={() => setSubmitMode("draft")}
                />
                Save all as <strong>Draft</strong> (continue later in Smart Listing)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="submitMode"
                  checked={submitMode === "publish"}
                  onChange={() => setSubmitMode("publish")}
                />
                {mode === "admin" ? (
                  <>
                    <strong>Publish</strong> (live on site)
                  </>
                ) : (
                  <>
                    <strong>Request publish</strong> (Admin review)
                  </>
                )}
              </label>
            </div>
            {progress ? (
              <p className="text-sm text-blue-700 bg-blue-50 rounded-xl px-3 py-2">{progress}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStep("review")}
                className="px-4 py-2 rounded-xl border text-sm font-medium"
              >
                Back
              </button>
              <button
                type="button"
                disabled={busy || disabled}
                onClick={runSubmit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {submitMode === "publish"
                  ? mode === "admin"
                    ? "Publish all"
                    : "Request publish all"
                  : "Save all as draft"}
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            Variations & combo bulk: use <strong>Advanced Excel</strong> tab for now. Single listings
            use this grid.
          </div>
        </>
      ) : null}
    </div>
  );
}

function BulkStepper({ step }) {
  const activeIdx = STEPS.findIndex((s) => s.id === step);
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1">
      {STEPS.map((s, idx) => {
        const done = idx < activeIdx;
        const active = idx === activeIdx;
        return (
          <li key={s.id} className="flex items-center">
            {idx > 0 ? (
              <span className={`w-6 h-px ${done ? "bg-blue-400" : "bg-gray-200"}`} />
            ) : null}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs whitespace-nowrap ${
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : done
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-white text-gray-400 border-gray-200"
              }`}
            >
              {done ? "✓" : idx + 1} {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
