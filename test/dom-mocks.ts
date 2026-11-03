/**
 * Shared DOM API mocks for testing with jsdom.
 * Standalone components pull in Pastanaga directives that use APIs not implemented by jsdom.
 */

/**
 * Mock ResizeObserver for Pastanaga textarea, tooltip, and modal directives.
 */
export function mockResizeObserver(): void {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: class {
      observe() {
        /* empty */
      }
      unobserve() {
        /* empty */
      }
      disconnect() {
        /* empty */
      }
    },
  });
}

/**
 * Mock window.matchMedia for Pastanaga BreakpointObserver and navbar directives.
 */
export function mockMatchMedia(): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {
        /* empty */
      },
      removeListener: () => {
        /* empty */
      },
      addEventListener: () => {
        /* empty */
      },
      removeEventListener: () => {
        /* empty */
      },
      dispatchEvent: () => false,
    }),
  });
}

/**
 * Set up all DOM mocks at once.
 */
export function setupDomMocks(): void {
  mockResizeObserver();
  mockMatchMedia();
}
