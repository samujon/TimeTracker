"use client";

import { useRef, useState, useMemo, useEffect, type FormEvent } from "react";
import DatePicker from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import { parseDuration, buildHourOptions, formatLocalDate } from "@/lib/timeUtils";
import { MINUTES_PER_DAY } from "@/lib/constants";
import { useClickOutside } from "@/hooks/useClickOutside";

type ManualEntryFormProps = {
  manualDate: string;
  setManualDate: (v: string) => void;
  manualStartTime: string;
  setManualStartTime: (v: string) => void;
  manualEndTime: string;
  setManualEndTime: (v: string) => void;
  manualDuration: string;
  setManualDuration: (v: string) => void;
  manualDescription: string;
  setManualDescription: (v: string) => void;
  manualSaving: boolean;
  handleManualSubmit: (e: FormEvent) => void;
  hourOptions?: string[];
};

export function ManualEntryForm({
  manualDate,
  setManualDate,
  manualStartTime,
  setManualStartTime,
  manualEndTime,
  setManualEndTime,
  manualDuration,
  setManualDuration,
  manualDescription,
  setManualDescription,
  manualSaving,
  handleManualSubmit,
  hourOptions: propHourOptions,
}: ManualEntryFormProps) {
  const [endManuallyEdited, setEndManuallyEdited] = useState(false);

  // Use injected options if provided, else generate locally once
  const allHourOptions = useMemo(() => {
    if (propHourOptions && propHourOptions.length > 0) return propHourOptions;
    return buildHourOptions();
  }, [propHourOptions]);

  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);
  const startWrapRef = useRef<HTMLDivElement>(null);
  const endWrapRef = useRef<HTMLDivElement>(null);
  const startDropdownRef = useRef<HTMLUListElement>(null);
  const endDropdownRef = useRef<HTMLUListElement>(null);

  useClickOutside(startWrapRef, () => setShowStartDropdown(false), showStartDropdown);
  useClickOutside(endWrapRef, () => setShowEndDropdown(false), showEndDropdown);

  // When start time or duration changes, update end time (unless end was manually edited)
  useEffect(() => {
    if (!manualStartTime.match(/^\d{2}:\d{2}$/)) return;
    if (!manualDuration || endManuallyEdited) return;
    const mins = parseDuration(manualDuration);
    if (mins == null) return;
    const [h, m] = manualStartTime.split(":").map(Number);
    const start = new Date(2000, 0, 1, h, m);
    const end = new Date(start.getTime() + mins * 60000);
    setManualEndTime(
      `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualStartTime, manualDuration, endManuallyEdited]);

  // When end time is manually edited, recalculate duration
  useEffect(() => {
    if (!manualStartTime.match(/^\d{2}:\d{2}$/) || !manualEndTime.match(/^\d{2}:\d{2}$/)) return;
    if (!endManuallyEdited) return;
    const [sh, sm] = manualStartTime.split(":").map(Number);
    const [eh, em] = manualEndTime.split(":").map(Number);
    let mins = (eh - sh) * 60 + (em - sm);
    if (mins < 0) mins += MINUTES_PER_DAY;
    const hours = Math.floor(mins / 60).toString().padStart(2, "0");
    const minutes = (mins % 60).toString().padStart(2, "0");
    setManualDuration(`${hours}:${minutes}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualEndTime, manualStartTime, endManuallyEdited]);

  function getCurrentTimeOption(options: string[]) {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const idx = options.findIndex((opt) => opt >= current);
    if (idx === -1) return 0;
    if (options[idx] > current && idx > 0) return idx - 1;
    return idx;
  }

  const filteredEndOptions = allHourOptions.filter((value) => {
    if (!manualStartTime.match(/^\d{2}:\d{2}$/)) return true;
    return value > manualStartTime;
  });

  // Scroll start dropdown to current time when opened
  useEffect(() => {
    if (showStartDropdown && startDropdownRef.current) {
      const idx = getCurrentTimeOption(allHourOptions);
      const item = startDropdownRef.current.children[idx] as HTMLElement | undefined;
      if (item) startDropdownRef.current.scrollTop = item.offsetTop - 24;
    }
  }, [showStartDropdown, allHourOptions]);

  // Scroll end dropdown to current time when opened
  useEffect(() => {
    if (showEndDropdown && endDropdownRef.current) {
      const idx = getCurrentTimeOption(filteredEndOptions);
      const item = endDropdownRef.current.children[idx] as HTMLElement | undefined;
      if (item) endDropdownRef.current.scrollTop = item.offsetTop - 24;
    }
  }, [showEndDropdown, filteredEndOptions]);

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Add manual entry</h2>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
          For past days or specific times
        </span>
      </div>
      <form
        onSubmit={handleManualSubmit}
        className="grid gap-4 sm:grid-cols-2"
        autoComplete="off"
      >
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Date
          </label>
          <DatePicker
            selected={manualDate ? new Date(manualDate + 'T00:00:00') : null}
            onChange={(date: Date | null) => date && setManualDate(formatLocalDate(date))}
            dateFormat="yyyy-MM-dd"
            showWeekNumbers
            locale={sv}
            calendarStartDay={1}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            popperClassName="z-50"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Description (optional)
          </label>
          <input
            type="text"
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
            placeholder="What did you work on?"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        {/* Start time with custom dropdown */}
        <div className="space-y-2 relative" ref={startWrapRef}>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Start time (24h)
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="09:00"
            value={manualStartTime}
            onFocus={() => setShowStartDropdown(true)}
            onChange={(e) => {
              setManualStartTime(e.target.value);
              setShowStartDropdown(true);
            }}
            autoComplete="off"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {showStartDropdown && (
            <ul
              ref={startDropdownRef}
              className="absolute left-0 z-30 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg"
              style={{ top: '100%' }}
            >
              {allHourOptions.map((value) => (
                <li
                  key={value}
                  className="cursor-pointer px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-emerald-600/20"
                  onMouseDown={() => {
                    setManualStartTime(value);
                    setShowStartDropdown(false);
                  }}
                >
                  {value}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* End time and duration */}
        <div className="space-y-2 relative" ref={endWrapRef}>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">End time (24h) or duration</label>
          <div className="flex gap-2">
            <div className="relative w-1/2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="17:30"
                value={manualEndTime}
                onFocus={() => setShowEndDropdown(true)}
                onChange={(e) => {
                  setManualEndTime(e.target.value);
                  setShowEndDropdown(true);
                  setEndManuallyEdited(true);
                }}
                autoComplete="off"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {showEndDropdown && (
                <ul
                  ref={endDropdownRef}
                  className="absolute left-0 z-30 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg"
                  style={{ top: '100%' }}
                >
                  {filteredEndOptions.map((value) => (
                    <li
                      key={value}
                      className="cursor-pointer px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-emerald-600/20"
                      onMouseDown={() => {
                        setManualEndTime(value);
                        setShowEndDropdown(false);
                        setEndManuallyEdited(true);
                      }}
                    >
                      {value}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="w-1/2">
              <input
                type="text"
                placeholder="e.g. 1h 15m or 1:5 or 01:30"
                value={manualDuration}
                onChange={e => {
                  // Allow user to type freely, don't pad on every keystroke
                  setManualDuration(e.target.value);
                  setEndManuallyEdited(false);
                }}
                onBlur={e => {
                  // On blur, if h:m or h:mm or hh:m, format to hh:mm
                  const val = e.target.value;
                  const colonMatch = val.match(/^(\d{1,2}):(\d{1,2})$/);
                  if (colonMatch) {
                    const hours = colonMatch[1].padStart(2, "0");
                    const mins = colonMatch[2].padStart(2, "0");
                    setManualDuration(`${hours}:${mins}`);
                  }
                }}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="block text-xs text-zinc-400 dark:text-zinc-500 mt-1">Duration (e.g. 1h 15m, 1:5, 01:30, 1:30; auto-formats to hh:mm)</span>
            </div>
          </div>
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={manualSaving}
            className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-6 py-2 text-xs font-medium text-zinc-950 shadow-md shadow-black/30 transition hover:bg-white disabled:opacity-60"
          >
            Save manual entry
          </button>
        </div>
      </form>
    </section>
  );
}
