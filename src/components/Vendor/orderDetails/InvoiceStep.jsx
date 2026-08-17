import React, { useCallback, useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  downloadTaxInvoicesForOrder,
  getTaxInvoicesForOrder,
} from "../../../services/api.order";

const InvoiceStep = ({ orderData }) => {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const orderId = orderData?.rowId || orderData?.id;

  const loadInvoices = useCallback(async () => {
    if (!orderId) return;
    try {
      setInvoices(await getTaxInvoicesForOrder(orderId));
    } catch {
      setInvoices([]);
    }
  }, [orderId]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleDownload = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await downloadTaxInvoicesForOrder(orderId);
      if (res.status !== 1) {
        alert(res.message || "Invoice is available after the order is shipped");
        return;
      }
      setInvoices(res.data || []);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to download invoice");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  return (
    <div className="flex flex-col items-center gap-4 w-full p-4 font-inter">
      <div className="flex justify-end w-full max-w-[800px]">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EF] rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
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
        {invoices.length
          ? invoices.map((inv) => (
              <p key={inv.id}>
                {inv.kind}: {inv.invoice_number}
              </p>
            ))
          : "No tax invoice yet. Ship the order first."}
      </div>
    </div>
  );
};

export default React.memo(InvoiceStep);
