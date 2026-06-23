import React, { useRef, useCallback, useMemo } from "react";
import { X, Printer } from "lucide-react";
import html2pdf from "html2pdf.js";
import ShippingLabelCard from "../../../../components/Vendor/orderDetails/ShippingLabelCard";
import { prepareOrderDataForLabel } from "./helpers";

const LabelModal = ({ show, onClose, order }) => {
  const cardRef = useRef(null);
  const orderData = useMemo(() => order ? prepareOrderDataForLabel(order) : null, [order]);

  const handlePrint = useCallback(() => {
    if (!orderData || !cardRef.current) return;
    const opt = {
      margin: 10,
      filename: `shipping_label_${orderData.id}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a6", orientation: "portrait" }
    };
    html2pdf().set(opt).from(cardRef.current).save();
  }, [orderData]);

  if (!show || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden border border-gray-150 font-satoshi animate-scaleIn">
        <div className="flex items-center justify-between p-5 border-b border-gray-150 bg-gray-50/70 backdrop-blur-md">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Shipping Label</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Preview and print logistics label for Order #{orderData.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-150 rounded-lg transition-colors border-0 bg-transparent">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 bg-gray-50 flex justify-center items-center overflow-y-auto max-h-[60vh]">
          <div className="shadow-lg rounded-xl overflow-hidden bg-white border border-gray-200 p-1">
            <ShippingLabelCard ref={cardRef} orderData={orderData} />
          </div>
        </div>
        <div className="p-4 bg-white border-t border-gray-150 flex justify-end gap-3 font-sans">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm">Close</button>
          <button onClick={handlePrint} className="px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-orange-600 transition-colors shadow-sm flex items-center gap-1.5">
            <Printer className="w-4 h-4" />
            Print Label
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LabelModal);

