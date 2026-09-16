import React from "react";
import { Link } from "react-router-dom";
import { Eye, Heart, MousePointerClick, ShoppingCart, Star } from "lucide-react";

const int = (value) => Number(value || 0).toLocaleString("en-IN");

const Sparkline = ({ points = [], color = "#6366F1" }) => {
  const w = 72;
  const h = 22;
  const nums = points.length ? points.map((n) => Number(n) || 0) : [0, 0, 0, 0, 0, 0, 0];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const d = nums
    .map((n, i) => {
      const x = (i / Math.max(nums.length - 1, 1)) * w;
      const y = h - 3 - ((n - min) / span) * (h - 6);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const ChangeBadge = ({ change, tracked }) => {
  if (!tracked || change === null || change === undefined) {
    return <span className="text-[11px] font-medium text-[#9CA3AF]">—</span>;
  }
  const n = Number(change);
  const up = n >= 0;
  return (
    <span className={`text-[11px] font-semibold ${up ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
      {up ? "↑" : "↓"}
      {Math.abs(n).toFixed(1)}%
    </span>
  );
};

const MetricRow = ({ icon: Icon, iconWrap, iconColor, label, metric, sparkColor }) => {
  const tracked = metric?.tracked !== false;
  return (
    <li className="flex items-center gap-3 border-b border-[#F8F9FB] py-2.5 last:border-0 last:pb-0 first:pt-0">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.8} />
      </span>
      <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#111827]">
        {label}
      </p>
      <p className="w-16 text-right font-satoshi text-[13px] font-semibold text-[#111827]">
        {tracked ? int(metric?.count) : "—"}
      </p>
      <span className="w-14 text-right">
        <ChangeBadge change={metric?.change} tracked={tracked} />
      </span>
      <Sparkline points={metric?.series} color={sparkColor} />
    </li>
  );
};

const stars = (rating) => {
  const n = Math.max(0, Math.min(5, Number(rating) || 0));
  return Array.from({ length: 5 }, (_, i) => i < Math.round(n));
};

const emptyMetric = (tracked = true) => ({
  count: 0,
  previous: 0,
  change: tracked ? 0 : null,
  series: [0, 0, 0, 0, 0, 0, 0],
  tracked,
});

const DashboardPerformanceRow = ({ performance, reviews = [] }) => {
  const metrics = {
    clicks: performance?.clicks || emptyMetric(),
    views: performance?.views || emptyMetric(),
    wishlist: performance?.wishlist || emptyMetric(),
    cart: performance?.cart || emptyMetric(),
  };

  return (
    <div className="mb-2.5 grid grid-cols-1 gap-2.5 xl:grid-cols-12">
      <section className="rounded-xl border border-[#EEF0F4] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] xl:col-span-7">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-satoshi text-[13px] font-semibold text-[#111827]">
            Product Performance{" "}
            <span className="font-medium text-[#6B7280]">(This Week)</span>
          </h2>
          <Link to="/dashboard/product-performance" className="text-[12px] font-medium text-[#111827] hover:underline">
            View All
          </Link>
        </div>
        <ul>
          <MetricRow
            icon={MousePointerClick}
            iconWrap="bg-[#F3E8FF]"
            iconColor="text-[#7C3AED]"
            label="Product Clicks"
            metric={metrics.clicks}
            sparkColor="#8B5CF6"
          />
          <MetricRow
            icon={Eye}
            iconWrap="bg-[#EFF6FF]"
            iconColor="text-[#2563EB]"
            label="Product Views"
            metric={metrics.views}
            sparkColor="#3B82F6"
          />
          <MetricRow
            icon={Heart}
            iconWrap="bg-[#FFF7ED]"
            iconColor="text-[#EA580C]"
            label="Add to Wishlist"
            metric={metrics.wishlist}
            sparkColor="#F97316"
          />
          <MetricRow
            icon={ShoppingCart}
            iconWrap="bg-[#ECFDF3]"
            iconColor="text-[#16A34A]"
            label="Add to Cart"
            metric={metrics.cart}
            sparkColor="#22C55E"
          />
        </ul>
      </section>

      <section className="rounded-xl border border-[#EEF0F4] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] xl:col-span-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-satoshi text-[13px] font-semibold text-[#111827]">
            Customer Reviews
          </h2>
          <Link to="/dashboard" className="text-[12px] font-medium text-[#111827] hover:underline">
            View All
          </Link>
        </div>
        <ul className="space-y-3">
          {reviews.length === 0 ? (
            <li className="py-10 text-center text-[12px] text-[#9CA3AF]">
              No customer reviews yet
            </li>
          ) : (
            reviews.slice(0, 4).map((item, index) => (
              <li key={`${item.product_id || "r"}-${index}`} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[11px] font-semibold text-[#4F46E5]">
                  {(item.customer_name || "C")
                    .split(" ")
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12px] font-semibold text-[#111827]">
                      {item.customer_name || "Customer"}
                    </p>
                    <span className="flex items-center gap-0.5">
                      {stars(item.review).map((on, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${on ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#E5E7EB]"}`}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-[#9CA3AF]">
                    {item.product_name || "Product"}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-[#4B5563]">
                    {item.comment || "No comment"}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
};

export default DashboardPerformanceRow;
