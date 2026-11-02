---
name: testing-patterns
description: >
  Testing patterns for the Nuclia frontend monorepo — covering Vitest 5 via the Angular
  `@angular/build:unit-test` builder (zoneless) for Angular apps/libs, plain Vitest for sdk-core
  and search-widget (Svelte 5). Use this
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

All first-party projects use **Vitest 5**; the entry point differs. Match the setup to the project:

| Projects                                                                                                                       | Setup                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `admin`, `auth`, `dashboard`, `manager-v2`, `rao`, `sistema-demo`, `common`, `core`, `sistema`, `sync`, `ui`, `user` (Angular) | `@angular/build:unit-test` executor — jsdom, zoneless, `globals: true`                       |
| `sdk-core`                                                                                                                     | Plain Vitest — `libs/sdk-core/vitest.config.mts` (jsdom, `globals`, `resolve.tsconfigPaths`) |
| `chrome-ext`                                                                                                                   | Plain Vitest, inferred `test` target                                                         |
| `search-widget`, `search-widget-demo` (Svelte 5)                                                                               | Plain Vitest — `libs/search-widget/vite.config.mjs`                                          |

Run with `nx test <project-name>` in all cases (`yarn test` runs everything). `libs/pastanaga-angular` is
external and still uses Jest + Zone — don't edit or migrate it.

---

## Angular Testing (`@angular/build:unit-test` + Vitest)

### Global setup

- **Zoneless:** there is no `zone.js` and no `test-setup.ts` that bootstraps one. `fakeAsync`, `tick`,
  `flush` and `waitForAsync` do **not** work — see _Async & timers_ below.
- **Build target:** apps use their own `<app>:build:unit-test` configuration. Libs (`common`, `core`, `sistema`,
  `sync`, `ui`, `user`) each own a `test-build` target (`@angular/build:application`, `outputPath`
  `dist/test-build/<lib>`) and set `test.buildTarget` to `<lib>:test-build`. It sets `polyfills: []`
  deliberately: any file-path polyfill makes Angular load `zone.js`. Sistema Sass is found via the direct include path
  `libs/sistema/styles`, so libs never depend on an app.
- **Translate:** `test/translate-test-provider.ts` is the `providersFile` (in `dashboard`, `manager-v2`,
  `common`, `sync`, `user`) and already stubs `TranslateService` (keys are returned as-is).
- **jsdom shims:** `ResizeObserver` and `matchMedia` are stubbed through `setupFiles` in `libs/common/src/test-setup.ts`
  and `apps/manager-v2/src/test-setup.ts` only. Add a shim there if a real Pastanaga directive needs another browser API.
- **Browserslist:** `.env.test` forces `BROWSERSLIST=last 2 Chrome versions`; app browserslists are too old for
  the builder's top-level await.
- **Globals:** `describe`/`it`/`expect`/`vi` need no import (`vitest/globals` in `tsconfig.spec.json`);
  import only types, e.g. `import type { Mock } from 'vitest'`. Prefer `vi.fn()`, `vi.spyOn()` — never `jest.*`.
- **Run options:** `watch` is `false` by default — use `nx test <name> --watch` or `--configuration=watch`;
  `--configuration=ci` enables coverage (`coverage/{apps,libs}/<name>`);
  `--include='**/foo.spec.ts'` runs a single file and `--filter=<regex>` a test name.
- `vi.mock()` with relative paths is not supported by this builder; inject a mock provider instead.
- The builder fails with "No tests found" on a project without specs and has no `passWithNoTests` option, so every
  Angular project keeps at least one real spec (`auth`, `rao`, `sistema-demo` and `ui` each have a smoke spec on a
  root component, guard or directive). Plain Vitest has no Angular template compiler, so never use it for Angular code.

---

### Component test skeleton (standalone)

New standalone components use `imports:` in `TestBed`, **not** `declarations:`.

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { MyFeatureComponent } from './my-feature.component';
import { SomeService } from './some.service';
import { of } from 'rxjs';

describe('MyFeatureComponent', () => {
  let component: MyFeatureComponent;
  let fixture: ComponentFixture<MyFeatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MyFeatureComponent, // standalone component under test
      ],
      providers: [MockProvider(SomeService, { items$: of([]) })],
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

Components are all standalone, so `declarations:` is not needed. Use `MockModule(SomeModule)` only for NgModule imports such as `PaTranslateModule`.

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
  fixture.detectChanges(); // ← required!
  const el = fixture.nativeElement.querySelector('[data-cy="label"]');
  expect(el.textContent).toBe('New Label');
});
```

---

### Async & timers (zoneless)

Use `async`/`await` and Vitest fake timers — never `fakeAsync`/`tick`/`waitForAsync`:

```ts
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('debounces search', async () => {
  component.searchTerm.set('hello');
  await vi.advanceTimersByTimeAsync(300); // or `await vi.runAllTimersAsync()`
  fixture.detectChanges(); // re-render after async work
  expect(component.results().length).toBeGreaterThan(0);
});
```

For promise-only work, `await fixture.whenStable()` before the assertion.

---

### Mocking services with ng-mocks

The entire codebase uses **[ng-mocks](https://ng-mocks.sudo.eu/)** for test doubles. Key helpers:

| Helper                             | Usage                                                          |
| ---------------------------------- | -------------------------------------------------------------- |
| `MockProvider(Service, overrides)` | Provide a mock service with specific method/property overrides |
| `MockModule(SomeModule)`           | Replace an NgModule with empty mocks of all its declarations   |
| `MockComponent(SomeComponent)`     | Replace a specific standalone component with a stub            |

```ts
providers: [
  // Override specific properties/methods only — rest are auto-mocked
  MockProvider(SDKService, {
    currentKb: of(mockKb), // BehaviorSubject / Observable override
    nuclia: { options: {}, db: {} },
  }),

  // Make a vi.fn() available via injection
  MockProvider(SisToastService, {
    error: vi.fn(),
    success: vi.fn(),
  }),

  // Manual mock for full control
  {
    provide: ZoneService,
    useValue: {
      getZones: () => of([{ slug: 'eu', title: 'Europe' }]),
    },
  },
];
```

`MockProvider` methods are plain no-op functions, not spies (no `ngMocks.autoSpy` is configured). Pass `vi.fn()`
explicitly for anything you assert on, and `vi.fn().mockReturnValue(of(...))` when it must return an observable.

Never import the real `HttpClientModule` or call real network in unit tests; use `MockProvider` with stub return values instead.

---

### Service testing (no component)

When testing a service in isolation, skip `compileComponents()` and inject via `TestBed.inject()`:

```ts
import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { firstValueFrom, skip } from 'rxjs';

describe('SomeService', () => {
  let service: SomeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockProvider(SDKService, { currentKb: of(mockKb) })],
    });
    service = TestBed.inject(SomeService);
  });

  it('emits updated state after action', async () => {
    // skip(1) skips the initial BehaviorSubject emission
    const next = firstValueFrom(service.items$.pipe(skip(1)));
    service.loadItems();
    expect(await next).toEqual([{ id: '1' }]);
  });
});
```

Key patterns:

- `firstValueFrom(obs$.pipe(skip(1)))` to assert on the _next_ emission from a `BehaviorSubject`; subscribe before triggering the action
- `// @ts-ignore access to private member` when seeding internal state directly
- `vi.fn()` for methods that should be called; `done` callbacks are discouraged — use `async`/`await`

---

### Spectator (pastanaga-angular only)

The external `libs/pastanaga-angular` lib still runs on Jest and uses `@ngneat/spectator/jest` with `createHostFactory` for host-component-based tests. Don't introduce Spectator or Jest APIs in first-party code, and don't edit that lib.

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

Components import `TranslatePipe` (not `TranslateModule`). Where the project sets `providersFile` (see _Global setup_), `TranslateService` is already stubbed and keys are
returned as-is: translations return the key string. Elsewhere either:

1. **`MockProvider(TranslateService, { instant: (key) => key })`** (plus `MockPipe(TranslatePipe)` if the template uses the pipe) — returns the key string.
2. **`provideTranslateService({ loader: { provide: TranslateLoader, useFactory: () => ({ getTranslation: () => of(EN) }) } })`** — loads real translations. Use only when the test asserts on translated text.

---

## Plain Vitest (search-widget, sdk-core)

### Environment & globals

These projects run with:

```ts
// vite.config.{mjs,ts} / vitest.config.mts
test: {
  globals: true,       // describe/it/expect available without import
  environment: 'jsdom',
  include: ['src/**/*.{test,spec}.ts'],
}
```

Use `vi.fn()` for mocks (not `jest.fn()`). The root `vitest.config.ts` aggregates only these plain projects
(not the Angular ones), so run them through `nx test <name>`.

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
      events: { close: mock }, // Svelte 5 event binding
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

---

## Common Pitfalls

| Symptom                                                                | Cause                                         | Fix                                                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `NullInjectorError: No provider for X`                                 | Forgot to mock a transitive dependency        | Add `MockProvider(X)` to providers                                                       |
| Template renders stale data                                            | OnPush not re-checked                         | Call `fixture.detectChanges()` after mutation                                            |
| `ExpressionChangedAfterItHasBeenCheckedError`                          | State mutated after CD                        | Move initialization to `ngOnInit` or use signals                                         |
| Signal input throws required input error                               | `setInput` called after first `detectChanges` | Set all required signal inputs before first `detectChanges`                              |
| `Cannot read property 'subscribe' of undefined`                        | `MockProvider` missing an Observable property | Pass `{ myObs$: of(value) }` as the override                                             |
| `ERROR: 'describe' is not defined` in Vitest                           | `globals: true` missing in vite config        | Already set in the plain configs — check you're running `nx test`, not `vitest` directly |
| `fakeAsync`/`waitForAsync` throws (zone.js missing)                    | Tests are zoneless                            | Use `async`/`await` + `vi.useFakeTimers()` / `vi.advanceTimersByTimeAsync()`             |
| `expect(mockedMethod).toHaveBeenCalled()` fails on `MockProvider` stub | ng-mocks stubs are not spies                  | Pass `vi.fn()` in the `MockProvider` overrides                                           |
