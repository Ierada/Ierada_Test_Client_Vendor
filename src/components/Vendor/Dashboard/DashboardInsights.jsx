import React from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  RotateCcw,
  IndianRupee,
  Package,
  Sparkles,
} from "lucide-react";

const inr = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const DashboardInsights = ({ insights, data = {} }) => {
  const topProduct = (data.topSellingProducts || [])[0];
  const fallback = [
    {
      icon: TrendingUp,
      iconWrap: "bg-[#ECFDF3] text-[#16A34A]",
      text: data.total_sales
        ? `${Number(data.total_sales).toLocaleString("en-IN")} orders in this shop’s dashboard data.`
        : "No orders in dashboard data yet.",
    },
    {
      icon: RotateCcw,
      iconWrap: "bg-[#FEF3C7] text-[#D97706]",
      text:
        data.cancelled_order || data.return_order
          ? `${Number(data.cancelled_order || 0)} cancelled, ${Number(data.return_order || 0)} returned.`
          : "No cancellations or returns in dashboard data.",
    },
    {
      icon: IndianRupee,
      iconWrap: "bg-[#FEE2E2] text-[#DC2626]",
      text: `Delivered revenue: ${inr(data.total_revenue)}`,
    },
    {
      icon: Package,
      iconWrap: "bg-[#EEF2FF] text-[#4F46E5]",
      text: topProduct?.name
        ? `Top seller so far: ${topProduct.name} (${Number(topProduct.soldCount || 0).toLocaleString("en-IN")} units).`
        : "No top-selling product yet.",
    },
    {
      icon: Sparkles,
      iconWrap: "bg-[#F3E8FF] text-[#7C3AED]",
      text: "AI insight feed is not connected. These lines are from dashboard totals, not a model.",
    },
  ];

  const items = Array.isArray(insights) && insights.length ? insights : fallback;

  return (
    <section className="rounded-xl border border-[#EEF0F4] bg-white p-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] xl:col-span-3">
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="font-satoshi text-[14px] font-semibold text-[#111827]">
          AI Business Insights
        </h2>
        <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-medium text-[#4F46E5]">
          Beta
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon || TrendingUp;
          return (
            <li key={item.text} className="flex items-start gap-2">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${item.iconWrap || "bg-[#F3F4F6] text-[#6B7280]"}`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <p className="font-satoshi text-[13px] leading-5 text-[#374151]">
                {item.text}
              </p>
            </li>
          );
        })}
      </ul>
      <Link
        to="/report"
        className="mt-2 inline-block text-[13px] font-medium text-[#111827] hover:underline"
      >
        View reports
      </Link>
    </section>
  );
};

export default DashboardInsights;
