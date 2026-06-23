import React from "react";
import { User, MapPin, Phone, Mail, Star } from "lucide-react";

const CustomerSection = ({ customer }) => {
  return (
    <div className="flex w-full flex-col rounded-2xl border border-[#E4E8EF] bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#101828]">
        <span className="h-4 w-1 rounded-full bg-[#FF6012]" />
        Customer Details
      </h3>
      <div className="flex flex-col justify-between gap-5 text-[12px] lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFE9CC] text-[#FF6012]">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#101828]">{customer?.name ||""}</div>
            { customer.since && <div className="text-[#8A94A6]">Since {customer.since || ""}</div>}
            <div className="mt-0.5 flex items-center gap-1 font-bold text-[#344054]">
              <Star className="h-3.5 w-3.5 fill-[#FFB900] text-[#FFB900]" />
              <span>{customer.stats?.rating || ""}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 border-t border-[#EEF1F5] pt-3 lg:border-x lg:border-t-0 lg:px-5 lg:pt-0">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF6012]" />
            <span className="font-medium text-[#475467]">{customer.address?.line1}, {customer.address?.line2}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0 text-[#FF6012]" />
            <span className="font-medium text-[#475467]">{customer.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0 text-[#FF6012]" />
            <span className="font-medium text-[#475467]">{customer.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-6 self-end lg:self-center">
          <div className="text-center">
            <div className="text-base font-bold text-[#101828]">{customer.stats?.orders || ""}</div>
            <div className="text-[11px] text-[#8A94A6]">Orders</div>
          </div>
          <div className="text-center">
            <div className="text-base font-bold text-[#101828]">{customer.stats?.totalSpend || ""}</div>
            <div className="text-[11px] text-[#8A94A6]">Total Spent</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CustomerSection);
