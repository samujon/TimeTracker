"use client";

import React, { useRef, useState } from "react";
import { X } from "lucide-react";
import type { Tag } from "@/types";
import { DEFAULT_PROJECT_COLOR } from "@/lib/constants";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useDisclosure } from "@/hooks/useDisclosure";
import { ColorPicker } from "./ColorPicker";

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
  /** Called when the user changes a tag's colour in the Manage tab. */
  onUpdateTagColor?: (tagId: string, color: string) => Promise<void>;
  /** When true the selector is compact (no manage-tags panel). */
  compact?: boolean;
  label?: string;
};

export function TagSelector({
  allTags,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  onDeleteTag,
  onUpdateTagColor,
  compact = false,
  label = "Tags",
}: TagSelectorProps) {
  const [inputValue, setInputValue] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_PROJECT_COLOR);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"select" | "manage">("select");
  const [editColorTagId, setEditColorTagId] = useState<string | null>(null);

  // useDisclosure manages open state + click-outside together.
  const dropdownDisclosure = useDisclosure<HTMLDivElement>();
  const colorDisclosure = useDisclosure<HTMLDivElement>();
  const editColorPopoverRef = useRef<HTMLDivElement | null>(null);
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
    colorDisclosure.close();
    setCreating(false);
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
        {label}
      </label>

      {!compact && (
        <div className="flex gap-1 mb-2">
          <button
            type="button"
            className={`rounded-md px-3 py-0.5 text-xs font-medium transition ${
              tab === "select"
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
            }`}
            onClick={() => setTab("select")}
          >
            Select
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-0.5 text-xs font-medium transition ${
              tab === "manage"
                ? "bg-[var(--color-destructive)] text-white"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
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
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {(tab === "select" || compact) && (
        <div className="relative" ref={dropdownDisclosure.ref}>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                dropdownDisclosure.set(true);
              }}
              onFocus={() => dropdownDisclosure.set(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isNewTag) {
                  e.preventDefault();
                  void handleCreate();
                }
              }}
              placeholder="Add or search tags…"
              className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              autoComplete="off"
            />
            {/* Color button — only shown when about to create a new tag */}
            {isNewTag && (
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  className="w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: newTagColor }}
                  aria-label="Choose tag colour"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    colorDisclosure.toggle();
                  }}
                />
                {colorDisclosure.open && (
                  <div
                    ref={colorDisclosure.ref}
                    className="absolute z-30 right-0 mt-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
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
                className="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-medium text-[var(--color-primary-foreground)] transition hover:opacity-90 disabled:opacity-60"
              >
                {creating ? "Adding…" : "Add"}
              </button>
            )}
          </div>

          {/* Dropdown of matching existing tags */}
          {dropdownDisclosure.open && filteredTags.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 z-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[var(--color-surface-alt)]"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onToggleTag(tag.id);
                    setInputValue("");
                    dropdownDisclosure.close();
                  }}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color ?? DEFAULT_PROJECT_COLOR }}
                  />
                  <span className="text-sm text-[var(--color-text)]">{tag.name}</span>
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
            <p className="text-xs text-[var(--color-text-muted)] py-2">
              No tags yet. Switch to &ldquo;Select&rdquo; and type a new tag name to create one.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {allTags.map((tag) => (
                <li key={tag.id} className="flex items-center justify-between py-1.5 gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="relative flex-shrink-0"
                      ref={editColorTagId === tag.id ? editColorPopoverRef : null}
                    >
                      <button
                        type="button"
                        className="w-6 h-6 rounded-full border border-[var(--color-border)] cursor-pointer hover:ring-2 hover:ring-[var(--color-primary)] transition"
                        style={{ backgroundColor: tag.color ?? DEFAULT_PROJECT_COLOR }}
                        title={onUpdateTagColor ? "Edit tag colour" : "Tag colour"}
                        aria-label={onUpdateTagColor ? "Edit tag colour" : "Tag colour"}
                        onClick={() =>
                          onUpdateTagColor
                            ? setEditColorTagId(editColorTagId === tag.id ? null : tag.id)
                            : undefined
                        }
                      />
                      {editColorTagId === tag.id && onUpdateTagColor && (
                        <div
                          className="absolute z-30 left-0 mt-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
                          style={{ minWidth: 180 }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <ColorPicker
                            value={tag.color ?? DEFAULT_PROJECT_COLOR}
                            onChange={(c) => {
                              void onUpdateTagColor(tag.id, c);
                              setEditColorTagId(null);
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-[var(--color-text)]">{tag.name}</span>
                  </div>
                  {onDeleteTag && (
                    <button
                      type="button"
                      onClick={() => onDeleteTag(tag.id)}
                      className="ml-2 rounded-md bg-[var(--color-destructive)] px-2 py-0.5 text-xs text-white hover:opacity-90 transition"
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


