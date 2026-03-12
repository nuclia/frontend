# Codebase Patterns — Nuclia Frontend Monorepo

Annotated, real code excerpts from the repo. Use these as canonical templates.

---

## 1. Module-Level Signal State File

**Source:** `libs/common/src/lib/retrieval-agent/agent-dashboard/workflow/workflow.state.ts`

This file holds global UI state for the workflow canvas. There is no service class — just 
private `signal()` instances, exported `computed()` readers, and exported setter functions.

```ts
import { ComponentRef, computed, signal } from '@angular/core';

// ── PATTERN: private signal + computed reader + setter ───────────────────────
const _aragUrl = signal('');
export function setAragUrl(url: string) { _aragUrl.set(url); }
export const aragUrl = computed(() => _aragUrl());

// ── PATTERN: object signal with partial update ────────────────────────────────
const sidebar = signal<{
  open: boolean;
  title: string;
  active: '' | 'rules' | 'test' | 'export';
}>({ open: false, title: '', active: '' });

export function setSidebarTitle(title: string): void {
  sidebar.update((s) => ({ ...s, title }));
}
export function openSidebar(active: 'rules' | 'test' | 'export'): void {
  sidebar.update((s) => ({ ...s, open: true, active }));
}
export function closeSidebar(): void {
  sidebar.update((s) => ({ ...s, open: false, active: '' }));
}

// Expose sub-properties as readonly computed — components never touch the raw signal
export const sidebarOpen   = computed(() => sidebar().open);
export const sidebarTitle  = computed(() => sidebar().title);
export const activeSidebar = computed(() => sidebar().active);
```

**When to use:** Feature-scoped UI state that multiple sibling components need to share
but doesn't belong to a service (no HTTP, no injection lifecycle needed).

---

## 2. Hybrid Signal + RxJS Service

**Source:** `libs/common/src/lib/retrieval-agent/drivers/drivers.service.ts`

The pattern: RxJS pipeline fetches data, `tap()` writes to a private `signal`, and the
component consumes the signal directly (or via `toSignal()`).

```ts
import { inject, Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, catchError, of, switchMap, tap, shareReplay } from 'rxjs';
import { SDKService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { Driver } from '@nuclia/core';

@Injectable({ providedIn: 'root' })
export class DriversService {
  private sdk   = inject(SDKService);
  private toast = inject(SisToastService);

  // ── Private state signals ────────────────────────────────────────
  private _drivers = signal<Driver[]>([]);
  private _schemas = signal<Schema | null>(null);

  // ── Refresh trigger (BehaviorSubject works as manual retrigger) ──
  private _refresh = new BehaviorSubject<void>(undefined);

  // ── RxJS pipeline → writes signal as side effect ─────────────────
  drivers$ = this._refresh.pipe(
    switchMap(() => this.sdk.currentArag),
    switchMap((arag) => arag.getDrivers()),
    catchError(() => of([])),
    tap((drivers) => this._drivers.set(drivers)),   // ← KEY: bridge to signal
    shareReplay(1),                                 // ← KEY: prevent duplicate requests
  );

  schemas$ = this._refresh.pipe(
    switchMap(() => this.sdk.currentArag),
    switchMap((arag) => arag.getFullSchemas()),
    catchError((err) => {
      this.toast.error('Failed to load schemas');
      return of(null);
    }),
    tap((schemas) => this._schemas.set(schemas)),
    shareReplay(1),
  );

  // ── Public readonly signals (safe to consume in templates/computed) ──────────
  drivers        = this._drivers.asReadonly();
  schemas        = this._schemas.asReadonly();
  hasDrivers     = computed(() => this._drivers().length > 0);

  refresh(): void { this._refresh.next(); }

  initialize() {
    // Subscribe both pipelines together; caller takes a single subscription
    return combineLatest([this.drivers$, this.schemas$]).pipe(take(1));
  }
}
```

**Usage in component:**
```ts
export class DriversPageComponent {
  private service = inject(DriversService);

  drivers    = this.service.drivers;           // Signal<Driver[]> — use in template directly
  hasDrivers = this.service.hasDrivers;        // Signal<boolean> — use in *ngIf/@if

  // Or bridge an observable to a local signal:
  schemas = toSignal(this.service.schemas$, { initialValue: null });

  ngOnInit(): void {
    this.service.initialize().pipe(takeUntil(this._destroy)).subscribe();
  }
}
```

---

## 3. Standalone Component (Full Example)

**Source:** Based on `libs/common/src/lib/retrieval-agent/drivers/drivers-page.component.ts`

```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent } from '@nuclia/sistema';
import { DriversService } from './drivers.service';

@Component({
  selector: 'app-drivers-panel',
  imports: [TranslateModule, PaButtonModule, PaTableModule, InfoCardComponent],
  templateUrl: './drivers-page.component.html',
  styleUrl: './drivers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Note: no `standalone: true` — it's implicit in Angular 19+
})
export class DriversPageComponent implements OnInit, OnDestroy {
  private driversService = inject(DriversService);

  // Surfaces service signal directly to template
  drivers    = this.driversService.drivers;
  hasDrivers = this.driversService.hasDrivers;

  // Computed from signal
  driverCount = computed(() => this.drivers().length);

  // Old-style cleanup (still valid in existing components)
  private _destroy = new Subject<void>();

  ngOnInit(): void {
    this.driversService.initialize()
      .pipe(takeUntil(this._destroy))
      .subscribe();
  }

  ngOnDestroy(): void {
    this._destroy.next();
    this._destroy.complete();
  }
}
```

**Template patterns with signals:**
```html
<!-- Read signal in template — call it as a function -->
<p>{{ driverCount() }} drivers</p>

<!-- Signal in @if / *ngIf -->
@if (hasDrivers()) {
  <pa-table [data]="drivers()">...</pa-table>
}

<!-- Input binding (for child components using input()) -->
<app-driver-card [driver]="drivers()[0]" />
```

---

## 4. Pure RxJS Service (BehaviorSubject pattern)

**Source:** `libs/sync/src/lib/logic/sync.service.ts` and `apps/manager-v2/src/app/manager.store.ts`

Used in `libs/core`, `libs/sync`, `libs/user`, older parts of `libs/common`.

```ts
@Injectable({ providedIn: 'root' })
export class SomeStore {
  // ── Private subjects ──────────────────────────────────────────────
  private _item    = new BehaviorSubject<Item | null>(null);
  private _loading = new BehaviorSubject<boolean>(false);
  private _list    = new BehaviorSubject<Item[]>([]);

  // ── Public observables (never expose the subject itself) ──────────
  item    = this._item.asObservable();
  loading = this._loading.asObservable();
  list    = this._list.asObservable();

  // ── Derived observables ───────────────────────────────────────────
  hasItems = this._list.pipe(map((l) => l.length > 0));

  // ── Setters ───────────────────────────────────────────────────────
  setItem(item: Item | null): void { this._item.next(item); }

  // ── Snapshot reads ────────────────────────────────────────────────
  getCurrentItem(): Item | null { return this._item.getValue(); }
}
```

**In component (using `async` pipe):**
```html
<div *ngIf="store.loading | async">Loading...</div>
<ul>
  <li *ngFor="let item of store.list | async">{{ item.name }}</li>
</ul>
```

**Or bridge to signal in component:**
```ts
items   = toSignal(this.store.list,    { initialValue: [] });
loading = toSignal(this.store.loading, { initialValue: false });
```

---

## 5. Functional Guard

**Source:** `libs/common/src/lib/guards/select-kb.guard.ts`

```ts
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { SDKService, NavigationService } from '@flaps/core';
import { FeaturesService } from '@flaps/core';
import { map } from 'rxjs';

export const featureGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const sdk     = inject(SDKService);
  const nav     = inject(NavigationService);
  const router  = inject(Router);
  const account = route.paramMap.get('account')!;

  return sdk.currentKb.pipe(
    map((kb) => {
      if (!kb.someFeature) {
        return router.createUrlTree([nav.getAccountUrl(account)]);
      }
      return true;
    }),
  );
};
```

**Register in routes:**
```ts
{
  path: 'feature',
  canActivate: [featureGuard],
  loadComponent: () =>
    import('./feature/feature.component').then((m) => m.FeatureComponent),
}
```

---

## 6. Standard currentKb Pattern

Nearly every data-fetching method in this codebase follows this shape:

```ts
// In a service method
doSomethingForCurrentKb(payload: Payload): Observable<Result> {
  return this.sdk.currentKb.pipe(
    take(1),                                       // ← always take(1) for one-shot ops
    switchMap((kb) => kb.someManager.doAction(payload)),
  );
}
```

The key: `sdk.currentKb` is a ReplaySubject(1). Always call `take(1)` before `switchMap` to
complete after the first emission — otherwise the outer subscription stays open.

---

## 7. Feature Flags

```ts
// In a component or service
private features = inject(FeaturesService);

// Stable flags
isEnterprise = this.features.isEnterprise;         // Observable<boolean>

// Unstable flags (subject to change)
hasSomeFeature = this.features.unstable.someFeature; // Observable<boolean>

// In template via async pipe
@if ((hasSomeFeature | async)) {
  <some-component />
}

// Or bridge to signal
hasSomeFeature = toSignal(this.features.unstable.someFeature, { initialValue: false });
```
