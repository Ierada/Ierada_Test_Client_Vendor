import React, { useRef, useCallback } from "react";
import html2pdf from "html2pdf.js";
import { Printer } from "lucide-react";
import ShippingLabelCard from "./ShippingLabelCard";

const ShippingLabelStep = ({ orderData }) => {
  const cardRef = useRef(null);

  const handleDownload = useCallback(() => {
    const opt = {
      margin: 10,
      filename: `shipping_label_${orderData.id}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a6", orientation: "portrait" }
    };
    html2pdf().set(opt).from(cardRef.current).save();
  }, [orderData.id]);

  return (
    <div className="flex flex-col items-center gap-4 w-full p-4 font-inter">
      <div className="flex justify-end w-full max-w-[380px]">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EF] rounded-lg hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-700 shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Label</span>
        </button>
      </div>
      <div className="w-full overflow-x-auto">
        <ShippingLabelCard ref={cardRef} orderData={orderData} />
      </div>
    </div>
  );
};

export default React.memo(ShippingLabelStep);
