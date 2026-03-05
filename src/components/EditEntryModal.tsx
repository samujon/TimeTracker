import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import type { Project } from "@/types";
import { formatLocalDate, formatLocalTime } from "@/lib/timeUtils";

type EditEntryModalProps = {
  entry: {
    id: string;
    description: string | null;
    project_id: string | null;
    started_at: string;
    ended_at: string | null;
  };
  projects: Project[];
  /** Async — the modal resets its `saving` state after the promise settles. */
  onSave: (update: {
    id: string;
    description: string;
    project_id: string;
    started_at: string;
    ended_at: string;
  }) => Promise<void>;
  onClose: () => void;
};

export function EditEntryModal({ entry, projects, onSave, onClose }: EditEntryModalProps) {
  // Parse ISO timestamps into local-time parts so the displayed values match
  // what the user sees in their local timezone (e.g. CET/CEST for Swedish users).
  const startDate = entry.started_at ? new Date(entry.started_at) : null;
  const endDate = entry.ended_at ? new Date(entry.ended_at) : null;

  const [description, setDescription] = useState(entry.description ?? "");
  const [projectId, setProjectId] = useState(entry.project_id ?? "");
  const [date, setDate] = useState(() => (startDate ? formatLocalDate(startDate) : ""));
  const [startTime, setStartTime] = useState(() => (startDate ? formatLocalTime(startDate) : ""));
  const [endTime, setEndTime] = useState(() => (endDate ? formatLocalTime(endDate) : ""));
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!date || !startTime || !endTime) {
      setValidationError("Date, start time and end time are all required.");
      return;
    }
    if (endTime <= startTime) {
      setValidationError("End time must be after start time.");
      return;
    }

    // Construct local-datetime strings and convert to UTC ISO for storage.
    const startedAt = new Date(`${date}T${startTime}:00`).toISOString();
    const endedAt = new Date(`${date}T${endTime}:00`).toISOString();

    setSaving(true);
    try {
      await onSave({ id: entry.id, description, project_id: projectId, started_at: startedAt, ended_at: endedAt });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-700 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-zinc-100">Edit Entry</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">— No project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Date</label>
            <DatePicker
              selected={date ? new Date(date + "T00:00:00") : null}
              onChange={(d: Date | null) => d && setDate(formatLocalDate(d))}
              dateFormat="yyyy-MM-dd"
              locale={sv}
              calendarStartDay={1}
              showWeekNumbers
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              popperClassName="z-50"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Start time</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="HH:mm"
                pattern="[0-2][0-9]:[0-5][0-9]"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-300 mb-1">End time</label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="HH:mm"
                pattern="[0-2][0-9]:[0-5][0-9]"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          {validationError && (
            <p className="text-xs text-rose-400">{validationError}</p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-full bg-zinc-700 text-zinc-200 text-xs font-medium hover:bg-zinc-600 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-full bg-emerald-500 text-zinc-950 text-xs font-medium hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

