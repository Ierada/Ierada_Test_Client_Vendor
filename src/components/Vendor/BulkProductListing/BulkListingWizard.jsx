import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FolderUp,
  Image as ImageIcon,
  ImagePlus,
  Info,
  Loader2,
  MessageCircle,
  BookOpen,
  Archive,
  ScanLine,
  Layers,
  Package,
  Copy,
  Clock,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { getCategories, getSubCategories, getInnerSubCategories } from "../../../services/api.category";
import { getAllColors } from "../../../services/api.color";
import { getAllSizes } from "../../../services/api.size";
import { addProduct, getProductsByVendorId } from "../../../services/api.product";
import { generateListingAiDraft, suggestListingCategory } from "../../../services/api.smartListing";
import { getBulkListingWizardJob, uploadBulkListingImagesInSlices, uploadBulkListingZipInChunks, waitForStagedBulkListingImages, lookupStagedBulkListingImages, downloadBulkListingTemplate } from "../../../services/api.bulkListingWizard";
import { loadWizardSession, saveWizardSession, stripPreviewUrls, loadMappingTemplate, saveMappingTemplate, clampWizardStep, readWizardStepFromLocation, loadLastListingKind, saveLastListingKind, normalizeListingKind, emptyKindSession, dropClonedKindSessions, kindSessionHasUploads } from "./wizardSession";
import MapFieldsStep, { MapFieldsFooterStats } from "./MapFieldsStep";
import ValidateDataStep, { AiProgressModal, ValidateFooterStats } from "./ValidateDataStep";
import PreviewConfirmStep from "./PreviewConfirmStep";
import SubmitCompleteStep from "./SubmitCompleteStep";
import { notifyOnFail, notifyOnSuccess } from "../../../utils/notification/toast";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildSmartListingFormData } from "../SmartListing/utils/buildFormData";
import {
  buildListingAiPayload,
  mergeAiDraft,
  taxFromCategoryTree,
} from "../SmartListing/utils/aiDraft";
import innerHsnGstLookup from "../SmartListing/utils/innerHsnGstLookup.json";
import { gstFromBands } from "../SmartListing/utils/gstBands";
import { fileToSuggestPayload } from "../SmartListing/utils/fileToSuggestPayload";
import {
  IERADA_FIELDS,
  CUSTOM_ATTR_MAP_FIELDS,
  TEMPLATE_FILES,
  listingTemplate,
  applyColumnMap,
  applySavedMappingTemplate,
  autoMapColumns,
  refreshMappingConfidence,
  buildCompletedWorkbook,
  buildMappedSampleWorkbook,
  buildPreviewSampleWorkbook,
  downloadBlob,
  mappingTemplatePayload,
  previewAiMode,
  parseListingWorkbook,
  parseSpecs,
  parseSkuImageFilename,
  imagesForSku,
  rowImageKey,
  filesForSku,
  indexImageFilesBySku,
  mergeImagesBySku,
  stagedImageCount,
  wizardImageSrc,
  rowNeedsAiFill,
  applyCategorySuggestion,
  mergeGeneratedRows,
  expandMappedRowsBySize,
  duplicateSkuKeys,
  normalizeSkuKey,
  sizeVariantSku,
  groupColorSizeSubmitRows,
  splitPipe,
  splitWhatsInTheBox,
  validateListingRow,
  isVariationListingKind,
  isCustomListingKind,
  customAttributeColumns,
  variantAttrValue,
  variationPreviewGroups,
  listingTableScrollClass,
  listingTableHeadClass,
} from "./wizardEngine";

function uniqById(list) {
  const seen = new Set();
  return (list || []).filter((item) => {
    const id = String(item.id ?? item.name ?? "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

const STEPS = [
  { id: 1, label: "Upload File", hint: "File uploaded successfully" },
  { id: 2, label: "Map Fields", hint: "Columns mapped" },
  { id: 3, label: "Validate Data", hint: "No critical issues" },
  { id: 4, label: "Preview & Confirm", hint: "Review products before submit" },
  { id: 5, label: "Submit & Complete", hint: "Products will be listed" },
];

const IMAGE_NAME = /\.(jpe?g|png|webp|gif|bmp|avif)$/i;

function isImageFile(file) {
  if (!file) return false;
  if (file.type && String(file.type).startsWith("image/")) return true;
  return IMAGE_NAME.test(file.name || "");
}

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F56C43]/20 focus:border-[#F56C43]";

function Stepper({ step }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-2">
      {STEPS.map((item, i) => {
        const done = step > item.id;
        const active = step === item.id;
        return (
          <li key={item.id} className="flex items-center">
            {i ? <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-gray-300 sm:mx-2" /> : null}
            <div className="relative flex items-start gap-2 px-1 pb-2 sm:px-2">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-[#F56C43] text-white"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : item.id === 4 || item.id === 5 ? (
                  <ClipboardList className="h-3.5 w-3.5" />
                ) : item.id === 3 ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  item.id
                )}
              </span>
              <span>
                <p className={`text-[12px] font-semibold ${active ? "text-[#F56C43]" : done ? "text-emerald-700" : "text-[#1A2B48]"}`}>
                  {item.id}. {item.label}
                </p>
                <p className="text-[11px] leading-snug text-gray-500">
                  {item.id === 4 && step >= 5 ? "Review completed" : item.hint}
                </p>
              </span>
              {active ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#F56C43]" /> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function HelpCard({ onGuide }) {
  return (
    <div className="rounded-2xl border border-[#FDE4D8] bg-[#FFF8F4] p-4">
      <p className="text-sm font-semibold text-[#1A2B48]">Need Help?</p>
      <p className="mt-1 text-xs text-gray-600">
        Watch the step-by-step guide to upload products in bulk.
      </p>
      <button
        type="button"
        onClick={onGuide}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#F56C43] px-3 py-1.5 text-xs font-semibold text-[#F56C43]"
      >
        View Guide
      </button>
    </div>
  );
}

function PreviewColHead({ label, hint, hintClass, labelClass = "text-[#1A2B48]", compact = false }) {
  return (
    <th className={`whitespace-nowrap text-left align-bottom ${compact ? "px-2 py-1.5" : "px-3 py-2.5"}`}>
      <p className={`${compact ? "text-[11px]" : "text-[12px]"} font-semibold ${labelClass}`}>{label}</p>
      {hint ? <p className={`${compact ? "text-[9px]" : "text-[10px]"} font-medium ${hintClass}`}>{hint}</p> : null}
    </th>
  );
}

function PreviewImageCell({ images, compact = false }) {
  if (!images.length) {
    return (
      <span className="inline-flex rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-500">
        Missing
      </span>
    );
  }
  const shown = images.slice(0, compact ? 2 : 3);
  const extra = images.length - shown.length;
  const size = compact ? "h-7 w-7" : "h-8 w-8";
  return (
    <div className="flex w-max items-center">
      {shown.map((img, i) => (
        <img
          key={`${img.filename || img.url || img.previewUrl || i}-${img.order || i}`}
          src={wizardImageSrc(img)}
          alt=""
          className={`relative ${size} shrink-0 rounded-md bg-gray-100 object-cover ring-2 ring-white ${i ? "-ml-2" : ""}`}
        />
      ))}
      {extra > 0 ? (
        <span className="ml-1 shrink-0 text-[11px] font-semibold text-[#F56C43]">+{extra}</span>
      ) : null}
    </div>
  );
}

function formatEta(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  if (seconds < 8) return "a few seconds left";
  if (seconds < 60) return `about ${Math.round(seconds)}s left`;
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes === 1 ? "about 1 min left" : `about ${minutes} min left`;
}

function formatBytes(n) {
  const value = Number(n) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadProgressBar({ progress }) {
  if (!progress) return null;
  const pct = Math.max(0, Math.min(100, Number(progress.percent) || 0));
  return (
    <div className="mt-4 rounded-xl border border-[#FDE4D8] bg-white p-3">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-semibold text-[#1A2B48]">
        <span>{progress.label || "Uploading images…"}</span>
        <span className="shrink-0 text-[#F56C43]">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-[#F56C43] transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
        <span>{progress.detail || "Keep this page open until the upload finishes."}</span>
        {progress.eta ? (
          <span className="font-semibold text-[#1A2B48]">{progress.eta}</span>
        ) : null}
      </div>
    </div>
  );
}

function FilePreviewSection({
  rows,
  imagesBySku,
  onDownload,
  onProceed,
  onGenerateAi,
  pendingAiCount = 0,
  aiBusy = false,
  generatingSku,
  isSample,
  listingKind = "single",
}) {
  const variation = isVariationListingKind(listingKind);
  const custom = isCustomListingKind(listingKind);
  const groups = variation ? variationPreviewGroups(rows) : [];
  const attrCols = custom ? customAttributeColumns(rows) : [];
  const productCount = variation ? groups.length : rows.length;
  const variationColSpan = custom ? 11 + attrCols.length : 12;
  const listCount = variation
    ? groups.reduce((sum, group) => sum + (group.variants?.length || 0), 0)
    : rows.length;
  const pad = custom ? "px-2 py-1.5" : "px-3 py-2.5";

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className={`flex flex-wrap items-center justify-between gap-3 ${custom ? "px-4 py-2" : "px-5 py-3"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[#1A2B48]">File Preview</p>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
            {productCount} Products Found
          </span>
          {isSample ? (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
              Sample Data
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pendingAiCount && !isSample ? (
            <button
              type="button"
              onClick={onGenerateAi}
              disabled={aiBusy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#F56C43] px-3 py-2 text-xs font-semibold text-[#F56C43] hover:bg-[#FFF8F4] disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {aiBusy ? "Generating…" : `Generate AI Fields (${pendingAiCount})`}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download Sample Data
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#F56C43] px-4 py-2 text-sm font-semibold text-white"
          >
            Proceed to Map Fields
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className={listingTableScrollClass(listCount)}>
        {variation ? (
          <table className={`min-w-full text-left ${custom ? "text-[11px]" : "text-xs"}`}>
            <thead className={listingTableHeadClass("border-t border-gray-100 bg-white")}>
              <tr>
                <th className={`${pad} text-left ${custom ? "text-[11px]" : "text-[12px]"} font-semibold text-gray-500`}>#</th>
                <PreviewColHead label="Product Name" hint="(Manual)" hintClass="text-[#F56C43]" compact={custom} />
                <PreviewColHead label="Variant SKU" hint="(Manual)" hintClass="text-[#F56C43]" compact={custom} />
                {custom ? (
                  attrCols.map((col) => (
                    <PreviewColHead
                      key={col.key}
                      label={col.label}
                      hint="(Manual)"
                      hintClass="text-[#F56C43]"
                      compact
                    />
                  ))
                ) : (
                  <>
                    <PreviewColHead label="Colour" hint="(Manual)" hintClass="text-[#F56C43]" />
                    <PreviewColHead label="Size" hint="(Manual)" hintClass="text-[#F56C43]" />
                  </>
                )}
                <PreviewColHead label="Image" labelClass="text-violet-600" compact={custom} />
                <PreviewColHead label="Brand Name" hint="(Manual)" hintClass="text-[#F56C43]" compact={custom} />
                <PreviewColHead label="Category Level 1" hint="(Manual)" hintClass="text-[#F56C43]" compact={custom} />
                <PreviewColHead label="Selling Price ₹" hint="(Manual)" hintClass="text-[#F56C43]" compact={custom} />
                <PreviewColHead label="AI Mode" hint="(Yes/No)" hintClass="text-violet-500" compact={custom} />
                <PreviewColHead label="Short Description" hint="(AI Generated)" hintClass="text-emerald-600" compact={custom} />
                <PreviewColHead label="Status" labelClass="text-emerald-600" compact={custom} />
              </tr>
            </thead>
            <tbody>
              {groups.length ? (
                groups.map((group, gi) =>
                  group.variants.map((variant, vi) => {
                    const row = variant.row || {};
                    const imgs = [...imagesForSku(imagesBySku, variant.imageKey || variant.sku)].sort(
                      (a, b) => Number(a.order || 99) - Number(b.order || 99),
                    );
                    const generating =
                      generatingSku &&
                      group.variants.some((item) => item.sku === generatingSku);
                    const aiMode = previewAiMode(row);
                    const valid = Boolean(String(variant.sku || "").trim());
                    return (
                      <tr key={`${group.parentSku || gi}-${variant.mergeKey}`} className="border-t border-gray-100">
                        {vi === 0 ? (
                          <>
                            <td
                              rowSpan={group.variants.length}
                              className={`${pad} align-top text-gray-500`}
                            >
                              {gi + 1}
                            </td>
                            <td
                              rowSpan={group.variants.length}
                              className={`${custom ? "max-w-[160px]" : "max-w-[220px]"} ${pad} align-top`}
                            >
                              <p
                                className={`${custom ? "line-clamp-1 text-[11px]" : "line-clamp-2 text-[12px]"} font-medium leading-[1.35] text-[#1A2B48]`}
                                title={group.title}
                              >
                                {group.title || (generating ? "Generating…" : "—")}
                              </p>
                            </td>
                          </>
                        ) : null}
                        <td className={`${pad} font-medium text-[#1A2B48]`}>{variant.sku || "—"}</td>
                        {custom ? (
                          attrCols.map((col) => (
                            <td key={col.key} className={`${pad} whitespace-nowrap text-[#1A2B48]`}>
                              {variantAttrValue(variant, col.index) || "—"}
                            </td>
                          ))
                        ) : (
                          <>
                            <td className={`${pad} text-[#1A2B48]`}>{variant.colour || "—"}</td>
                            <td className={`${pad} text-[#1A2B48]`}>
                              {variant.sizes.length ? variant.sizes.join(", ") : "—"}
                            </td>
                          </>
                        )}
                        <td className={`relative z-0 ${custom ? "w-[5.5rem] min-w-[5.5rem]" : "w-[7rem] min-w-[7rem]"} ${pad}`}>
                          <PreviewImageCell images={imgs} compact={custom} />
                        </td>
                        <td className={`relative z-10 whitespace-nowrap bg-white ${pad} text-[#1A2B48]`}>
                          {row.brand || "—"}
                        </td>
                        <td className={`${pad} text-[#1A2B48]`}>
                          {row.category || (generatingSku && generatingSku === variant.sku ? "Generating…" : "—")}
                        </td>
                        <td className={`${pad} text-[#1A2B48]`}>{row.selling_price || "—"}</td>
                        <td className={`${pad} text-[#1A2B48]`}>{aiMode}</td>
                        <td className={`${custom ? "max-w-[140px]" : "max-w-[180px]"} ${pad} text-gray-600`}>
                          {row.short_description ? (
                            <span className={custom ? "line-clamp-1" : "line-clamp-2"}>{row.short_description}</span>
                          ) : generatingSku && generatingSku === variant.sku ? (
                            <span className="text-[#F56C43]">Generating…</span>
                          ) : (
                            <span className="text-gray-400">Pending AI</span>
                          )}
                        </td>
                        <td className={pad}>
                          {valid ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                              <AlertTriangle className="h-3.5 w-3.5" /> Invalid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }),
                )
              ) : (
                <tr>
                  <td colSpan={variationColSpan} className="px-3 py-8 text-center text-sm text-gray-500">
                    Upload seller Excel to preview product rows here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full text-left text-xs">
            <thead className={listingTableHeadClass("border-t border-gray-100 bg-white")}>
              <tr>
                <th className="px-3 py-2.5 text-left text-[12px] font-semibold text-gray-500">#</th>
                <PreviewColHead label="Product Name" hint="(Manual)" hintClass="text-[#F56C43]" />
                <PreviewColHead label="Brand Name" hint="(Manual)" hintClass="text-[#F56C43]" />
                <PreviewColHead label="Category Level 1" hint="(Manual)" hintClass="text-[#F56C43]" />
                <PreviewColHead label="Selling Price ₹" hint="(Manual)" hintClass="text-[#F56C43]" />
                <PreviewColHead label="SKU" hint="(Manual)" hintClass="text-[#F56C43]" />
                <PreviewColHead label="Images" labelClass="text-violet-600" />
                <PreviewColHead label="AI Mode" hint="(Yes/No)" hintClass="text-violet-500" />
                <PreviewColHead label="Short Description" hint="(AI Generated)" hintClass="text-emerald-600" />
                <PreviewColHead label="Status" labelClass="text-emerald-600" />
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row, i) => {
                  const imgs = [...imagesForSku(imagesBySku, rowImageKey(row) || row.sku)].sort(
                    (a, b) => Number(a.order || 99) - Number(b.order || 99),
                  );
                  const aiMode = previewAiMode(row);
                  const valid = Boolean(String(row.sku || "").trim());
                  return (
                    <tr key={row.row_id || i} className="border-t border-gray-100">
                      <td className="px-3 py-2.5 text-gray-500">{i + 1}</td>
                      <td className="max-w-[160px] px-3 py-2.5 font-medium text-[#1A2B48]">
                        {row.name || (generatingSku && generatingSku === row.sku ? "Generating…" : "—")}
                      </td>
                      <td className="whitespace-nowrap bg-white px-3 py-2.5 text-[#1A2B48]">{row.brand || "—"}</td>
                      <td className="px-3 py-2.5 text-[#1A2B48]">
                        {row.category || (generatingSku && generatingSku === row.sku ? "Generating…" : "—")}
                      </td>
                      <td className="px-3 py-2.5 text-[#1A2B48]">{row.selling_price || "—"}</td>
                      <td className="px-3 py-2.5 font-medium text-[#1A2B48]">{row.sku || "—"}</td>
                      <td className="relative z-0 w-[7rem] min-w-[7rem] px-3 py-2.5">
                        <PreviewImageCell images={imgs} />
                      </td>
                      <td className="px-3 py-2.5 text-[#1A2B48]">{aiMode}</td>
                      <td className="max-w-[180px] px-3 py-2.5 text-gray-600">
                        {row.short_description ? (
                          <span className="line-clamp-2">{row.short_description}</span>
                        ) : generatingSku && generatingSku === row.sku ? (
                          <span className="text-[#F56C43]">Generating…</span>
                        ) : (
                          <span className="text-gray-400">Pending AI</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {valid ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                            <AlertTriangle className="h-3.5 w-3.5" /> Invalid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-sm text-gray-500">
                    Upload seller Excel to preview product rows here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function UploadedImagesSummary({ summary, mappedRows, imagesBySku }) {
  const total = Number(summary?.total_images || 0);
  const withImages = Number(summary?.products_with_images || 0);
  const missing = mappedRows.length
    ? mappedRows.filter((row) => !imagesForSku(imagesBySku, rowImageKey(row) || row.sku).length).length
    : summary?.missing_cover_skus?.length || 0;
  const dupes = summary?.duplicate_filenames?.length || 0;
  const low = total ? Math.max(1, Math.round(total / 24)) : 0;
  const high = total ? Math.max(low + 1, Math.round(total / 16)) : 0;

  const items = [
    {
      value: total,
      label: "Total Images Uploaded",
      icon: ImageIcon,
      wrap: "bg-emerald-50",
      iconClass: "text-emerald-500",
      valueClass: "text-emerald-600",
    },
    {
      value: withImages,
      label: "Products with Images",
      icon: Package,
      wrap: "bg-sky-50",
      iconClass: "text-sky-500",
      valueClass: "text-sky-600",
    },
    {
      value: missing,
      label: "Missing Images",
      icon: AlertTriangle,
      wrap: "bg-rose-50",
      iconClass: "text-rose-500",
      valueClass: "text-rose-500",
    },
    {
      value: dupes,
      label: "Duplicate Filenames",
      icon: Copy,
      wrap: "bg-violet-50",
      iconClass: "text-violet-500",
      valueClass: "text-violet-600",
    },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-[200px] shrink-0 lg:max-w-[220px]">
          <p className="text-sm font-semibold text-[#1A2B48]">Uploaded Images Summary</p>
          <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
            Overview of uploaded product images and mapping status.
          </p>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 rounded-2xl bg-gray-50/80 px-3 py-2.5">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.wrap}`}>
                <item.icon className={`h-4 w-4 ${item.iconClass}`} />
              </span>
              <span>
                <p className={`text-lg font-bold leading-none ${item.valueClass}`}>{item.value}</p>
                <p className="mt-1 text-[11px] leading-snug text-gray-500">{item.label}</p>
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2.5 rounded-2xl bg-gray-50/80 px-3 py-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50">
              <Clock className="h-4 w-4 text-[#F56C43]" />
            </span>
            <span>
              <p className="text-[11px] text-gray-500">Estimated Time</p>
              <p className="text-sm font-bold leading-tight text-[#1A2B48]">
                {total ? `${low} - ${high} mins` : "—"}
              </p>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function DropZone({ onFiles, className, children }) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={`${className} ${over ? "border-[#F56C43] bg-[#FFF1E8]" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles?.(e.dataTransfer.files);
      }}
    >
      {children}
    </div>
  );
}

function ImportantInstructions({ tab, setTab, listingKind = "single" }) {
  const fileTips =
    listingKind === "color_size"
      ? [
          { icon: ScanLine, text: "Colour × Size: Products sheet has one parent SKU per listing. Do not put colour or size on that sheet." },
          { icon: Layers, text: "Variations sheet: one row per colour under the same Parent SKU. Parent SKU is meant to repeat — that is not a duplicate SKU. Each colour needs its own Variant SKU." },
          { icon: Package, text: "Size can be one value per row, or several on the same colour row (6,7,8,9). We create one size variation each and append the size to the Variant SKU." },
          { icon: Package, text: "Example: parent lifeo-zimmi-black-312 with Brown 6,7,8,9 (lifeo-zimmi-brown-277) and Tan 6,8,10 (lifeo-zimmi-tan-977) = one listing, two colours." },
          { icon: Package, text: "Kids Fashion sizes: pick an age-group size from the Size dropdown (6-9 Months, 9-12 Months, 12-15 Months, 18-21 Months, 2-2.5 Years, 3-3.5 Years, 5-5.5 Years). Do not use adult S/M/L for kids apparel." },
          { icon: ImageIcon, text: "Use Image SKU so all sizes of one colour share photos (FAS-TS-003-BLK-1.jpg)." },
          { icon: Layers, text: "Delete SAMPLE rows before a live upload. Do not write product title, category, HSN or copy." },
        ]
      : listingKind === "custom"
        ? [
            { icon: ScanLine, text: "Custom: Products sheet has one parent SKU. Attributes sheet lists axes. Variations sheet lists the combinations you sell." },
            { icon: Layers, text: "Delete SAMPLE rows before a live upload." },
            { icon: ImageIcon, text: "SKU / Image SKU must match already-stored image filenames." },
          ]
        : [
            { icon: ScanLine, text: "Single listing: one Products row = one product. Write one SKU, one colour and one size only. Do not use commas for extra colours or sizes." },
            { icon: Layers, text: "If the product has more than one colour or size, download the Colour × Size Variations template instead." },
            { icon: Package, text: "Kids Fashion sizes: pick an age-group size from the Size dropdown (6-9 Months, 9-12 Months, 12-15 Months, 18-21 Months, 2-2.5 Years, 3-3.5 Years, 5-5.5 Years). Do not use adult S/M/L for kids apparel." },
            { icon: Layers, text: "Fill SKU, brand, colour, size, prices, stock and package. Do not write product title, category, HSN or copy." },
            { icon: ImageIcon, text: "SKU must match already-stored image filenames ({SKU}-1 is the cover)." },
            { icon: Layers, text: "Delete SAMPLE rows before a live upload." },
          ];
  const imageTips = [
    { icon: ScanLine, text: "Name files {SKU}-1.jpg, {SKU}-2.jpg … {SKU}-10.jpg. SKU lifeo-1601-slipeer-blue-956 uses lifeo-1601-slipeer-blue-956-1 as cover." },
    { icon: ImageIcon, text: "Supported formats: JPG, PNG, WebP." },
    { icon: Layers, text: "Recommended resolution: 1000 x 1000 px (square)." },
    { icon: ImagePlus, text: "First image will be used as the cover image for the product." },
    { icon: Package, text: "You can upload multiple images per SKU (max 10 images)." },
    { icon: Archive, text: "You can also upload a ZIP file containing all product images." },
    { icon: Info, text: "Ensure image filenames are unique to avoid duplicates." },
  ];
  const tips = tab === "file" ? fileTips : imageTips;
  return (
    <aside className="rounded-2xl border border-[#FDE4D8] bg-[#FFF8F4] p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-[#F56C43]">
        <Info className="h-4 w-4" />
        Important Instructions
      </p>
      <div className="mt-3 flex rounded-lg bg-white p-1 text-xs font-semibold">
        <button
          type="button"
          className={`flex-1 rounded-md py-1.5 ${tab === "file" ? "bg-[#FFF1E8] text-[#F56C43]" : "text-gray-500"}`}
          onClick={() => setTab("file")}
        >
          Product File
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md py-1.5 ${tab === "image" ? "bg-[#FFF1E8] text-[#F56C43]" : "text-gray-500"}`}
          onClick={() => setTab("image")}
        >
          Image Upload
        </button>
      </div>
      <ul className="mt-3 space-y-2.5">
        {tips.map((tip) => (
          <li key={tip.text} className="flex gap-2 text-[11px] leading-snug text-gray-600">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[#F56C43] shadow-sm">
              <tip.icon className="h-3 w-3" />
            </span>
            {tip.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function TemplateColumnGuide() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-xs">
      <p className="font-semibold text-[#1A2B48]">Template Column Guide</p>
      <ul className="mt-3 space-y-2">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#F56C43]" />
          <span><span className="font-semibold text-[#F56C43]">Orange</span> Mandatory / Manual Input</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
          <span><span className="font-semibold text-violet-600">Purple</span> AI Generated (Optional)</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span><span className="font-semibold text-blue-600">Blue</span> Lookup / Dropdown Values</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span><span className="font-semibold text-emerald-600">Green</span> Auto Calculated / System</span>
        </li>
      </ul>
    </div>
  );
}

function NeedHelpCard({ onGuide, supportTo }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-semibold text-[#1A2B48]">Need Help?</p>
      <p className="mt-1 text-xs text-gray-500">Our team is here to help you.</p>
      {supportTo ? (
        <Link
          to={supportTo}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#1A2B48] hover:border-[#F56C43]"
        >
          <MessageCircle className="h-3.5 w-3.5 text-[#F56C43]" />
          Chat with Support
        </Link>
      ) : (
        <button
          type="button"
          onClick={onGuide}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#1A2B48] hover:border-[#F56C43]"
        >
          <MessageCircle className="h-3.5 w-3.5 text-[#F56C43]" />
          Chat with Support
        </button>
      )}
      <button
        type="button"
        onClick={onGuide}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#1A2B48] hover:border-[#F56C43]"
      >
        <BookOpen className="h-3.5 w-3.5 text-[#F56C43]" />
        View Upload Guide
      </button>
    </div>
  );
}

function coverFilename(img) {
  const url = String(img?.url || "");
  const hit = url.match(/files\/([^/?#]+)/i);
  if (hit?.[1]) {
    try {
      return decodeURIComponent(hit[1]);
    } catch {
      return hit[1];
    }
  }
  const raw = String(img?.filename || "").split(/[/\\]/).pop();
  if (raw && !raw.includes("..")) return raw;
  const shown = String(wizardImageSrc(img) || "");
  const shownHit = shown.match(/files\/([^/?#]+)/i);
  if (shownHit?.[1]) {
    try {
      return decodeURIComponent(shownHit[1]);
    } catch {
      return shownHit[1];
    }
  }
  return "";
}

function coverFetchUrls(cover) {
  const urls = [];
  const push = (value) => {
    const src = String(value || "").trim();
    if (src && !urls.includes(src)) urls.push(src);
  };
  const filename = coverFilename(cover);
  if (filename) push(`/api/bulk-listing-wizard/files/${encodeURIComponent(filename)}`);
  push(cover?.url);
  push(wizardImageSrc(cover));
  push(cover?.previewUrl);
  return urls;
}

async function coverImagePayload(cover, files) {
  const ordered = Object.entries(files || {}).sort((a, b) => Number(a[0]) - Number(b[0]));
  const coverSlot = files?.[1] || files?.["1"] || ordered[0]?.[1];
  let blob = coverSlot?.file || coverSlot;
  if (!(blob instanceof Blob) && cover) {
    for (const src of coverFetchUrls(cover)) {
      try {
        const res = await fetch(src);
        if (!res.ok) continue;
        const body = await res.blob();
        if (body?.size) {
          blob = body;
          break;
        }
      } catch {
        /* try the next url for this cover */
      }
    }
  }
  if (!(blob instanceof Blob)) return null;
  const file =
    blob instanceof File
      ? blob
      : new File([blob], "cover.jpg", { type: blob.type || "image/jpeg" });
  return fileToSuggestPayload(file);
}

const AI_SHARE_KEYS = [
  "name",
  "category",
  "sub_category",
  "inner_sub_category",
  "hsn_code",
  "gst",
  "short_description",
  "product_details",
  "general_info",
  "key_features",
  "benefits",
  "whats_in_the_box",
  "specifications",
  "meta_title",
  "meta_description",
  "tags",
  "country_of_origin",
];

function pickAiShare(row) {
  const out = {};
  AI_SHARE_KEYS.forEach((key) => {
    if (row[key] == null || String(row[key]).trim() === "") return;
    out[key] = row[key];
  });
  return out;
}

function variationAiCacheKey(row, listingKind) {
  const kind = row.listing_kind || listingKind;
  if (kind === "custom") {
    return `parent:${String(row.parent_sku || row.sku || "").trim().toLowerCase()}`;
  }
  if (kind === "color_size") {
    return `image:${String(row.image_sku || row.sku || "").trim().toLowerCase()}`;
  }
  return `sku:${String(row.sku || "").trim().toLowerCase()}`;
}

function coverMediaForRow(row, source, imagesBySku, imageFilesBySku) {
  const keys = [row.image_sku, row.sku].map((v) => String(v || "").trim()).filter(Boolean);
  const tryKeys = (list) => {
    for (const key of list) {
      const images = imagesForSku(imagesBySku, key);
      if (images.length) {
        return { images, files: filesForSku(imageFilesBySku, key) };
      }
    }
    return null;
  };
  const direct = tryKeys(keys);
  if (direct) return direct;
  const parent = String(row.parent_sku || "").trim().toLowerCase();
  const imageSku = String(row.image_sku || "").trim().toLowerCase();
  const siblings = (source || []).filter((other) => {
    if (other === row) return false;
    if (imageSku && String(other.image_sku || "").trim().toLowerCase() === imageSku) return true;
    if (parent && String(other.parent_sku || "").trim().toLowerCase() === parent) return true;
    return false;
  });
  for (const other of siblings) {
    const hit = tryKeys([other.image_sku, other.sku]);
    if (hit) return hit;
  }
  return { images: [], files: {} };
}

function customAttributeState(row) {
  const attributes = [1, 2, 3, 4]
    .map((n) => ({
      label: String(row[`attr${n}_name`] || "").trim(),
      value: String(row[`attr${n}_value`] || "").trim(),
    }))
    .filter((item) => item.value);
  return {
    extraNotes: attributes
      .map((item) => (item.label ? `${item.label}: ${item.value}` : item.value))
      .join("; "),
    customRows: attributes.length ? [{ enabled: true, attributes }] : [],
    colorGroups: row.colour
      ? [{ color_name: row.colour, sizes: row.size ? [{ size_name: row.size }] : [] }]
      : [],
  };
}

function pipeJoin(list) {
  if (Array.isArray(list)) {
    return list
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.feature) return `${item.feature}:${item.specification || ""}`;
        if (item?.title) return item.details ? `${item.title}: ${item.details}` : item.title;
        return "";
      })
      .filter(Boolean)
      .join(" | ");
  }
  return String(list || "").trim();
}

async function mapLimit(items, limit, fn) {
  const list = items || [];
  if (!list.length) return [];
  const out = new Array(list.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(Math.max(limit, 1), list.length) }, async () => {
    while (cursor < list.length) {
      const idx = cursor;
      cursor += 1;
      out[idx] = await fn(list[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

function ListingTypePicker({ value, onChange, onDownload }) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      {TEMPLATE_FILES.map((t) => {
        const active = value === t.id;
        return (
          <div
            key={t.id}
            className={`rounded-xl border px-3 py-2.5 ${
              active ? "border-[#F56C43] bg-[#FFF8F4]" : "border-gray-200 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => onChange(t.id)}
              className="w-full text-left"
            >
              <p className="text-[12px] font-semibold text-[#1A2B48]">{t.name}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-gray-500">{t.blurb}</p>
            </button>
            <button
              type="button"
              onClick={() => onDownload(t.id)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#F56C43]"
            >
              <Download className="h-3 w-3" /> Download Excel
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function BulkListingWizard({
  mode = "vendor",
  vendorId,
  listPath = "/product/list",
  mediaPath = "/bulk-upload/media",
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState(() => readWizardStepFromLocation());
  const [jobId, setJobId] = useState("");
  const [excelName, setExcelName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState([]);
  const [rows, setRows] = useState([]);
  const [imagesBySku, setImagesBySku] = useState({});
  const [imageFilesBySku, setImageFilesBySku] = useState({});
  const [imageSummary, setImageSummary] = useState(null);
  const [taxonomy, setTaxonomy] = useState({
    categories: [],
    subCategories: [],
    innerSubCategories: [],
  });
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [existingSkus, setExistingSkus] = useState(new Set());
  const [busy, setBusy] = useState("");
  const [aiProgress, setAiProgress] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [selected, setSelected] = useState({});
  const [submitResult, setSubmitResult] = useState(null);
  const [tab, setTab] = useState("image");
  const [imageMapMethod, setImageMapMethod] = useState("sku");
  const [imageSourceName, setImageSourceName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);
  const [revalidating, setRevalidating] = useState(false);
  const [listingKind, setListingKind] = useState("single");
  const excelRef = useRef(null);
  const imageRef = useRef(null);
  const zipRef = useRef(null);
  const folderRef = useRef(null);
  const completedRef = useRef(null);
  const sessionReady = useRef(false);
  const aiJob = useRef(null);
  const lastAiKey = useRef("");
  const lastAutoFixKey = useRef("");
  const lastRecoverKey = useRef("");
  const filesByKind = useRef({ single: {}, color_size: {}, custom: {} });
  const kindSwitchGen = useRef(0);
  const activeKindRef = useRef("single");

  const requireVendor = mode === "admin" && !vendorId;

  const loadLookups = useCallback(async () => {
    const [catRes, subRes, innerRes, colorRes, sizeRes] = await Promise.all([
      getCategories({ silent: true }),
      getSubCategories({ silent: true }),
      getInnerSubCategories({ silent: true }),
      getAllColors({ silent: true }).then((res) => res || { data: [] }).catch(() => ({ data: [] })),
      getAllSizes({}, { silent: true }).then((res) => res || { data: [] }).catch(() => ({ data: [] })),
    ]);
    const nextTaxonomy = {
      categories: (catRes?.data || []).map((c) => ({
        id: c.id,
        name: c.title,
        hsn_code: c.hsn_code,
        tax: c.tax ?? c.gst,
      })),
      subCategories: (subRes?.data || []).map((c) => ({
        id: c.id,
        name: c.title,
        categoryId: c.cat_id,
        hsn_code: c.hsn_code,
        tax: c.tax ?? c.gst,
      })),
      innerSubCategories: (innerRes?.data || []).map((c) => ({
        id: c.id,
        name: c.title,
        subCategoryId: c.sub_cat_id,
        hsn_code: c.hsn_code,
        tax: c.tax ?? c.gst,
      })),
    };
    const nextColors = uniqById(
      (colorRes?.data || colorRes || []).map((c) => ({
        id: c.id,
        name: c.name || c.title,
      })).filter((c) => c.name),
    );
    const nextSizes = uniqById(
      (sizeRes?.data || sizeRes || []).map((s) => ({
        id: s.id,
        name: s.name || s.title || s.size_name,
      })).filter((s) => s.name),
    );
    setTaxonomy(nextTaxonomy);
    setColors(nextColors);
    setSizes(nextSizes);
    return { taxonomy: nextTaxonomy, colors: nextColors, sizes: nextSizes };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadLookups();
      } catch {
        if (!cancelled) notifyOnFail("Could not load catalogue lookups");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadLookups]);

  useEffect(() => {
    if (step !== 3 && step !== 4) return undefined;
    loadLookups().catch(() => {});
    return undefined;
  }, [step, loadLookups]);

  useEffect(() => {
    if (!vendorId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await getProductsByVendorId(
          vendorId,
          { page: 1, limit: 500 },
          { silent: true },
        );
        const items = res?.data?.products || res?.data || [];
        const set = new Set(
          (Array.isArray(items) ? items : [])
            .map((p) => String(p.sku || "").trim().toLowerCase())
            .filter(Boolean),
        );
        if (!cancelled) setExistingSkus(set);
      } catch {
        /* uniqueness still checked on submit */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  useEffect(() => {
    sessionReady.current = false;
    let cancelled = false;
    const lastKind = loadLastListingKind(mode, vendorId);
    activeKindRef.current = lastKind;
    const saved = loadWizardSession(mode, vendorId, lastKind);
    const urlStep = readWizardStepFromLocation();
    if (!saved || !kindSessionHasUploads(saved)) {
      setListingKind(lastKind);
      setStep(saved?.step === 5 && saved?.submitResult ? 5 : urlStep);
      if (saved?.submitResult) setSubmitResult(saved.submitResult);
      sessionReady.current = true;
      return undefined;
    }
    setListingKind(normalizeListingKind(saved.listingKind || lastKind));
    if (saved.excelName) setExcelName(saved.excelName);
    if (Array.isArray(saved.headers)) setHeaders(saved.headers);
    if (Array.isArray(saved.rawRows)) setRawRows(saved.rawRows);
    if (Array.isArray(saved.mapping)) setMapping(refreshMappingConfidence(saved.mapping));
    if (Array.isArray(saved.rows)) setRows(saved.rows);
    if (saved.imageSourceName) setImageSourceName(saved.imageSourceName);
    if (saved.jobId) setJobId(saved.jobId);
    if (saved.imagesBySku && Object.keys(saved.imagesBySku).length) {
      setImagesBySku(saved.imagesBySku);
    }
    if (saved.imageSummary) setImageSummary(saved.imageSummary);
    if (saved.selected && typeof saved.selected === "object") setSelected(saved.selected);
    if (saved.filter) setFilter(saved.filter);
    if (typeof saved.query === "string") setQuery(saved.query);
    if (saved.tab) setTab(saved.tab);
    if (saved.imageMapMethod) setImageMapMethod(saved.imageMapMethod);
    if (saved.submitResult) setSubmitResult(saved.submitResult);
    const restoredStep = urlStep > 1 ? urlStep : clampWizardStep(saved.step, urlStep);
    setStep(restoredStep);
    (async () => {
      if (saved.jobId) {
        try {
          const jobRes = await getBulkListingWizardJob(saved.jobId);
          if (!cancelled && jobRes?.status === 1) mergeImageSummary(jobRes.data.summary);
        } catch {
          /* keep locally stored mapping */
        }
      }
      if (!cancelled) sessionReady.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, vendorId]);

  useEffect(() => {
    if (!sessionReady.current) return;
    if (activeKindRef.current !== listingKind) return;
    saveWizardSession(mode, vendorId, listingKind, {
      step,
      jobId,
      excelName,
      headers,
      rawRows,
      mapping,
      rows,
      imageSourceName,
      imagesBySku: stripPreviewUrls(imagesBySku),
      imageSummary,
      selected,
      filter,
      query,
      tab,
      imageMapMethod,
      submitResult,
      listingKind,
    });
  }, [mode, vendorId, step, jobId, excelName, headers, rawRows, mapping, rows, imageSourceName, imagesBySku, imageSummary, selected, filter, query, tab, imageMapMethod, submitResult, listingKind]);

  useEffect(() => {
    if (!sessionReady.current) return;
    if (activeKindRef.current !== listingKind) return;
    filesByKind.current[listingKind] = imageFilesBySku;
  }, [listingKind, imageFilesBySku]);

  useEffect(() => {
    const current = searchParams.get("step");
    if (current === String(step)) return;
    const next = new URLSearchParams(searchParams);
    next.set("step", String(step));
    setSearchParams(next, { replace: true });
  }, [step, searchParams, setSearchParams]);

  const snapshotKindSession = (kind = listingKind) => ({
    step,
    jobId,
    excelName,
    headers,
    rawRows,
    mapping,
    rows,
    imageSourceName,
    imagesBySku: stripPreviewUrls(imagesBySku),
    imageSummary,
    selected,
    filter,
    query,
    tab,
    imageMapMethod,
    submitResult,
    listingKind: normalizeListingKind(kind),
    ownedKind: normalizeListingKind(kind),
  });

  const applyKindState = (saved) => {
    const data = saved && typeof saved === "object" ? saved : {};
    setStep(clampWizardStep(data.step, 1));
    setJobId(data.jobId || "");
    setExcelName(data.excelName || "");
    setHeaders(Array.isArray(data.headers) ? data.headers : []);
    setRawRows(Array.isArray(data.rawRows) ? data.rawRows : []);
    setMapping(Array.isArray(data.mapping) ? refreshMappingConfidence(data.mapping) : []);
    setRows(Array.isArray(data.rows) ? data.rows : []);
    setImageSourceName(data.imageSourceName || "");
    setImagesBySku(data.imagesBySku && typeof data.imagesBySku === "object" ? data.imagesBySku : {});
    setImageSummary(data.imageSummary || null);
    setSelected(data.selected && typeof data.selected === "object" ? data.selected : {});
    setFilter(data.filter || "all");
    setQuery(typeof data.query === "string" ? data.query : "");
    setTab(data.tab || "image");
    setImageMapMethod(data.imageMapMethod || "sku");
    setSubmitResult(data.submitResult || null);
    setBusy("");
    setAiProgress(null);
    setRevalidating(false);
    setUploadProgress(null);
    lastAiKey.current = "";
    lastAutoFixKey.current = "";
    lastRecoverKey.current = "";
    aiJob.current = null;
  };

  const switchListingKind = (nextKind) => {
    const next = normalizeListingKind(nextKind);
    if (next === listingKind) {
      if (step === 5) {
        setSubmitResult(null);
        setStep(1);
      }
      return;
    }
    const gen = kindSwitchGen.current + 1;
    kindSwitchGen.current = gen;
    sessionReady.current = false;
    saveWizardSession(mode, vendorId, listingKind, snapshotKindSession(listingKind));
    filesByKind.current[listingKind] = imageFilesBySku;
    activeKindRef.current = next;
    const saved = loadWizardSession(mode, vendorId, next);
    applyKindState(saved);
    const localFiles = filesByKind.current[next] && typeof filesByKind.current[next] === "object" ? filesByKind.current[next] : {};
    if (!saved || !kindSessionHasUploads(saved)) {
      filesByKind.current[next] = {};
      setImageFilesBySku({});
      saveWizardSession(mode, vendorId, next, emptyKindSession(next, { step: 1 }));
    } else {
      setImageFilesBySku(localFiles);
    }
    setListingKind(next);
    saveLastListingKind(mode, vendorId, next);
    if (!saved?.jobId || !kindSessionHasUploads(saved)) {
      queueMicrotask(() => {
        if (kindSwitchGen.current === gen) sessionReady.current = true;
      });
      return;
    }
    (async () => {
      try {
        const jobRes = await getBulkListingWizardJob(saved.jobId);
        if (kindSwitchGen.current === gen && jobRes?.status === 1) mergeImageSummary(jobRes.data.summary);
      } catch {
        /* keep locally stored mapping */
      }
      if (kindSwitchGen.current === gen) sessionReady.current = true;
    })();
  };

  const mergeImageSummary = (summary, extraBySku = {}) => {
    setImagesBySku((prev) => mergeImagesBySku(prev, extraBySku, summary?.by_sku || {}));
    if (summary) setImageSummary(summary);
  };

  const rememberLocalImageFiles = (files) => {
    setImageFilesBySku((prev) => {
      const next = { ...prev };
      files.forEach((file) => {
        const parsed = parseSkuImageFilename(file.webkitRelativePath || file.name);
        if (!parsed?.sku) return;
        next[parsed.sku] = { ...(next[parsed.sku] || {}), [parsed.order]: file };
      });
      filesByKind.current[listingKind] = next;
      return next;
    });
  };

  const uploadImages = async (fileList, zips = [], sourceName = "") => {
    if (requireVendor) {
      notifyOnFail("Select a vendor first");
      return;
    }
    const files = Array.from(fileList || []).filter((f) => isImageFile(f));
    const zipFiles = Array.from(zips || []).filter(
      (f) => f.name.toLowerCase().endsWith(".zip") || f.type.includes("zip"),
    );
    if (!files.length && !zipFiles.length) {
      notifyOnFail("Choose JPG, PNG, WebP images or a ZIP");
      return;
    }
    const label =
      sourceName ||
      zipFiles[0]?.name ||
      (files[0]?.webkitRelativePath ? files[0].webkitRelativePath.split("/")[0] : "") ||
      (files.length ? `${files.length} images` : "Images");
    const localBySku = indexImageFilesBySku(files);
    rememberLocalImageFiles(files);
    if (Object.keys(localBySku).length) {
      setImagesBySku((prev) => mergeImagesBySku(prev, localBySku));
    }
    setImageSourceName(label);
    setBusy("Uploading images…");
    const expectedBytes = [...files, ...zipFiles].reduce(
      (sum, file) => sum + (Number(file.size) || 0),
      0,
    );
    const startedAt = Date.now();
    // Bytes on the wire drive 0–85%; the server's stored/total drives 85–99%.
    let sentBytes = 0;
    const reportUpload = (bytesInCurrent, what, cap = 85) => {
      const done = Math.min(expectedBytes, sentBytes + Math.max(0, bytesInCurrent));
      const elapsed = Math.max(0.2, (Date.now() - startedAt) / 1000);
      const rate = done / elapsed;
      setUploadProgress({
        percent: expectedBytes
          ? Math.min(cap, Math.round((done / expectedBytes) * cap))
          : 0,
        label: `Uploading ${what}…`,
        eta: rate > 1 ? formatEta((expectedBytes - done) / rate) : "",
        detail: `${formatBytes(done)} of ${formatBytes(expectedBytes)}`,
      });
    };
    const reportUnpack = (progress) => {
      const total = Number(progress?.total) || 0;
      const stored = Number(progress?.stored) || 0;
      setUploadProgress({
        percent: total
          ? Math.min(99, 85 + Math.round((stored / Math.max(total, 1)) * 14))
          : 86,
        label: "Unpacking ZIP and storing images…",
        eta:
          total && stored < total
            ? `${total - stored} image${total - stored === 1 ? "" : "s"} left`
            : "Finishing up…",
        detail: total
          ? `${stored} of ${total} images stored`
          : `${label} · ${formatBytes(expectedBytes)}`,
      });
    };
    setUploadProgress({
      percent: 0,
      label: `Uploading ${label}…`,
      eta: "",
      detail: expectedBytes ? `0 B of ${formatBytes(expectedBytes)}` : "Starting upload…",
    });
    try {
      let currentJob = jobId;
      let lastSummary = null;
      let lastRes = null;

      if (files.length) {
        const imageBytes = files.reduce((sum, f) => sum + (Number(f.size) || 0), 0);
        setBusy(`Uploading images… 0 of ${files.length}`);
        const res = await uploadBulkListingImagesInSlices({
          jobId: currentJob,
          vendorId,
          files,
          onProgress: ({ loaded }) =>
            reportUpload(Math.min(Number(loaded) || 0, imageBytes), `${files.length} images`, 99),
        });
        if (res?.status !== 1) throw new Error(res?.message || "Upload failed");
        currentJob = res.data.job_id;
        setJobId(currentJob);
        sentBytes += imageBytes;
        lastSummary = res.data.summary;
        lastRes = res;
        mergeImageSummary(lastSummary, localBySku);
      }

      for (const zip of zipFiles) {
        const zipBytes = Number(zip.size) || 0;
        setBusy(`Uploading ${zip.name}…`);
        const res = await uploadBulkListingZipInChunks({
          jobId: currentJob,
          vendorId,
          file: zip,
          onProgress: ({ loaded }) =>
            reportUpload(Math.min(Number(loaded) || 0, zipBytes), zip.name),
        });
        if (res?.status !== 1) throw new Error(res?.message || "ZIP upload failed");
        currentJob = res.data.job_id;
        setJobId(currentJob);
        sentBytes += zipBytes;
        setBusy("Unpacking ZIP…");
        reportUnpack(res.data.progress);
        const finished = await waitForStagedBulkListingImages(currentJob, {
          onProgress: reportUnpack,
        });
        lastSummary = finished.data.summary;
        lastRes = finished;
        mergeImageSummary(lastSummary, localBySku);
      }
      setUploadProgress({ percent: 100, label: "Upload complete" });
      // Let the AI pass run again now that photos are mapped to SKUs.
      lastAiKey.current = "";
      lastRecoverKey.current = "";
      const mapped = Object.keys(mergeImagesBySku(localBySku, lastSummary?.by_sku || {})).length;
      const stored = Number(lastSummary?.total_images || mapped);
      const ignored = Number(lastSummary?.ignored || 0);
      const failed = Array.isArray(lastRes?.data?.failed) ? lastRes.data.failed.length : 0;
      if (!mapped && !stored) {
        notifyOnFail(
          "Name each file {SKU}-1.jpg to {SKU}-10.jpg. Example: lifeo-1601-slipeer-blue-956-1.jpg maps to SKU lifeo-1601-slipeer-blue-956.",
        );
        return;
      }
      let msg = `${stored} images mapped by {SKU}-1 … {SKU}-10`;
      if (ignored) msg += `. ${ignored} not named with -1 to -10`;
      if (failed) {
        const names = (lastRes?.data?.failed || [])
          .map((f) => f.originalName)
          .filter(Boolean)
          .slice(0, 3)
          .join(", ");
        msg += `. ${failed} failed${names ? `: ${names}` : ""}`;
      }
      notifyOnSuccess(msg);
    } catch (e) {
      const detail = getApiErrorMessage(e, "Could not store images on the server");
      if (Object.keys(localBySku).length) {
        notifyOnFail(detail || "Images are mapped in preview, but server upload failed. Try a ZIP or a smaller batch.");
      } else {
        notifyOnFail(detail);
      }
    } finally {
      setBusy("");
      setTimeout(() => setUploadProgress(null), 600);
    }
  };

  const clearExcel = () => {
    const previous = snapshotKindSession(listingKind);
    setExcelName("");
    setHeaders([]);
    setRawRows([]);
    setMapping([]);
    setRows([]);
    lastAiKey.current = "";
    lastRecoverKey.current = "";
    dropClonedKindSessions(mode, vendorId, previous, listingKind).forEach((kind) => {
      filesByKind.current[kind] = {};
    });
    saveWizardSession(mode, vendorId, listingKind, {
      ...previous,
      excelName: "",
      headers: [],
      rawRows: [],
      mapping: [],
      rows: [],
    });
  };

  const clearImages = () => {
    const previous = snapshotKindSession(listingKind);
    setJobId("");
    setImagesBySku({});
    setImageFilesBySku({});
    filesByKind.current[listingKind] = {};
    setImageSummary(null);
    setImageSourceName("");
    dropClonedKindSessions(mode, vendorId, previous, listingKind).forEach((kind) => {
      filesByKind.current[kind] = {};
    });
    saveWizardSession(mode, vendorId, listingKind, {
      ...previous,
      jobId: "",
      imagesBySku: {},
      imageSummary: null,
      imageSourceName: "",
    });
  };

  const onExcel = async (file) => {
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseListingWorkbook(buf);
      const parsedKind = normalizeListingKind(parsed.listingKind || "single");
      if (parsedKind !== listingKind) {
        notifyOnFail(
          `This Excel is a ${listingTemplate(parsedKind).name} file. Switch to that listing type first — each type keeps its own Excel and images until it is listed or you remove them.`,
        );
        return;
      }
      setExcelName(file.name);
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setMapping(applySavedMappingTemplate(parsed.headers, loadMappingTemplate()));
      lastAiKey.current = "";
      lastRecoverKey.current = "";
      notifyOnSuccess(`${parsed.rows.length} rows read from Excel`);
      if (jobId) {
        try {
          const jobRes = await getBulkListingWizardJob(jobId);
          if (jobRes?.status === 1) mergeImageSummary(jobRes.data.summary);
        } catch {
          /* keep already staged images */
        }
      }
    } catch (e) {
      notifyOnFail(e.message || "Could not read Excel");
    }
  };

  const mappedRows = useMemo(() => applyColumnMap(rawRows, mapping), [rawRows, mapping]);
  const filePreviewRows = useMemo(() => mergeGeneratedRows(mappedRows, rows), [mappedRows, rows]);

  const sourceRows = rows.length ? rows : mappedRows;

  const duplicateSkus = useMemo(() => duplicateSkuKeys(sourceRows), [sourceRows]);

  const validatedRows = useMemo(() => {
    return sourceRows.map((row) => {
      const result = validateListingRow(row, {
        taxonomy,
        colors,
        sizes,
        imagesBySku,
        existingSkus,
        duplicateSkus,
        listingKind,
      });
      const status = result.errors.length ? "error" : result.warnings.length ? "warning" : "valid";
      return { ...row, ...result, status };
    });
  }, [sourceRows, taxonomy, colors, sizes, imagesBySku, existingSkus, duplicateSkus, listingKind]);

  useEffect(() => {
    if (step !== 4 || !validatedRows.length) return;
    setSelected((prev) => {
      const next = { ...prev };
      let changed = false;
      validatedRows.forEach((row) => {
        if (row.status === "error") {
          // A row can turn invalid after selection, once lookups or photos load.
          if (next[row.row_id]) {
            next[row.row_id] = false;
            changed = true;
          }
          return;
        }
        if (next[row.row_id] === undefined) {
          next[row.row_id] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [step, validatedRows]);

  const stats = useMemo(() => {
    const total = validatedRows.length;
    const valid = validatedRows.filter((r) => r.status === "valid").length;
    const errors = validatedRows.filter((r) => r.status === "error").length;
    const warnings = validatedRows.filter((r) => r.status === "warning").length;
    return { total, valid, errors, warnings };
  }, [validatedRows]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return validatedRows.filter((row) => {
      if (filter === "errors" && row.status !== "error") return false;
      if (filter === "warnings" && row.status !== "warning") return false;
      if (filter === "valid" && row.status !== "valid") return false;
      if (!q) return true;
      return `${row.name} ${row.sku}`.toLowerCase().includes(q);
    });
  }, [validatedRows, filter, query]);

  const missingMandatory = [
    ...IERADA_FIELDS.filter((f) => {
      if (!f.required) return false;
      if (listingKind === "custom" && (f.key === "size" || f.key === "colour")) return false;
      return !mapping.some((m) => m.ierada === f.key);
    }),
    ...(listingKind === "custom"
      ? CUSTOM_ATTR_MAP_FIELDS.filter((f) => f.required && !mapping.some((m) => m.ierada === f.key))
      : []),
  ];

  const generateListingFields = async (list) => {
    if (aiJob.current) return aiJob.current;
    const run = (async () => {
      const source = list || [];
      const groupFill = new Map();
      let catalog = taxonomy;
      if (!catalog?.categories?.length) {
        try {
          const lookups = await loadLookups();
          catalog = lookups.taxonomy || catalog;
        } catch {
          /* keep current taxonomy */
        }
      }
      setBusy("Generating listing details…");
      let failure = "";
      const unique = [];
      const seenKeys = new Set();
      source.forEach((row) => {
        const key = variationAiCacheKey(row, listingKind);
        if (seenKeys.has(key)) return;
        seenKeys.add(key);
        unique.push(row);
      });
      const total = unique.length;
      let done = 0;
      const fillOne = async (row) => {
        const cacheKey = variationAiCacheKey(row, listingKind);
        let working = { ...row };
        const media = coverMediaForRow(working, source, imagesBySku, imageFilesBySku);
        const images = media.images;
        const cover = images.find((img) => Number(img.order) === 1) || images[0];
        const extras = customAttributeState(working);
        const filename = coverFilename(cover);
        let coverImage = null;
        try {
          coverImage = await coverImagePayload(cover, media.files);
        } catch {
          coverImage = null;
        }
        if (coverImage?.image_base64 || filename) {
          try {
            const payload = {
              listing_type: listingKind || "single",
              filename,
              sku: working.sku || "",
              fast: true,
              from_image: true,
              image_base64: coverImage?.image_base64 || "",
              mime_type: coverImage?.mime_type || "image/jpeg",
            };
            if (payload.image_base64 || payload.filename) {
              const res = await suggestListingCategory(payload);
              if (res?.status === 1 && res?.data) {
                working = applyCategorySuggestion(working, res.data, catalog);
              } else if (!failure) {
                failure = res?.message || "Category was not read from the cover photo";
              }
            }
          } catch (err) {
            if (!failure) failure = err?.message || "Category was not read from the cover photo";
          }
        }

        const preview = validateListingRow(working, {
          taxonomy: catalog,
          colors,
          sizes,
          imagesBySku,
          existingSkus,
          listingKind,
        });
        const category = preview.resolved.category;
        const subCategory = preview.resolved.subCategory;
        const inner = preview.resolved.inner;
        const treeTax = taxFromCategoryTree({
          category,
          subCategory,
          innerSubCategory: inner,
        });
        const lookup = inner?.id ? innerHsnGstLookup[String(inner.id)] : null;
        if (!String(working.hsn_code || "").trim()) {
          working.hsn_code = lookup?.hsn || treeTax.hsn_code || "";
        }
        if (working.gst === "" || working.gst == null) {
          const bandGst = gstFromBands(
            lookup?.bands,
            Number(working.selling_price || working.mrp),
            lookup?.tax != null ? lookup.tax : treeTax.gst,
          );
          if (bandGst != null) working.gst = bandGst;
          else if (lookup?.tax != null) working.gst = lookup.tax;
          else if (treeTax.gst != null) working.gst = treeTax.gst;
        }

        const skipAi = !coverImage?.image_base64 && !filename;
        if (!skipAi) {
          const listingFiles = Object.entries(media.files || {})
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([, file]) => file?.file || file)
            .filter(Boolean);
          const listingMedia = (images || [])
            .map((img, i) => ({
              url: wizardImageSrc(img),
              id: img.id,
              label: Number(img.order) === 1 || i === 0 ? "front" : `photo-${i + 1}`,
            }))
            .filter((item) => item.url);
          const state = {
            listingType:
              listingKind === "color_size" || listingKind === "custom"
                ? listingKind
                : "single",
            brandType: String(working.brand_type || "").toLowerCase() === "branded" ? "branded" : "generic",
            brand: working.brand,
            name: "",
            from_image: true,
            category_id: category?.id || "",
            sub_category_id: subCategory?.id || "",
            inner_sub_category_id: inner?.id || "",
            categoryTitle: category?.name || working.category,
            subCategoryTitle: subCategory?.name || working.sub_category,
            innerSubCategoryTitle: inner?.name || working.inner_sub_category,
            hsn_code: working.hsn_code,
            gst: working.gst,
            original_price: working.mrp,
            discounted_price: working.selling_price,
            package_length: working.package_length,
            package_width: working.package_width,
            package_height: working.package_height,
            package_weight: working.package_weight,
            countryOfOrigin: working.country_of_origin || "India",
            files: listingFiles.slice(0, 1),
            existingMedia: listingMedia.slice(0, 1),
            extraNotes: "",
            customRows: extras.customRows,
            colorGroups: extras.colorGroups,
          };
          let draft = null;
          try {
            const payload = await buildListingAiPayload(state);
            payload.from_image = true;
            payload.name = "";
            if (!payload.image_base64 && coverImage?.image_base64) {
              payload.image_base64 = coverImage.image_base64;
              payload.mime_type = coverImage.mime_type || "image/jpeg";
              payload.images = [
                { image_base64: coverImage.image_base64, mime_type: payload.mime_type },
              ];
            }
            const res = await generateListingAiDraft(payload);
            if (res?.status === 1) {
              draft = res?.data?.draft || res?.data || res?.draft || res;
            } else if (!failure) {
              failure = res?.message || "Listing text was not read from the cover photo";
            }
          } catch (err) {
            draft = null;
            if (!failure) failure = err?.message || "Listing text was not read from the cover photo";
          }
          if (!draft) {
            const kept = pickAiShare(working);
            groupFill.set(cacheKey, kept);
            publishFilledRow(cacheKey, kept);
            return working;
          }
          const merged = mergeAiDraft(state, {
            draft,
            forceOverwrite: true,
          });
          const tags = Array.isArray(merged.tags) ? merged.tags.join(", ") : String(merged.tags || "");
          working = {
            ...working,
            name: String(merged.name || "").trim(),
            short_description: String(merged.shortDescription || "").trim(),
            product_details: String(merged.productDetails || "").trim(),
            general_info: String(merged.generalInfo || "").trim(),
            key_features: pipeJoin(merged.keyFeatures),
            benefits: pipeJoin(merged.benefits),
            specifications: pipeJoin(merged.specifications),
            meta_title: String(merged.metaTitle || "").trim(),
            meta_description: String(merged.metaDescription || "").trim(),
            tags,
            country_of_origin: working.country_of_origin || merged.countryOfOrigin || "India",
          };
        }
        const shared = pickAiShare(working);
        groupFill.set(cacheKey, shared);
        publishFilledRow(cacheKey, shared);
        return working;
      };

      const publishFilledRow = (cacheKey, shared) => {
        if (!shared || !Object.keys(shared).length) return;
        setRows((prev) => {
          const base = prev.length ? prev : source;
          return base.map((row) =>
            variationAiCacheKey(row, listingKind) === cacheKey
              ? { ...row, ...shared, sku: row.sku, image_sku: row.image_sku, size: row.size }
              : row,
          );
        });
      };

      await mapLimit(unique, 8, async (row) => {
        try {
          await fillOne(row);
        } finally {
          done += 1;
          setAiProgress({
            current: done,
            total,
            sku: row.sku || "",
            percent: Math.round((done / Math.max(total, 1)) * 100),
            label: `Filled ${done} of ${total}`,
          });
        }
      });

      const filled = source.map((row) => {
        const shared = groupFill.get(variationAiCacheKey(row, listingKind));
        return shared ? { ...row, ...shared, sku: row.sku, image_sku: row.image_sku, size: row.size } : row;
      });
      setRows(filled);
      setBusy("");
      setAiProgress(null);
      filled.failure = failure;
      return filled;
    })();
    aiJob.current = run.finally(() => {
      aiJob.current = null;
    });
    return aiJob.current;
  };

  const downloadTemplate = async (kind) => {
    const nextKind = kind || listingKind || "single";
    try {
      await downloadBulkListingTemplate(nextKind);
    } catch {
      const hit = listingTemplate(nextKind);
      if (hit?.file) window.location.href = `/bulk-listing-templates/${hit.file}`;
      else notifyOnFail("Could not download template");
    }
  };

  const revalidateNow = async () => {
    if (revalidating) return;
    setRevalidating(true);
    setBusy("Re-validating file…");
    try {
      if (aiJob.current) await aiJob.current;
      const lookups = await loadLookups();
      const merged = expandMappedRowsBySize(mergeGeneratedRows(mappedRows, rows));
      let filled = merged;
      if (merged.some((row) => rowNeedsAiFill(row))) {
        filled = (await generateListingFields(merged)) || merged;
      } else {
        setRows(merged);
      }
      const results = filled.map((row) =>
        validateListingRow(row, {
          taxonomy: lookups.taxonomy,
          colors: lookups.colors,
          sizes: lookups.sizes,
          imagesBySku,
          existingSkus,
          listingKind,
        }),
      );
      const errorCount = results.filter((r) => r.errors.length).length;
      const warnCount = results.filter((r) => !r.errors.length && r.warnings.length).length;
      const validCount = results.length - errorCount;
      notifyOnSuccess(
        `Re-validated ${results.length} row${results.length === 1 ? "" : "s"} · ${validCount} valid · ${errorCount} error${errorCount === 1 ? "" : "s"}${warnCount ? ` · ${warnCount} warning${warnCount === 1 ? "" : "s"}` : ""}`,
      );
      if (errorCount) setFilter("errors");
    } catch (e) {
      notifyOnFail(e.message || "Could not re-validate");
    } finally {
      setBusy("");
      setRevalidating(false);
    }
  };

  const downloadSampleData = () => {
    if (!mappedRows.length) {
      downloadTemplate(listingKind || "single");
      return;
    }
    const bytes = buildPreviewSampleWorkbook(mappedRows, imagesBySku);
    downloadBlob(
      bytes,
      "IERADA_Bulk_Listing_Preview_Sample.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  };

  const autoMapNow = () => {
    setMapping(autoMapColumns(headers));
    notifyOnSuccess("Columns remapped from header names");
  };

  const saveCurrentMappingTemplate = () => {
    if (!mapping.length) {
      notifyOnFail("Map columns before saving a template");
      return;
    }
    saveMappingTemplate(mappingTemplatePayload(mapping));
    notifyOnSuccess("Mapping template saved on this browser");
  };

  const downloadMappedSample = () => {
    if (!mappedRows.length) {
      notifyOnFail("Upload Excel first");
      return;
    }
    const bytes = buildMappedSampleWorkbook(mappedRows, mapping);
    downloadBlob(
      bytes,
      "IERADA_Sample_Mapped_File.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  };

  const goMap = async () => {
    if (!stagedImageCount(imageSummary, imagesBySku)) {
      const recovered = await recoverStagedImages(mappedRows);
      if (!recovered.total) {
        explainMissingImages(recovered);
        return;
      }
    }
    if (!rawRows.length) {
      notifyOnFail("Upload the seller Excel file after images are stored");
      return;
    }
    setStep(2);
  };

  const goValidate = async () => {
    if (missingMandatory.length) {
      notifyOnFail(`Map mandatory fields: ${missingMandatory.map((f) => f.label).join(", ")}`);
      return;
    }
    lastAiKey.current = "";
    lastAutoFixKey.current = "";
    let filled = rows;
    if (aiJob.current) filled = (await aiJob.current) || filled;
    const merged = expandMappedRowsBySize(mergeGeneratedRows(mappedRows, filled));
    if (merged.some((row) => rowNeedsAiFill(row))) {
      await generateListingFields(merged);
    } else {
      setRows(merged);
    }
    setStep(3);
  };

  const pendingAiCount = useMemo(
    () => filePreviewRows.filter((row) => rowNeedsAiFill(row)).length,
    [filePreviewRows],
  );

  /** A session can lose its job id while the photos are still staged on the server. */
  const recoverStagedImages = async (list) => {
    const skus = [...new Set((list || []).map((row) => rowImageKey(row)).filter(Boolean))];
    if (!skus.length) return { total: 0, reason: "no_sku" };
    try {
      const res = await lookupStagedBulkListingImages({ vendorId, skus });
      if (res?.status !== 1) {
        return { total: 0, reason: "failed", message: res?.message };
      }
      const summary = res.data?.summary;
      const total = Number(summary?.total_images || 0);
      if (!total) {
        return { total: 0, reason: "no_match", skus, staged: res.data?.staged_skus || [] };
      }
      if (res.data?.job_id && !jobId) setJobId(res.data.job_id);
      mergeImageSummary(summary);
      return { total, reason: "ok" };
    } catch (e) {
      return { total: 0, reason: "failed", message: e?.message };
    }
  };

  /** Says which SKU the wizard looked for, instead of asking for another upload. */
  const explainMissingImages = (result) => {
    if (result?.reason === "failed") {
      notifyOnFail(
        result.message ||
          "Could not check the photos already stored for these SKUs. Reload the page and try again.",
      );
      return;
    }
    if (result?.reason === "no_match") {
      const asked = (result.skus || []).slice(0, 2).join(", ");
      const have = (result.staged || []).slice(0, 2).join(", ");
      notifyOnFail(
        have
          ? `No stored photo is named for ${asked}. Stored photos use ${have}. Fix the Image SKU column or upload files named {SKU}-1.`
          : `No stored photo is named for ${asked}. Upload images named ${asked ? `${asked}-1` : "{SKU}-1"} first.`,
      );
      return;
    }
    notifyOnFail("Store product images first, then generate listing details");
  };

  const runAiFillNow = async () => {
    if (aiJob.current) return;
    if (!mappedRows.length) {
      notifyOnFail("Upload the seller Excel file first");
      return;
    }
    if (!stagedImageCount(imageSummary, imagesBySku)) {
      const recovered = await recoverStagedImages(mappedRows);
      if (!recovered.total) {
        explainMissingImages(recovered);
        return;
      }
      notifyOnSuccess(
        `Re-attached ${recovered.total} stored image${recovered.total === 1 ? "" : "s"}`,
      );
    }
    const merged = mergeGeneratedRows(mappedRows, rows);
    if (!merged.some((row) => rowNeedsAiFill(row))) {
      notifyOnSuccess("Listing fields are already filled");
      return;
    }
    try {
      const filled = (await generateListingFields(merged)) || [];
      const left = filled.filter((row) => rowNeedsAiFill(row)).length;
      if (left) {
        notifyOnFail(
          filled.failure
            ? `${left} row${left === 1 ? "" : "s"} still need listing details. ${filled.failure}`
            : `${left} row${left === 1 ? "" : "s"} still need listing details`,
        );
      }
      else notifyOnSuccess("Listing details generated");
    } catch (e) {
      lastAiKey.current = "";
      notifyOnFail(e.message || "Could not generate listing details");
    }
  };

  useEffect(() => {
    if (!mappedRows.length) return undefined;
    if (stagedImageCount(imageSummary, imagesBySku)) return undefined;
    const key = `${excelName}|${mappedRows.length}|${listingKind}`;
    if (lastRecoverKey.current === key) return undefined;
    lastRecoverKey.current = key;
    recoverStagedImages(mappedRows);
    return undefined;
  }, [excelName, mappedRows.length, imageSummary?.total_images, imagesBySku, listingKind]);

  useEffect(() => {
    const imageCount = stagedImageCount(imageSummary, imagesBySku);
    if (!mappedRows.length || !imageCount) return undefined;
    const merged = mergeGeneratedRows(mappedRows, rows);
    const ready = merged.filter(
      (row) =>
        rowNeedsAiFill(row) && imagesForSku(imagesBySku, rowImageKey(row) || row.sku).length,
    );
    if (!ready.length) return undefined;
    const key = `${excelName}|${mappedRows.length}|${ready.length}|${listingKind}|image-visible`;
    if (lastAiKey.current === key) return undefined;
    lastAiKey.current = key;
    generateListingFields(merged).catch(() => {
      lastAiKey.current = "";
    });
    return undefined;
  }, [excelName, mappedRows.length, imageSummary?.total_images, imagesBySku, listingKind]);

  const goPreview = () => {
    const nextSelected = {};
    validatedRows.forEach((row) => {
      if (row.status !== "error") nextSelected[row.row_id] = true;
    });
    setSelected(nextSelected);
    setFilter("all");
    setQuery("");
    setStep(4);
  };

  const savePreviewRow = (rowId, patch) => {
    const source = rows.length ? rows : mappedRows;
    setRows(source.map((row) => (row.row_id === rowId ? { ...row, ...patch } : row)));
    notifyOnSuccess("Listing updated");
  };

  const downloadCompleted = () => {
    const bytes = buildCompletedWorkbook(rows.length ? rows : validatedRows);
    downloadBlob(
      bytes,
      `IERADA_Completed_Listing_${Date.now()}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  };

  const onReuploadCompleted = async (file) => {
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseListingWorkbook(buf);
      const remapped = autoMapColumns(parsed.headers);
      const applied = applyColumnMap(parsed.rows, remapped);
      const merged = applied.map((row, i) => ({
        ...(rows[i] || {}),
        ...row,
        row_id: rows[i]?.row_id || row.row_id,
      }));
      setRawRows(parsed.rows);
      setHeaders(parsed.headers);
      setMapping(remapped);
      setRows(merged);
      notifyOnSuccess("Completed Excel re-uploaded. Review and submit.");
    } catch (e) {
      notifyOnFail(e.message || "Could not read completed Excel");
    }
  };

  const submitListings = async () => {
    // Status only exists on validated rows — filtering plain rows would pass errors through.
    const chosen = validatedRows.filter(
      (row) => selected[row.row_id] && row.status !== "error",
    );
    if (!chosen.length) {
      notifyOnFail("Select at least one valid product");
      return;
    }
    setBusy("Submitting listings…");
    let success = 0;
    const failed = [];

    if (listingKind === "color_size") {
      const groups = groupColorSizeSubmitRows(chosen);
      // A parent lists as one product, so a single bad size row must hold back
      // the whole group instead of publishing a listing that is missing sizes.
      const siblingErrors = new Map();
      groupColorSizeSubmitRows(validatedRows).forEach((group) => {
        const key = normalizeSkuKey(group.parentSku) || group.rows[0]?.row_id;
        const bad = group.rows.find((row) => row.status === "error");
        if (key && bad) siblingErrors.set(key, bad);
      });
      for (const group of groups) {
        const parentSku = group.parentSku || group.rows[0]?.sku || "";
        const sibling = siblingErrors.get(
          normalizeSkuKey(group.parentSku) || group.rows[0]?.row_id,
        );
        if (sibling) {
          failed.push({
            sku: sibling.sku || parentSku,
            parentSku,
            variantSku: sibling.sku || "",
            error: sibling.errors?.[0] || "Another row under this parent SKU has an error",
          });
          continue;
        }
        try {
          const checked = group.rows.map((row) => ({
            row,
            result: validateListingRow(row, {
              taxonomy,
              colors,
              sizes,
              imagesBySku,
              existingSkus,
              duplicateSkus,
              listingKind,
            }),
          }));
          const bad = checked.find((item) => item.result.errors.length);
          if (bad) {
            failed.push({
              sku: bad.row.sku || parentSku,
              parentSku,
              variantSku: bad.row.sku || "",
              error: bad.result.errors[0],
            });
            continue;
          }

          const colorMap = new Map();
          const images = [];
          const seenImages = new Set();
          let stockTotal = 0;
          checked.forEach(({ row, result }) => {
            const colour = result.resolved.colour;
            if (!colour?.id) return;
            const key = String(colour.id);
            if (!colorMap.has(key)) {
              colorMap.set(key, {
                color_id: colour.id,
                color_name: colour.name,
                sizes: [],
              });
            }
            const bucket = colorMap.get(key);
            const rowSizes = result.resolved.sizes?.length
              ? result.resolved.sizes
              : [result.resolved.size].filter(Boolean);
            rowSizes.forEach((size) => {
              if (!size?.id) return;
              if (bucket.sizes.some((s) => String(s.size_id) === String(size.id))) return;
              const stock = Number(row.stock) || 0;
              stockTotal += stock;
              bucket.sizes.push({
                size_id: size.id,
                size_name: size.name,
                stock,
                original_price: row.mrp,
                discounted_price: row.selling_price,
                sku: sizeVariantSku(row.sku, size.name || size.title, rowSizes.length),
                barcode: row.barcode || null,
                enabled: true,
              });
            });
            (result.resolved.images || []).forEach((img) => {
              const token = img?.id || img?.filename || img?.originalName;
              if (!token || seenImages.has(token)) return;
              seenImages.add(token);
              images.push(img);
            });
          });

          const colorGroups = [...colorMap.values()];
          if (!colorGroups.length) {
            failed.push({
              sku: parentSku,
              parentSku,
              variantSku: group.rows[0]?.sku || "",
              error: "No colour resolved for this parent SKU",
            });
            continue;
          }
          const expandedSkus = colorGroups.flatMap((groupRow) =>
            (groupRow.sizes || []).map((size) => String(size.sku || "").trim()).filter(Boolean),
          );
          const repeatedSku = expandedSkus.find(
            (sku, i) =>
              expandedSkus.findIndex((other) => other.toLowerCase() === sku.toLowerCase()) !== i,
          );
          if (repeatedSku) {
            failed.push({
              sku: repeatedSku,
              parentSku,
              variantSku: repeatedSku,
              error: `Variant SKU "${repeatedSku}" would be used for more than one size. Give that colour its own Variant SKU — the Parent SKU can stay the same.`,
            });
            continue;
          }

          const head = checked[0];
          const row = head.row;
          const resolved = head.result.resolved;
          const state = {
            vendor_id: vendorId,
            listingType: "color_size",
            brandType:
              String(row.brand_type || "").toLowerCase() === "branded" ? "branded" : "generic",
            brand: row.brand,
            name: row.name,
            sku: parentSku,
            hsn_code: row.hsn_code,
            gst: row.gst,
            original_price: row.mrp,
            discounted_price: row.selling_price,
            stock: stockTotal,
            package_weight: row.package_weight,
            package_length: row.package_length,
            package_width: row.package_width,
            package_height: row.package_height,
            countryOfOrigin: row.country_of_origin || "India",
            barcode: row.barcode || "",
            category_id: resolved.category?.id || "",
            sub_category_id: resolved.subCategory?.id || "",
            inner_sub_category_id: resolved.inner?.id || "",
            categoryTitle: resolved.category?.name || row.category,
            subCategoryTitle: resolved.subCategory?.name || row.sub_category,
            innerSubCategoryTitle: resolved.inner?.name || "",
            colorGroups,
            shortDescription: row.short_description || "",
            productDetails: row.product_details || "",
            generalInfo: row.general_info || "",
            keyFeatures: splitPipe(row.key_features),
            benefits: splitPipe(row.benefits),
            whatsInTheBox: splitWhatsInTheBox(row.whats_in_the_box),
            specifications: parseSpecs(row.specifications),
            metaTitle: row.meta_title || "",
            metaDescription: row.meta_description || "",
            tags: String(row.tags || "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            files: [],
            existingMedia: images.map((img) => ({ url: img.url, id: img.id })),
            visibility: "Hidden",
            listing_status: mode === "admin" ? "published" : "pending_review",
          };
          const stagedIds = images.map((img) => img.id).filter(Boolean);
          if (!stagedIds.length) {
            failed.push({
              sku: parentSku,
              parentSku,
              variantSku: group.rows[0]?.sku || "",
              error:
                "Photos are not stored on the server yet. Re-upload the ZIP or folder, then submit.",
            });
            continue;
          }
          const built = buildSmartListingFormData(state, {
            requestPublish: mode === "vendor",
            adminPublish: mode === "admin",
          });
          built.formData.append(
            "staged_image_ids",
            JSON.stringify(stagedIds),
          );
          const res = await addProduct(built.formData);
          if (res?.status === 1) {
            success += 1;
            group.rows.forEach((r) => existingSkus.add(String(r.sku).toLowerCase()));
          } else {
            failed.push({
              sku: parentSku,
              parentSku,
              variantSku: group.rows[0]?.sku || "",
              error: res?.message || "Submit failed",
            });
          }
        } catch (e) {
          failed.push({
            sku: parentSku,
            parentSku,
            variantSku: group.rows[0]?.sku || "",
            error: getApiErrorMessage(e, "Submit failed"),
          });
        }
      }
    } else if (listingKind === "custom") {
      const groups = groupColorSizeSubmitRows(chosen);
      const siblingErrors = new Map();
      groupColorSizeSubmitRows(validatedRows).forEach((group) => {
        const key = normalizeSkuKey(group.parentSku) || group.rows[0]?.row_id;
        const bad = group.rows.find((row) => row.status === "error");
        if (key && bad) siblingErrors.set(key, bad);
      });
      for (const group of groups) {
        const parentSku = group.parentSku || group.rows[0]?.sku || "";
        const sibling = siblingErrors.get(
          normalizeSkuKey(group.parentSku) || group.rows[0]?.row_id,
        );
        if (sibling) {
          failed.push({
            sku: sibling.sku || parentSku,
            parentSku,
            variantSku: sibling.sku || "",
            error: sibling.errors?.[0] || "Another row under this parent SKU has an error",
          });
          continue;
        }
        try {
          const checked = group.rows.map((row) => ({
            row,
            result: validateListingRow(row, {
              taxonomy,
              colors,
              sizes,
              imagesBySku,
              existingSkus,
              duplicateSkus,
              listingKind,
            }),
          }));
          const bad = checked.find((item) => item.result.errors.length);
          if (bad) {
            failed.push({
              sku: bad.row.sku || parentSku,
              parentSku,
              variantSku: bad.row.sku || "",
              error: bad.result.errors[0],
            });
            continue;
          }
          const images = [];
          const seenImages = new Set();
          const customRows = [];
          let stockTotal = 0;
          checked.forEach(({ row, result }, i) => {
            stockTotal += Number(row.stock) || 0;
            (result.resolved.images || []).forEach((img) => {
              const token = img?.id || img?.filename || img?.originalName;
              if (!token || seenImages.has(token)) return;
              seenImages.add(token);
              images.push(img);
            });
            const attributes = [1, 2, 3, 4]
              .map((n) => ({
                attribute_name: String(row[`attr${n}_name`] || "").trim(),
                attribute_value: String(row[`attr${n}_value`] || "").trim(),
              }))
              .filter((item) => item.attribute_value);
            customRows.push({
              enabled: true,
              grouping_key: i,
              stock: row.stock,
              original_price: row.mrp,
              discounted_price: row.selling_price,
              sku: row.sku,
              barcode: row.barcode || null,
              attributes,
            });
          });
          if (!customRows.length) {
            failed.push({
              sku: parentSku,
              parentSku,
              variantSku: group.rows[0]?.sku || "",
              error: "Custom variation values are required",
            });
            continue;
          }
          const stagedIds = images.map((img) => img.id).filter(Boolean);
          if (!stagedIds.length) {
            failed.push({
              sku: parentSku,
              parentSku,
              variantSku: group.rows[0]?.sku || "",
              error:
                "Photos are not stored on the server yet. Re-upload the ZIP or folder, then submit.",
            });
            continue;
          }
          const head = checked[0];
          const row = head.row;
          const resolved = head.result.resolved;
          const state = {
            vendor_id: vendorId,
            listingType: "custom",
            brandType:
              String(row.brand_type || "").toLowerCase() === "branded" ? "branded" : "generic",
            brand: row.brand,
            name: row.name,
            sku: parentSku,
            hsn_code: row.hsn_code,
            gst: row.gst,
            original_price: row.mrp,
            discounted_price: row.selling_price,
            stock: stockTotal,
            package_weight: row.package_weight,
            package_length: row.package_length,
            package_width: row.package_width,
            package_height: row.package_height,
            countryOfOrigin: row.country_of_origin || "India",
            barcode: row.barcode || "",
            category_id: resolved.category?.id || "",
            sub_category_id: resolved.subCategory?.id || "",
            inner_sub_category_id: resolved.inner?.id || "",
            categoryTitle: resolved.category?.name || row.category,
            subCategoryTitle: resolved.subCategory?.name || row.sub_category,
            innerSubCategoryTitle: resolved.inner?.name || "",
            customRows,
            shortDescription: row.short_description || "",
            productDetails: row.product_details || "",
            generalInfo: row.general_info || "",
            keyFeatures: splitPipe(row.key_features),
            benefits: splitPipe(row.benefits),
            whatsInTheBox: splitWhatsInTheBox(row.whats_in_the_box),
            specifications: parseSpecs(row.specifications),
            metaTitle: row.meta_title || "",
            metaDescription: row.meta_description || "",
            tags: String(row.tags || "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            files: [],
            existingMedia: images.map((img) => ({ url: img.url, id: img.id })),
            visibility: "Hidden",
            listing_status: mode === "admin" ? "published" : "pending_review",
          };
          const built = buildSmartListingFormData(state, {
            requestPublish: mode === "vendor",
            adminPublish: mode === "admin",
          });
          built.formData.append("staged_image_ids", JSON.stringify(stagedIds));
          const res = await addProduct(built.formData);
          if (res?.status === 1) {
            success += 1;
            group.rows.forEach((r) => existingSkus.add(String(r.sku).toLowerCase()));
          } else {
            failed.push({
              sku: parentSku,
              parentSku,
              variantSku: group.rows[0]?.sku || "",
              error: res?.message || "Submit failed",
            });
          }
        } catch (e) {
          failed.push({
            sku: parentSku,
            parentSku,
            variantSku: group.rows[0]?.sku || "",
            error: getApiErrorMessage(e, "Submit failed"),
          });
        }
      }
    } else {
    for (const row of chosen) {
      try {
        const result = validateListingRow(row, {
          taxonomy,
          colors,
          sizes,
          imagesBySku,
          existingSkus,
          duplicateSkus,
          listingKind,
        });
        if (result.errors.length) {
          failed.push({ sku: row.sku, error: result.errors[0] });
          continue;
        }
        const images = result.resolved.images || [];
        const state = {
          vendor_id: vendorId,
          listingType: "single",
          brandType: String(row.brand_type || "").toLowerCase() === "branded" ? "branded" : "generic",
          brand: row.brand,
          name: row.name,
          sku: row.sku,
          hsn_code: row.hsn_code,
          gst: row.gst,
          original_price: row.mrp,
          discounted_price: row.selling_price,
          stock: row.stock,
          package_weight: row.package_weight,
          package_length: row.package_length,
          package_width: row.package_width,
          package_height: row.package_height,
          countryOfOrigin: row.country_of_origin || "India",
          barcode: row.barcode || "",
          category_id: result.resolved.category?.id || "",
          sub_category_id: result.resolved.subCategory?.id || "",
          inner_sub_category_id: result.resolved.inner?.id || "",
          categoryTitle: result.resolved.category?.name || row.category,
          subCategoryTitle: result.resolved.subCategory?.name || row.sub_category,
          innerSubCategoryTitle: result.resolved.inner?.name || "",
          color_id: result.resolved.colour?.id || "",
          color_name: result.resolved.colour?.name || row.colour,
          size_id: result.resolved.size?.id || "",
          shortDescription: row.short_description || "",
          productDetails: row.product_details || "",
          generalInfo: row.general_info || "",
          keyFeatures: splitPipe(row.key_features),
          benefits: splitPipe(row.benefits),
          whatsInTheBox: splitWhatsInTheBox(row.whats_in_the_box),
          specifications: parseSpecs(row.specifications),
          metaTitle: row.meta_title || "",
          metaDescription: row.meta_description || "",
          tags: String(row.tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          files: [],
          existingMedia: images.map((img) => ({ url: img.url, id: img.id })),
          visibility: "Hidden",
          listing_status: mode === "admin" ? "published" : "pending_review",
        };
        const stagedIds = images.map((img) => img.id).filter(Boolean);
        if (!stagedIds.length) {
          failed.push({
            sku: row.sku,
            error:
              "Photos are not stored on the server yet. Re-upload the ZIP or folder, then submit.",
          });
          continue;
        }
        const built = buildSmartListingFormData(state, {
          requestPublish: mode === "vendor",
          adminPublish: mode === "admin",
        });
        built.formData.append("staged_image_ids", JSON.stringify(stagedIds));
        const res = await addProduct(built.formData);
        if (res?.status === 1) {
          success += 1;
          existingSkus.add(String(row.sku).toLowerCase());
        } else {
          failed.push({ sku: row.sku, error: res?.message || "Submit failed" });
        }
      } catch (e) {
        failed.push({ sku: row.sku, error: getApiErrorMessage(e, "Submit failed") });
      }
    }
    }
    const result = {
      success,
      failed,
      total: stats.total,
      valid: stats.valid,
      warnings: stats.warnings,
      errors: stats.errors + failed.length,
      submitted: chosen.length,
      at: new Date().toISOString(),
      fileName: excelName,
    };
    if (success && !failed.length) {
      const previous = snapshotKindSession(listingKind);
      filesByKind.current[listingKind] = {};
      lastAiKey.current = "";
      lastRecoverKey.current = "";
      aiJob.current = null;
      setJobId("");
      setExcelName("");
      setHeaders([]);
      setRawRows([]);
      setMapping([]);
      setRows([]);
      setImagesBySku({});
      setImageFilesBySku({});
      setImageSummary(null);
      setImageSourceName("");
      setSelected({});
      dropClonedKindSessions(mode, vendorId, previous, listingKind).forEach((kind) => {
        filesByKind.current[kind] = {};
      });
      saveWizardSession(
        mode,
        vendorId,
        listingKind,
        emptyKindSession(listingKind, { step: 5, submitResult: result }),
      );
    }
    setSubmitResult(result);
    setBusy("");
    // Nothing was accepted, so keep the seller on Preview to fix and retry
    // instead of showing a submitted screen for zero listings.
    setStep(success ? 5 : 4);
    if (success) notifyOnSuccess(`${success} products submitted`);
    if (failed.length) {
      notifyOnFail(
        success
          ? `${failed.length} listings failed. Fix them and submit again.`
          : `Nothing was submitted. ${failed.length} listing${failed.length > 1 ? "s" : ""} failed — fix the errors below and submit again.`,
      );
    }
  };

  const returnToUpload = () => {
    setSubmitResult(null);
    setStep(1);
  };

  const previewRows = validatedRows;
  const activeTemplate = listingTemplate(listingKind);

  return (
    <div className={`px-4 pt-4 lg:px-6 ${step === 4 || step === 5 ? "pb-8" : "pb-24"} ${aiProgress ? "pointer-events-none" : ""}`}>
      <div className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[18px] font-bold text-[#1A2B48]">
              {activeTemplate.title}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {activeTemplate.blurb} Upload the matching Excel and create listings in one go.
            </p>
            <ListingTypePicker
              value={listingKind}
              onChange={switchListingKind}
              onDownload={downloadTemplate}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadTemplate(listingKind)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1A2B48]"
            >
              <Download className="h-3.5 w-3.5" /> Download Template
            </button>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="inline-flex items-center rounded-lg border border-[#F56C43] px-3 py-1.5 text-[12px] font-semibold text-[#F56C43]"
            >
              Need Help?
            </button>
          </div>
        </div>
      </div>

      {requireVendor ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Select a vendor above before staging images or uploading Excel.
        </div>
      ) : null}

      <Stepper step={step} />

      {busy ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          <Loader2 className="h-4 w-4 animate-spin" /> {busy}
        </p>
      ) : null}

      {step === 1 ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-[#1A2B48]">1. Upload Your Excel File</h2>
            <p className="mt-1 text-xs text-gray-500">
              Download the {activeTemplate.name} template, fill it, then upload the file.
            </p>
            <DropZone
              onFiles={(files) => {
                const xlsx = Array.from(files || []).find((f) => /\.xlsx?$/i.test(f.name));
                if (xlsx) onExcel(xlsx);
              }}
              className="mt-4 rounded-xl border-2 border-dashed border-[#F56C43]/45 bg-[#FFF8F4] p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white">
                  <FileSpreadsheet className="h-7 w-7 text-emerald-600" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1A2B48]">
                    {excelName || activeTemplate.file}
                  </p>
                  <p className="text-[11px] text-emerald-600">
                    {excelName ? "Uploaded — stays until this type is listed, or you remove it" : "(Recommended format)"}
                  </p>
                </div>
                {excelName ? (
                  <button
                    type="button"
                    onClick={clearExcel}
                    className="rounded-md p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-500"
                    title="Remove Excel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => excelRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#F56C43] bg-white px-3 py-2 text-xs font-semibold text-[#F56C43]"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Choose File
                </button>
                <span className="text-xs text-gray-500">Or drag and drop your file here</span>
              </div>
              <input
                ref={excelRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => onExcel(e.target.files?.[0])}
              />
              <p className="mt-3 text-[11px] text-gray-400">
                Maximum file size: 25 MB &nbsp;|&nbsp; Allowed format: .xlsx, .xls
              </p>
            </DropZone>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-[#1A2B48]">2. Upload Product Images</h2>
            <p className="mt-1 text-xs text-gray-500">
              Upload product images in bulk and map them by SKU.
            </p>
            <DropZone
              onFiles={(files) => {
                const list = Array.from(files || []);
                const zips = list.filter((f) => f.name.toLowerCase().endsWith(".zip"));
                const imgs = list.filter((f) => isImageFile(f));
                const folder = imgs.find((f) => f.webkitRelativePath)?.webkitRelativePath?.split("/")[0];
                if (imgs.length || zips.length) {
                  uploadImages(imgs, zips, zips[0]?.name || folder || "");
                }
              }}
              className="mt-4 rounded-xl border-2 border-dashed border-[#F56C43]/45 bg-[#FFF8F4] p-5 text-center"
            >
              <ImagePlus className="mx-auto h-9 w-9 text-[#F56C43]" />
              <p className="mt-2 text-sm font-semibold text-[#1A2B48]">
                {imageSourceName || "Drag and drop product images here"}
              </p>
              <p className="text-[11px] text-gray-500">
                {imageSourceName
                  ? "Uploaded — stays until this type is listed, or you remove it"
                  : "or choose an option below"}
              </p>
              {imageSourceName ? (
                <button
                  type="button"
                  onClick={clearImages}
                  className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-rose-500 hover:bg-rose-50"
                >
                  <X className="h-3.5 w-3.5" /> Remove images
                </button>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => imageRef.current?.click()}
                  className="rounded-lg bg-[#F56C43] px-3 py-2 text-xs font-semibold text-white"
                >
                  Choose Images
                </button>
                <button
                  type="button"
                  onClick={() => zipRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#F56C43]/40 bg-white px-3 py-2 text-xs font-semibold text-[#1A2B48]"
                >
                  <Archive className="h-3.5 w-3.5" /> Upload ZIP
                </button>
                <button
                  type="button"
                  onClick={() => folderRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#F56C43]/40 bg-white px-3 py-2 text-xs font-semibold text-[#1A2B48]"
                >
                  <FolderUp className="h-3.5 w-3.5" /> Upload Folder
                </button>
              </div>
              <input
                ref={imageRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => uploadImages(e.target.files)}
              />
              <input
                ref={zipRef}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={(e) => uploadImages([], e.target.files, e.target.files?.[0]?.name || "images.zip")}
              />
              <input
                ref={folderRef}
                type="file"
                multiple
                // @ts-expect-error webkitdirectory
                webkitdirectory=""
                directory=""
                className="hidden"
                onChange={(e) => {
                  const list = Array.from(e.target.files || []);
                  const folder = list[0]?.webkitRelativePath?.split("/")[0] || "Folder";
                  uploadImages(e.target.files, [], folder);
                }}
              />
              <p className="mt-3 text-[11px] text-gray-500">
                Supported formats: JPG, PNG, WebP &nbsp;|&nbsp; Max 10 images per product
              </p>
              <p className="text-[11px] text-gray-500">Recommended naming: SKU-1, SKU-2, SKU-3… (cover is SKU-1)</p>
              <p className="text-[11px] text-gray-500">You can also upload a ZIP file containing product images.</p>
              <UploadProgressBar progress={uploadProgress} />
            </DropZone>
            <div className="mt-4 rounded-xl border border-gray-100 bg-white p-3">
              <p className="flex items-center gap-1 text-xs font-semibold text-[#1A2B48]">
                Image Mapping Method
                <Info className="h-3.5 w-3.5 text-gray-400" />
              </p>
              <label className="mt-2 flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  name="image-map-method"
                  className="mt-0.5 accent-[#F56C43]"
                  checked={imageMapMethod === "sku"}
                  onChange={() => setImageMapMethod("sku")}
                />
                <span>
                  <p className="text-xs font-semibold text-[#1A2B48]">Match by SKU filename (Recommended)</p>
                  <p className="text-[11px] text-gray-500">Images will be matched to products using SKU from filename.</p>
                </span>
              </label>
              <label className="mt-2 flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  name="image-map-method"
                  className="mt-0.5 accent-[#F56C43]"
                  checked={imageMapMethod === "manual"}
                  onChange={() => setImageMapMethod("manual")}
                />
                <span>
                  <p className="text-xs font-semibold text-[#1A2B48]">Manual mapping after upload</p>
                  <p className="text-[11px] text-gray-500">You can manually map images to products in the next step.</p>
                </span>
              </label>
            </div>
          </section>

          <ImportantInstructions tab={tab} setTab={setTab} listingKind={listingKind} />

          <div className="xl:col-span-2">
            <FilePreviewSection
              rows={filePreviewRows}
              imagesBySku={imagesBySku}
              onDownload={downloadSampleData}
              onProceed={goMap}
              onGenerateAi={runAiFillNow}
              pendingAiCount={pendingAiCount}
              aiBusy={Boolean(aiProgress)}
              generatingSku={aiProgress?.sku}
              listingKind={listingKind}
            />
          </div>
          <aside className="space-y-4">
            <TemplateColumnGuide />
            <NeedHelpCard
              onGuide={() => setGuideOpen(true)}
              supportTo={mode === "vendor" ? "/support" : null}
            />
          </aside>
          <div className="xl:col-span-3">
            <UploadedImagesSummary
              summary={imageSummary}
              mappedRows={mappedRows}
              imagesBySku={imagesBySku}
            />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <MapFieldsStep
          headers={headers}
          mapping={mapping}
          rawRows={rawRows}
          imagesBySku={imagesBySku}
          missingMandatory={missingMandatory}
          onChangeMapping={setMapping}
          onAutoMap={autoMapNow}
          onGuide={() => setGuideOpen(true)}
          onDownloadMapped={downloadMappedSample}
          onProceed={goValidate}
          busy={busy}
        />
      ) : null}

      {step === 3 ? (
        <ValidateDataStep
          stats={stats}
          filter={filter}
          setFilter={setFilter}
          query={query}
          setQuery={setQuery}
          visibleRows={visibleRows}
          listingKind={listingKind}
          imagesBySku={imagesBySku}
          onRevalidate={revalidateNow}
          revalidating={revalidating}
          onGuide={() => setGuideOpen(true)}
          onFix={async () => {
            setFilter("errors");
            lastAiKey.current = "";
            lastAutoFixKey.current = "";
            await revalidateNow();
          }}
          onView={(row) => {
            const issues = [...(row.errors || []), ...(row.warnings || [])];
            notifyOnSuccess(issues.join(" · ") || `${row.name || row.sku} is valid`);
          }}
        />
      ) : null}

      {step === 4 ? (
        <PreviewConfirmStep
          stats={stats}
          rows={previewRows}
          visibleRows={visibleRows}
          listingKind={listingKind}
          imagesBySku={imagesBySku}
          selected={selected}
          setSelected={setSelected}
          filter={filter}
          setFilter={setFilter}
          query={query}
          setQuery={setQuery}
          busy={busy}
          completedRef={completedRef}
          taxonomy={taxonomy}
          colors={colors}
          sizes={sizes}
          onEditMapping={() => setStep(2)}
          onBackToValidate={() => setStep(3)}
          onSubmit={submitListings}
          onSaveRow={savePreviewRow}
          onDownloadCompleted={downloadCompleted}
          onReuploadCompleted={onReuploadCompleted}
          submitFailures={submitResult && !submitResult.success ? submitResult.failed : []}
        />
      ) : null}

      {step === 5 ? (
        <SubmitCompleteStep
          mode={mode}
          stats={stats}
          submitResult={submitResult}
          listPath={listPath}
          historyPath={mode === "admin" ? "/product/bulk" : "/bulk-upload"}
          supportTo="/support"
          onUploadAnother={returnToUpload}
          onBackToPreview={() => setStep(4)}
        />
      ) : null}

      {step < 5 && step !== 4 ? (
        <div className="sticky bottom-0 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 border-t bg-[#F5F6F8]/95 py-3 backdrop-blur">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="inline-flex items-center gap-1 rounded-lg border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step === 1 && (
            <button
              type="button"
              onClick={goMap}
              className="inline-flex items-center gap-1 rounded-lg bg-[#F56C43] px-4 py-2 text-sm font-semibold text-white"
            >
              Proceed to Map Fields <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {step === 2 && (
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3">
              <MapFieldsFooterStats mapping={mapping} headers={headers} rawRows={rawRows} />
              <button
                type="button"
                onClick={saveCurrentMappingTemplate}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1A2B48]"
              >
                Save Mapping Template
              </button>
              <button
                type="button"
                onClick={goValidate}
                disabled={Boolean(busy)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#F56C43] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Proceed to Validate Data <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3">
              <ValidateFooterStats stats={stats} />
              <button
                type="button"
                disabled={stats.valid + stats.warnings === 0 || Boolean(aiProgress)}
                onClick={goPreview}
                className="inline-flex items-center gap-1 rounded-lg bg-[#F56C43] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Proceed to Preview <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : null}

      {guideOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5">
            <p className="text-lg font-semibold text-[#1A2B48]">Bulk listing guide</p>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-gray-700">
              <li>Pick listing type: Single Products, Colour × Size, or Custom Variations. Download that Excel.</li>
              <li>Upload images named {"{SKU}"}-1 (cover) through {"{SKU}"}-10. Colour × Size can share photos with Image SKU.</li>
              <li>Single: one SKU, one colour and one size per Products row. Colour × Size: parent SKU on Products (repeats on Variations), unique Variant SKU per colour; sizes can be comma-separated. Custom: Products + Attributes + Variations.</li>
              <li>Kids Fashion sizes: pick an age-group size (6-9 Months, 12-15 Months, 2-2.5 Years…) from the Size dropdown, not adult S/M/L.</li>
              <li>Map columns. The wizard matches Image SKU or SKU to staged photos, then AI writes title, category, HSN/GST and copy from SKU-1.</li>
              <li>Validate, download the completed Excel, edit if needed, re-upload on Preview, then submit. Vendor listings stay Hidden until review.</li>
            </ol>
            <button
              type="button"
              className="mt-4 rounded-lg bg-[#F56C43] px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setGuideOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
      <AiProgressModal progress={aiProgress} />
    </div>
  );
}
