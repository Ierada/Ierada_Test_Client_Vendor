import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAllProducts,
  getProductsByVendorId,
  updateProduct,
  deleteProduct,
} from "../../../services/api.product";
import { notifyOnFail, notifyOnSuccess } from "../../../utils/notification/toast";
import { getApiErrorMessage } from "../../../utils/apiError";
import ListingErrorBoundary from "../../../components/Vendor/SmartListing/ListingErrorBoundary";
import BulkProductImport from "../../../components/Vendor/Models/BulkProductImport";
import { useAppContext } from "../../../context/AppContext";
import {
  createBulkListingJob,
  listBulkListingJobs,
} from "../../../services/api.smartListing";

const JOB_KEY = "ierada_bulk_listing_jobs";

function loadJobs() {
  try {
    return JSON.parse(localStorage.getItem(JOB_KEY) || "[]");
  } catch {
    return [];
  }
}

function pushJob(job) {
  const next = [job, ...loadJobs()].slice(0, 40);
  localStorage.setItem(JOB_KEY, JSON.stringify(next));
  // Best-effort server history (ignore failures — local still works)
  createBulkListingJob({
    vendor_id: job.vendor_id,
    job_type: job.type || job.job_type || "bulk_update",
    status: job.status || "done",
    success_count: job.success || job.success_count || 0,
    fail_count: job.failed || job.fail_count || 0,
    summary: job,
  }).catch(() => {});
  return next;
}

function parseCsv(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        sku: parts[0],
        discounted_price: parts[1],
        stock: parts[2],
        visibility: parts[3],
      };
    })
    .filter((r) => r.sku && r.sku.toLowerCase() !== "sku");
}

export default function BulkListingManager({ mode = "vendor" }) {
  const { user } = useAppContext();
  const vendorId = mode === "vendor" ? user?.id : null;
  const [tab, setTab] = useState("upload");
  const [paste, setPaste] = useState("sku,discounted_price,stock,visibility\n");
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState(() => loadJobs());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listBulkListingJobs({
          ...(vendorId ? { vendor_id: vendorId } : {}),
          limit: 40,
        });
        if (cancelled || res?.status !== 1) return;
        const server = (res.data || []).map((j) => ({
          id: j.id,
          type: j.job_type,
          status: j.status,
          success: j.success_count,
          failed: j.fail_count,
          at: j.created_at,
          server: true,
          ...(j.summary && typeof j.summary === "object" ? j.summary : {}),
        }));
        if (server.length) {
          setJobs((prev) => {
            const merged = [...server, ...prev];
            const seen = new Set();
            return merged.filter((x) => {
              const k = String(x.id || x.at || Math.random());
              if (seen.has(k)) return false;
              seen.add(k);
              return true;
            }).slice(0, 40);
          });
        }
      } catch {
        /* keep localStorage history */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vendorId]);
  const [exportRows, setExportRows] = useState([]);
  const [archiveText, setArchiveText] = useState("");
  const [progress, setProgress] = useState("");

  const tabs = useMemo(
    () => [
      { id: "upload", label: "Create / Upload" },
      { id: "update", label: "Bulk Update" },
      { id: "export", label: "Export / Read" },
      { id: "archive", label: "Archive / Delete" },
      { id: "history", label: "Job History" },
    ],
    [],
  );

  const runUpdate = async () => {
    const rows = parseCsv(paste);
    if (!rows.length) {
      notifyOnFail("Paste CSV rows with sku,discounted_price,stock,visibility");
      return;
    }
    setBusy(true);
    setProgress("Loading catalog…");
    const failed = [];
    let success = 0;
    try {
      const listRes = vendorId
        ? await getProductsByVendorId(vendorId, { limit: 5000 })
        : await getAllProducts("limit=5000");
      const products = listRes?.data || [];
      const bySku = new Map(
        products.map((p) => [String(p.sku || "").toLowerCase(), p]),
      );

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setProgress(`Updating ${i + 1}/${rows.length}`);
        const product = bySku.get(String(row.sku).toLowerCase());
        if (!product) {
          failed.push({ ...row, error: "SKU not found" });
          continue;
        }
        if (mode === "vendor" && vendorId && Number(product.vendor_id) !== Number(vendorId)) {
          failed.push({ ...row, error: "Not your product" });
          continue;
        }
        try {
          const fd = new FormData();
          if (row.discounted_price !== undefined && row.discounted_price !== "") {
            fd.append("discounted_price", row.discounted_price);
          }
          if (row.stock !== undefined && row.stock !== "") {
            fd.append("stock", row.stock);
          }
          if (row.visibility) fd.append("visibility", row.visibility);
          fd.append("vendor_id", product.vendor_id);
          const res = await updateProduct(product.id, fd);
          if (res?.status === 1) success += 1;
          else failed.push({ ...row, error: res?.message || "Update failed" });
        } catch (e) {
          failed.push({
            ...row,
            error: getApiErrorMessage(e, "Update error"),
          });
        }
      }

      const job = {
        id: `upd_${Date.now()}`,
        type: "update",
        at: new Date().toISOString(),
        success,
        failed: failed.length,
        errors: failed,
      };
      setJobs(pushJob(job));
      notifyOnSuccess(`${success} updated, ${failed.length} failed`);
      if (failed.length) downloadFailed(failed, "bulk-update-failed.csv");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const runExport = async () => {
    setBusy(true);
    try {
      const listRes = vendorId
        ? await getProductsByVendorId(vendorId, { limit: 5000 })
        : await getAllProducts("limit=5000");
      const products = listRes?.data || [];
      setExportRows(products);
      const csv = [
        "id,sku,name,discounted_price,stock,visibility,listing_status,vendor_id",
        ...products.map((p) =>
          [
            p.id,
            csvEsc(p.sku),
            csvEsc(p.name),
            p.discounted_price,
            p.stock,
            p.visibility,
            p.listing_status || "",
            p.vendor_id,
          ].join(","),
        ),
      ].join("\n");
      downloadText(csv, "products-export.csv");
      const job = {
        id: `exp_${Date.now()}`,
        type: "export",
        at: new Date().toISOString(),
        success: products.length,
        failed: 0,
        errors: [],
      };
      setJobs(pushJob(job));
      notifyOnSuccess(`Exported ${products.length} products`);
    } catch (e) {
      notifyOnFail(getApiErrorMessage(e, "Export failed"));
    } finally {
      setBusy(false);
    }
  };

  const runArchive = async ({ hardDelete }) => {
    const skus = archiveText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!skus.length) {
      notifyOnFail("Paste SKUs to archive");
      return;
    }
    setBusy(true);
    const failed = [];
    let success = 0;
    try {
      const listRes = vendorId
        ? await getProductsByVendorId(vendorId, { limit: 5000 })
        : await getAllProducts("limit=5000");
      const bySku = new Map(
        (listRes?.data || []).map((p) => [String(p.sku || "").toLowerCase(), p]),
      );
      for (const sku of skus) {
        const product = bySku.get(sku.toLowerCase());
        if (!product) {
          failed.push({ sku, error: "Not found" });
          continue;
        }
        if (mode === "vendor" && Number(product.vendor_id) !== Number(vendorId)) {
          failed.push({ sku, error: "Not allowed" });
          continue;
        }
        try {
          if (hardDelete && mode === "admin") {
            const res = await deleteProduct(product.id);
            if (res?.status === 1) success += 1;
            else failed.push({ sku, error: res?.message || "Delete failed" });
          } else {
            const fd = new FormData();
            fd.append("visibility", "Hidden");
            fd.append("listing_status", "hidden");
            fd.append("vendor_id", product.vendor_id);
            const res = await updateProduct(product.id, fd);
            if (res?.status === 1) success += 1;
            else failed.push({ sku, error: res?.message || "Archive failed" });
          }
        } catch (e) {
          failed.push({ sku, error: getApiErrorMessage(e, "Error") });
        }
      }
      const job = {
        id: `arc_${Date.now()}`,
        type: hardDelete ? "delete" : "archive",
        at: new Date().toISOString(),
        success,
        failed: failed.length,
        errors: failed,
      };
      setJobs(pushJob(job));
      notifyOnSuccess(`${success} done, ${failed.length} failed`);
      if (failed.length) downloadFailed(failed, "bulk-archive-failed.csv");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ListingErrorBoundary>
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Bulk listing</h1>
            <p className="text-sm text-gray-500 mt-1">
              Excel create + full-field update. Path: Products → Bulk Manager.
            </p>
          </div>
          <Link
            to="/product/add"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Smart Listing
          </Link>
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-100 rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {progress ? (
          <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
            {progress}
          </p>
        ) : null}

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-gray-700 space-y-2">
          <p className="font-semibold text-gray-900">Bulk listing flow</p>
          <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm">
            <li>This page: <strong>Products → Bulk Manager</strong>. One-by-one listing is Smart Listing.</li>
            <li><strong>Create</strong> — download Import template, fill Products + Specifications (custom fields) + box + variations, upload.</li>
            <li><strong>Update</strong> — download Update template for name, HSN, GST, prices, stock, specs, variations (not only stock/price).</li>
            <li>Images via media / folder-pack manager.</li>
          </ol>
        </div>

        {tab === "upload" ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-sm text-gray-600 max-w-xl">
                Download a template, fill the Excel, then upload. Images go through the media / folder-pack manager.
              </p>
              <Link to="/bulk-upload/media" className="text-sm font-medium text-blue-600 shrink-0">
                Open media manager
              </Link>
            </div>
            <BulkProductImport vendorId={vendorId} user={user} compact />
          </div>
        ) : null}

        {tab === "update" ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <p className="text-sm text-gray-600">
              CSV columns: <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">sku</code>,{" "}
              <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">discounted_price</code>,{" "}
              <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">stock</code>,{" "}
              <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">visibility</code>{" "}
              (Published / Hidden)
            </p>
            <textarea
              className="w-full h-48 border rounded-xl p-3 font-mono text-xs"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={runUpdate}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              Run update
            </button>
          </div>
        ) : null}

        {tab === "export" ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <p className="text-sm text-gray-600">
              Download CSV of catalog ({exportRows.length ? `${exportRows.length} last` : "ready"}).
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={runExport}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold"
            >
              Export CSV
            </button>
          </div>
        ) : null}

        {tab === "archive" ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <p className="text-sm text-gray-600">Paste SKUs (comma or newline). Soft-archive sets Hidden.</p>
            <textarea
              className="w-full h-32 border rounded-xl p-3 font-mono text-xs"
              value={archiveText}
              onChange={(e) => setArchiveText(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => runArchive({ hardDelete: false })}
                className="px-4 py-2 rounded-xl border text-sm font-semibold"
              >
                Soft archive
              </button>
              {mode === "admin" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runArchive({ hardDelete: true })}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold"
                >
                  Hard delete
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === "history" ? (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-2.5 font-medium">When</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">OK</th>
                  <th className="px-4 py-2.5 font-medium">Failed</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-t">
                    <td className="px-4 py-2.5 text-xs text-gray-600">
                      {j.at ? new Date(j.at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2.5 capitalize">{j.type}</td>
                    <td className="px-4 py-2.5">{j.success}</td>
                    <td className="px-4 py-2.5">{j.failed}</td>
                  </tr>
                ))}
                {!jobs.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      No jobs yet
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </ListingErrorBoundary>
  );
}

function csvEsc(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadFailed(rows, filename) {
  const keys = Object.keys(rows[0] || { sku: "", error: "" });
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => csvEsc(r[k])).join(","))].join(
    "\n",
  );
  downloadText(csv, filename);
}
