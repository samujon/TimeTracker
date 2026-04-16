"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { enCA } from "date-fns/locale/en-CA";
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
    if (view === "daily") return date.toLocaleDateString("en-CA");
    if (view === "weekly") {
      const start = startOfISOWeek(date);
      const end = endOfISOWeek(date);
      const week = getISOWeek(date);
      const year = getISOWeekYear(date);
      return `W${week} ${year} (${start.toLocaleDateString("en-CA")} \u2013 ${end.toLocaleDateString("en-CA")})`;
    }
    if (view === "monthly") return date.toLocaleString("en-CA", { month: "long", year: "numeric" });
    return "";
  }

  return (
    <div className="flex items-center gap-2 mb-3">
      {view === "daily" ? (
        <>
          <button
            className="px-2 py-1 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition"
            onClick={() => onChange(addPeriod(selectedDate, -1))}
            aria-label="Previous day"
          >
            &lt;
          </button>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => date && onChange(date)}
            dateFormat="yyyy-MM-dd"
            locale={enCA}
            calendarStartDay={1}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            popperClassName="z-50"
            showWeekNumbers
          />
          <button
            className="px-2 py-1 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition"
            onClick={() => onChange(addPeriod(selectedDate, 1))}
            aria-label="Next day"
          >
            &gt;
          </button>
        </>
      ) : view === "weekly" ? (
        <>
          <button
            className="px-2 py-1 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition"
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
            locale={enCA}
            calendarStartDay={1}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            popperClassName="z-50"
            showWeekNumbers
            renderCustomHeader={({ date, decreaseMonth, increaseMonth }: { date: Date; decreaseMonth: () => void; increaseMonth: () => void }) => (
              <div className="flex items-center justify-between mb-2">
                <button onClick={decreaseMonth} className="px-2 py-1 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]">&lt;</button>
                <span className="mx-2 text-sm font-medium">{date.toLocaleString("en-CA", { month: "long", year: "numeric" })}</span>
                <button onClick={increaseMonth} className="px-2 py-1 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]">&gt;</button>
              </div>
            )}
          />
          <button
            className="px-2 py-1 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition"
            onClick={() => onChange(addPeriod(selectedDate, 1))}
            aria-label="Next week"
          >
            &gt;
          </button>
        </>
      ) : (
        <>
          <button
            className="px-2 py-1 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition"
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
            locale={enCA}
            calendarStartDay={1}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            popperClassName="z-50"
            showWeekNumbers
          />
          <button
            className="px-2 py-1 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition"
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
