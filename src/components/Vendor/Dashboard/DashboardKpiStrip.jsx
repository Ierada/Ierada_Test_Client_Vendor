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
    <div className="mt-1">
      {(href || change != null) && (
        <ChangeLine change={change} href={href} linkLabel={linkLabel} />
      )}
    </div>
  </div>
);

const DashboardKpiStrip = ({ data = {} }) => {
  const cards = [
    {
      title: "Total Revenue",
      value: inr(data.total_revenue),
      icon: Wallet,
      iconWrap: "bg-[#F3E8FF]",
      iconColor: "text-[#7C3AED]",
      change: data.revenue_change,
    },
    {
      title: "Total Orders",
      value: int(data.total_sales ?? data.completed_order),
      icon: ShoppingBag,
      iconWrap: "bg-[#FFF1E8]",
      iconColor: "text-[#EA580C]",
      change: data.orders_change,
    },
    {
      title: "Published Products",
      value: int(data.published_products ?? data.total_products),
      icon: Package,
      iconWrap: "bg-[#FFF8E1]",
      iconColor: "text-[#D97706]",
      href: "/product/list",
      linkLabel: `${int(data.total_products)} listed`,
    },
    {
      title: "Total Customers",
      value: int(data.total_users),
      icon: Users,
      iconWrap: "bg-[#ECFDF3]",
      iconColor: "text-[#16A34A]",
      change: data.customers_change,
    },
    {
      title: "Pending Payout",
      value: inr(data.pending_payout),
      icon: Clock3,
      iconWrap: "bg-[#FFF1F2]",
      iconColor: "text-[#E11D48]",
      href: "/payments",
      linkLabel: "View Payouts",
    },
    {
      title: "Store Rating",
      value: Number(data.store_rating || 0).toFixed(1),
      icon: Star,
      iconWrap: "bg-[#FFF7ED]",
      iconColor: "text-[#F59E0B]",
      change: data.rating_change,
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
