import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, FileText } from "lucide-react";

const PageHeader = ({ orderId, productName, status, onBack, backLabel = "Back to Orders", showBack = true }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-row justify-between items-center px-5 py-3 bg-white border-b border-[#E5E7EF] w-full h-[54px] box-border">
      {/* Left section */}
      <div className="flex flex-row items-center gap-2.5">
        {showBack && (
          <>
            <button
              onClick={onBack || (() => navigate("/orders"))}
              className="flex flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-[12px] h-[12px] text-[#6B7280]" />
              <span className="text-[#6B7280] font-medium text-[11px] leading-[17px] text-center">
                {backLabel}
              </span>
            </button>
            <span className="text-[#E5E7EF] font-normal text-[14px] leading-[21px]">|</span>
          </>
        )}
        <div className="flex flex-row items-center gap-1.5">
          <span className="text-[#0D0F14] font-semibold text-[14px] leading-[21px]">
            {orderId}
          </span>
          <span className="text-[#6B7280] font-normal text-[11px] leading-[17px] mx-1">
            &gt;
          </span>
          <span className="text-[#6B7280] font-normal text-[11px] leading-[17px]">
            {productName}
          </span>
        </div>
      </div>

      {/* Right section */}
      <div className="flex flex-row items-center gap-1.5">
        <div className="bg-[#F0F9FF] rounded-full px-2.5 py-1">
          <span className="text-[#0EA5E9] font-semibold text-[11px] leading-[16px]">
            {status}
          </span>
        </div>
        <button className="flex flex-row items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E5E7EF] rounded-lg hover:bg-gray-50 transition-colors h-[28px]">
          <Printer className="w-[12px] h-[12px] text-[#6B7280]" />
          <span className="text-[#0D0F14] font-medium text-[11px] leading-[16px] text-center">
            Print
          </span>
        </button>
        <button className="flex flex-row items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E5E7EF] rounded-lg hover:bg-gray-50 transition-colors h-[28px]">
          <FileText className="w-[12px] h-[12px] text-[#6B7280]" />
          <span className="text-[#0D0F14] font-medium text-[11px] leading-[16px] text-center">
            Invoice
          </span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(PageHeader);



