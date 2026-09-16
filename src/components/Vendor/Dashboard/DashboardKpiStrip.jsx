import React from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  ShoppingBag,
  Package,
  Users,
  Clock3,
  Star,
} from "lucide-react";

const inr = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const int = (value) => Number(value || 0).toLocaleString("en-IN");

const Sparkline = ({ points = [], color = "#6366F1" }) => {
  const w = 48;
  const h = 15;
  const nums = points.length ? points : [0, 0, 0, 0, 0, 0, 0];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const d = nums
    .map((n, i) => {
      const x = (i / Math.max(nums.length - 1, 1)) * w;
      const y = h - 4 - ((n - min) / span) * (h - 8);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
};

const ChangeLine = ({ change, href, linkLabel }) => {
  if (href) {
    return (
      <Link to={href} className="text-[10px] font-medium text-[#6366F1] hover:underline">
        {linkLabel}
      </Link>
    );
  }
  const n = Number(change || 0);
  const up = n >= 0;
  return (
    <p className="text-[10px] text-[#9CA3AF]">
      <span className={up ? "text-[#16A34A] font-medium" : "text-[#DC2626] font-medium"}>
        {up ? "+" : ""}
        {n.toFixed(1)}%
      </span>{" "}
      vs last 7 days
    </p>
  );
};

const KpiCard = ({
  title,
  value,
  icon: Icon,
  iconWrap,
  iconColor,
  change,
  href,
  linkLabel,
  spark,
  sparkColor,
}) => (
  <div className="rounded-xl border border-[#EEF0F4] bg-white px-3 py-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
    <div className="flex items-center gap-2.5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-[#9CA3AF]">{title}</p>
        <p className="mt-0.5 truncate font-satoshi text-[14px] font-semibold leading-none text-[#111827]">
          {value}
        </p>
      </div>
    </div>
    <div className="mt-1 flex items-end justify-between gap-2">
      <ChangeLine change={change} href={href} linkLabel={linkLabel} />
      <Sparkline points={spark} color={sparkColor} />
    </div>
  </div>
);

const sparkFrom = (value) => {
  const base = Number(value || 0);
  if (!base) return [0, 0, 0, 0, 0, 0, 0];
  return [0.72, 0.78, 0.74, 0.86, 0.9, 0.84, 1].map((n) => base * n);
};

const DashboardKpiStrip = ({ data = {} }) => {
  const cards = [
    {
      title: "Total Revenue",
      value: inr(data.total_revenue),
      icon: Wallet,
      iconWrap: "bg-[#F3E8FF]",
      iconColor: "text-[#7C3AED]",
      change: data.revenue_change,
      spark: data.revenue_spark || sparkFrom(data.total_revenue),
      sparkColor: "#8B5CF6",
    },
    {
      title: "Total Orders",
      value: int(data.total_sales ?? data.completed_order),
      icon: ShoppingBag,
      iconWrap: "bg-[#FFF1E8]",
      iconColor: "text-[#EA580C]",
      change: data.orders_change,
      spark: data.orders_spark || sparkFrom(data.total_sales ?? data.completed_order),
      sparkColor: "#F97316",
    },
    {
      title: "Total Products",
      value: int(data.total_products),
      icon: Package,
      iconWrap: "bg-[#FFF8E1]",
      iconColor: "text-[#D97706]",
      change: data.products_change,
      spark: data.products_spark || sparkFrom(data.total_products),
      sparkColor: "#F59E0B",
    },
    {
      title: "Total Customers",
      value: int(data.total_users),
      icon: Users,
      iconWrap: "bg-[#ECFDF3]",
      iconColor: "text-[#16A34A]",
      change: data.customers_change,
      spark: data.customers_spark || sparkFrom(data.total_users),
      sparkColor: "#22C55E",
    },
    {
      title: "Pending Payout",
      value: inr(data.pending_payout),
      icon: Clock3,
      iconWrap: "bg-[#FFF1F2]",
      iconColor: "text-[#E11D48]",
      href: "/payments",
      linkLabel: "View Payouts",
      spark: data.payout_spark || sparkFrom(data.pending_payout),
      sparkColor: "#FB7185",
    },
    {
      title: "Store Rating",
      value: Number(data.store_rating || 0).toFixed(1),
      icon: Star,
      iconWrap: "bg-[#FFF7ED]",
      iconColor: "text-[#F59E0B]",
      change: data.rating_change,
      spark: data.rating_spark || sparkFrom(data.store_rating || 0),
      sparkColor: "#F59E0B",
    },
  ];

  return (
    <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <KpiCard key={card.title} {...card} />
      ))}
    </div>
  );
};

export default DashboardKpiStrip;
