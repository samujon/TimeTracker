
function getISOWeek(date: Date): number {
  // Returns ISO 8601 week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
}

function getISOWeekYear(date: Date): number {
  // Returns the year for the ISO week
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return d.getUTCFullYear();
}

function getStartOfISOWeek(date: Date): Date {
  // Returns the Monday of the ISO week
  const d = new Date(date);
  const day = d.getDay() || 7;
  if (day !== 1) d.setDate(d.getDate() - (day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfISOWeek(date: Date): Date {
  // Returns the Sunday of the ISO week
  const d = getStartOfISOWeek(date);
  d.setDate(d.getDate() + 6);
  return d;
}
import React, { useEffect } from "react";
import DatePicker, { CalendarContainer } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { sv } from "date-fns/locale/sv";
import type { Locale } from "date-fns";


export function PeriodNav({
  view,
  selectedDate,
  onChange,
}: {
  view: "daily" | "weekly" | "monthly";
  selectedDate: Date;
  onChange: (date: Date) => void;
}) {
  function addPeriod(date: Date, n: number) {
    const d = new Date(date);
    if (view === "daily") d.setDate(d.getDate() + n);
    else if (view === "weekly") d.setDate(d.getDate() + n * 7);
    else d.setMonth(d.getMonth() + n);
    return d;
  }

  function formatLabel(date: Date) {
    if (view === "daily") return date.toLocaleDateString();
    if (view === "weekly") {
      const start = getStartOfISOWeek(date);
      const end = getEndOfISOWeek(date);
      const week = getISOWeek(date);
      const year = getISOWeekYear(date);
      return `v. ${week} (${start.toLocaleDateString("sv-SE")} – ${end.toLocaleDateString("sv-SE")})`;
    }
    if (view === "monthly") return date.toLocaleString("default", { month: "long", year: "numeric" });
    return "";
  }

  // Use user's browser locale if available, else fallback to sv
  const userLocale = typeof window !== "undefined" && window.navigator.language ? window.navigator.language : "sv";
  let dateFnsLocale: Locale = sv;
  try {
    // Dynamically import the locale from date-fns if available
    const imported = require(`date-fns/locale/${userLocale.split('-')[0]}`);
    // Use the default export if present, otherwise use the module itself
    dateFnsLocale = imported.default ? imported.default : imported;
  } catch {
    dateFnsLocale = sv;
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      {view === "daily" ? (
        <>
          <button
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
            onClick={() => onChange(addPeriod(selectedDate, -1))}
            aria-label="Previous day"
          >
            &lt;
          </button>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => date && onChange(date)}
            dateFormat="yyyy-MM-dd"
            locale={dateFnsLocale}
            calendarStartDay={1}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            popperClassName="z-50"
            showWeekNumbers
          />
          <button
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
            onClick={() => onChange(addPeriod(selectedDate, 1))}
            aria-label="Next day"
          >
            &gt;
          </button>
        </>
      ) : view === "weekly" ? (
        <>
          <button
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
            onClick={() => onChange(addPeriod(selectedDate, -1))}
            aria-label="Previous week"
          >
            &lt;
          </button>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => date && onChange(getStartOfISOWeek(date))}
            dateFormat="yyyy-'W'II"
            showWeekPicker
            locale={dateFnsLocale}
            calendarStartDay={1}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            popperClassName="z-50"
            showWeekNumbers
            renderCustomHeader={({ date, decreaseMonth, increaseMonth }: { date: Date; decreaseMonth: () => void; increaseMonth: () => void }) => (
              <div className="flex items-center justify-between mb-2">
                <button onClick={decreaseMonth} className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700">&lt;</button>
                <span className="mx-2 text-sm font-medium">{date.toLocaleString("default", { month: "long", year: "numeric" })}</span>
                <button onClick={increaseMonth} className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700">&gt;</button>
              </div>
            )}
          />
          <button
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
            onClick={() => onChange(addPeriod(selectedDate, 1))}
            aria-label="Next week"
          >
            &gt;
          </button>
        </>
      ) : (
        <>
          <button
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
            onClick={() => onChange(addPeriod(selectedDate, -1))}
            aria-label="Previous"
          >
            &lt;
          </button>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => date && onChange(date)}
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            locale={dateFnsLocale}
            calendarStartDay={1}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            popperClassName="z-50"
            showWeekNumbers
          />
          <button
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
            onClick={() => onChange(addPeriod(selectedDate, 1))}
            aria-label="Next"
          >
            &gt;
          </button>
        </>
      )}
    </div>
  );
}
