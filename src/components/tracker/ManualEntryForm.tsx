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
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Manual entry</h2>
        <span className="text-[11px] text-[var(--color-text-muted)]">
          For past days or specific times
        </span>
      </div>
      <form
        onSubmit={handleManualSubmit}
        className="grid gap-3 sm:grid-cols-2"
        autoComplete="off"
      >
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
            Date
          </label>
          <DatePicker
            selected={manualDate ? new Date(manualDate + 'T00:00:00') : null}
            onChange={(date: Date | null) => date && setManualDate(formatLocalDate(date))}
            dateFormat="yyyy-MM-dd"
            showWeekNumbers
            locale={sv}
            calendarStartDay={1}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            popperClassName="z-50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
            Description (optional)
          </label>
          <input
            type="text"
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
            placeholder="What did you work on?"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
        <div className="space-y-1.5 relative" ref={startWrapRef}>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
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
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          {showStartDropdown && (
            <ul
              ref={startDropdownRef}
              className="absolute left-0 z-30 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
              style={{ top: '100%' }}
            >
              {allHourOptions.map((value) => (
                <li
                  key={value}
                  className="cursor-pointer px-3 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary-light)]"
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
        <div className="space-y-1.5 relative" ref={endWrapRef}>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">End time (24h) or duration</label>
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
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
              {showEndDropdown && (
                <ul
                  ref={endDropdownRef}
                  className="absolute left-0 z-30 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
                  style={{ top: '100%' }}
                >
                  {filteredEndOptions.map((value) => (
                    <li
                      key={value}
                      className="cursor-pointer px-3 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary-light)]"
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
                  setManualDuration(e.target.value);
                  setEndManuallyEdited(false);
                }}
                onBlur={e => {
                  const val = e.target.value;
                  const colonMatch = val.match(/^(\d{1,2}):(\d{1,2})$/);
                  if (colonMatch) {
                    const hours = colonMatch[1].padStart(2, "0");
                    const mins = colonMatch[2].padStart(2, "0");
                    setManualDuration(`${hours}:${mins}`);
                  }
                }}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
              <span className="block text-[10px] text-[var(--color-text-muted)] mt-1">Duration (e.g. 1h 15m, 01:30)</span>
            </div>
          </div>
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={manualSaving}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--color-surface-alt)] px-5 py-1.5 text-xs font-medium text-[var(--color-text)] border border-[var(--color-border)] transition hover:bg-[var(--color-bg)] disabled:opacity-60"
          >
            Save manual entry
          </button>
        </div>
      </form>
    </section>
  );
}
