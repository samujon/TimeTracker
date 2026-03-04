import React from "react";

type ManualEntryFormProps = {
  manualDate: string;
  setManualDate: (v: string) => void;
  manualStartTime: string;
  setManualStartTime: (v: string) => void;
  manualEndTime: string;
  setManualEndTime: (v: string) => void;
  manualDescription: string;
  setManualDescription: (v: string) => void;
  manualSaving: boolean;
  handleManualSubmit: (e: React.FormEvent) => void;
  hourOptions: string[];
};

export function ManualEntryForm({
  manualDate,
  setManualDate,
  manualStartTime,
  setManualStartTime,
  manualEndTime,
  setManualEndTime,
  manualDescription,
  setManualDescription,
  manualSaving,
  handleManualSubmit,
  hourOptions,
}: ManualEntryFormProps) {
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
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            Start time (24h)
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="09:00"
            list="time-options"
            value={manualStartTime}
            onChange={(e) => setManualStartTime(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            End time (24h)
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="17:30"
            list="time-options"
            value={manualEndTime}
            onChange={(e) => setManualEndTime(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
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
      <datalist id="time-options">
        {hourOptions.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
    </section>
  );
}
