import React from "react";

export const getStageDots = (stage) => {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className={`w-2 h-2 rounded-full ${idx < stage ? "bg-orange-500" : "bg-gray-200"}`} />
      ))}
    </div>
  );
};

export const getStatusBadge = (status) => {
  const norm = status?.toLowerCase() || "";
  const bg = norm.includes("scheduled") ? "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]" :
             norm.includes("approved") || norm.includes("success") ? "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]" :
             norm.includes("failed") || norm.includes("rto") ? "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]" :
             "bg-orange-50 text-orange-600 border-orange-200";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bg}`}>{status}</span>;
};
