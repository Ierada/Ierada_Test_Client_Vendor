import React from "react";

const PaymentSummaryCard = ({ summary }) => {
  return (
    <div className="flex flex-col p-[14px] bg-white border border-[#E5E7EF] rounded-[11px] w-full max-w-[426px] box-border mb-3.5">
      <h3 className="font-semibold text-[#0D0F14] text-[12.25px] leading-[17px] mb-2.5">
        Payment Summary
      </h3>

      <div className="flex flex-col w-full gap-[7px]">
        <div className="flex flex-row justify-between items-center w-full">
          <span className="font-normal text-[#6B7280] text-[10.64px] leading-[16px]">Product price</span>
          <span className="font-normal text-[#0D0F14] text-[10.92px] leading-[16px]">{summary.productPrice}</span>
        </div>
        <div className="flex flex-row justify-between items-center w-full">
          <span className="font-normal text-[#6B7280] text-[10.64px] leading-[16px]">Delivery charges</span>
          <span className="font-normal text-[#0D0F14] text-[10.92px] leading-[16px]">{summary.deliveryCharges}</span>
        </div>
        <div className="flex flex-row justify-between items-center w-full">
          <span className="font-normal text-[#6B7280] text-[10.64px] leading-[16px]">Platform fee</span>
          <span className="font-normal text-[#EF4444] text-[10.92px] leading-[16px]">{summary.platformFee}</span>
        </div>
        <div className="flex flex-row justify-between items-center w-full">
          <span className="font-normal text-[#6B7280] text-[10.64px] leading-[16px]">GST (18%)</span>
          <span className="font-normal text-[#EF4444] text-[10.92px] leading-[16px]">{summary.gst}</span>
        </div>
        <div className="flex flex-row justify-between items-center w-full">
          <span className="font-normal text-[#6B7280] text-[10.64px] leading-[16px]">Closing fee</span>
          <span className="font-normal text-[#EF4444] text-[10.92px] leading-[16px]">{summary.closingFee}</span>
        </div>
      </div>

      <div className="flex flex-row justify-between items-center w-full mt-[7px] pt-[7px] border-t border-[#E5E7EF]">
        <span className="font-semibold text-[#0D0F14] text-[11.48px] leading-[17px]">Net Settlement</span>
        <span className="font-bold text-[#10B981] text-[12.6px] leading-[19px]">{summary.netSettlement}</span>
      </div>

      <div className="flex flex-row items-center w-full mt-[10.5px] p-[8.75px] bg-[#FFFBEB] border border-[#FEF3C6] rounded-[7px] box-border">
        <span className="font-normal text-[#BB4D00] text-[10.08px] leading-[15px]">
          {summary.settlementMessage}
        </span>
      </div>
    </div>
  );
};

export default React.memo(PaymentSummaryCard);
