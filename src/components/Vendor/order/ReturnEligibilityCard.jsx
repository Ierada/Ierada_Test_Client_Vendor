import React from "react";
import { CheckCircle } from "lucide-react";

const ReturnEligibilityCard = ({ eligibility }) => {
  return (
    <div className="flex flex-col p-[14px] bg-white border border-[#E5E7EF] rounded-[11px] w-full max-w-[426px] box-border mb-3.5">
      <h3 className="font-semibold text-[#0D0F14] text-[12.25px] leading-[17px] mb-[10.5px]">
        Return Eligibility
      </h3>

      <div className="flex flex-col">
        <div className="flex flex-row items-center gap-[7px] mb-2.5">
          <CheckCircle className="w-[14px] h-[14px] text-[#10B981]" />
          <span className="font-semibold text-[#0D0F14] text-[11.2px] leading-[17px]">
            {eligibility.windowText}
          </span>
        </div>
        
        <span className="font-normal text-[#6B7280] text-[9.8px] leading-[15px]">
          {eligibility.description}
        </span>
      </div>
    </div>
  );
};

export default React.memo(ReturnEligibilityCard);
