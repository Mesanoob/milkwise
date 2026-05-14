/**
 * useFocusTrap — web-only focus trap + Esc dismiss for modal dialogs.
 *
 * WCAG 2.1.2 ("No Keyboard Trap") and ARIA Authoring Practices for dialog
 * patterns both require:
 *   1. Focus moves *into* the dialog when it opens.
 *   2. Tab / Shift+Tab cycle inside the dialog only (no escape into the
 *      background page).
 *   3. Esc closes the dialog.
 *   4. Focus is restored to the element that opened the dialog on close.
 *
 * Implementation is intentionally light:
 *   - We query focusable descendants of the container on every Tab key —
 *     cheap (a single querySelectorAll) and survives dynamic content.
 *   - We do NOT poly-fill `inert` on background elements; the visual
 *     backdrop + click-to-dismiss is enough for sighted users and the
 *     focus cycle handles keyboard / screen-reader users.
 *
 * Native (iOS/Android) gets a no-op: the hook short-circuits when there
 * is no `document` global. RN's native `<Modal>` provides its own focus
 * semantics — we'll wire that in when the compare flow ships to native.
 */

import { useEffect, useRef, type RefObject } from 'react';
import { Platform } from 'react-native';

// CSS selector listing every element type that can take keyboard focus
// when not explicitly disabled. Matches the WAI-ARIA "tabbable" set.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), ' +
  'input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
  '[tabindex]:not([tabindex="-1"])';

export interface UseFocusTrapOptions {
  /** When false the trap is detached — used to disable while modal is closed. */
  active: boolean;
  /** Called when the user presses Esc while focus is inside the trap. */
  onEscape?: () => void;
}

/**
 * Attach to the outer container element of a dialog. Returns the ref you
 * should spread onto that container.
 *
 * Usage:
 *   const ref = useFocusTrap({ active: open, onEscape: close });
 *   return <View ref={ref}>…</View>;
 */
export const useFocusTrap = <T extends HTMLElement = HTMLElement>(
  { active, onEscape }: UseFocusTrapOptions,
): RefObject<T | null> => {
  const containerRef = useRef<T | null>(null);
  // Remembering which element had focus *before* the dialog opened lets
  // us restore it on close — keyboard users land back where they started
  // instead of at the top of the document.
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    previouslyFocused.current = (document.activeElement as HTMLElement | null) ?? null;

    const container = containerRef.current as unknown as HTMLElement | null;
    if (!container) return;

    // Defer focus until after the dialog has actually mounted in the DOM.
    // Without a microtask delay the querySelectorAll below can race with
    // React's commit phase and return zero focusable nodes.
    const focusTimer = window.setTimeout(() => {
      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = focusables[0];
      if (first) {
        first.focus();
      } else {
        // Fall back to focusing the container itself so screen readers
        // announce the dialog name when it opens. Needs tabindex=-1 so
        // the element is programmatically focusable but not in the tab
        // order. We set it lazily and only if missing.
        if (!container.hasAttribute('tabindex')) {
          container.setAttribute('tabindex', '-1');
        }
        container.focus();
      }
    }, 0);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEscape?.();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute('aria-hidden'));

      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0]!;
      const last  = focusables[focusables.length - 1]!;
      const activeEl = document.activeElement as HTMLElement | null;

      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKey);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKey);
      // Restore the pre-open focus on close. Wrapped in a try/catch
      // because the element could have been removed from the DOM while
      // the dialog was open (e.g. the trigger was conditionally unmounted).
      try {
        previouslyFocused.current?.focus();
      } catch {
        /* element gone — nothing to restore */
      }
    };
  }, [active, onEscape]);

  return containerRef;
};
