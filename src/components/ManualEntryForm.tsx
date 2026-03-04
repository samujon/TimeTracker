import React, { useRef, useState } from "react";

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
  handleManualSubmit: (e: React.FormEvent) => void;
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
    // Track if end time was manually edited (overrides duration)
    const [endManuallyEdited, setEndManuallyEdited] = useState(false);

    // Parse duration string (e.g., "1h 15m", "90m", "1:5", "01:30", "1:30") to minutes
    function parseDuration(str: string): number | null {
      if (!str) return null;
      // Accept h:m, hh:mm, h:mm (single/double digit hours, always 1-2 digit minutes)
      const colonMatch = str.match(/^(\d{1,2}):(\d{1,2})$/);
      if (colonMatch) {
        const hours = parseInt(colonMatch[1], 10);
        const mins = parseInt(colonMatch[2], 10);
        if (isNaN(hours) || isNaN(mins) || mins > 59) return null;
        return hours * 60 + mins;
      }
      // Accept 1h 15m, 90m, etc
      const regex = /(?:(\d+)\s*h)?\s*(\d+)?\s*m?/i;
      const match = str.match(regex);
      if (!match) return null;
      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const mins = match[2] ? parseInt(match[2], 10) : 0;
      if (isNaN(hours) && isNaN(mins)) return null;
      return hours * 60 + mins;
    }

    // When start time or duration changes, update end time (unless end was manually edited)
    React.useEffect(() => {
      if (!manualStartTime.match(/^\d{2}:\d{2}$/)) return;
      if (!manualDuration || endManuallyEdited) return;
      const mins = parseDuration(manualDuration);
      if (mins == null) return;
      const [h, m] = manualStartTime.split(":").map(Number);
      const start = new Date(2000, 0, 1, h, m);
      const end = new Date(start.getTime() + mins * 60000);
      const endStr = `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
      setManualEndTime(endStr);
    }, [manualStartTime, manualDuration]);

    // When end time changes, update duration (unless it was set by duration input)
    React.useEffect(() => {
      if (!manualStartTime.match(/^\d{2}:\d{2}$/) || !manualEndTime.match(/^\d{2}:\d{2}$/)) return;
      if (!endManuallyEdited) return;
      const [sh, sm] = manualStartTime.split(":").map(Number);
      const [eh, em] = manualEndTime.split(":").map(Number);
      let mins = (eh - sh) * 60 + (em - sm);
      if (mins < 0) mins += 24 * 60; // handle overnight
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      // Always use hh:mm format, zero-padded
      setManualDuration(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
    }, [manualEndTime]);
  // Generate 15-minute increment options if not provided
  const allHourOptions = React.useMemo(() => {
    if (propHourOptions && Array.isArray(propHourOptions) && propHourOptions.length > 0) {
      return propHourOptions;
    }
    const options: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        options.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
      }
    }
    return options;
  }, [propHourOptions]);
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const startDropdownRef = useRef<HTMLUListElement>(null);
  const endDropdownRef = useRef<HTMLUListElement>(null);
  // Helper to get the closest time option to now (rounded down to nearest option)
  function getCurrentTimeOption(options: string[]) {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    // Find the closest option <= current
    let idx = options.findIndex(opt => opt >= current);
    if (idx === -1) return 0;
    if (options[idx] > current && idx > 0) return idx - 1;
    return idx;
  }

  // Filtered options for end time
  const filteredEndOptions = allHourOptions.filter((value) => {
    if (!manualStartTime.match(/^\d{2}:\d{2}$/)) return true;
    return value > manualStartTime;
  });

  // Helper to handle click outside for dropdowns
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        startInputRef.current &&
        !startInputRef.current.contains(e.target as Node)
      ) {
        setShowStartDropdown(false);
      }
      if (
        endInputRef.current &&
        !endInputRef.current.contains(e.target as Node)
      ) {
        setShowEndDropdown(false);
      }
    }
    if (showStartDropdown || showEndDropdown) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showStartDropdown, showEndDropdown]);

  // Scroll start dropdown to current time when opened
  React.useEffect(() => {
    if (showStartDropdown && startDropdownRef.current) {
      const idx = getCurrentTimeOption(allHourOptions);
      const item = startDropdownRef.current.children[idx] as HTMLElement | undefined;
      if (item) {
        startDropdownRef.current.scrollTop = item.offsetTop - 24; // 24px padding
      }
    }
  }, [showStartDropdown, allHourOptions]);

  // Scroll end dropdown to current time when opened
  React.useEffect(() => {
    if (showEndDropdown && endDropdownRef.current) {
      const idx = getCurrentTimeOption(filteredEndOptions);
      const item = endDropdownRef.current.children[idx] as HTMLElement | undefined;
      if (item) {
        endDropdownRef.current.scrollTop = item.offsetTop - 24;
      }
    }
  }, [showEndDropdown, filteredEndOptions]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-200">Add manual entry</h2>
        <span className="text-[11px] text-zinc-500">
          For past days or specific times
        </span>
      </div>
      <form
        onSubmit={handleManualSubmit}
        className="grid gap-4 sm:grid-cols-2"
        autoComplete="off"
      >
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            Date
          </label>
          <input
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            Description (optional)
          </label>
          <input
            type="text"
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
            placeholder="What did you work on?"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        {/* Start time with custom dropdown */}
        <div className="space-y-2 relative">
          <label className="block text-xs font-medium text-zinc-300">
            Start time (24h)
          </label>
          <input
            ref={startInputRef}
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
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {showStartDropdown && (
            <ul
              ref={startDropdownRef}
              className="absolute left-0 z-30 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg"
              style={{ top: '100%' }}
            >
              {allHourOptions.map((value) => (
                <li
                  key={value}
                  className="cursor-pointer px-3 py-2 text-sm text-zinc-100 hover:bg-emerald-600/20"
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
        <div className="space-y-2 relative">
          <label className="block text-xs font-medium text-zinc-300">End time (24h) or duration</label>
          <div className="flex gap-2">
            <div className="relative w-1/2">
              <input
                ref={endInputRef}
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
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {showEndDropdown && (
                <ul
                  ref={endDropdownRef}
                  className="absolute left-0 z-30 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg"
                  style={{ top: '100%' }}
                >
                  {filteredEndOptions.map((value) => (
                    <li
                      key={value}
                      className="cursor-pointer px-3 py-2 text-sm text-zinc-100 hover:bg-emerald-600/20"
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
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="block text-xs text-zinc-500 mt-1">Duration (e.g. 1h 15m, 1:5, 01:30, 1:30; auto-formats to hh:mm)</span>
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
