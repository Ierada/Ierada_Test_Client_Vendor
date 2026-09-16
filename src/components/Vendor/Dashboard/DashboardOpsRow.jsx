import React from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";

const inr = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const statusTone = (status = "") => {
  const s = String(status).toLowerCase();
  if (s.includes("deliver") || s.includes("complete")) return "text-[#16A34A]";
  if (s.includes("ship") || s.includes("dispatch")) return "text-[#0EA5E9]";
  if (s.includes("cancel")) return "text-[#DC2626]";
  if (s.includes("process") || s.includes("pending")) return "text-[#D97706]";
  return "text-[#6B7280]";
};

const DashboardOpsRow = ({
  orders = [],
  inventory = {},
  categories = [],
}) => {
  const inStock = Number(inventory.in_stock || 0);
  const lowStock = Number(inventory.low_stock || 0);
  const outStock = Number(inventory.out_of_stock || 0);
  const total = inStock + lowStock + outStock;
  const healthy = total ? Math.round((inStock / total) * 100) : 0;

  return (
    <div className="mb-2.5 grid grid-cols-1 gap-2.5 xl:grid-cols-12">
      <section className="rounded-xl border border-[#EEF0F4] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] xl:col-span-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-satoshi text-[13px] font-semibold text-[#111827]">
            Recent Orders
          </h2>
          <Link to="/orders" className="text-[12px] font-medium text-[#111827] hover:underline">
            View All
          </Link>
        </div>
        <ul className="space-y-3">
          {orders.length === 0 ? (
            <li className="py-8 text-center text-[12px] text-[#9CA3AF]">
              No recent orders
            </li>
          ) : (
            orders.slice(0, 4).map((order) => (
              <li key={order.id || order.order_id} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6]">
                  <Package className="h-3.5 w-3.5 text-[#6B7280]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-[#111827]">
                    {order.order_id || order.id}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-semibold text-[#111827]">
                    {inr(order.total_amount || order.amount || 0)}
                  </p>
                  <p className={`text-[11px] ${statusTone(order.status || order.order_status)}`}>
                    {order.status || order.order_status || "—"}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
        <Link
          to="/orders"
          className="mt-3 inline-block text-[12px] font-medium text-[#111827] hover:underline"
        >
          View All Orders
        </Link>
      </section>

      <section className="rounded-xl border border-[#EEF0F4] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] xl:col-span-4">
        <h2 className="mb-2 font-satoshi text-[13px] font-semibold text-[#111827]">
          Inventory Health
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#F3F4F6" strokeWidth="3.5" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="#22C55E"
                strokeWidth="3.5"
                strokeDasharray={`${healthy} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-satoshi text-[18px] font-semibold leading-none text-[#111827]">
                {healthy}%
              </p>
              <p className="mt-1 text-[10px] text-[#16A34A]">Healthy</p>
            </div>
          </div>
          <ul className="space-y-2 text-[12px]">
            <li className="flex items-center justify-between gap-6 text-[#6B7280]">
              <span>In Stock</span>
              <span className="font-semibold text-[#111827]">{inStock}</span>
            </li>
            <li className="flex items-center justify-between gap-6 text-[#6B7280]">
              <span>Low Stock</span>
              <span className="font-semibold text-[#111827]">{lowStock}</span>
            </li>
            <li className="flex items-center justify-between gap-6 text-[#6B7280]">
              <span>Out of Stock</span>
              <span className="font-semibold text-[#111827]">{outStock}</span>
            </li>
          </ul>
        </div>
        <Link
          to="/product/list"
          className="mt-4 inline-block text-[12px] font-medium text-[#111827] hover:underline"
        >
          Manage Inventory
        </Link>
      </section>

      <section className="rounded-xl border border-[#EEF0F4] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] xl:col-span-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-satoshi text-[13px] font-semibold text-[#111827]">
            Top Selling Categories
          </h2>
          <Link to="/report" className="text-[12px] font-medium text-[#111827] hover:underline">
            View All
          </Link>
        </div>
        <ul className="space-y-3">
          {categories.length === 0 ? (
            <li className="py-8 text-center text-[12px] text-[#9CA3AF]">
              No category sales yet
            </li>
          ) : (
            categories.slice(0, 5).map((cat) => (
              <li key={cat.name} className="flex items-center justify-between gap-3">
                <span className="truncate text-[12px] text-[#4B5563]">{cat.name}</span>
                <span className="shrink-0 text-[12px] font-semibold text-[#111827]">
                  {inr(cat.amount)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
};

export default DashboardOpsRow;
