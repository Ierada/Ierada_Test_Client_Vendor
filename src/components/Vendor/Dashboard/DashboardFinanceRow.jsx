import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Chart from "react-apexcharts";

const inr = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const CHANNEL_COLORS = {
  website: "#6366F1",
  app: "#22C55E",
  influencer: "#F97316",
  marketing: "#06B6D4",
};

const DashboardFinanceRow = ({ data = {} }) => {
  const channels = useMemo(() => {
    const raw = data.donutChartData || {};
    const keys = Object.keys(raw);
    if (!keys.length) {
      return [
        { key: "Website", value: 0, color: CHANNEL_COLORS.website },
        { key: "App", value: 0, color: CHANNEL_COLORS.app },
        { key: "Influencer", value: 0, color: CHANNEL_COLORS.influencer },
        { key: "Marketing", value: 0, color: CHANNEL_COLORS.marketing },
      ];
    }
    return keys.map((key) => ({
      key: key.charAt(0).toUpperCase() + key.slice(1),
      value: Number(raw[key]?.value || 0),
      color: CHANNEL_COLORS[key] || "#9CA3AF",
    }));
  }, [data.donutChartData]);

  const channelTotal = channels.reduce((sum, c) => sum + c.value, 0);
  const revenue = Number(data.total_revenue || 0);
  const expenses = Number(data.expenses || 0);
  const profit =
    data.profit != null ? Number(data.profit) : Math.max(0, revenue - expenses);
  const rating = Number(data.store_rating || 0);
  const sellerScore =
    data.seller_score != null
      ? Number(data.seller_score)
      : rating
        ? Math.round(rating * 20)
        : 0;

  const channelBarOptions = {
    chart: { toolbar: { show: false }, fontFamily: "Satoshi, sans-serif" },
    plotOptions: {
      bar: { horizontal: true, borderRadius: 4, barHeight: "58%", distributed: true },
    },
    colors: channels.map((c) => c.color),
    dataLabels: { enabled: false },
    grid: { borderColor: "#F3F4F6", xaxis: { lines: { show: false } } },
    xaxis: {
      categories: channels.map((c) => c.key),
      labels: { style: { colors: "#9CA3AF", fontSize: "10px" } },
    },
    yaxis: { labels: { style: { colors: "#6B7280", fontSize: "11px" } } },
    legend: { show: false },
    tooltip: {
      y: { formatter: (v) => `${Number(v || 0).toLocaleString("en-IN")} orders` },
    },
  };

  const profitBarOptions = {
    chart: { toolbar: { show: false }, fontFamily: "Satoshi, sans-serif" },
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: "42%", distributed: true },
    },
    colors: ["#6366F1", "#F97316", "#22C55E"],
    dataLabels: { enabled: false },
    grid: { borderColor: "#F3F4F6", strokeDashArray: 3 },
    xaxis: {
      categories: ["Revenue", "Expenses", "Profit"],
      labels: { style: { colors: "#9CA3AF", fontSize: "10px" } },
    },
    yaxis: {
      labels: {
        style: { colors: "#9CA3AF", fontSize: "10px" },
        formatter: (v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : `${v}`),
      },
    },
    legend: { show: false },
    tooltip: { y: { formatter: (v) => inr(v) } },
  };

  return (
    <div className="mb-2.5 grid grid-cols-1 gap-2.5 xl:grid-cols-12">
      <section className="rounded-xl border border-[#EEF0F4] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] xl:col-span-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-satoshi text-[13px] font-semibold text-[#111827]">
            Revenue by Channel
          </h2>
          <Link to="/report" className="text-[12px] font-medium text-[#111827] hover:underline">
            View All
          </Link>
        </div>
        <Chart
          type="bar"
          height={150}
          options={channelBarOptions}
          series={[{ name: "Orders", data: channels.map((c) => c.value || 0) }]}
        />
        <p className="mt-1 text-center text-[11px] text-[#9CA3AF]">
          {channelTotal.toLocaleString("en-IN")} orders across channels
        </p>
      </section>

      <section className="rounded-xl border border-[#EEF0F4] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] xl:col-span-4">
        <h2 className="mb-2 font-satoshi text-[13px] font-semibold text-[#111827]">
          Profit Overview
        </h2>
        <Chart
          type="bar"
          height={140}
          options={profitBarOptions}
          series={[{ name: "Amount", data: [revenue, expenses, profit] }]}
        />
        <div className="mt-1 grid grid-cols-3 gap-1.5 text-center">
          <div>
            <p className="text-[10px] text-[#9CA3AF]">Revenue</p>
            <p className="text-[11px] font-semibold text-[#111827]">{inr(revenue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#9CA3AF]">Expenses</p>
            <p className="text-[11px] font-semibold text-[#111827]">{inr(expenses)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#9CA3AF]">Profit</p>
            <p className="text-[11px] font-semibold text-[#15803D]">{inr(profit)}</p>
          </div>
        </div>
        <Link
          to="/payments"
          className="mt-2 inline-block text-[11px] font-medium text-[#111827] hover:underline"
        >
          View payouts
        </Link>
      </section>

      <section className="rounded-xl border border-[#EEF0F4] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] xl:col-span-4">
        <h2 className="mb-2 font-satoshi text-[13px] font-semibold text-[#111827]">
          Seller Score
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
                stroke="#6366F1"
                strokeWidth="3.5"
                strokeDasharray={`${sellerScore} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-satoshi text-[22px] font-semibold leading-none text-[#111827]">
                {sellerScore}
              </p>
              <p className="mt-1 text-[10px] text-[#9CA3AF]">/ 100</p>
            </div>
          </div>
          <ul className="space-y-2 text-[12px] text-[#6B7280]">
            <li className="flex justify-between gap-6">
              <span>Store rating</span>
              <span className="font-semibold text-[#111827]">
                {rating ? rating.toFixed(1) : "—"}
              </span>
            </li>
            <li className="flex justify-between gap-6">
              <span>Completed orders</span>
              <span className="font-semibold text-[#111827]">
                {Number(data.completed_order || 0).toLocaleString("en-IN")}
              </span>
            </li>
            <li className="flex justify-between gap-6">
              <span>Returns</span>
              <span className="font-semibold text-[#111827]">
                {Number(data.return_order || 0).toLocaleString("en-IN")}
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DashboardFinanceRow;
