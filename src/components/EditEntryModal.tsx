import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";

type EditEntryModalProps = {
  entry: {
    id: string;
    description: string | null;
    project_id: string | null;
    started_at: string;
    ended_at: string | null;
  };
  projects: { id: string; name: string; color?: string }[];
  onSave: (update: { id: string; description: string; project_id: string; started_at: string; ended_at: string }) => void;
  onClose: () => void;
};

export function EditEntryModal({ entry, projects, onSave, onClose }: EditEntryModalProps) {
  const [description, setDescription] = useState(entry.description || "");
  const [projectId, setProjectId] = useState(entry.project_id || (projects[0]?.id ?? ""));
  const [date, setDate] = useState(entry.started_at ? entry.started_at.slice(0, 10) : "");
  const [startTime, setStartTime] = useState(entry.started_at ? entry.started_at.slice(11, 16) : "");
  const [endTime, setEndTime] = useState(entry.ended_at ? entry.ended_at.slice(11, 16) : "");
  const [saving, setSaving] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    onSave({
      id: entry.id,
      description,
      project_id: projectId,
      started_at: `${date}T${startTime}`,
      ended_at: `${date}T${endTime}`,
    });
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
              onChange={e => setProjectId(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Date</label>
            <DatePicker
              selected={date ? new Date(date) : null}
              onChange={d => d && setDate(d.toISOString().slice(0, 10))}
              dateFormat="yyyy-MM-dd"
              locale={sv}
              calendarStartDay={1}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              popperClassName="z-50"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-300 mb-1">End time</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-zinc-700 text-zinc-200 text-xs font-medium hover:bg-zinc-600"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-emerald-500 text-zinc-950 text-xs font-medium hover:bg-emerald-400 disabled:opacity-60"
              disabled={saving}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
