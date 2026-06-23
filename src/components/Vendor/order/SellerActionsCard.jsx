import React from "react";
import { Check, Printer, FileText, RotateCcw, X } from "lucide-react";

const SellerActionsCard = () => {
  return (
    <div className="flex flex-col p-[14px] bg-white border border-[#E5E7EF] rounded-[11px] w-full max-w-[426px] box-border mb-3.5">
      <h3 className="font-semibold text-[#0D0F14] text-[12.25px] leading-[17px] mb-2.5">
        Seller Actions
      </h3>
      
      <div className="flex flex-col gap-[7px] w-full">
        <button className="flex flex-row items-center gap-[8.75px] px-[10.5px] py-[8.75px] bg-[#F97316] rounded-[7px] w-full transition-colors hover:bg-[#ea580c]">
          <Check className="w-[12px] h-[12px] text-white" />
          <span className="font-semibold text-white text-[11.2px] leading-[17px] text-center">
            Accept & Process
          </span>
        </button>
        
        <button 
          className="flex flex-row items-center gap-[8.75px] px-[10.5px] py-[8.75px] bg-white border border-[#E5E7EF] rounded-[7px] w-full transition-colors hover:bg-gray-50 cursor-pointer"
          onClick={() => window.print()}
        >
          <Printer className="w-[12px] h-[12px] text-[#0D0F14]" />
          <span className="font-normal text-[#0D0F14] text-[11.2px] leading-[17px] text-center">
            Print Shipping Label
          </span>
        </button>
        
        <button 
          className="flex flex-row items-center gap-[8.75px] px-[10.5px] py-[8.75px] bg-white border border-[#E5E7EF] rounded-[7px] w-full transition-colors hover:bg-gray-50 cursor-pointer"
          onClick={() => window.print()}
        >
          <FileText className="w-[12px] h-[12px] text-[#0D0F14]" />
          <span className="font-normal text-[#0D0F14] text-[11.2px] leading-[17px] text-center">
            Print Invoice
          </span>
        </button>
        
        <button className="flex flex-row items-center gap-[8.75px] px-[10.5px] py-[8.75px] bg-[#FFF7ED] border border-[#FFD6A8] rounded-[7px] w-full transition-colors hover:bg-[#ffedd5]">
          <RotateCcw className="w-[12px] h-[12px] text-[#F54900]" />
          <span className="font-normal text-[#F54900] text-[11.2px] leading-[17px] text-center">
            Initiate Return
          </span>
        </button>
        
        <button className="flex flex-row items-center gap-[8.75px] px-[10.5px] py-[8.75px] bg-[#FEF2F2] border border-[#FFC9C9] rounded-[7px] w-full transition-colors hover:bg-[#fee2e2]">
          <X className="w-[12px] h-[12px] text-[#E7000B]" />
          <span className="font-normal text-[#E7000B] text-[11.2px] leading-[17px] text-center">
            Cancel Order
          </span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(SellerActionsCard);
