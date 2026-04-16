"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import type { Project, Tag } from "@/types";
import { formatLocalDate, formatLocalTime } from "@/lib/timeUtils";
import { TagSelector } from "./TagSelector";
import { DEFAULT_PROJECT_COLOR } from "@/lib/constants";

type EditEntryModalProps = {
  entry: {
    id: string;
    description: string | null;
    project_id: string | null;
    started_at: string;
    ended_at: string | null;
    entry_tags?: Tag[];
  };
  projects: Project[];
  tags: Tag[];
  onCreateTag: (name: string, color: string) => Promise<void>;
  /** Async — the modal resets its `saving` state after the promise settles. */
  onSave: (update: {
    id: string;
    description: string;
    project_id: string;
    started_at: string;
    ended_at: string;
    entry_tag_ids: string[];
  }) => Promise<void>;
  onClose: () => void;
};

export function EditEntryModal({ entry, projects, tags, onCreateTag, onSave, onClose }: EditEntryModalProps) {
  // Parse ISO timestamps into local-time parts so the displayed values match
  // what the user sees in their local timezone (e.g. CET/CEST for Swedish users).
  const startDate = entry.started_at ? new Date(entry.started_at) : null;
  const endDate = entry.ended_at ? new Date(entry.ended_at) : null;

  const [description, setDescription] = useState(entry.description ?? "");
  const [projectId, setProjectId] = useState(entry.project_id ?? "");
  const [date, setDate] = useState(() => (startDate ? formatLocalDate(startDate) : ""));
  const [startTime, setStartTime] = useState(() => (startDate ? formatLocalTime(startDate) : ""));
  const [endTime, setEndTime] = useState(() => (endDate ? formatLocalTime(endDate) : ""));
  const [entryTagIds, setEntryTagIds] = useState<string[]>(() =>
    (entry.entry_tags ?? []).map((t) => t.id)
  );
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Inherited project tags (read-only display)
  const selectedProject = projects.find((p) => p.id === projectId);
  const inheritedTags = selectedProject?.tags ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!date || !startTime || !endTime) {
      setValidationError("Date, start time and end time are all required.");
      return;
    }
    if (new Date(`${date}T${endTime}:00`).getTime() <= new Date(`${date}T${startTime}:00`).getTime()) {
      setValidationError("End time must be after start time.");
      return;
    }

    // Construct local-datetime strings and convert to UTC ISO for storage.
    const startedAt = new Date(`${date}T${startTime}:00`).toISOString();
    const endedAt = new Date(`${date}T${endTime}:00`).toISOString();

    setSaving(true);
    try {
      await onSave({ id: entry.id, description, project_id: projectId, started_at: startedAt, ended_at: endedAt, entry_tag_ids: entryTagIds });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--color-surface)] rounded-lg p-6 w-full max-w-md border border-[var(--color-border)] shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-[var(--color-text)]">Edit Entry</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
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
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Date</label>
            <DatePicker
              selected={date ? new Date(date + "T00:00:00") : null}
              onChange={(d: Date | null) => d && setDate(formatLocalDate(d))}
              dateFormat="yyyy-MM-dd"
              locale={sv}
              calendarStartDay={1}
              showWeekNumbers
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              popperClassName="z-50"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Start time</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="HH:mm"
                pattern="[0-2][0-9]:[0-5][0-9]"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">End time</label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="HH:mm"
                pattern="[0-2][0-9]:[0-5][0-9]"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Inherited project tags — read-only */}
          {inheritedTags.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                From project
              </label>
              <div className="flex flex-wrap gap-1">
                {inheritedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-zinc-950 opacity-80"
                    style={{ backgroundColor: tag.color ?? DEFAULT_PROJECT_COLOR }}
                    title="Inherited from project (not editable here)"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Entry-specific tags */}
          <TagSelector
            allTags={tags}
            selectedTagIds={entryTagIds}
            onToggleTag={(id) =>
              setEntryTagIds((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              )
            }
            onCreateTag={onCreateTag}
            compact
            label="Entry tags"
          />

          {validationError && (
            <p className="text-xs text-[var(--color-destructive)]">{validationError}</p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] text-xs font-medium hover:bg-[var(--color-bg)] border border-[var(--color-border)] disabled:opacity-60 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-medium hover:opacity-90 disabled:opacity-60 transition"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

