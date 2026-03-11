"use client";

import { useEffect, useRef } from "react";

type KeyMap = Record<string, (e: KeyboardEvent) => void>;

/**
 * Attaches a single `keydown` listener on `document` and dispatches to the
 * matching handler in `keymap`.  Events originating from interactive form
 * elements (input, textarea, select) are ignored so that typing never
 * accidentally triggers shortcuts.
 *
 * The `keymap` reference is stored in a ref so the listener is only attached /
 * detached when `enabled` changes, not on every render.
 */
export function useKeyboardShortcuts(keymap: KeyMap, enabled = true) {
    const keymapRef = useRef(keymap);
    keymapRef.current = keymap;

    useEffect(() => {
        if (!enabled) return;

        function handleKeyDown(e: KeyboardEvent) {
            const target = e.target as HTMLElement;
            if (
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement
            ) {
                return;
            }
            const handler = keymapRef.current[e.key];
            if (handler) handler(e);
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [enabled]);
}
