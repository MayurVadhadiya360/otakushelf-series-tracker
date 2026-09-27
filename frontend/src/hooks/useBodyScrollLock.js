import { useEffect } from "react";

/**
 * Locks page scrolling while `active` is true — used by drawers and modals
 * so the background page can't scroll behind them, and so a fixed-position
 * panel's right edge doesn't visually double up with the page's scrollbar.
 */
export default function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
