import React, { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Download,
  Eye,
  Truck,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  downloadTaxInvoicesForOrder,
  downloadSingleTaxInvoice,
  getTaxInvoicesForOrder,
  previewTaxInvoice,
} from "../../../../services/api.order";

// ─── Shared section shell ──────────────────────────────────────────────────────
const StepShell = ({ children, title, subtitle, icon: Icon }) => (
  <div className="w-full max-w-2xl mx-auto p-6">
    <div className="bg-white rounded-2xl border border-[#EDF0F4] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#EDF0F4]">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#0164CE]" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ─── Row helper ────────────────────────────────────────────────────────────────
const Row = ({ label, value, bold, green }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span
      className={`text-sm font-semibold ${bold ? "text-gray-900" : ""} ${
        green ? "text-green-600" : ""
      }`}
    >
      {value ?? "—"}
    </span>
  </div>
);

const invoiceReadyStatus = (status) =>
  !["", "placed", "pending", "cancelled", "rejected"].includes(
    String(status || "").toLowerCase(),
  );

export const InvoiceStep = ({ orderData }) => {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [busyInvoiceId, setBusyInvoiceId] = useState(null);
  const orderId = orderData?.rowId;
  const ready = invoiceReadyStatus(orderData?.status);

  const loadInvoices = useCallback(async () => {
    if (!orderId || !ready) {
      setInvoices([]);
      return;
    }
    try {
      const list = await getTaxInvoicesForOrder(orderId);
      setInvoices(list);
    } catch {
      setInvoices([]);
    }
  }, [orderId, ready]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleDownloadGenerated = useCallback(async () => {
    if (!orderId || !ready) return;
    setLoading(true);
    try {
      const res = await downloadTaxInvoicesForOrder(orderId);
      if (res.status !== 1) {
        alert(res.message || "Could not download invoice");
        return;
      }
      setInvoices(res.data || []);
    } catch (error) {
      console.error("Error downloading invoice PDF:", error);
      alert(error?.message || "Failed to download invoice");
    } finally {
      setLoading(false);
    }
  }, [orderId, ready]);

  const handlePreview = useCallback(async (invoice) => {
    setBusyInvoiceId(invoice.id);
    try {
      await previewTaxInvoice(invoice.id);
    } catch (error) {
      console.error("Error previewing invoice PDF:", error);
      alert(error?.message || "Failed to preview invoice");
    } finally {
      setBusyInvoiceId(null);
    }
  }, []);

  const handleDownloadOne = useCallback(async (invoice) => {
    setBusyInvoiceId(invoice.id);
    try {
      await downloadSingleTaxInvoice(invoice.id, invoice.invoice_number);
    } catch (error) {
      console.error("Error downloading invoice PDF:", error);
      alert(error?.message || "Failed to download invoice");
    } finally {
      setBusyInvoiceId(null);
    }
  }, []);

  if (!orderData) return null;

  return (
    <StepShell
      icon={FileText}
      title="Tax invoices"
      subtitle="Product and logistic tax invoices for this order."
    >
      {ready ? (
        <>
          <div className="flex flex-wrap gap-3 mb-5">
            <button
              onClick={handleDownloadGenerated}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#0164CE] text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{loading ? "Downloading..." : "Download invoices"}</span>
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {invoices.length ? (
              <div className="divide-y divide-gray-100">
                {invoices.map((inv) => {
                  const busy = busyInvoiceId === inv.id;
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <p className="capitalize">
                        {inv.kind}: <span className="font-medium text-gray-800">{inv.invoice_number}</span>
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handlePreview(inv)}
                          disabled={busy}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-medium text-gray-700 disabled:opacity-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </button>
                        <button
                          onClick={() => handleDownloadOne(inv)}
                          disabled={busy}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-medium text-gray-700 disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>Generating invoices… if this stays empty, try download again.</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-600">
          Invoice download opens once you accept this order.
        </p>
      )}
    </StepShell>
  );
};

export const MarkShippedStep = ({ orderData }) => {
  if (!orderData) return null;

  const { product, orderInfo, customer } = orderData;

  return (
    <StepShell
      icon={Truck}
      title="Confirm & Mark Packed"
      subtitle="Verify everything is correct before marking the order as packed and ready for pickup"
    >
      {/* Summary card */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mb-5 space-y-3">
        <div className="flex items-center gap-3">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0"
            />
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{product.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Qty: {product.quantity || 1} · {product.color || ""}{" "}
              {product.size ? `/ ${product.size}` : ""}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Customer
            </p>
            <p className="text-xs font-semibold text-gray-800">
              {customer.name}
            </p>
            <p className="text-xs text-gray-500">{customer.phone}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Deliver To
            </p>
            <p className="text-xs font-semibold text-gray-800">
              {customer.address.line1}
            </p>
            <p className="text-xs text-gray-500">{customer.address.line2}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Payment
            </p>
            <p className="text-xs font-semibold text-gray-800">
              {orderInfo.paymentType}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Order Total
            </p>
            <p className="text-xs font-bold text-green-600">
              {orderInfo.orderTotal}
            </p>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2.5 mb-5">
        {[
          "Product is correctly packed and sealed",
          "Order details have been verified with the customer",
          "Tax invoices are already available on the Invoice tab",
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl"
          >
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 font-medium">{item}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Clicking <strong>"Mark as Packed"</strong> will update the order status
        and notify the customer. This action cannot be undone.
      </p>
    </StepShell>
  );
};
