import React, { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

const intensityClass = (value, max, isToday) => {
  if (isToday && (!max || !value)) return "bg-[#FF6012]";
  if (!max || !value) return "bg-[#EEF0F4]";
  const ratio = value / max;
  if (ratio > 0.75) return "bg-[#4F46E5]";
  if (ratio > 0.5) return "bg-[#818CF8]";
  if (ratio > 0.25) return "bg-[#C7D2FE]";
  return "bg-[#E0E7FF]";
};

const monthGrid = (year, monthIndex) => {
  const start = startOfMonth(new Date(year, monthIndex, 1));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });
  const pad = getDay(start);
  return { days, pad };
};

const DashboardCalendarRow = ({ dateRange, series = [] }) => {
  const today = new Date();
  const year = today.getFullYear();
  const todayKey = format(today, "yyyy-MM-dd");

  const heatDays = useMemo(() => {
    const start = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(year, 11, 31), { weekStartsOn: 1 });
    try {
      return eachDayOfInterval({ start, end });
    } catch {
      return [];
    }
  }, [year]);

  const seriesByOffset = useMemo(() => {
    const from = dateRange?.from;
    const to = dateRange?.to;
    if (!from || !Array.isArray(series) || !series.length) return new Map();
    const start = from <= (to || from) ? from : to;
    const end = from <= (to || from) ? to || from : from;
    let days = [];
    try {
      days = eachDayOfInterval({ start, end }).slice(-series.length);
    } catch {
      days = [];
    }
    const map = new Map();
    days.forEach((day, i) => {
      map.set(format(day, "yyyy-MM-dd"), Number(series[i] || 0));
    });
    return map;
  }, [dateRange, series]);

  const max = Math.max(0, ...series.map((n) => Number(n) || 0));
  const weeks = [];
  for (let i = 0; i < heatDays.length; i += 7) {
    weeks.push(heatDays.slice(i, i + 7));
  }

  return (
    <div className="mb-2.5 grid grid-cols-1 items-start gap-2.5 xl:grid-cols-12">
      <section className="rounded-xl border border-[#EEF0F4] bg-white px-3 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)] xl:col-span-7">
        <div className="mb-1.5 flex items-center justify-between">
          <h2 className="font-satoshi text-[13px] font-semibold text-[#111827]">
            Performance Heatmap
          </h2>
          <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
            <span>Less</span>
            <span className="h-2 w-2 rounded-[2px] bg-[#EEF0F4]" />
            <span className="h-2 w-2 rounded-[2px] bg-[#E0E7FF]" />
            <span className="h-2 w-2 rounded-[2px] bg-[#C7D2FE]" />
            <span className="h-2 w-2 rounded-[2px] bg-[#818CF8]" />
            <span className="h-2 w-2 rounded-[2px] bg-[#4F46E5]" />
            <span>More</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex w-full min-w-[520px] gap-[2px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-1 flex-col gap-[2px]">
                {week.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const value = seriesByOffset.get(key) || 0;
                  return (
                    <div
                      key={key}
                      title={`${format(day, "MMM d")}: ${value}`}
                      className={`h-[7px] rounded-[1px] ${intensityClass(
                        value,
                        max,
                        key === todayKey,
                      )}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#EEF0F4] bg-white px-3 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)] xl:col-span-5">
        <h2 className="mb-1.5 font-satoshi text-[13px] font-semibold text-[#111827]">
          {year} calendar
        </h2>
        <div className="grid grid-cols-4 gap-x-2 gap-y-1.5">
          {Array.from({ length: 12 }, (_, month) => {
            const { days, pad } = monthGrid(year, month);
            return (
              <div key={month}>
                <p className="mb-0.5 text-[9px] font-medium text-[#6B7280]">
                  {format(new Date(year, month, 1), "MMM")}
                </p>
                <div className="grid grid-cols-7 gap-[1px]">
                  {Array.from({ length: pad }, (_, i) => (
                    <span key={`p-${i}`} className="h-[7px]" />
                  ))}
                  {days.map((day) => {
                    const isToday = format(day, "yyyy-MM-dd") === todayKey;
                    return (
                      <span
                        key={day.toISOString()}
                        className={`h-[7px] rounded-[1px] ${
                          isToday ? "bg-[#FF6012]" : "bg-[#E5E7EB]"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DashboardCalendarRow;
