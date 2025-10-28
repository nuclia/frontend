import { inject, Injectable, signal, computed } from '@angular/core';
import { SDKService, FeaturesService, STFUtils } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { Driver, ARAGSchemas } from '@nuclia/core';
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
  timeout,
} from 'rxjs';

// Import modal components
import { NucliaDriverModalComponent } from './nuclia-driver';
import { DynamicDriverModalComponent } from './dynamic-driver-form';

export type DriverType = string; // Now accepts any string (driver title from schema)

@Injectable({
  providedIn: 'root',
})
export class DriversService {
  private sdk = inject(SDKService);
  private modal = inject(SisModalService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);
  private featureService = inject(FeaturesService);

  // Feature flags
  hasSql = this.featureService.unstable.aragSql;
  hasCypher = this.featureService.unstable.aragCypher;
  hasAlinia = this.featureService.unstable.aragAlinia;
  hasMcp = this.featureService.unstable.aragMcp;

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

  /**
   * Handle driver addition result from modal
   */
  private handleAddDriverResult(driver: any): Observable<any> {
    if (!driver) {
      // Modal was cancelled - return empty observable that completes immediately
      console.log('Modal was cancelled or closed without data');
      return of(null);
    }

    console.log('Processing driver creation with data:', driver);
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
  addDriver(driverTitle: string): Observable<any> {
    return of(this._drivers()).pipe(
      take(1),
      switchMap((existingDrivers) => {
        let modalRef$: Observable<ModalRef<any>>;
        switch (driverTitle) {
          case 'NucliaDBConfig':
            modalRef$ = this.sdk.kbList.pipe(
              take(1),
              map((kbList) =>
                this.modal.openModal(
                  NucliaDriverModalComponent,
                  new ModalConfig({
                    data: { kbList },
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
                    driverTitle,
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

            // Use merge to handle both onClose and onDismiss simultaneously
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

              // Handle normal close (Cancel/Save buttons)
              const closeSub = modalRef.onClose
                .pipe(
                  timeout(300000),
                  tap((result) => {
                    console.log('Modal onClose result:', result);
                  }),
                )
                .subscribe({
                  next: (result) => complete(result),
                  error: (error) => {
                    console.error('Modal onClose error or timeout:', error);
                    complete(null);
                  },
                });

              // Handle dismiss (X button, ESC key, etc.)
              const dismissSub = modalRef.onDismiss
                .pipe(
                  tap(() => {
                    console.log('Modal onDismiss triggered');
                  }),
                )
                .subscribe({
                  next: () => complete(null), // Treat dismiss as cancel
                  error: (error) => {
                    console.error('Modal onDismiss error:', error);
                    complete(null);
                  },
                });

              // Cleanup function
              return () => {
                closeSub.unsubscribe();
                dismissSub.unsubscribe();
              };
            });
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
    return combineLatest([of(this._schemas()), of(this._drivers())]).pipe(
      take(1),
      switchMap(([schemas, existingDrivers]) => {
        if (!schemas) {
          throw new Error('Schemas not available');
        }

        // Find the appropriate driver schema based on the provider
        const driverTitle = this.getDriverTitleByProvider(driverToEdit.provider, schemas);
        if (!driverTitle) {
          throw new Error(`Unknown driver provider: ${driverToEdit.provider}`);
        }

        const modalRef = this.modal.openModal(
          DynamicDriverModalComponent,
          new ModalConfig({
            data: {
              driverTitle,
              existingDriver: driverToEdit,
              existingDrivers,
            },
            dismissable: false,
          }),
        );

        const handleResult = (driver: any) => this.handleEditDriverResult(driver, driverToEdit);

        // Use merge to handle both onClose and onDismiss simultaneously
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

          // Handle normal close (Cancel/Save buttons)
          const closeSub = modalRef.onClose.subscribe({
            next: (result) => complete(result),
            error: (error) => {
              console.error('Modal onClose error:', error);
              complete(null);
            },
          });

          // Handle dismiss (X button, ESC key, etc.)
          const dismissSub = modalRef.onDismiss
            .pipe(
              tap(() => {
                console.log('Modal onDismiss triggered');
              }),
            )
            .subscribe({
              next: () => complete(null), // Treat dismiss as cancel
              error: (error) => {
                console.error('Modal onDismiss error:', error);
                complete(null);
              },
            });

          // Cleanup function
          return () => {
            closeSub.unsubscribe();
            dismissSub.unsubscribe();
          };
        });
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

  /**
   * Get drivers by provider type
   */
  getDriversByProvider(provider: string): Observable<Driver[]> {
    return this.drivers$.pipe(map((drivers) => drivers.filter((driver) => driver.provider === provider)));
  }

  /**
   * Get driver schema title by provider name
   */
  private getDriverTitleByProvider(provider: string, schemas: ARAGSchemas): string | null {
    // Map provider names to schema titles
    const providerToTitleMap: Record<string, string> = {
      brave: 'BraveDriverConfig',
      cypher: 'CypherDriverConfig',
      nucliadb: 'NucliaDBConfig',
      perplexity: 'PerplexityDriverConfig',
      tavily: 'TavilyDriverConfig',
      sql: 'SQLDriverConfig',
      google: 'GoogleDriverConfig',
      mcpstdio: 'MCPStdioDriverConfig',
      mcpsse: 'MCPSSEDriverConfig',
      mcphttp: 'MCPHTTPDriverConfig',
      alinia: 'AliniaDriverConfig',
    };

    const title = providerToTitleMap[provider];
    if (title) {
      // Verify the schema exists
      const driverSchema = schemas.drivers.find((d) => d.title === title);
      return driverSchema ? title : null;
    }

    return null;
  }
}
