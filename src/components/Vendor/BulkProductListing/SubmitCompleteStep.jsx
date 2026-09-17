import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileSpreadsheet,
  Headset,
  Package,
} from "lucide-react";
import { listingErrorLabel } from "./wizardEngine";

function formatSubmittedAt(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).replace(",", ",");
}

function SuccessArt({ count }) {
  return (
    <div className="relative mx-auto h-[210px] w-full max-w-[300px]">
      <span className="absolute left-10 top-3 h-2 w-2 rotate-45 bg-amber-400" />
      <span className="absolute left-20 top-8 h-1.5 w-1.5 rounded-full bg-sky-400" />
      <span className="absolute right-16 top-4 h-2 w-2 rounded-full bg-rose-400" />
      <span className="absolute right-8 top-12 h-1.5 w-4 rotate-12 rounded-sm bg-emerald-400" />
      <span className="absolute left-6 top-16 h-2 w-2 rounded-full bg-violet-400" />
      <span className="absolute right-10 bottom-16 h-2 w-2 rotate-45 bg-[#F56C43]" />
      <span className="absolute left-16 bottom-10 h-1.5 w-1.5 rounded-full bg-lime-400" />

      <div className="absolute left-2 top-8 rounded-2xl border border-white/80 bg-white px-2.5 py-2 shadow-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <FileSpreadsheet className="h-4 w-4" />
        </div>
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-2.5 w-2.5" />
        </span>
      </div>

      <div className="absolute right-0 top-6 max-w-[110px] rounded-2xl rounded-bl-sm bg-white px-2.5 py-2 text-[10px] font-medium leading-snug text-[#1A2B48] shadow-sm">
        Thank you for growing with IERADA!
      </div>

      <div className="absolute bottom-2 left-1/2 w-[210px] -translate-x-1/2">
        <div className="overflow-hidden rounded-t-xl border-[10px] border-[#1A2B48] bg-white px-3 py-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
            <Check className="h-7 w-7" strokeWidth={3} />
          </div>
          <p className="mt-2 text-[12px] font-semibold text-emerald-600">Submission Successful!</p>
          <p className="text-[11px] text-gray-500">{count} products submitted</p>
        </div>
        <div className="mx-auto h-2.5 w-[230px] rounded-b-lg bg-[#1A2B48]" />
        <div className="mx-auto mt-0.5 h-1 w-16 rounded-full bg-gray-300" />
      </div>

      <div className="absolute bottom-6 right-2 text-emerald-600">
        <svg width="36" height="48" viewBox="0 0 36 48" fill="none" aria-hidden="true">
          <path d="M18 46c0-8 8-10 8-18" stroke="#86C56A" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="12" cy="18" rx="8" ry="11" fill="#7BC47F" />
          <ellipse cx="24" cy="16" rx="7" ry="10" fill="#5AAF66" />
          <ellipse cx="18" cy="10" rx="6" ry="8" fill="#8ED08A" />
        </svg>
      </div>
    </div>
  );
}

function SummaryLine({ icon, label, value, valueClass = "text-[#1A2B48]" }) {
  return (
    <li className="flex items-center justify-between gap-2 text-[12px]">
      <span className="flex items-center gap-2 text-gray-500">
        {icon}
        {label}
      </span>
      <span className={`max-w-[140px] truncate font-medium ${valueClass}`} title={String(value)}>
        {value}
      </span>
    </li>
  );
}

function OverviewCard({ tone, icon, value, label }) {
  const tones = {
    blue: "border-sky-100 bg-sky-50 text-sky-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-600",
    rose: "border-rose-100 bg-rose-50 text-rose-600",
  };
  return (
    <div className={`rounded-xl border px-3 py-3 text-center ${tones[tone]}`}>
      <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center">{icon}</div>
      <p className="text-[20px] font-semibold leading-none text-[#1A2B48]">{value}</p>
      <p className="mt-1 text-[11px] text-gray-500">{label}</p>
    </div>
  );
}

export default function SubmitCompleteStep({
  mode = "vendor",
  stats,
  submitResult,
  listPath,
  historyPath,
  supportTo,
  onUploadAnother,
  onBackToPreview,
  onDone,
}) {
  const total = submitResult?.total ?? stats?.total ?? 0;
  const valid = submitResult?.valid ?? stats?.valid ?? 0;
  const warnings = submitResult?.warnings ?? stats?.warnings ?? 0;
  const errors = submitResult?.errors ?? stats?.errors ?? submitResult?.failed?.length ?? 0;
  const submitted = submitResult?.success ?? submitResult?.submitted ?? valid;
  const failed = submitResult?.failed || [];
  const fileName = submitResult?.fileName || "IERADA_Single_Product_Bulk.xlsx";
  const isAdmin = mode === "admin";
  const partial = failed.length > 0;

  return (
    <div className="mt-5 space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="min-w-0 space-y-4">
          <section
            className={`overflow-hidden rounded-2xl border p-5 ${
              partial
                ? "border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-50"
                : "border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50"
            }`}
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] lg:items-center">
              <div>
                <h2 className="border-l-4 border-[#F56C43] pl-3 text-[26px] font-bold leading-tight text-[#1A2B48]">
                  {partial ? (
                    <>
                      {submitted} of {submitted + failed.length} Listings
                      <br />
                      Were Submitted
                    </>
                  ) : (
                    <>
                      Your Products
                      <br />
                      Have Been Submitted!
                    </>
                  )}
                </h2>
                <p className="mt-3 max-w-md text-[13px] text-gray-600">
                  {partial
                    ? `${failed.length} listing${failed.length > 1 ? "s were" : " was"} rejected and ${failed.length > 1 ? "are" : "is"} not live. Fix the rows listed below and submit them again.`
                    : isAdmin
                      ? "Valid products are live on IERADA. You can review any remaining issues and upload another file when you are ready."
                      : "We are now processing your products. Once the review is complete, the products will be listed on IERADA."}
                </p>
                <ul className="mt-4 space-y-2 text-[13px] text-emerald-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> File processed successfully
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    {submitted} product{submitted === 1 ? "" : "s"} submitted for listing
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    {isAdmin ? "Live products are visible in All Products" : "You will be notified once the products are live"}
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    You can track status in “Products” → “{isAdmin ? "All Products" : "Bulk Upload History"}”
                  </li>
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to={listPath}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#F56C43] px-4 py-2 text-[13px] font-medium text-white"
                  >
                    Go to All Products →
                  </Link>
                  <button
                    type="button"
                    onClick={onUploadAnother}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-[#1A2B48]"
                  >
                    Upload Another File
                  </button>
                </div>
              </div>
              <SuccessArt count={submitted} />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="flex items-center gap-2 text-[14px] font-medium text-[#1A2B48]">
              <Package className="h-4 w-4 text-[#F56C43]" /> Submitted Products Overview
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">Quick summary of the products in this upload.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <OverviewCard tone="blue" value={total} label="Total Submitted" icon={<Package className="h-5 w-5 text-sky-500" />} />
              <OverviewCard tone="green" value={valid} label="Valid Products" icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} />
              <OverviewCard tone="amber" value={warnings} label="With Warnings" icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} />
              <OverviewCard tone="rose" value={errors} label="With Errors" icon={<AlertTriangle className="h-5 w-5 text-rose-500" />} />
            </div>
            {failed.length ? (
              <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2">
                <p className="text-[12px] font-semibold text-rose-700">
                  Not submitted — fix these and submit again
                </p>
                <ul className="mt-1 space-y-1 text-[12px] text-rose-600">
                  {failed.map((item, i) => (
                    <li key={`${item.sku}-${i}`}>
                      <span className="font-semibold">{listingErrorLabel(item)}</span>: {item.error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-[13px] font-medium text-[#1A2B48]">Tips to Get Your Products Live Faster</p>
            <ul className="mt-2 grid gap-1 text-[12px] text-gray-600 sm:grid-cols-2">
              <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />Ensure all product images are clear and high quality.</li>
              <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />Avoid promotional text or restricted content.</li>
              <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />Follow marketplace guidelines for titles, descriptions and attributes.</li>
              <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />Keep category and pricing updated.</li>
            </ul>
          </section>
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#1A2B48]">
              <FileSpreadsheet className="h-4 w-4 text-[#F56C43]" /> Submission Summary
            </p>
            <ul className="mt-3 space-y-2">
              <SummaryLine icon={<FileSpreadsheet className="h-3.5 w-3.5 text-gray-400" />} label="File Name" value={fileName} />
              <SummaryLine icon={<Clock className="h-3.5 w-3.5 text-gray-400" />} label="Submitted On" value={formatSubmittedAt(submitResult?.at)} />
              <SummaryLine icon={<Package className="h-3.5 w-3.5 text-sky-500" />} label="Total Products" value={total} />
              <SummaryLine icon={<Check className="h-3.5 w-3.5 text-emerald-500" />} label="Valid Products" value={valid} valueClass="text-emerald-600" />
              <SummaryLine icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />} label="With Warnings" value={warnings} valueClass="text-amber-500" />
              <SummaryLine icon={<AlertTriangle className="h-3.5 w-3.5 text-rose-500" />} label="With Errors" value={errors} valueClass="text-rose-500" />
            </ul>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#1A2B48]">
              <Clock className="h-4 w-4 text-[#F56C43]" /> What Happens Next?
            </p>
            <ol className="mt-2 space-y-2 text-[12px] text-gray-600">
              {(isAdmin
                ? [
                    "Valid products are already live on IERADA.",
                    "Fix any remaining errors and re-upload if needed.",
                    "Track listings in Products → All Products.",
                    "Start another bulk file whenever you are ready.",
                  ]
                : [
                    "Our team will review your submitted products.",
                    "If any updates are required, we'll notify you.",
                    "Once approved, products will be live on IERADA.",
                    "You can check the status anytime in Products → Manage Products or Bulk Upload History.",
                  ]
              ).map((item, i) => (
                <li key={item} className="flex gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-[#1A2B48]">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#1A2B48]">
              <Headset className="h-4 w-4 text-sky-600" /> Need Assistance?
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              Our seller support team is here to help you with any queries.
            </p>
            <Link
              to={supportTo}
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-[#1A2B48]"
            >
              Contact Seller Support
            </Link>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToPreview}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-[#1A2B48]"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Preview
        </button>
        <Link
          to={historyPath || listPath}
          onClick={onDone}
          className="inline-flex items-center gap-1 rounded-lg bg-[#F56C43] px-5 py-2 text-[13px] font-medium text-white"
        >
          <Check className="h-4 w-4" /> Done
        </Link>
      </div>
    </div>
  );
}
