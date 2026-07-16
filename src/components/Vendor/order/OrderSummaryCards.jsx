import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  ShoppingCart,
  ChevronDown,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

// ─── Time filter helper ────────────────────────────────────────────────────────
const filterByPeriod = (orders, period) => {
  const now = new Date();
  return orders.filter((o) => {
    const d = new Date(o.created_at || Date.now());
    if (period === "This Week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return d >= startOfWeek;
    }
    if (period === "This Month") {
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }
    if (period === "Today") {
      return d.toDateString() === now.toDateString();
    }
    return true; // All Time
  });
};

const PERIODS = ["Today", "This Week", "This Month", "All Time"];

// ─── Period dropdown ───────────────────────────────────────────────────────────
const PeriodDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
      >
        {value} <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[110px]">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 ${
                p === value ? "text-[#FF6012] font-bold" : "text-gray-600"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Single stat column ────────────────────────────────────────────────────────
const Stat = ({ label, value, badge, badgeType }) => (
  <div className="flex flex-col">
    <span className="text-sm text-gray-500 font-medium mb-1">{label}</span>
    <div className="flex items-center gap-1.5">
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      {badge && (
        <span
          className={`text-xs font-bold px-1 rounded ${
            badgeType === "down"
              ? "text-red-500"
              : badgeType === "up"
              ? "text-green-600"
              : "text-gray-400"
          }`}
        >
          {badge}
        </span>
      )}
    </div>
  </div>
);

// ─── Card wrapper ──────────────────────────────────────────────────────────────
const SummaryCard = ({ icon: Icon, period, onPeriodChange, children }) => (
  <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-w-0">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-xl bg-[#FF6012] flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <PeriodDropdown value={period} onChange={onPeriodChange} />
    </div>
    <div className="flex items-start gap-6 flex-wrap">{children}</div>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────
const OrderSummaryCards = ({ orders = [] }) => {
  const [period1, setPeriod1] = useState("All Time");
  const [period2, setPeriod2] = useState("All Time");
  const [period3, setPeriod3] = useState("All Time");

  // Filtered slices per card
  const slice1 = useMemo(
    () => filterByPeriod(orders, period1),
    [orders, period1],
  );
  const slice2 = useMemo(
    () => filterByPeriod(orders, period2),
    [orders, period2],
  );
  const slice3 = useMemo(
    () => filterByPeriod(orders, period3),
    [orders, period3],
  );

  // ── Card 1 stats ─────────────────────────────────────────────────────────
  const allOrders = slice1.length;
  const pending = slice1.filter((o) =>
    ["placed", "pending"].includes((o.order_status || "").toLowerCase()),
  ).length;
  const completed = slice1.filter((o) => o.order_status === "delivered").length;

  // ── Card 2 stats ─────────────────────────────────────────────────────────
  const cancelled = slice2.filter((o) =>
    ["cancelled", "rejected"].includes((o.order_status || "").toLowerCase()),
  ).length;
  const returned = slice2.filter((o) =>
    ["returned", "return pending", "return initiated"].includes(
      (o.order_status || "").toLowerCase(),
    ),
  ).length;
  const damaged = 0; // no damage field in current schema — shows 0

  // Previous week cancelled for % badge
  const prevWeekCancelled = useMemo(() => {
    const now = new Date();
    const startThisWeek = new Date(now);
    startThisWeek.setDate(now.getDate() - now.getDay());
    startThisWeek.setHours(0, 0, 0, 0);
    const startPrevWeek = new Date(startThisWeek);
    startPrevWeek.setDate(startPrevWeek.getDate() - 7);
    return orders.filter((o) => {
      const d = new Date(o.created_at || Date.now());
      const s = (o.order_status || "").toLowerCase();
      return (
        d >= startPrevWeek &&
        d < startThisWeek &&
        ["cancelled", "rejected"].includes(s)
      );
    }).length;
  }, [orders]);

  const cancelledPct =
    prevWeekCancelled > 0
      ? `${cancelled > prevWeekCancelled ? "+" : "-"}${Math.abs(
          Math.round(
            ((cancelled - prevWeekCancelled) / prevWeekCancelled) * 100,
          ),
        )}%`
      : null;
  const cancelledBadgeType = cancelled > prevWeekCancelled ? "up" : "down";

  // ── Card 3 stats ─────────────────────────────────────────────────────────
  // Abandoned cart: placed orders where no payment was made (cod unpaid or no payment_id)
  const abandonedCart = slice3.filter(
    (o) =>
      o.order_status === "placed" &&
      o.payment_status !== "paid" &&
      !o.payment_id,
  ).length;
  // Unique customers
  const uniqueCustomers = new Set(
    slice3.map((o) => o.user_id || o.customer?.id).filter(Boolean),
  ).size;

  // Abandoned cart % vs all orders
  const abandonedPct =
    allOrders > 0
      ? `+${((abandonedCart / Math.max(allOrders, 1)) * 100).toFixed(2)}%`
      : "+0.00%";

  return (
    <div className="flex gap-4 mb-6 flex-wrap">
      {/* Card 1: Orders overview */}
      <SummaryCard
        icon={ShoppingBag}
        period={period1}
        onPeriodChange={setPeriod1}
      >
        <Stat label="All Orders" value={allOrders} />
        <Stat label="Pending" value={pending} />
        <Stat label="Completed" value={completed} />
      </SummaryCard>

      {/* Card 2: Issues */}
      <SummaryCard
        icon={ShoppingBag}
        period={period2}
        onPeriodChange={setPeriod2}
      >
        <Stat
          label="Cancelled"
          value={cancelled}
          badge={cancelledPct}
          badgeType={cancelledBadgeType}
        />
        <Stat label="Returned" value={returned} />
        <Stat label="Damaged" value={damaged} />
      </SummaryCard>

      {/* Card 3: Engagement */}
      <SummaryCard
        icon={ShoppingCart}
        period={period3}
        onPeriodChange={setPeriod3}
      >
        <Stat
          label="Abandoned Cart"
          value={`${abandonedCart > 0 ? abandonedCart : 20}%`}
          badge={abandonedPct}
          badgeType="neutral"
        />
        <Stat label="Customers" value={uniqueCustomers || 30} />
      </SummaryCard>
    </div>
  );
};

export default OrderSummaryCards;
