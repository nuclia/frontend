# Common Test Pitfalls — Testing Reference

Recurring failures and their fixes, sorted by symptom.

---

## Setup / configuration errors

| Symptom                                                    | Cause                                               | Fix                                                                                 |
| ---------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `NullInjectorError: No provider for X`                     | Service not mocked                                  | Add `MockProvider(X)` to `providers`                                                |
| `NullInjectorError: No provider for X` on a transitive dep | MockProvider doesn't recursively mock deps          | Add `MockProvider` for each missing dep shown in the error chain                    |
| `CUSTOM_ELEMENTS_SCHEMA` error on nsi-\* component         | Missing import in TestBed                           | Import the mock: `MockComponent(NsiButtonComponent)` or `MockModule(SistemaModule)` |
| `Can't bind to 'xxx' since it isn't a known property`      | Binding to a child component that isn't imported    | Add the child to `imports` or mock it with `MockComponent`                          |
| `ExpressionChangedAfterItHasBeenCheckedError`              | State mutated synchronously after CD                | Wrap mutation in `Promise.resolve().then(...)` or move to `ngOnInit`                |
| `ViewDestroyedError` on `detectChanges`                    | `detectChanges` called after component is destroyed | Ensure fixture cleanup happens in `afterEach`, not `afterAll`                       |

---

## Change detection gaps (OnPush)

| Symptom                                          | Fix                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Template shows stale data after input change     | `fixture.componentRef.setInput('prop', val); fixture.detectChanges();`         |
| Template shows stale data after service emit     | `service.subject$.next(val); fixture.detectChanges();`                         |
| `@if` / `@for` not re-evaluating                 | Signal inputs require `fixture.componentRef.setInput()`, not direct assignment |
| Required signal input throws before first render | Call `setInput` for all required inputs before the first `detectChanges()`     |

---

## Async / Observable gaps

| Symptom                                            | Fix                                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Observable subscription never fires in test        | `await firstValueFrom(obs$)` or `await vi.runAllTimersAsync()` (no `fakeAsync`/`waitForAsync`: tests are zoneless)  |
| BehaviorSubject initial value swallowing assertion | `await firstValueFrom(service.data$.pipe(skip(1)))` (subscribe before triggering the action)                        |
| `firstValueFrom` hangs                             | Observable never emits; check `MockProvider` returns `of(...)` not `NEVER`                                          |
| Debounce/timer assertion fails                     | `vi.useFakeTimers()` then `await vi.advanceTimersByTimeAsync(ms)`; restore with `vi.useRealTimers()` in `afterEach` |
| Test with a `done` callback times out or is flaky  | Rewrite with `async`/`await`                                                                                        |

---

## ng-mocks specific

| Symptom                                                | Fix                                                                                                                              |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `MockProvider` method not being called                 | Check method name spelling; ng-mocks stubs are not spies, so pass `vi.fn()` in the override and assert with `toHaveBeenCalled()` |
| `MockProvider` observable property returns `undefined` | Pass `{ myObs$: of(value) }` as second arg to `MockProvider`                                                                     |
| Child component input not binding                      | Use `fixture.componentRef.setInput()` for signal inputs, `[attr]` binding for legacy                                             |
| `MockComponent` input type mismatch                    | Cast the mock instance: `childInstance as MockedComponent<ChildType>`                                                            |

---

## Vitest-specific (plain Vitest: search-widget, sdk-core)

| Symptom                                                    | Fix                                                                                                                  |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `describe is not defined`                                  | Run via `nx test`, not `vitest` directly                                                                             |
| Angular builder: "No tests found"                          | The builder has no `passWithNoTests` option: keep at least one real spec in every Angular project                    |
| `vi.mock('./relative')` throws in an Angular spec          | Unsupported by `@angular/build:unit-test`; provide a mock through DI                                                 |
| Angular test pulls in `zone.js` / fails on top-level await | Keep `polyfills: []` in the `test-build` (libs) / `build:unit-test` (apps) config; `.env.test` sets the browserslist |
| DOM not cleaned between tests                              | Always call `unmount(component)` in `afterEach`                                                                      |
| Store state bleeds between tests                           | Reset Svelte stores explicitly: `storeVar.set(initialValue)`                                                         |
| `vi.fn()` not resetting between tests                      | Add `vi.clearAllMocks()` in `beforeEach` or use `vi.restoreAllMocks()`                                               |
