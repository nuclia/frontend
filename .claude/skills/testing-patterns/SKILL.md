````skill
---
name: testing-patterns
description: >
  Testing patterns for the Nuclia frontend monorepo — covering Jest + jest-preset-angular for
  Angular apps/libs and Vitest for search-widget (Svelte 5) and rao-widget (React 19). Use this
  skill whenever you are writing or modifying a spec file, debugging a failing test, setting up a
  new TestBed configuration, mocking Angular services, working with OnPush components in tests,
  or using Vitest with Svelte/React. Do not wait to be asked about "testing patterns" specifically —
  any task involving *.spec.ts files, ng-mocks, TestBed, vitest, or fixture.detectChanges() should
  activate this skill.
---

# Testing Patterns — Nuclia Frontend Monorepo

## When to Write Tests

**Tests are not auto-generated after feature work.** The user triggers test writing manually
when they decide the feature is stable enough. Agents must follow these rules:

1. **Never auto-generate tests as part of a feature build** — unless the user explicitly says
   "write tests", "add tests", or similar.
2. **Do not offer to write tests** at the end of a feature implementation. The user will ask
   when ready.
3. When the user _does_ ask for tests, use the `test-writer` agent or follow the patterns below.

---

Two separate test stacks live in this repo. Match the stack to the project:

| Projects | Runner | Config |
|---|---|---|
| Angular apps & libs (`dashboard`, `rao`, `manager-v2`, `nucliadb-admin`, `core`, `common`, `sistema`, `user`, `sync`, `pastanaga-angular`) | **Jest 30** + `jest-preset-angular` | `jest.config.js` / `jest.config.ts` per project |
| `libs/search-widget` (Svelte 5) | **Vitest 4** | `libs/search-widget/vite.config.mjs` |
| `libs/rao-widget` (React 19) | **Vitest 4** | `libs/rao-widget/vite.config.ts` |

Run with `nx test <project-name>` in all cases.

---

## Angular Testing (Jest + jest-preset-angular)

### Global setup

Each Angular project's `jest.config.js` points to a `test-setup.ts`:

```ts
// src/test-setup.ts
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
setupZoneTestEnv();
```

This bootstraps Zone.js for Angular's async model. Never remove or replace it.

The workspace-level `jest.preset.js` also maps `d3` to a stub (`test/d3.js`) — you don't need to mock d3 yourself.

---

### Component test skeleton (standalone)

New standalone components use `imports:` in `TestBed`, **not** `declarations:`.

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockModule, MockProvider } from 'ng-mocks';
import { TranslateModule } from '@ngx-translate/core';
import { MyFeatureComponent } from './my-feature.component';
import { SomeService } from './some.service';
import { of } from 'rxjs';

describe('MyFeatureComponent', () => {
  let component: MyFeatureComponent;
  let fixture: ComponentFixture<MyFeatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MyFeatureComponent,          // standalone component under test
        MockModule(TranslateModule), // mock heavy modules
      ],
      providers: [
        MockProvider(SomeService, { items$: of([]) }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyFeatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit + first CD cycle
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

**Legacy non-standalone components** still use `declarations: [MyComponent]` alongside `imports: [MockModule(...)]`.

---

### Setting signal inputs in tests

Angular 17+ signal inputs (`input()` / `input.required()`) **cannot** be set by direct property assignment. Use `fixture.componentRef.setInput()`:

```ts
// ✅ Correct — works for both signal inputs and regular @Input()
fixture.componentRef.setInput('itemId', 'abc-123');
fixture.detectChanges();

// ❌ Wrong — bypasses the signal mechanism for signal inputs
component.itemId = 'abc-123';
```

For `input.required<T>()` you must call `setInput` before the first `detectChanges()`, otherwise Angular throws a required-input error.

---

### OnPush + fixture.detectChanges() gotchas

`ChangeDetectionStrategy.OnPush` (used on every component) suppresses automatic re-renders. You must manually trigger change detection after any state mutation:

```ts
it('shows updated label', () => {
  fixture.componentRef.setInput('label', 'New Label');
  fixture.detectChanges();                    // ← required!
  const el = fixture.nativeElement.querySelector('[data-cy="label"]');
  expect(el.textContent).toBe('New Label');
});
```

For timer-based or async work:

```ts
import { fakeAsync, tick } from '@angular/core/testing';

it('debounces search', fakeAsync(() => {
  component.searchTerm.set('hello');
  fixture.detectChanges();
  tick(300);                // advance virtual clock
  fixture.detectChanges();  // re-render after async work
  expect(component.results().length).toBeGreaterThan(0);
}));
```

---

### Mocking services with ng-mocks

The entire codebase uses **[ng-mocks](https://ng-mocks.sudo.eu/)** for test doubles. Key helpers:

| Helper | Usage |
|---|---|
| `MockProvider(Service, overrides)` | Provide a mock service with specific method/property overrides |
| `MockModule(SomeModule)` | Replace an NgModule with empty mocks of all its declarations |
| `MockComponent(SomeComponent)` | Replace a specific standalone component with a stub |

```ts
providers: [
  // Override specific properties/methods only — rest are auto-mocked
  MockProvider(SDKService, {
    currentKb: of(mockKb),    // BehaviorSubject / Observable override
    nuclia: { options: { standalone: false }, db: {} },
  }),

  // Make a jest.fn() available via injection
  MockProvider(SisToastService, {
    error: jest.fn(),
    success: jest.fn(),
  }),

  // Manual mock for full control
  {
    provide: ZoneService,
    useValue: {
      getZones: () => of([{ slug: 'eu', title: 'Europe' }]),
    },
  },
]
```

Never import the real `HttpClientModule` or call real network in unit tests; use `MockProvider` with stub return values instead.

---

### Service testing (no component)

When testing a service in isolation, skip `compileComponents()` and inject via `TestBed.inject()`:

```ts
import { TestBed, waitForAsync } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { skip, take } from 'rxjs';

describe('SomeService', () => {
  let service: SomeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(SDKService, { currentKb: of(mockKb) }),
      ],
    });
    service = TestBed.inject(SomeService);
  });

  it('emits updated state after action', waitForAsync(() => {
    // skip(1) skips the initial BehaviorSubject emission
    service.items$.pipe(skip(1), take(1)).subscribe((items) => {
      expect(items).toEqual([{ id: '1' }]);
    });
    service.loadItems();
  }));
});
```

Key patterns:
- `skip(1)` + `take(1)` to assert on the _next_ emission from a `BehaviorSubject`
- `// @ts-ignore access to private member` when seeding internal state directly
- `jest.fn()` for methods that should be called (not `vi.fn()` — that's Vitest)

---

### Spectator (pastanaga-angular only)

The `libs/pastanaga-angular` lib uses `@ngneat/spectator/jest` with `createHostFactory` for host-component-based tests. Don't introduce Spectator in app code — it's only for that lib.

```ts
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';

const createHost = createHostFactory({
  component: TabsListComponent,
  declarations: [TabsListComponent, MockComponent(TabItemComponent)],
  detectChanges: false, // manual control
});

beforeEach(() => {
  spectator = createHost(`<pa-tabs>...</pa-tabs>`);
  component = spectator.component;
});
```

---

### Translate in tests

For components that use `TranslateModule`, use either:

1. **`MockModule(TranslateModule)`** — all translations return the key string. Simple and fast.  
2. **`TranslateModule.forRoot({ loader: { provide: TranslateLoader, useFactory: () => ({ getTranslation: () => of(EN) }) } })`** — loads real translations. Use only when the test asserts on translated text.

---

## Vitest Testing (search-widget / rao-widget)

### Environment & globals

Both Vitest projects run with:

```ts
// vite.config.{mjs,ts}
test: {
  globals: true,       // describe/it/expect available without import
  environment: 'jsdom',
  include: ['src/**/*.{test,spec}.ts'],
}
```

Use `vi.fn()` for mocks (not `jest.fn()`).

---

### Svelte 5 component tests (search-widget)

Svelte 5 uses `mount` / `unmount` from `'svelte'`. Always unmount after each test to prevent DOM leaks:

```ts
import { mount, unmount } from 'svelte';
import { vi } from 'vitest';
import { Button } from './';

describe('Button', () => {
  it('renders with correct class', () => {
    const component = mount(Button, {
      target: document.body,
      props: { size: 'small' },
    });
    expect(document.body.querySelector('button')?.classList.value).toContain('small');
    unmount(component);
  });

  it('dispatches close event', () => {
    const mock = vi.fn();
    const component = mount(Modal, {
      target: document.body,
      props: { show: true },
      events: { close: mock },   // Svelte 5 event binding
    });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(mock).toHaveBeenCalled();
    unmount(component);
  });
});
```

**Key points:**
- `events: { eventName: handler }` in `mount()` binds DOM/custom events
- Direct DOM queries (`document.querySelector`) are the primary assertion mechanism
- Stores (e.g., `searchQuery`, `typeAhead`) can be set directly in tests to seed state
- `firstValueFrom(store$)` to await a store value asynchronously

---

### React component tests (rao-widget)

Use React Testing Library (`@testing-library/react`) when tests exist. The `rao-widget` currently has no spec files — if you add them, follow this pattern:

```ts
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

describe('MyWidget', () => {
  it('shows content', () => {
    render(<MyWidget label="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

---

## Common Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| `NullInjectorError: No provider for X` | Forgot to mock a transitive dependency | Add `MockProvider(X)` to providers |
| Template renders stale data | OnPush not re-checked | Call `fixture.detectChanges()` after mutation |
| `ExpressionChangedAfterItHasBeenCheckedError` | State mutated after CD | Move initialization to `ngOnInit` or use signals |
| Signal input throws required input error | `setInput` called after first `detectChanges` | Set all required signal inputs before first `detectChanges` |
| `Cannot read property 'subscribe' of undefined` | `MockProvider` missing an Observable property | Pass `{ myObs$: of(value) }` as the override |
| `ERROR: 'describe' is not defined` in Vitest | `globals: true` missing in vite config | Already set in both widget configs — check you're running `nx test`, not `vitest` directly |
````
