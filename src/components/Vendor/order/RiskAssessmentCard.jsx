import React from "react";
import { AlertTriangle } from "lucide-react";

const RiskAssessmentCard = ({ risk }) => {
  return (
    <div className="flex flex-col p-[14px] bg-white border border-[#E5E7EF] rounded-[11px] w-full max-w-[426px] box-border mb-3.5">
      <div className="flex flex-row items-center gap-[7px] mb-2.5">
        <AlertTriangle className="w-[14px] h-[14px] text-[#8E51FF]" />
        <h3 className="font-semibold text-[#0D0F14] text-[12.25px] leading-[17px]">
          Risk Assessment
        </h3>
      </div>

      <div className="flex flex-col mt-[10.5px]">
        <div className="flex flex-row justify-between items-center w-full mb-1">
          <span className="font-normal text-[#6B7280] text-[10.64px] leading-[16px]">Return Probability</span>
          <span className="font-bold text-[#10B981] text-[11.2px] leading-[17px]">{risk.returnProbability}%</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-[#E5E7EF] h-[4.5px] rounded-full mb-1 overflow-hidden">
          <div 
            className="bg-[#10B981] h-full rounded-full" 
            style={{ width: `${risk.returnProbability}%` }}
          />
        </div>
        
        <div className="flex flex-row justify-between items-center w-full mb-[10.5px]">
          <div className="bg-[#ECFDF5] px-1.5 py-0.5 rounded-[3px]">
            <span className="font-semibold text-[#10B981] text-[9.1px] leading-[14px]">
              {risk.riskLevel}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-[3.5px]">
          <div className="flex flex-row justify-between items-center w-full">
            <span className="font-normal text-[#6B7280] text-[9.8px] leading-[15px]">Customer trust score</span>
            <span className="font-normal text-[#10B981] text-[9.8px] leading-[15px]">{risk.trustScore}</span>
          </div>
          <div className="flex flex-row justify-between items-center w-full">
            <span className="font-normal text-[#6B7280] text-[9.8px] leading-[15px]">Address verified</span>
            <span className="font-normal text-[#10B981] text-[9.8px] leading-[15px]">{risk.addressVerified ? "Yes" : "No"}</span>
          </div>
          <div className="flex flex-row justify-between items-center w-full">
            <span className="font-normal text-[#6B7280] text-[9.8px] leading-[15px]">CCD history</span>
            <span className="font-normal text-[#10B981] text-[9.8px] leading-[15px]">{risk.ccdHistory}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(RiskAssessmentCard);
