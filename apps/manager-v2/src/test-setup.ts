import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// Standalone components now pull in real Pastanaga directives (tooltip, textarea, modal)
// that use ResizeObserver, which jsdom doesn't implement.
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

// Standalone components now pull in real Pastanaga directives (BreakpointObserver, navbar)
// that use window.matchMedia, which jsdom doesn't implement.
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
