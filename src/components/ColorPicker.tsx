"use client";

import { PROJECT_COLORS } from "@/lib/constants";

type ColorPickerProps = {
  /** Currently selected hex color. */
  value: string;
  /** Called with the new hex color whenever the user makes a selection. */
  onChange: (color: string) => void;
};

/**
 * Compact colour picker: a row of preset swatches plus a native
 * `<input type="color">` for custom colours.  Shared between the project
 * and tag colour-picker popovers.
 */
export function ColorPicker({ value, onChange }: ColorPickerProps) {
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
