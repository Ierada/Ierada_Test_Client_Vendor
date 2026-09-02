import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { getCategories, getSubCategories, getInnerSubCategories } from "../../../../services/api.category";
import { addProduct, updateProduct } from "../../../../services/api.product";
import { generateListingAiDraft } from "../../../../services/api.smartListing";
import { notifyOnFail, notifyOnSuccess } from "../../../../utils/notification/toast";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { useAppContext } from "../../../../context/AppContext";
import { buildSmartListingFormData } from "../utils/buildFormData";
import LabeledPhotoBoxes from "../LabeledPhotoBoxes";
import { buildListingAiPayload, mergeAiDraft } from "../utils/aiDraft";
import {
  BULK_GRID_COLUMNS,
  BULK_MAX_ROWS,
  BULK_EXCEL_MAX_BYTES,
  BULK_PASTE_HEADER,
  applyAiMergeToRow,
  clearBulkSession,
  columnGroupClass,
  downloadCsvTemplate,
  downloadExcelTemplate,
  downloadFailedRows,
  loadBulkSession,
  newBulkRow,
  parseBulkExcelFile,
  parseBulkPaste,
  polishBulkName,
  rowToSmartListingState,
  saveBulkSession,
  validateBulkRow,
} from "./bulkGridUtils";

const STEPS = [
  { id: "fill", label: "Upload sheet", hint: "Template or paste rows" },
  { id: "photos", label: "Add photos", hint: "Front photo per product" },
  { id: "ai", label: "AI content", hint: "Ecommerce copy & SEO" },
  { id: "review", label: "Review", hint: "Edit before save" },
  { id: "submit", label: "Save", hint: "Draft or publish" },
];

export default function BulkCreateGrid({
  vendorId,
  mode = "vendor",
  onJobComplete,
  disabled = false,
}) {
  const { user } = useAppContext();
  const fileRef = useRef(null);
  const [step, setStep] = useState("fill");
  const [rows, setRows] = useState([]);
  const [pasteText, setPasteText] = useState("");
  const [globalAi, setGlobalAi] = useState(true);
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
  const [uploadBusy, setUploadBusy] = useState(false);
  const [showRowEditor, setShowRowEditor] = useState(false);

  const hasLoadedSheet = rows.length > 0;

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
          categories: (catRes?.data || []).map((c) => ({ id: c.id, name: c.title })),
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

  const loadRows = (parsed) => {
    if (!parsed.length) {
      notifyOnFail("No product rows found — check template headers");
      return;
    }
    if (parsed.length > BULK_MAX_ROWS) {
      notifyOnFail(`Loaded first ${BULK_MAX_ROWS} rows (max per session)`);
      setRows(parsed.slice(0, BULK_MAX_ROWS));
    } else {
      setRows(parsed);
    }
    setPasteText("");
    setShowRowEditor(false);
    notifyOnSuccess(`Loaded ${Math.min(parsed.length, BULK_MAX_ROWS)} product row(s)`);
    setStep("fill");
  };

  const applyPaste = () => loadRows(parseBulkPaste(pasteText));

  const onFilePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "tsv", "csv", "txt"].includes(ext || "")) {
      notifyOnFail("Use .xlsx, .xls, .tsv or paste tab/comma rows");
      return;
    }
    if (file.size > BULK_EXCEL_MAX_BYTES) {
      notifyOnFail("Excel file too large — max 10 MB. Split into smaller sheets or paste rows.");
      return;
    }
    setUploadBusy(true);
    try {
      if (ext === "xlsx" || ext === "xls") {
        loadRows(await parseBulkExcelFile(file));
      } else {
        const text = await file.text();
        loadRows(parseBulkPaste(text));
      }
    } catch {
      notifyOnFail("Could not read file — use the downloaded template");
    } finally {
      setUploadBusy(false);
    }
  };

  const addRows = (count = 1) => {
    setRows((prev) => [...prev, ...Array.from({ length: count }, () => newBulkRow())]);
  };

  const removeRow = (rowId) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.row_id !== rowId)));
  };

  const validatedRows = useMemo(
    () => rows.map((row) => ({ row, errors: validateBulkRow(row, taxonomy) })),
    [rows, taxonomy],
  );

  const validCount = validatedRows.filter((v) => !Object.keys(v.errors).length).length;
  const invalidCount = rows.length - validCount;
  const aiReadyCount = validatedRows.filter(
    ({ row, errors }) => !Object.keys(errors).length && row.files?.length && row.ai_enabled !== false,
  ).length;

  const goPhotos = () => {
    if (!validCount) {
      notifyOnFail("Fix validation errors before continuing");
      return;
    }
    setStep("photos");
  };

  const runBulkAi = async () => {
    if (!globalAi) {
      setStep("review");
      return;
    }
    setAiBusy(true);
    let done = 0;
    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.ai_enabled === false) continue;
        const errors = validateBulkRow(row, taxonomy);
        if (Object.keys(errors).length || !row.files?.length) continue;
        setProgress(`AI generating ${i + 1}/${rows.length}…`);
        const base = rowToSmartListingState(row, taxonomy, vendorId);
        let draft = null;
        try {
          const res = await generateListingAiDraft(
            await buildListingAiPayload(base, user || {}),
          );
          if (res?.status === 1 && res?.data?.draft) draft = res.data.draft;
        } catch {
          /* mergeAiDraft falls back to local template */
        }
        const merged = mergeAiDraft(base, { draft, vendorContext: user || {} });
        patchRow(row.row_id, applyAiMergeToRow(row, merged));
        done += 1;
      }
      notifyOnSuccess(
        done
          ? `AI filled ${done} listing(s) with full ecommerce details`
          : "No rows ready — add photos, fix errors, or enable AI on rows",
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
        setProgress(`Saving ${i + 1}/${validatedRows.length}…`);
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
            state.visibility = "Published";
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
            patchRow(row.row_id, { product_id: res?.data?.id || row.product_id, status: "saved" });
          } else {
            failed.push({ ...row, error: res?.message || "Save failed" });
          }
        } catch (e) {
          failed.push({ ...row, error: getApiErrorMessage(e, "Save error") });
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
      } else if (failed.length) {
        notifyOnFail(
          failed[0]?.error ||
            `All ${failed.length} row(s) failed to save — check the downloaded error file`,
        );
      }
      if (failed.length) downloadFailedRows(failed);
      if (success && !failed.length) {
        clearBulkSession();
        setRows([]);
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
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1 min-w-0">
          <BulkStepper step={step} />
        </div>
        <BulkStats total={rows.length} valid={validCount} invalid={invalidCount} />
      </div>

      {step === "fill" ? (
        <>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Upload your Excel</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Download template → fill in Excel → upload here. Same fields as Smart Listing —
                  no manual grid editing needed.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel template (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" /> TSV template
                </button>
                <button
                  type="button"
                  onClick={() => addRows(5)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" /> Add 5 rows
                </button>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.tsv,.txt" className="hidden" onChange={onFilePick} />
              <button
                type="button"
                disabled={uploadBusy}
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-orange-300 rounded-2xl p-8 text-center bg-orange-50/30 hover:border-primary-100 hover:bg-orange-50/60 transition-colors"
              >
                {uploadBusy ? (
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary-100" />
                ) : (
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                )}
                <p className="mt-2 text-sm font-medium text-gray-800">
                  Choose file or drag & drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  .xlsx / .xls · max 10 MB · up to {BULK_MAX_ROWS} products
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Extra gallery photos — upload via Product → Media Manager (20 MB per image, up to 2,500 per session).
                </p>
              </button>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800 flex items-center gap-2">
                  <ClipboardPaste className="w-4 h-4" /> Or paste from Excel / Google Sheets
                </label>
                <p className="text-[11px] text-gray-400 font-mono break-all">{BULK_PASTE_HEADER}</p>
                <textarea
                  className="w-full h-24 border rounded-xl p-3 font-mono text-xs"
                  placeholder="Paste rows with header row…"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <button
                  type="button"
                  onClick={applyPaste}
                  className="px-4 py-2 rounded-xl bg-primary-100 text-white text-sm font-semibold"
                >
                  Load pasted rows
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-violet-950 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI generation
                    </p>
                    <p className="text-xs text-violet-800 mt-1">
                      Fills descriptions, features, specs, benefits, SEO & shipping text — same as
                      Smart Listing review.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={globalAi}
                      onChange={(e) => setGlobalAi(e.target.checked)}
                    />
                    <span className="w-11 h-6 bg-gray-300 peer-checked:bg-primary-100 rounded-full peer after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>
                <ul className="mt-3 text-[11px] text-violet-900 space-y-1 list-disc pl-4">
                  <li>Product name, short & full description</li>
                  <li>Key features, benefits, specifications</li>
                  <li>What&apos;s in the box, SEO title & meta</li>
                </ul>
              </div>
              <ColumnLegend />
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-950 space-y-1">
                <p className="font-semibold">Tips</p>
                <p>Category names must match your catalog exactly.</p>
                <p>Brand = your seller brand — leave blank for generic listings.</p>
                <p>Per-row AI column: Yes / No to skip AI on specific rows.</p>
              </div>
            </div>
          </div>

          {hasLoadedSheet && !showRowEditor ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {rows.length} product{rows.length !== 1 ? "s" : ""} loaded
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {validCount} ready · {invalidCount} need fixes
                    {globalAi ? ` · AI on for ${aiReadyCount} row(s) with photos` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50"
                  >
                    Re-upload file
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRowEditor(true)}
                    className="px-3 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50"
                  >
                    Edit rows
                  </button>
                </div>
              </div>
              {invalidCount > 0 ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-800 space-y-1">
                  <p className="font-semibold">Fix these before continuing:</p>
                  {validatedRows
                    .filter(({ errors }) => Object.keys(errors).length)
                    .slice(0, 8)
                    .map(({ row, errors }, i) => (
                      <p key={row.row_id} className="text-xs">
                        Row {i + 1} ({polishBulkName(row) || "Untitled"}):{" "}
                        {Object.values(errors).join(" · ")}
                      </p>
                    ))}
                  {invalidCount > 8 ? (
                    <p className="text-xs text-red-600">…and {invalidCount - 8} more — use Edit rows</p>
                  ) : null}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={goPhotos}
                  disabled={!validCount}
                  className="px-5 py-2.5 rounded-xl bg-primary-100 text-white text-sm font-semibold disabled:opacity-40"
                >
                  Next: Add photos →
                </button>
              </div>
            </div>
          ) : null}

          {showRowEditor && hasLoadedSheet ? (
          <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-sm">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="px-2 py-2 text-left w-8 bg-slate-50">#</th>
                  {BULK_GRID_COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      className={`px-2 py-2 text-left whitespace-nowrap ${columnGroupClass(c.group)}`}
                    >
                      {c.label}
                      {c.required ? " *" : ""}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-left bg-emerald-50 text-emerald-900 whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-2 py-2 bg-slate-50" />
                </tr>
              </thead>
              <tbody>
                {validatedRows.map(({ row, errors }, idx) => {
                  const valid = !Object.keys(errors).length;
                  return (
                    <tr key={row.row_id} className="border-t align-top">
                      <td className="px-2 py-2 text-gray-400">{idx + 1}</td>
                      {BULK_GRID_COLUMNS.map((col) => (
                        <td key={col.key} className="px-1 py-1">
                          {col.key === "ai_enabled" ? (
                            <select
                              className="w-full min-w-[64px] px-2 py-1.5 border rounded-lg text-xs border-gray-200"
                              value={row.ai_enabled === false ? "no" : "yes"}
                              onChange={(e) =>
                                patchRow(row.row_id, {
                                  ai_enabled: e.target.value !== "no",
                                })
                              }
                            >
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          ) : (
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
                          )}
                          {errors[col.key] ? (
                            <p className="text-[10px] text-red-600 mt-0.5">{errors[col.key]}</p>
                          ) : null}
                        </td>
                      ))}
                      <td className="px-2 py-2">
                        {valid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 text-xs">
                            <AlertCircle className="w-3.5 h-3.5" /> Fix
                          </span>
                        )}
                      </td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
          ) : null}

          {showRowEditor && hasLoadedSheet ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              {validCount}/{rows.length} valid · session auto-saved locally
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRowEditor(false)}
                className="px-4 py-2 rounded-xl border text-sm font-medium"
              >
                Back to summary
              </button>
              <button
                type="button"
                disabled={disabled || !validCount}
                onClick={goPhotos}
                className="px-5 py-2.5 rounded-xl bg-primary-100 text-white text-sm font-semibold disabled:opacity-50"
              >
                Next: Add photos
              </button>
            </div>
          </div>
          ) : null}
        </>
      ) : null}

      {step === "photos" ? (
        <>
          <p className="text-sm text-gray-600">
            Add a <strong>front</strong> photo per product (labeled slots — same as single listing).
            AI uses photos + category for richer copy.
          </p>
          <p className="text-xs text-primary-100 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
            Need all gallery images (5 per product)? Upload them in{" "}
            <strong>Product → Media Manager</strong> first — up to 2,500 photos per session
            (20 MB each, auto-batched).
          </p>
          <div className="space-y-3">
            {validatedRows.map(({ row, errors }, idx) => (
              <div key={row.row_id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-left"
                  onClick={() => setExpandedRow(expandedRow === row.row_id ? null : row.row_id)}
                >
                  <div>
                    <p className="font-medium text-sm">{polishBulkName(row) || `Row ${idx + 1}`}</p>
                    <p className="text-xs text-gray-500">
                      {row.category} › {row.sub_category}
                      {(row.files || []).length ? ` · ${row.files.length} photo(s)` : " · no photos yet"}
                    </p>
                  </div>
                  {Object.keys(errors).length ? (
                    <span className="text-xs text-red-600">Fix sheet errors</span>
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedRow === row.row_id || validatedRows.length <= 5 ? (
                  <div className="mt-3">
                    <LabeledPhotoBoxes
                      state={{ ...row, name: polishBulkName(row) }}
                      patch={(partial) => patchRow(row.row_id, partial)}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 justify-between">
            <button type="button" onClick={() => setStep("fill")} className="px-4 py-2 rounded-xl border text-sm font-medium">
              Back
            </button>
            <button
              type="button"
              onClick={() => (globalAi ? setStep("ai") : setStep("review"))}
              className="px-5 py-2.5 rounded-xl bg-primary-100 text-white text-sm font-semibold"
            >
              Next: {globalAi ? "AI content" : "Review"}
            </button>
          </div>
        </>
      ) : null}

      {step === "ai" ? (
        <>
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 text-sm text-violet-950">
            <p className="font-semibold">GPT-5.6 Terra listing AI</p>
            <p className="text-xs mt-1">
              Generates full ecommerce listing copy per row: descriptions, 7+ key features,
              specifications, benefits, what&apos;s in the box, SEO meta, warranty & delivery text.
            </p>
            <p className="text-xs mt-2 text-violet-800">
              {aiReadyCount} row(s) ready · needs valid sheet + front photo + AI = Yes
            </p>
          </div>
          {progress ? (
            <p className="text-sm text-primary-100 bg-orange-50 rounded-xl px-3 py-2">{progress}</p>
          ) : null}
          <button
            type="button"
            disabled={aiBusy || disabled || !aiReadyCount}
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
            <button type="button" onClick={() => setStep("review")} className="px-4 py-2 rounded-xl border text-sm text-gray-600">
              Skip to review
            </button>
          </div>
        </>
      ) : null}

      {step === "review" ? (
        <>
          <p className="text-sm text-gray-600">
            Review AI content before save — expand each product to edit details.
          </p>
          <div className="space-y-3">
            {validatedRows.map(({ row }, idx) => (
              <BulkReviewCard key={row.row_id} idx={idx} row={row} patchRow={patchRow} />
            ))}
          </div>
          <div className="flex gap-2 justify-between">
            <button
              type="button"
              onClick={() => setStep(globalAi ? "ai" : "photos")}
              className="px-4 py-2 rounded-xl border text-sm font-medium"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep("submit")}
              className="px-5 py-2.5 rounded-xl bg-primary-100 text-white text-sm font-semibold"
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
              {validCount} listing(s) ready · each row saves independently (partial success OK).
            </p>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="submitMode" checked={submitMode === "draft"} onChange={() => setSubmitMode("draft")} />
                Save all as <strong>Draft</strong>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="submitMode" checked={submitMode === "publish"} onChange={() => setSubmitMode("publish")} />
                {mode === "admin" ? (
                  <>
                    <strong>Publish</strong> live
                  </>
                ) : (
                  <>
                    <strong>Request publish</strong> (admin review)
                  </>
                )}
              </label>
            </div>
            {progress ? (
              <p className="text-sm text-primary-100 bg-orange-50 rounded-xl px-3 py-2">{progress}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setStep("review")} className="px-4 py-2 rounded-xl border text-sm font-medium">
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
          <p className="text-xs text-gray-500">
            Combo & variation bulk → use <strong>Smart Bulk</strong> or <strong>Advanced Excel</strong> tab.
          </p>
        </>
      ) : null}
    </div>
  );
}

function BulkStats({ total, valid, invalid }) {
  return (
    <div className="grid grid-cols-3 gap-2 shrink-0 w-full lg:w-auto">
      {[
        { label: "Total", value: total, tone: "bg-slate-50 text-slate-800" },
        { label: "Valid", value: valid, tone: "bg-emerald-50 text-emerald-800" },
        { label: "Invalid", value: invalid, tone: invalid ? "bg-red-50 text-red-800" : "bg-slate-50 text-slate-500" },
      ].map((s) => (
        <div key={s.label} className={`rounded-xl px-4 py-3 border border-gray-100 ${s.tone}`}>
          <p className="text-[10px] uppercase tracking-wide opacity-70">{s.label}</p>
          <p className="text-xl font-bold">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function ColumnLegend() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 text-xs space-y-2">
      <p className="font-semibold text-gray-800">Column guide</p>
      <p className="flex items-center gap-2">
        <span className="w-3 h-3 rounded bg-orange-200" /> Manual input (price, HSN, name…)
      </p>
      <p className="flex items-center gap-2">
        <span className="w-3 h-3 rounded bg-sky-200" /> Must match catalog titles
      </p>
      <p className="flex items-center gap-2">
        <span className="w-3 h-3 rounded bg-violet-200" /> AI on/off per row
      </p>
    </div>
  );
}

function BulkReviewCard({ idx, row, patchRow }) {
  const [open, setOpen] = useState(false);
  const name = polishBulkName(row);
  return (
    <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
        <span className="font-medium text-sm flex-1">
          {idx + 1}. {name}
          {row.ai_done ? (
            <span className="ml-2 text-xs font-normal text-indigo-600">AI filled</span>
          ) : null}
        </span>
        <span className="text-xs text-gray-400">₹{row.discounted_price}</span>
      </button>
      {open ? (
        <div className="px-4 pb-4 space-y-3 border-t pt-3">
          <Field label="Product name" value={row.name} onChange={(v) => patchRow(row.row_id, { name: v })} />
          <Field
            label="Short description"
            value={row.shortDescription}
            multiline
            onChange={(v) => patchRow(row.row_id, { shortDescription: v })}
          />
          {(row.keyFeatures || []).length ? (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Key features</p>
              <ul className="text-xs text-gray-700 list-disc pl-4 space-y-0.5">
                {row.keyFeatures.slice(0, 8).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {(row.benefits || []).length ? (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Benefits</p>
              <ul className="text-xs text-gray-700 list-disc pl-4 space-y-0.5">
                {row.benefits.slice(0, 5).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {(row.specifications || []).length ? (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Specifications</p>
              <div className="text-xs grid gap-1">
                {row.specifications.slice(0, 6).map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-gray-500 shrink-0">{s.feature}:</span>
                    <span>{s.specification}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {row.metaTitle || row.metaDescription ? (
            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
              <p className="font-medium text-gray-700">SEO</p>
              {row.metaTitle ? <p>Title: {row.metaTitle}</p> : null}
              {row.metaDescription ? <p className="text-gray-600">{row.metaDescription}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange, multiline = false }) {
  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";
  return (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {multiline ? (
        <textarea className={`${cls} h-20 mt-1`} value={value || ""} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={`${cls} mt-1`} value={value || ""} onChange={(e) => onChange(e.target.value)} />
      )}
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
              <span className={`w-4 sm:w-6 h-px shrink-0 ${done ? "bg-primary-100" : "bg-gray-200"}`} />
            ) : null}
            <span
              title={s.hint}
              className={`inline-flex flex-col px-2 sm:px-3 py-1.5 rounded-xl border text-[10px] sm:text-xs whitespace-nowrap min-w-[72px] ${
                active
                  ? "bg-primary-100 text-white border-primary-100"
                  : done
                    ? "bg-orange-50 text-primary-100 border-orange-200"
                    : "bg-white text-gray-400 border-gray-200"
              }`}
            >
              <span>{done ? "✓" : idx + 1} {s.label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
