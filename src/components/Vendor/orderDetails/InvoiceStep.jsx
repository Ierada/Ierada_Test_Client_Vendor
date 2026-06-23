import React, { useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Printer } from "lucide-react";
import InvoiceCard from "./InvoiceCard";

const InvoiceStep = ({ orderData }) => {
  const cardRef = useRef(null);

  const handleDownload = useCallback(async () => {
    const input = cardRef.current;

    if (!input) return;

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = 210;
    const pdfHeight = 297;

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`invoice_${orderData.id}.pdf`);
  }, [orderData]);

  return (
    <div className="flex flex-col items-center gap-4 w-full p-4 font-inter">
      <div className="flex justify-end w-full max-w-[800px]">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EF] rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Invoice</span>
        </button>
      </div>

      <div className="w-full flex justify-center items-start">
        <InvoiceCard
          ref={cardRef}
          orderData={orderData}
        />
      </div>
    </div>
  );
};

export default React.memo(InvoiceStep);