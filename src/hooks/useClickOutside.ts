import { useEffect, RefObject } from "react";

/**
 * Calls `onClose` whenever a mousedown event fires outside the given `ref` element.
 * Pass `enabled = false` to temporarily disable the listener (e.g. when the
 * popover / dropdown is not visible) so no event listener is attached at all.
 */
export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T | null>,
    onClose: () => void,
    enabled = true
) {
    useEffect(() => {
        if (!enabled) return;

        function handleMouseDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [ref, onClose, enabled]);
}
