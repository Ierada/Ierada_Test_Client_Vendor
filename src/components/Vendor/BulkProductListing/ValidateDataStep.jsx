import React, { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Lightbulb,
  Loader2,
  MoreHorizontal,
  Play,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import {
  imagesForSku,
  isVariationListingKind,
  isCustomListingKind,
  customAttributeColumns,
  variantAttrValue,
  previewAiMode,
  variationPreviewGroups,
  listingTableScrollClass,
  listingTableHeadClass,
  wizardImageSrc,
} from "./wizardEngine";

function Thumbs({ images }) {
  if (!images?.length) {
    return (
      <span className="inline-flex rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-500">
        Missing
      </span>
    );
  }
  const shown = images.slice(0, 3);
  const extra = images.length - shown.length;
  return (
    <div className="flex w-max items-center">
      {shown.map((img, i) => (
        <img
          key={`${img.filename || img.url || i}`}
          src={wizardImageSrc(img)}
          alt=""
          className={`relative h-8 w-8 shrink-0 rounded-md bg-gray-100 object-cover ring-2 ring-white ${i ? "-ml-2" : ""}`}
        />
      ))}
      {extra > 0 ? <span className="ml-1 shrink-0 text-[11px] font-semibold text-[#F56C43]">+{extra}</span> : null}
    </div>
  );
}

function variantRows(variant) {
  return variant.rows?.length ? variant.rows : [variant.row];
}

function variantStatus(variant) {
  const list = variantRows(variant);
  if (list.some((row) => row.status === "error")) return "error";
  if (list.some((row) => row.status === "warning")) return "warning";
  if (list.some((row) => row.status === "valid")) return "valid";
  return list[0]?.status || "";
}

function variantIssues(variant) {
  const issues = [];
  variantRows(variant).forEach((row) => {
    [...(row.errors || []), ...(row.warnings || [])].forEach((issue) => {
      if (!issues.includes(issue)) issues.push(issue);
    });
  });
  return issues;
}

function variantActionRow(variant) {
  return variantRows(variant).find((row) => row.status === "error") || variant.row;
}

function StatusCell({ status }) {
  if (status === "valid") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-2.5 w-2.5" />
        </span>
        Valid
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-white text-[9px]">!</span>
        Warning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-white text-[9px]">!</span>
      Error
    </span>
  );
}

export function AiProgressModal({ progress }) {
  if (!progress) return null;
  const pct = Math.max(0, Math.min(100, Number(progress.percent) || 0));
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1A2B48]/45 pointer-events-auto">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-base font-semibold text-[#1A2B48]">Generating listing details</p>
        <p className="mt-1 text-sm text-gray-500">
          {progress.label || "AI is filling title, category and copy from cover images."}
        </p>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-100">
          <div className="h-2.5 rounded-full bg-[#F56C43] transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold text-[#1A2B48]">
          <span>
            {progress.current || 0} of {progress.total || 0}
            {progress.sku ? ` · ${progress.sku}` : ""}
          </span>
          <span className="text-[#F56C43]">{pct}%</span>
        </div>
        <p className="mt-3 text-[11px] text-gray-400">Please wait. Editing is paused until this finishes.</p>
      </div>
    </div>
  );
}

export default function ValidateDataStep({
  stats,
  filter,
  setFilter,
  query,
  setQuery,
  visibleRows,
  listingKind = "single",
  imagesBySku,
  onRevalidate,
  revalidating,
  onGuide,
  onFix,
  onView,
}) {
  const [menu, setMenu] = useState(null);
  const [checked, setChecked] = useState({});
  const variation = isVariationListingKind(listingKind);
  const custom = isCustomListingKind(listingKind);
  const groups = variation ? variationPreviewGroups(visibleRows) : [];
  const attrCols = custom ? customAttributeColumns(visibleRows) : [];
  const variationColSpan = custom ? 13 + attrCols.length : 15;
  const listCount = variation
    ? groups.reduce((sum, group) => sum + (group.variants?.length || 0), 0)
    : visibleRows.length;
  const tabs = [
    { id: "all", label: `All Products (${stats.total})` },
    { id: "errors", label: `Errors (${stats.errors})` },
    { id: "warnings", label: `Warnings (${stats.warnings})` },
    { id: "valid", label: `Valid (${stats.valid})` },
  ];

  return (
    <div className="mt-4 grid gap-2 xl:grid-cols-[minmax(0,1fr)_220px]">
      <div className="space-y-2">
        <div>
          <h2 className="border-l-4 border-[#F56C43] pl-2.5 text-[13px] font-semibold text-[#1A2B48]">
            Validate Product Data
          </h2>
          <p className="mt-0.5 pl-2.5 text-[10px] text-gray-500">
            We have checked your file for errors, missing information and marketplace guidelines. Please review and fix the issues below.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
          <div className="rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-2">
            <p className="flex items-center gap-1 text-[10px] text-sky-600">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Total Products
            </p>
            <p className="mt-0.5 text-xl font-bold text-[#1A2B48]">{stats.total}</p>
            <p className="text-[9px] text-gray-400">in your file</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2">
            <p className="flex items-center gap-1 text-[10px] text-emerald-600">
              <Check className="h-3.5 w-3.5" /> Valid Products
            </p>
            <p className="mt-0.5 text-xl font-bold text-emerald-600">{stats.valid}</p>
            <p className="text-[9px] text-gray-400">Ready to list</p>
          </div>
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-2">
            <p className="flex items-center gap-1 text-[10px] text-rose-500">
              <AlertTriangle className="h-3.5 w-3.5" /> Errors
            </p>
            <p className="mt-0.5 text-xl font-bold text-rose-500">{stats.errors}</p>
            <p className="text-[9px] text-gray-400">Must fix</p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2">
            <p className="flex items-center gap-1 text-[10px] text-amber-500">
              <AlertTriangle className="h-3.5 w-3.5" /> Warnings
            </p>
            <p className="mt-0.5 text-xl font-bold text-amber-500">{stats.warnings}</p>
            <p className="text-[9px] text-gray-400">Recommended to fix</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id === "errors" ? "errors" : tab.id)}
              className={`pb-2 text-[12px] font-semibold ${
                filter === tab.id
                  ? "border-b-2 border-[#F56C43] text-[#F56C43]"
                  : "text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
            <input
              className="h-8 w-56 rounded-md border border-gray-200 bg-white pl-8 pr-2 text-[12px] focus:border-[#F56C43] focus:outline-none"
              placeholder="Search by product name, SKU…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={`${listingTableScrollClass(listCount)} rounded-lg border border-gray-200 bg-white`}>
          {variation ? (
            <table className="min-w-full text-left text-[10px]">
              <thead className={listingTableHeadClass("bg-[#F4F5F7] text-[10px] font-medium text-gray-500")}>
                <tr>
                  <th className="px-2 py-1.5">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded-[3px] accent-[#F56C43]" readOnly />
                  </th>
                  <th className="px-1.5 py-1.5">#</th>
                  <th className="px-1.5 py-1.5">Product Name</th>
                  <th className="px-1.5 py-1.5">Variant SKU</th>
                  {custom ? (
                    attrCols.map((col) => (
                      <th key={col.key} className="px-1.5 py-1.5">{col.label}</th>
                    ))
                  ) : (
                    <>
                      <th className="px-1.5 py-1.5">Colour</th>
                      <th className="px-1.5 py-1.5">Size</th>
                    </>
                  )}
                  <th className="px-1.5 py-1.5">Image</th>
                  <th className="px-1.5 py-1.5">Brand Name</th>
                  <th className="px-1.5 py-1.5">Category Level 1</th>
                  <th className="px-1.5 py-1.5">Selling Price</th>
                  <th className="px-1.5 py-1.5">AI Mode</th>
                  <th className="px-1.5 py-1.5">Short Description</th>
                  <th className="px-1.5 py-1.5">Validation Status</th>
                  <th className="px-1.5 py-1.5">Issues</th>
                  <th className="px-1.5 py-1.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {groups.length ? (
                  groups.map((group, gi) =>
                    group.variants.map((variant, vi) => {
                      const row = variant.row || {};
                      const images = row.resolved?.images || imagesForSku(imagesBySku, variant.imageKey || variant.sku);
                      const issues = variantIssues(variant);
                      const status = variantStatus(variant);
                      const actionRow = variantActionRow(variant);
                      const menuId = actionRow?.row_id || variant.mergeKey;
                      return (
                        <tr key={`${group.parentSku || gi}-${variant.mergeKey}`} className="border-t border-gray-100">
                          {vi === 0 ? (
                            <>
                              <td rowSpan={group.variants.length} className="w-8 px-2 py-2 align-top">
                                <input
                                  type="checkbox"
                                  className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-[3px] border-gray-300 text-[#F56C43] accent-[#F56C43]"
                                  checked={group.variants.every((item) => {
                                    const ids = variantRows(item).map((row) => row.row_id).filter(Boolean);
                                    return ids.length ? ids.every((id) => checked[id]) : Boolean(checked[item.mergeKey]);
                                  })}
                                  onChange={(e) => {
                                    const on = e.target.checked;
                                    setChecked((prev) => {
                                      const next = { ...prev };
                                      group.variants.forEach((item) => {
                                        const ids = variantRows(item).map((row) => row.row_id).filter(Boolean);
                                        (ids.length ? ids : [item.mergeKey]).forEach((id) => {
                                          next[id] = on;
                                        });
                                      });
                                      return next;
                                    });
                                  }}
                                />
                              </td>
                              <td rowSpan={group.variants.length} className="w-6 px-1 py-2 align-top text-[11px] text-gray-400">
                                <span className="mt-0.5 inline-block">{gi + 1}</span>
                              </td>
                              <td rowSpan={group.variants.length} className="min-w-[168px] max-w-[208px] px-2 py-2 align-top font-medium text-[#1A2B48]">
                                <span className="line-clamp-2 text-[12px] font-medium leading-[1.35]" title={group.title}>
                                  {group.title || "—"}
                                </span>
                              </td>
                            </>
                          ) : null}
                          <td className="whitespace-nowrap px-1.5 py-1.5 font-medium text-[#1A2B48]">{variant.sku || "—"}</td>
                          {custom ? (
                            attrCols.map((col) => (
                              <td key={col.key} className="px-1.5 py-1.5 text-[#1A2B48]">
                                {variantAttrValue(variant, col.index) || "—"}
                              </td>
                            ))
                          ) : (
                            <>
                              <td className="px-1.5 py-1.5 text-[#1A2B48]">{variant.colour || "—"}</td>
                              <td className="px-1.5 py-1.5 text-[#1A2B48]">
                                {variant.sizes.length ? variant.sizes.join(", ") : "—"}
                              </td>
                            </>
                          )}
                          <td className="relative z-0 w-[7rem] min-w-[7rem] px-1.5 py-1.5">
                            <Thumbs images={images} />
                          </td>
                          <td className="relative z-10 whitespace-nowrap bg-white px-1.5 py-1.5 text-[#1A2B48]">
                            {row.brand || "—"}
                          </td>
                          <td className="px-1.5 py-1.5 text-[#1A2B48]">{row.category || "—"}</td>
                          <td className="px-1.5 py-1.5 text-[#1A2B48]">{row.selling_price || "—"}</td>
                          <td className="px-1.5 py-1.5 text-[#1A2B48]">{previewAiMode(row)}</td>
                          <td className="max-w-[180px] px-1.5 py-1.5 text-gray-600">
                            {row.short_description ? (
                              <span className="line-clamp-2">{row.short_description}</span>
                            ) : (
                              <span className="text-gray-400">Pending AI</span>
                            )}
                          </td>
                          <td className="px-1.5 py-1.5"><StatusCell status={status} /></td>
                          <td className="max-w-[160px] px-1.5 py-1.5">
                            {issues.length ? (
                              <ul className="space-y-0.5 text-rose-500">
                                {issues.slice(0, 2).map((issue) => (
                                  <li key={issue} className="line-clamp-1">• {issue}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="relative px-1.5 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                className={`text-[10px] font-semibold ${
                                  status === "error" ? "text-[#F56C43]" : "text-gray-500"
                                }`}
                                onClick={() => (status === "error" ? onFix?.(actionRow) : onView?.(actionRow))}
                              >
                                {status === "error" ? "Fix" : "View"}
                              </button>
                              <button
                                type="button"
                                className="text-gray-300"
                                onClick={() => setMenu(menu === menuId ? null : menuId)}
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {menu === menuId ? (
                              <div className="absolute right-2 z-20 mt-1 w-36 rounded-lg border bg-white py-1 text-[11px] shadow-lg">
                                <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-gray-50" onClick={() => { onView?.(actionRow); setMenu(null); }}>View details</button>
                                <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-gray-50" onClick={() => { onFix?.(actionRow); setMenu(null); }}>Fix issues</button>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    }),
                  )
                ) : (
                  <tr>
                    <td colSpan={variationColSpan} className="px-3 py-8 text-center text-sm text-gray-500">
                      No products match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full text-left text-[10px]">
              <thead className={listingTableHeadClass("bg-[#F4F5F7] text-[10px] font-medium text-gray-500")}>
                <tr>
                  <th className="px-2 py-1.5">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded-[3px] accent-[#F56C43]" readOnly />
                  </th>
                  <th className="px-1.5 py-1.5">#</th>
                  <th className="px-1.5 py-1.5">Product Name</th>
                  <th className="px-1.5 py-1.5">SKU</th>
                  <th className="px-1.5 py-1.5">Category</th>
                  <th className="px-1.5 py-1.5">Selling Price</th>
                  <th className="px-1.5 py-1.5">Images</th>
                  <th className="px-1.5 py-1.5">Validation Status</th>
                  <th className="px-1.5 py-1.5">Issues</th>
                  <th className="px-1.5 py-1.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => {
                  const images = row.resolved?.images || imagesForSku(imagesBySku, row.sku);
                  const issues = [...(row.errors || []), ...(row.warnings || [])];
                  return (
                    <tr key={row.row_id} className="border-t border-gray-100">
                      <td className="px-2 py-1.5">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded-[3px] accent-[#F56C43]"
                          checked={Boolean(checked[row.row_id])}
                          onChange={(e) => setChecked((prev) => ({ ...prev, [row.row_id]: e.target.checked }))}
                        />
                      </td>
                      <td className="px-1.5 py-1.5 text-gray-400">{i + 1}</td>
                      <td className="max-w-[200px] px-1.5 py-1.5 font-medium text-[#1A2B48]">
                        <span className="line-clamp-2 text-[12px] font-medium leading-[1.35]" title={row.name || ""}>
                          {row.name || "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-1.5 py-1.5 text-[#1A2B48]">{row.sku}</td>
                      <td className="px-1.5 py-1.5 text-[#1A2B48]">{row.category || "—"}</td>
                      <td className="px-1.5 py-1.5 text-[#1A2B48]">{row.selling_price || "—"}</td>
                      <td className="px-1.5 py-1.5"><Thumbs images={images} /></td>
                      <td className="px-1.5 py-1.5"><StatusCell status={row.status} /></td>
                      <td className="max-w-[160px] px-1.5 py-1.5">
                        {issues.length ? (
                          <ul className="space-y-0.5 text-rose-500">
                            {issues.slice(0, 2).map((issue) => (
                              <li key={issue} className="line-clamp-1">• {issue}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="relative px-1.5 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className={`text-[10px] font-semibold ${
                              row.status === "error" ? "text-[#F56C43]" : "text-gray-500"
                            }`}
                            onClick={() => (row.status === "error" ? onFix?.(row) : onView?.(row))}
                          >
                            {row.status === "error" ? "Fix" : "View"}
                          </button>
                          <button
                            type="button"
                            className="text-gray-300"
                            onClick={() => setMenu(menu === row.row_id ? null : row.row_id)}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {menu === row.row_id ? (
                          <div className="absolute right-2 z-20 mt-1 w-36 rounded-lg border bg-white py-1 text-[11px] shadow-lg">
                            <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-gray-50" onClick={() => { onView?.(row); setMenu(null); }}>View details</button>
                            <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-gray-50" onClick={() => { onFix?.(row); setMenu(null); }}>Fix issues</button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <aside className="space-y-2">
        <button
          type="button"
          onClick={onRevalidate}
          disabled={Boolean(revalidating)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-sky-600 disabled:opacity-60"
        >
          {revalidating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {revalidating ? "Re-validating…" : "Re-validate File"}
        </button>

        <div className="rounded-lg border border-gray-200 bg-white p-2.5">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1A2B48]">
            <Lightbulb className="h-4 w-4 fill-amber-300 text-amber-500" />
            Validation Rules
          </p>
          <ul className="mt-2 space-y-1.5 text-[11px] text-gray-600">
            {[
              "Product Name is required",
              "Category, Sub-category is required",
              "Selling Price must be a valid number (e.g., 99 or 99.00)",
              "Size must match admin Size attributes (multiple: S, M, L)",
              "At least 1 product image is required",
              "Short description (minimum 20 characters)",
              "Check for prohibited or restricted content",
            ].map((rule) => (
              <li key={rule} className="flex gap-2">
                <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-2.5 w-2.5" />
                </span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1A2B48]">
            <HelpCircle className="h-4 w-4 text-[#F56C43]" />
            Need Help?
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            Learn how to fix common validation issues with our guide.
          </p>
          <button
            type="button"
            onClick={onGuide}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[#F56C43] px-3 py-1.5 text-[11px] font-semibold text-[#F56C43]"
          >
            <Play className="h-3 w-3 fill-current" /> View Validation Guide
          </button>
        </div>

        <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-violet-700">
            <Sparkles className="h-4 w-4" /> Pro Tip
          </p>
          <p className="mt-1 text-[11px] leading-snug text-violet-700">
            Fix all errors to list your products faster. Warnings won’t block submission but are recommended for better visibility.
          </p>
        </div>
      </aside>
    </div>
  );
}

export function ValidateFooterStats({ stats }) {
  return (
    <div className="hidden flex-1 items-center justify-center gap-5 text-[11px] text-gray-500 sm:flex">
      <span className="inline-flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5 text-sky-500" />
        <strong className="text-[13px] text-[#1A2B48]">{stats.total}</strong> Total Products
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        <strong className="text-[13px] text-[#1A2B48]">{stats.valid}</strong> Valid
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">!</span>
        <strong className="text-[13px] text-[#1A2B48]">{stats.errors}</strong> Errors
      </span>
      <span className="inline-flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        <strong className="text-[13px] text-[#1A2B48]">{stats.warnings}</strong> Warnings
      </span>
    </div>
  );
}

export function ValidateProceedButton({ disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg bg-[#F56C43] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
    >
      Proceed to Preview <ChevronRight className="h-4 w-4" />
    </button>
  );
}
