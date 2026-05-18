import { inject, Injectable, signal, computed } from '@angular/core';
import { SDKService, STFUtils } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { ARAGSchemas, Driver } from '@nuclia/core';
import { ModalConfig, ModalRef } from '@guillotinaweb/pastanaga-angular';
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  map,
  of,
  switchMap,
  take,
  tap,
  throwError,
  shareReplay,
} from 'rxjs';

// Import modal components
import { NucliaDriverModalComponent } from './nuclia-driver';
import { DynamicDriverModalComponent } from './dynamic-driver-form';

@Injectable({
  providedIn: 'root',
})
export class DriversService {
  private sdk = inject(SDKService);
  private modal = inject(SisModalService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);

  // Reactive state management
  private _drivers = signal<Driver[]>([]);
  private _schemas = signal<ARAGSchemas | null>(null);
  private _refreshTrigger = new BehaviorSubject<void>(undefined);

  // Public observables
  drivers$ = this._refreshTrigger.pipe(
    switchMap(() => this.sdk.currentArag),
    switchMap((arag) => arag.getDrivers()),
    catchError((error) => {
      if (error.status === 404) {
        return of([]);
      } else {
        return throwError(() => error);
      }
    }),
    tap((drivers) => this._drivers.set(drivers)),
    shareReplay(1),
  );

  schemas$ = this._refreshTrigger.pipe(
    switchMap(() => this.sdk.currentArag),
    switchMap((arag) => arag.getSchemas()),
    catchError((error) => {
      console.error('Error fetching schemas:', error);
      this.toaster.error(this.translate.instant('retrieval-agents.drivers.errors.schemas'));
      return of(null);
    }),
    tap((schemas) => this._schemas.set(schemas)),
    shareReplay(1),
  );

  kbList$ = combineLatest([this.sdk.currentArag, this.sdk.kbList]).pipe(
    map(([arag, kbList]) => kbList.filter((kb) => kb.zone === arag.zone && !!kb.role_on_kb)),
  );

  // Computed properties (accessible as signals)
  drivers = this._drivers.asReadonly();
  schemas = this._schemas.asReadonly();

  hasAllInternetDrivers = computed(
    () =>
      this._drivers().some((driver) => driver.provider === 'brave') &&
      this._drivers().some((driver) => driver.provider === 'perplexity') &&
      this._drivers().some((driver) => driver.provider === 'tavily'),
  );

  /**
   * Refresh drivers data
   */
  refreshDrivers(): void {
    this._refreshTrigger.next();
  }

  /**
   * Refresh all data (drivers and schemas)
   */
  refreshAll(): void {
    this._refreshTrigger.next();
  }

  /**
   * Initialize service by subscribing to data streams
   * Call this once in your main component's ngOnInit
   */
  initialize(): Observable<[Driver[], ARAGSchemas | null]> {
    this._refreshTrigger.next();
    return combineLatest([this.drivers$, this.schemas$]);
  }

  private _modalRefToObservable(modalRef: ModalRef, handleResult: (result: any) => Observable<any>): Observable<any> {
    return new Observable((observer) => {
      let completed = false;
      const complete = (result: any) => {
        if (!completed) {
          completed = true;
          handleResult(result).subscribe({
            next: (value) => observer.next(value),
            error: (err) => observer.error(err),
            complete: () => observer.complete(),
          });
        }
      };
      const closeSub = modalRef.onClose.subscribe({
        next: (result) => complete(result),
        error: () => complete(null),
      });
      const dismissSub = modalRef.onDismiss.subscribe({
        next: () => complete(null),
        error: () => complete(null),
      });
      return () => {
        closeSub.unsubscribe();
        dismissSub.unsubscribe();
      };
    });
  }

  /**
   * Handle driver addition result from modal
   */
  private handleAddDriverResult(driver: any): Observable<any> {
    if (!driver) {
      // Modal was cancelled - return empty observable that completes immediately
      return of(null);
    }

    // Process the driver creation
    const driverWithId = {
      ...driver,
      identifier: `${driver.provider}-${STFUtils.generateRandomSlugSuffix()}`,
    };

    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => arag.addDriver(driverWithId)),
      switchMap(() => this.sdk.refreshCurrentArag()),
      tap(() => this.refreshDrivers()),
      catchError((error) => {
        this.toaster.error(this.translate.instant('retrieval-agents.drivers.errors.creation'));
        return throwError(() => error);
      }),
    );
  }

  /**
   * Add a new driver using dynamic form based on schema
   */
  addDriver(driverKey: string): Observable<any> {
    return of(this._drivers()).pipe(
      take(1),
      switchMap((existingDrivers) => {
        let modalRef$: Observable<ModalRef<any>>;
        switch (driverKey) {
          case 'nucliadb':
          case 'sync':
            modalRef$ = this.kbList$.pipe(
              take(1),
              map((kbList) =>
                this.modal.openModal(
                  NucliaDriverModalComponent,
                  new ModalConfig({
                    data: { kbList, isSyncDriver: driverKey === 'sync' },
                    dismissable: false,
                  }),
                ),
              ),
            );
            break;
          default:
            modalRef$ = of(
              this.modal.openModal(
                DynamicDriverModalComponent,
                new ModalConfig({
                  data: {
                    driverKey,
                    existingDrivers,
                  },
                  dismissable: false,
                }),
              ),
            );
            break;
        }

        return modalRef$.pipe(
          switchMap((modalRef) => {
            const handleResult = (driver: any) => this.handleAddDriverResult(driver);
            return this._modalRefToObservable(modalRef, handleResult);
          }),
        );
      }),
    );
  }

  /**
   * Handle driver edit result from modal
   */
  private handleEditDriverResult(driver: any, driverToEdit: Driver): Observable<any> {
    if (!driver) {
      // Modal was cancelled - return empty observable that completes immediately
      return of(null);
    }

    return this.sdk.currentArag.pipe(
      take(1),
      // Edition modal doesn't return identifier properties, but they are present in driverToEdit
      switchMap((arag) => arag.patchDriver({ ...driverToEdit, ...driver })),
      switchMap(() => this.sdk.refreshCurrentArag()),
      tap(() => this.refreshDrivers()),
      catchError((error) => {
        console.error('Error in driver update:', error);
        this.toaster.error(this.translate.instant('retrieval-agents.drivers.errors.edition'));
        return throwError(() => error);
      }),
    );
  }

  /**
   * Edit an existing driver using dynamic form
   */
  editDriver(driverToEdit: Driver): Observable<any> {
    // Find the driver schema based on the provider
    return combineLatest([of(this._schemas()), of(this._drivers()), this.kbList$.pipe(take(1))]).pipe(
      take(1),
      switchMap(([schemas, existingDrivers, kbList]) => {
        if (!schemas) {
          throw new Error('Schemas not available');
        }

        const driverKey = driverToEdit.provider;

        const modalRef =
          driverKey === 'nucliadb' || driverKey === 'sync'
            ? this.modal.openModal(
                NucliaDriverModalComponent,
                new ModalConfig({
                  data: { kbList, driver: driverToEdit, isSyncDriver: driverKey === 'sync' },
                  dismissable: false,
                }),
              )
            : this.modal.openModal(
                DynamicDriverModalComponent,
                new ModalConfig({
                  data: {
                    driverKey,
                    existingDriver: driverToEdit,
                    existingDrivers,
                  },
                  dismissable: false,
                }),
              );

        const handleResult = (driver: any) => this.handleEditDriverResult(driver, driverToEdit);

        return this._modalRefToObservable(modalRef, handleResult);
      }),
    );
  }

  /**
   * Delete a driver
   */
  deleteDriver(driver: Driver): Observable<any> {
    return this.modal
      .openConfirm({
        title: this.translate.instant('retrieval-agents.drivers.confirm-deletion.title', { name: driver.name }),
        description: this.translate.instant('retrieval-agents.drivers.confirm-deletion.description'),
        isDestructive: true,
      })
      .onClose.pipe(
        switchMap((confirm) => {
          if (!confirm) {
            // Confirmation was cancelled - return empty observable that completes immediately
            return of(null);
          }

          return this.sdk.currentArag.pipe(
            take(1),
            switchMap((arag) => arag.deleteDriver(driver.id)),
            switchMap(() => this.sdk.refreshCurrentArag()),
            tap(() => this.refreshDrivers()),
            catchError((error) => {
              this.toaster.error(this.translate.instant('retrieval-agents.drivers.errors.deletion'));
              return throwError(() => error);
            }),
          );
        }),
      );
  }
}
