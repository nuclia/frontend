import { tick } from 'svelte';

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface FocusTrapOptions {
  /** Milliseconds to delay focus restore on close. Default: 0 (synchronous). */
  restoreDelay?: number;
  /** Override the focusable selector. Default: standard FOCUSABLE_SELECTOR. */
  selector?: string;
}

/**
 * Creates a keyboard focus trap for accessible overlay components.
 *
 * - `trapFocus()` — captures the currently focused element, installs a Tab-key
 *   interceptor that cycles focus within the container, then after the next Svelte
 *   tick moves focus to the first focusable element. Re-entrant safe (no-op if
 *   already trapped).
 * - `restoreFocus()` — removes the Tab interceptor, clears state, and returns
 *   focus to the element that was focused before `trapFocus()` was called.
 * - `releaseTrap()` — removes the Tab interceptor without restoring focus.
 *   Use this when the overlay closes in a way that doesn't need focus restoration
 *   (e.g. the chat panel, or as an `$effect` cleanup).
 */
export function createFocusTrap(getContainer: () => HTMLElement | undefined, options: FocusTrapOptions = {}) {
  const { restoreDelay = 0, selector = FOCUSABLE_SELECTOR } = options;
  let previouslyFocused: HTMLElement | null = null;
  let isTrapped = false;

  function handleTabKey(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const container = getContainer();
    if (!container) return;

    const focusable = Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      // Shift+Tab: if focus is on (or before) the first element, wrap to last
      if (document.activeElement === first || !container.contains(document.activeElement)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab: if focus is on (or after) the last element, wrap to first
      if (document.activeElement === last || !container.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function trapFocus() {
    if (isTrapped) return; // already trapped — no-op
    isTrapped = true;
    previouslyFocused = document.activeElement as HTMLElement;
    document.addEventListener('keydown', handleTabKey);
    void tick().then(() => {
      getContainer()?.querySelector<HTMLElement>(selector)?.focus();
    });
  }

  function releaseTrap() {
    if (!isTrapped) return;
    isTrapped = false;
    document.removeEventListener('keydown', handleTabKey);
  }

  function restoreFocus() {
    const toFocus = previouslyFocused;
    previouslyFocused = null;
    releaseTrap();
    if (restoreDelay > 0) {
      setTimeout(() => toFocus?.focus(), restoreDelay);
    } else {
      toFocus?.focus();
    }
  }

  return { trapFocus, restoreFocus, releaseTrap };
}
