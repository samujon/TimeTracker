"use client";

import React, { useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { Tag } from "@/types";
import { PROJECT_COLORS, DEFAULT_PROJECT_COLOR } from "@/lib/constants";
import { useClickOutside } from "@/hooks/useClickOutside";

export type TagSelectorProps = {
  /** Full list of available tags the user can choose from. */
  allTags: Tag[];
  /** IDs of currently-selected tags. */
  selectedTagIds: string[];
  /** Called when the user picks / removes a tag. */
  onToggleTag: (tagId: string) => void;
  /** Called when the user creates a brand-new tag inline. */
  onCreateTag: (name: string, color: string) => Promise<void>;
  /** Called when the user deletes a tag from the global list. */
  onDeleteTag?: (tagId: string) => void;
  /** When true the selector is compact (no manage-tags panel). */
  compact?: boolean;
  label?: string;
};

/** Colour picker sub-component, shared between create and edit flows. */
function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-wrap gap-1 mb-2 justify-center">
        {PROJECT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              value === c
                ? "border-emerald-400 scale-110 ring-2 ring-emerald-300"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
            aria-label={`Choose color ${c}`}
          />
        ))}
      </div>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 cursor-pointer"
        title="Pick a custom colour"
        style={{ minWidth: 32 }}
      />
    </div>
  );
}

export function TagSelector({
  allTags,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  onDeleteTag,
  compact = false,
  label = "Tags",
}: TagSelectorProps) {
  const [inputValue, setInputValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newTagColor, setNewTagColor] = useState(DEFAULT_PROJECT_COLOR);
  const [showColorPopover, setShowColorPopover] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"select" | "manage">("select");
  const [editColorTagId, setEditColorTagId] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const colorPopoverRef = useRef<HTMLDivElement | null>(null);
  const editColorPopoverRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(wrapperRef, () => setDropdownOpen(false), dropdownOpen);
  useClickOutside(colorPopoverRef, () => setShowColorPopover(false), showColorPopover);
  useClickOutside(editColorPopoverRef, () => setEditColorTagId(null), editColorTagId !== null);

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id));
  const filteredTags = allTags.filter(
    (t) =>
      t.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedTagIds.includes(t.id)
  );
  const isNewTag =
    inputValue.trim() !== "" &&
    !allTags.some((t) => t.name.toLowerCase() === inputValue.trim().toLowerCase());

  async function handleCreate() {
    const name = inputValue.trim();
    if (!name || creating) return;
    setCreating(true);
    await onCreateTag(name, newTagColor);
    setInputValue("");
    setNewTagColor(DEFAULT_PROJECT_COLOR);
    setShowColorPopover(false);
    setCreating(false);
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>

      {!compact && (
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            className={`rounded-full px-3 py-0.5 text-xs font-medium transition ${
              tab === "select"
                ? "bg-emerald-500 text-zinc-950"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
            onClick={() => setTab("select")}
          >
            Select
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-0.5 text-xs font-medium transition ${
              tab === "manage"
                ? "bg-rose-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
            onClick={() => setTab("manage")}
          >
            Manage
          </button>
        </div>
      )}

      {/* ── Selected tag chips ─────────────────────────────────────────────── */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-zinc-950"
              style={{ backgroundColor: tag.color ?? DEFAULT_PROJECT_COLOR }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => onToggleTag(tag.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
                aria-label={`Remove tag ${tag.name}`}
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {(tab === "select" || compact) && (
        <div className="relative" ref={wrapperRef}>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Add or search tags…"
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autoComplete="off"
            />
            {/* Color button — only shown when about to create a new tag */}
            {isNewTag && (
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: newTagColor }}
                  aria-label="Choose tag colour"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowColorPopover((v) => !v);
                  }}
                />
                {showColorPopover && (
                  <div
                    ref={colorPopoverRef}
                    className="absolute z-30 right-0 mt-2 p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg"
                    style={{ minWidth: 180 }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <ColorPicker value={newTagColor} onChange={setNewTagColor} />
                  </div>
                )}
              </div>
            )}
            {isNewTag && (
              <button
                type="button"
                disabled={creating}
                onClick={handleCreate}
                className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-950 shadow-sm transition hover:bg-white disabled:opacity-60"
              >
                {creating ? "Adding…" : "Add"}
              </button>
            )}
          </div>

          {/* Dropdown of matching existing tags */}
          {dropdownOpen && filteredTags.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 z-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-h-40 overflow-y-auto">
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onToggleTag(tag.id);
                    setInputValue("");
                    setDropdownOpen(false);
                  }}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full border border-zinc-300 dark:border-zinc-700 flex-shrink-0"
                    style={{ backgroundColor: tag.color ?? DEFAULT_PROJECT_COLOR }}
                  />
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">{tag.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Manage tab ─────────────────────────────────────────────────────── */}
      {tab === "manage" && !compact && (
        <div className="mt-2">
          {allTags.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 py-2">
              No tags yet. Switch to &ldquo;Select&rdquo; and type a new tag name to create one.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {allTags.map((tag) => (
                <li key={tag.id} className="flex items-center justify-between py-1.5 gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="relative flex-shrink-0"
                      ref={editColorTagId === tag.id ? editColorPopoverRef : null}
                    >
                      <button
                        type="button"
                        className="w-7 h-7 rounded-full border-2 border-zinc-300 dark:border-zinc-700 cursor-pointer hover:ring-2 hover:ring-emerald-400 transition"
                        style={{ backgroundColor: tag.color ?? DEFAULT_PROJECT_COLOR }}
                        title="Tag colour (click to view)"
                        aria-label="Tag colour"
                      />
                    </div>
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">{tag.name}</span>
                  </div>
                  {onDeleteTag && (
                    <button
                      type="button"
                      onClick={() => onDeleteTag(tag.id)}
                      className="ml-2 rounded bg-rose-600 px-2 py-0.5 text-xs text-white hover:bg-rose-500"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
