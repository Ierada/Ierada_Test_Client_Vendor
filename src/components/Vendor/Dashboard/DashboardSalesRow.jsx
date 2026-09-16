import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Chart from "react-apexcharts";
import { format, eachDayOfInterval } from "date-fns";

const COLORS = {
  delivered: "#7C3AED",
  processing: "#22C55E",
  shipped: "#22D3EE",
  cancelled: "#F97316",
  returned: "#F43F5E",
};

const DashboardSalesRow = ({ data = {}, dateRange }) => {
  const days = useMemo(() => {
    const from = dateRange?.from || new Date();
    const to = dateRange?.to || from;
    const start = from <= to ? from : to;
    const end = from <= to ? to : from;
    try {
      return eachDayOfInterval({ start, end }).slice(-7);
    } catch {
      return [];
    }
  }, [dateRange]);

  const categories = days.map((d) => format(d, "MMM d"));
  const revenueSeries = data.sales_revenue_series || days.map(() => 0);
  const ordersSeries = data.sales_orders_series || days.map(() => 0);

  const lineOptions = {
    chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "Satoshi, sans-serif" },
    stroke: { width: [2.5, 2.5], curve: "straight" },
    colors: ["#F97316", "#6366F1"],
    dataLabels: { enabled: false },
    markers: { size: 3, strokeWidth: 0 },
    grid: { borderColor: "#F3F4F6", strokeDashArray: 0, xaxis: { lines: { show: false } } },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#9CA3AF", fontSize: "11px" } },
    },
    yaxis: {
      labels: {
        style: { colors: "#9CA3AF", fontSize: "11px" },
        formatter: (v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : `${v}`),
      },
    },
    legend: { show: false },
    tooltip: { shared: true },
  };

  const slices = [
    { key: "Delivered", value: Number(data.completed_order || 0), color: COLORS.delivered },
    { key: "Processing", value: Number(data.processing_order || 0), color: COLORS.processing },
    { key: "Shipped", value: Number(data.shipped_order || 0), color: COLORS.shipped },
    { key: "Cancelled", value: Number(data.cancelled_order || 0), color: COLORS.cancelled },
    { key: "Returned", value: Number(data.return_order || 0), color: COLORS.returned },
  ];
  const total = slices.reduce((sum, s) => sum + s.value, 0) || Number(data.total_sales || 0);

  const statusMax = Math.max(1, ...slices.map((s) => s.value), total);
  const radialOptions = {
    chart: { toolbar: { show: false }, fontFamily: "Satoshi, sans-serif" },
    labels: slices.map((s) => s.key),
    colors: slices.map((s) => s.color),
    stroke: { lineCap: "round" },
    plotOptions: {
      radialBar: {
        hollow: { size: "28%" },
        track: { background: "#F3F4F6", strokeWidth: "80%" },
        dataLabels: {
          name: { fontSize: "10px", color: "#9CA3AF", offsetY: 12 },
          value: {
            fontSize: "14px",
            fontWeight: 600,
            color: "#111827",
            offsetY: -6,
            formatter: () => `${total.toLocaleString("en-IN")}`,
          },
          total: {
            show: true,
            label: "Total",
            fontSize: "10px",
            color: "#9CA3AF",
            formatter: () => `${total.toLocaleString("en-IN")}`,
          },
        },
      },
    },
    legend: { show: false },
  };
  const radialSeries = slices.map((s) =>
    Math.round((s.value / statusMax) * 100),
  );

  return (
    <>
      <section className="rounded-xl border border-[#EEF0F4] bg-white p-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)] xl:col-span-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-satoshi text-[13px] font-semibold text-[#111827]">
            Sales Overview
          </h2>
          <span className="rounded-lg border border-[#EEF0F4] bg-[#F9FAFB] px-2 py-0.5 text-[10px] text-[#6B7280]">
            Last 7 days
          </span>
        </div>
        <div className="mb-0.5 flex items-center gap-3 text-[11px] text-[#6B7280]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#F97316]" /> Revenue
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#6366F1]" /> Orders
          </span>
        </div>
        <Chart
          type="line"
          height={135}
          options={lineOptions}
          series={[
            { name: "Revenue", data: revenueSeries },
            { name: "Orders", data: ordersSeries },
          ]}
        />
      </section>

      <section className="rounded-xl border border-[#EEF0F4] bg-white p-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)] xl:col-span-3">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-satoshi text-[13px] font-semibold text-[#111827]">
            Order Status
          </h2>
          <Link to="/orders" className="text-[11px] font-medium text-[#111827] hover:underline">
            View All
          </Link>
        </div>
        <Chart
          type="radialBar"
          height={126}
          options={radialOptions}
          series={radialSeries}
        />
        <ul className="mt-0.5 space-y-0.5">
          {slices.map((s) => {
            const pct = total ? Math.round((s.value / total) * 100) : 0;
            return (
              <li key={s.key}>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="inline-flex items-center gap-1.5 text-[#6B7280]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                    {s.key}
                  </span>
                  <span className="font-medium text-[#111827]">
                    {s.value.toLocaleString("en-IN")}
                    <span className="ml-1 text-[#9CA3AF]">({pct}%)</span>
                  </span>
                </div>
                <div className="mt-0.5 h-0.5 overflow-hidden rounded-full bg-[#F3F4F6]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: s.color }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
};

export default DashboardSalesRow;
