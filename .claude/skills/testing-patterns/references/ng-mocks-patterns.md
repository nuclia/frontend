# ng-mocks Patterns — Testing Reference

Quick-reference cookbook for `ng-mocks` (MockProvider / MockModule / MockComponent) used
throughout the Angular test suite in this monorepo.

---

## MockProvider — by use case

### Observable / BehaviorSubject override
```ts
MockProvider(SDKService, {
  currentKb: of(mockKb),           // replaces a BehaviorSubject with a cold observable
  currentAccount: of(mockAccount),
  kbList: of([mockKb]),
})
```

### Method stub returning Observable
```ts
MockProvider(ResourceService, {
  getResources: () => of({ resources: [], total: 0 }),
  deleteResource: () => of(null),
})
```

### Method stub for void / toast calls
```ts
MockProvider(SisToastService, {
  error: jest.fn(),
  success: jest.fn(),
  warning: jest.fn(),
})
```
Then assert with: `expect(TestBed.inject(SisToastService).error).toHaveBeenCalledWith('my.key')`.

### Partial mock — only override what the test cares about
```ts
// Unspecified methods are auto-mocked to return undefined / empty
MockProvider(NavigationService, {
  getKbUrl: (kb) => `/kb/${kb.id}`,
})
```

### Manual mock for full control (complex setup)
```ts
{
  provide: ZoneService,
  useValue: {
    getZones: () => of([{ slug: 'eu', title: 'Europe' }]),
    getZone: (slug: string) => of({ slug, title: 'Europe' }),
  },
}
```

---

## MockModule — when to use
Use `MockModule` to neutralise heavy Angular modules (routing, forms, etc.) that the component
imports but the test doesn't care about:

```ts
imports: [
  MyComponent,
  MockModule(TranslateModule),          // translate pipe returns the key string
  MockModule(ReactiveFormsModule),      // for legacy non-standalone forms
  MockModule(RouterModule),             // link directives won't navigate
]
```

Do NOT mock `CommonModule` — it's almost always already included in standalone imports.

---

## MockComponent — isolate child component rendering
```ts
imports: [
  ParentComponent,
  MockComponent(ChildTableComponent),   // renders as <stf-child-table></stf-child-table>
  MockComponent(NsiButtonComponent),    // pa-button / nsi-button stubs
]
```

Use `MockComponent` when:
- The child component has complex dependencies of its own.
- The test only needs to verify the parent passes the right `@Input`s (signal inputs).
- The child's rendered output would interfere with assertions.

---

## Asserting on MockComponent inputs
```ts
const childEl = fixture.debugElement.query(By.directive(MockComponent(ChildTableComponent)));
const childInstance = childEl.componentInstance as MockedComponent<ChildTableComponent>;
expect(childInstance.items).toEqual(expectedItems);  // signal input value
```

---

## Service injection in test body
```ts
let toastService: SisToastService;

beforeEach(() => {
  // ...TestBed setup...
  toastService = TestBed.inject(SisToastService);
});

it('shows error toast on failure', () => {
  // trigger failure...
  expect(toastService.error).toHaveBeenCalledWith('resource.delete.error');
});
```

---

## Common anti-patterns to avoid
- **Providing the real service** — any service with HTTP calls or side-effects must be mocked.
- **Providing `HttpClientModule`** — use `provideHttpClientTesting()` instead.
- **Using `spyOn` on an already-mocked method** — `MockProvider` already returns `jest.fn()`; just
  assert directly on the mock.
- **Forgetting `async` on `beforeEach`** when `compileComponents()` is called — it returns a Promise.
