import React from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CreditCard,
  HelpCircle,
  LineChart,
  PackagePlus,
  ShoppingBag,
} from "lucide-react";

const ACTIONS = [
  {
    to: "/product/add",
    label: "Add product",
    hint: "Create a new listing",
    icon: PackagePlus,
    wrap: "bg-[#FFF1E8] text-[#EA580C]",
  },
  {
    to: "/orders",
    label: "Manage orders",
    hint: "Track and fulfill",
    icon: ShoppingBag,
    wrap: "bg-[#EEF2FF] text-[#4F46E5]",
  },
  {
    to: "/payments",
    label: "Payments",
    hint: "Payouts and settlements",
    icon: CreditCard,
    wrap: "bg-[#ECFDF3] text-[#16A34A]",
  },
  {
    to: "/notifications",
    label: "Notifications",
    hint: "Alerts for your shop",
    icon: Bell,
    wrap: "bg-[#FFF1F2] text-[#E11D48]",
  },
  {
    to: "/report",
    label: "Reports",
    hint: "Sales and performance",
    icon: LineChart,
    wrap: "bg-[#F3E8FF] text-[#7C3AED]",
  },
  {
    to: "/support",
    label: "Support",
    hint: "Chat with Ierada",
    icon: HelpCircle,
    wrap: "bg-[#E0F2FE] text-[#0284C7]",
  },
];

const DashboardQuickActions = () => (
  <section className="mb-2.5 rounded-xl border border-[#EEF0F4] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
    <h2 className="mb-2 font-satoshi text-[13px] font-semibold text-[#111827]">
      Quick Actions
    </h2>
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.to}
            to={action.to}
            className="flex items-center gap-2.5 rounded-xl border border-[#EEF0F4] px-2.5 py-2 hover:border-[#E5E7EB] hover:bg-[#F9FAFB]"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.wrap}`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-[#111827]">{action.label}</p>
              <p className="truncate text-[10px] text-[#9CA3AF]">{action.hint}</p>
            </span>
          </Link>
        );
      })}
    </div>
  </section>
);

export default DashboardQuickActions;
