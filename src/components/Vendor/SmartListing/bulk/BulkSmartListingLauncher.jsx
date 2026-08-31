import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ImagePlus,
  Play,
} from "lucide-react";
import { notifyOnFail, notifyOnSuccess } from "../../../../utils/notification/toast";
import {
  BULK_LISTING_TYPES,
  BULK_SESSION_MAX,
  buildTypeQueue,
  clearBulkSession,
  createBulkSession,
  getBulkSession,
  summarizeTypeCounts,
} from "../utils/bulkSessionStorage";
import BulkCreateGrid from "./BulkCreateGrid";

const emptyCounts = () => ({
  single: 0,
  combo: 0,
  color_size: 0,
  custom: 0,
});

export default function BulkSmartListingLauncher({
  vendorId,
  mode = "vendor",
  onJobComplete,
  disabled = false,
}) {
  const navigate = useNavigate();
  const [planMode, setPlanMode] = useState("planned"); // planned | flexible
  const [flexibleTotal, setFlexibleTotal] = useState(10);
  const [counts, setCounts] = useState({
    single: 5,
    combo: 0,
    color_size: 3,
    custom: 0,
  });
  const [showQuick, setShowQuick] = useState(false);

  const existing = useMemo(() => {
    const s = getBulkSession();
    if (!s || (s.completed || 0) >= s.total) return null;
    return s;
  }, []);

  const plannedTotal = useMemo(
    () => buildTypeQueue(counts).length,
    [counts],
  );

  const startSmartBulk = () => {
    if (mode === "admin" && !vendorId) {
      notifyOnFail("Select a vendor first");
      return;
    }

    if (planMode === "planned") {
      if (!plannedTotal) {
        notifyOnFail("Enter at least one listing count (single / combo / variation)");
        return;
      }
      if (plannedTotal > BULK_SESSION_MAX) {
        notifyOnFail(`Max ${BULK_SESSION_MAX} listings per Smart Bulk session`);
        return;
      }
      if (counts.combo > 0) {
        // Soft confirm — combo needs existing catalog products
        const ok = window.confirm(
          `${counts.combo} combo listing(s) planned. Combo needs existing products in catalog first (create singles/variations before combos). Continue?`,
        );
        if (!ok) return;
      }
      if (plannedTotal > 50) {
        const ok = window.confirm(
          `${plannedTotal} listings in one Smart Bulk session is long. Tip: upload images first in Media Manager, work in batches of 20–50, save drafts. Continue?`,
        );
        if (!ok) return;
      }
      createBulkSession({
        mode: "planned",
        typeCounts: counts,
        vendorId,
      });
    } else {
      const n = Math.max(1, Math.min(BULK_SESSION_MAX, Number(flexibleTotal) || 1));
      if (n > 50) {
        const ok = window.confirm(
          `${n} listings — each one can be Single / Combo / Color×Size / Custom. Prefer batches of 20–50 for images + AI. Continue?`,
        );
        if (!ok) return;
      }
      createBulkSession({
        mode: "flexible",
        total: n,
        vendorId,
      });
    }

    notifyOnSuccess("Smart Bulk started — pick type (or use planned type) for each listing");
    navigate("/product/add?bulk=1");
  };

  const resumeSession = () => {
    if (!existing) return;
    if (mode === "admin" && !vendorId && !existing.vendorId) {
      notifyOnFail("Select the same vendor to resume");
      return;
    }
    navigate("/product/add?bulk=1");
  };

  const discardSession = () => {
    clearBulkSession();
    notifyOnSuccess("Bulk session cleared");
    window.location.reload();
  };

  const patchCount = (id, value) => {
    const n = Math.max(0, Math.min(BULK_SESSION_MAX, Math.floor(Number(value) || 0)));
    setCounts((prev) => ({ ...prev, [id]: n }));
  };

  const breakdown = summarizeTypeCounts(counts);

  return (
    <div className="space-y-5">
      {existing ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Incomplete Smart Bulk session</p>
            <p className="text-xs mt-0.5">
              {existing.completed}/{existing.total} done
              {existing.skipped ? ` · ${existing.skipped} skipped` : ""} — resume where you left
              off (mixed types OK).
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resumeSession}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold"
            >
              <Play className="w-4 h-4" /> Resume
            </button>
            <button
              type="button"
              onClick={discardSession}
              className="px-4 py-2 rounded-xl border border-amber-300 text-sm font-medium text-amber-900"
            >
              Discard
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-600 text-white p-2.5 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Smart Bulk Listing</h2>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              <strong>Haan — mixed types ek saath:</strong> ek session me Single + Combo + Color×Size
              + Custom variation mix kar sakte ho. Har listing pe full Smart Listing (photos, AI,
              review). Next listing auto khulega.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPlanMode("planned")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              planMode === "planned"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            Planned mix (recommended)
          </button>
          <button
            type="button"
            onClick={() => setPlanMode("flexible")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              planMode === "flexible"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            Flexible (pick type each time)
          </button>
        </div>

        {planMode === "planned" ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Example: 200 single + 400 combo + 400 variation = one mixed session (queue order:
              Single → Combo → Color×Size → Custom).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BULK_LISTING_TYPES.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2.5"
                >
                  <span>
                    <span className="text-sm font-medium text-gray-800 block">{t.label}</span>
                    <span className="text-[11px] text-gray-500">{t.hint}</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={BULK_SESSION_MAX}
                    value={counts[t.id]}
                    onChange={(e) => patchCount(t.id, e.target.value)}
                    className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-right"
                    disabled={disabled}
                  />
                </label>
              ))}
            </div>
            <p className="text-sm font-medium text-gray-800">
              Total in this session: <strong>{plannedTotal}</strong>
              {breakdown.length ? (
                <span className="text-gray-500 font-normal text-xs ml-2">
                  ({breakdown.map((b) => `${b.count} ${b.label}`).join(" · ")})
                </span>
              ) : null}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="font-medium text-gray-700 block mb-1">Kitni listings?</span>
              <input
                type="number"
                min={1}
                max={BULK_SESSION_MAX}
                value={flexibleTotal}
                onChange={(e) => setFlexibleTotal(Number(e.target.value) || 1)}
                className="w-28 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                disabled={disabled}
              />
            </label>
            <p className="text-xs text-gray-500 pb-2">
              Har listing pe type choose karoge — Single / Combo / Variation / Custom.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-xs text-gray-700 space-y-2">
          <p className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Large catalog tip (e.g. 1000 products / 5000 images)
          </p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>
              Pehle <Link className="text-blue-600 font-medium" to="/bulk-upload/media">Media Manager</Link>{" "}
              me images upload karo (chunked — 100s OK).
            </li>
            <li>
              Smart Bulk me <strong>mixed types</strong> chalega, lekin guided AI flow hai — practical
              batches: <strong>20–50</strong> per session (max {BULK_SESSION_MAX}/session).
            </li>
            <li>
              <strong>Combo</strong> last me banao — pehle single/variation products exist hone
              chahiye jo combo me bundle honge.
            </li>
            <li>
              1000+ simple singles / Excel variations:{" "}
              <strong>Advanced Excel</strong> tab + media attach. Quality + combo/AI → Smart Bulk.
            </li>
          </ol>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={disabled || (planMode === "planned" && !plannedTotal)}
            onClick={startSmartBulk}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            <Layers className="w-4 h-4" />
            Start Smart Bulk
            {planMode === "planned" ? ` (${plannedTotal})` : ` (${flexibleTotal})`}
          </button>
          <Link
            to="/bulk-upload/media"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600"
          >
            <ImagePlus className="w-4 h-4" /> Upload images first
          </Link>
          <Link to="/product/add" className="text-sm font-medium text-gray-500 hover:text-blue-600">
            Single listing only →
          </Link>
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-gray-600"
            onClick={() => setCounts(emptyCounts())}
          >
            Clear counts
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setShowQuick((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-800 hover:bg-slate-50"
        >
          <span>Quick bulk — simple singles only (paste sheet)</span>
          {showQuick ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showQuick ? (
          <div className="px-5 pb-5 border-t">
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 my-4">
              Quick grid = <strong>single</strong> only. Mixed / combo / variation → use{" "}
              <strong>Smart Bulk</strong> above (planned mix).
            </p>
            <BulkCreateGrid
              vendorId={vendorId}
              mode={mode}
              disabled={disabled}
              onJobComplete={onJobComplete}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
