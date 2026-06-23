import React from "react";
import { User, MapPin, Phone, Mail, Star } from "lucide-react";

const CustomerInfoCard = ({ customer }) => {
  return (
    <div className="flex flex-col p-[14px] bg-white border border-[#E5E7EF] rounded-[11px] w-full max-w-[426px] box-border mb-3.5">
      <h3 className="font-semibold text-[#0D0F14] text-[12.25px] leading-[17px] mb-2.5">
        Customer
      </h3>

      <div className="flex flex-row items-center gap-[10.5px]">
        <div className="flex justify-center items-center w-[31.5px] h-[31.5px] bg-[#F1F2F7] rounded-full shrink-0">
          <User className="w-[14px] h-[14px] text-[#6B7280]" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-[#0D0F14] text-[11.48px] leading-[17px]">
            {customer.name}
          </span>
          <span className="font-normal text-[#6B7280] text-[10.08px] leading-[15px]">
            Customer since {customer.since}
          </span>
        </div>
      </div>

      <div className="flex flex-col mt-[10.5px] pt-[10.5px] border-t border-[#E5E7EF]">
        <div className="flex flex-row items-start gap-[8.75px] py-1">
          <MapPin className="w-[12.25px] h-[12.25px] text-[#6B7280] mt-[1.75px]" />
          <div className="flex flex-col">
            <span className="font-normal text-[#0D0F14] text-[10.92px] leading-[16px]">
              {customer.address.line1}
            </span>
            <span className="font-normal text-[#6B7280] text-[10.08px] leading-[15px]">
              {customer.address.line2}
            </span>
          </div>
        </div>

        <div className="flex flex-row items-center gap-[8.75px] pt-[8.75px]">
          <Phone className="w-[12.25px] h-[12.25px] text-[#6B7280]" />
          <span className="font-normal text-[#0D0F14] text-[10.92px] leading-[16px]">
            {customer.phone}
          </span>
        </div>

        <div className="flex flex-row items-center gap-[8.75px] pt-[8.75px]">
          <Mail className="w-[12.25px] h-[12.25px] text-[#6B7280]" />
          <span className="font-normal text-[#0D0F14] text-[10.92px] leading-[16px]">
            {customer.email}
          </span>
        </div>
      </div>

      <div className="flex flex-row justify-between items-center mt-[10.5px] pt-[10.5px] border-t border-[#E5E7EF] w-full">
        <div className="flex flex-col items-center">
          <span className="font-bold text-[#0D0F14] text-[14px] leading-[21px]">
            {customer.stats.orders}
          </span>
          <span className="font-normal text-[#6B7280] text-[9.1px] leading-[14px] text-center">
            Orders
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-[#0D0F14] text-[14px] leading-[21px]">
            {customer.stats.totalSpend}
          </span>
          <span className="font-normal text-[#6B7280] text-[9.1px] leading-[14px] text-center">
            Total spend
          </span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex flex-row items-center gap-[1.75px]">
            <span className="font-bold text-[#0D0F14] text-[14px] leading-[21px]">
              {customer.stats.rating}
            </span>
            <Star className="w-[10.5px] h-[10.5px] text-[#FFB900] fill-[#FFB900]" />
          </div>
          <span className="font-normal text-[#6B7280] text-[9.1px] leading-[14px] text-center">
            Rating
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CustomerInfoCard);
