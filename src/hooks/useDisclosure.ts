import { useRef, useState } from "react";
import { useClickOutside } from "./useClickOutside";

/**
 * Manages the open / closed state of a popover or dropdown and wires up
 * click-outside detection automatically.
 *
 * ```tsx
 * const dropdown = useDisclosure();
 * <div ref={dropdown.ref}>
 *   <button onClick={dropdown.toggle}>Open</button>
 *   {dropdown.open && <Menu />}
 * </div>
 * ```
 */
export function useDisclosure<T extends HTMLElement = HTMLDivElement>() {
  const [open, setOpen] = useState(false);
  const ref = useRef<T | null>(null);

  useClickOutside(ref, () => setOpen(false), open);

  return {
    open,
    ref,
    set: setOpen,
    toggle: () => setOpen((v) => !v),
    close: () => setOpen(false),
  };
}
