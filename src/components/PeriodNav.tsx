"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { sv } from "date-fns/locale/sv";
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek } from "@/lib/timeUtils";


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
    if (view === "daily") return date.toLocaleDateString("sv-SE");
    if (view === "weekly") {
      const start = startOfISOWeek(date);
      const end = endOfISOWeek(date);
      const week = getISOWeek(date);
      const year = getISOWeekYear(date);
      return `W${week} ${year} (${start.toLocaleDateString("sv-SE")} – ${end.toLocaleDateString("sv-SE")})`;
    }
    if (view === "monthly") return date.toLocaleString("sv-SE", { month: "long", year: "numeric" });
    return "";
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      {view === "daily" ? (
        <>
          <button
            className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-100"
            onClick={() => onChange(addPeriod(selectedDate, -1))}
            aria-label="Previous day"
          >
            &lt;
          </button>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => date && onChange(date)}
            dateFormat="yyyy-MM-dd"
            locale={sv}
            calendarStartDay={1}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            popperClassName="z-50"
            showWeekNumbers
          />
          <button
            className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-100"
            onClick={() => onChange(addPeriod(selectedDate, 1))}
            aria-label="Next day"
          >
            &gt;
          </button>
        </>
      ) : view === "weekly" ? (
        <>
          <button
            className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-100"
            onClick={() => onChange(addPeriod(selectedDate, -1))}
            aria-label="Previous week"
          >
            &lt;
          </button>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => date && onChange(startOfISOWeek(date))}
            dateFormat="yyyy-'W'II"
            showWeekPicker
            locale={sv}
            calendarStartDay={1}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            popperClassName="z-50"
            showWeekNumbers
            renderCustomHeader={({ date, decreaseMonth, increaseMonth }: { date: Date; decreaseMonth: () => void; increaseMonth: () => void }) => (
              <div className="flex items-center justify-between mb-2">
                <button onClick={decreaseMonth} className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-100">&lt;</button>
                <span className="mx-2 text-sm font-medium">{date.toLocaleString("sv-SE", { month: "long", year: "numeric" })}</span>
                <button onClick={increaseMonth} className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-100">&gt;</button>
              </div>
            )}
          />
          <button
            className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-100"
            onClick={() => onChange(addPeriod(selectedDate, 1))}
            aria-label="Next week"
          >
            &gt;
          </button>
        </>
      ) : (
        <>
          <button
            className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-100"
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
            locale={sv}
            calendarStartDay={1}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            popperClassName="z-50"
            showWeekNumbers
          />
          <button
            className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-100"
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
