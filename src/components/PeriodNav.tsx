import React from "react";

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
      const start = new Date(date);
      const end = new Date(date);
      start.setDate(start.getDate() - start.getDay());
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
    }
    if (view === "monthly") return date.toLocaleString("default", { month: "long", year: "numeric" });
    return "";
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
        onClick={() => onChange(addPeriod(selectedDate, -1))}
        aria-label="Previous"
      >
        &lt;
      </button>
      <span className="mx-2 text-sm font-medium">
        {formatLabel(selectedDate)}
      </span>
      <button
        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
        onClick={() => onChange(addPeriod(selectedDate, 1))}
        aria-label="Next"
      >
        &gt;
      </button>
      {/* Calendar picker can be added here */}
    </div>
  );
}
