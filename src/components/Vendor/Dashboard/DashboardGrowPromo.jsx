import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const DashboardGrowPromo = () => (
  <section className="mb-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EA580C] px-4 py-3 text-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-satoshi text-[14px] font-semibold">
            Grow your business
          </h2>
          <p className="mt-0.5 max-w-xl text-[11px] text-white/80">
            Add a new listing or tighten your current catalog so more shoppers
            can find you this week.
          </p>
        </div>
      </div>
      <Link
        to="/product/add"
        className="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-white px-3.5 text-[12px] font-semibold text-[#4F46E5]"
      >
        Add a listing
      </Link>
    </div>
  </section>
);

export default DashboardGrowPromo;
