import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  computed,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import {
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
  DropdownComponent,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Driver } from '@nuclia/core';
import { DropdownButtonComponent, InfoCardComponent } from '@nuclia/sistema';
import { Subject, takeUntil, finalize } from 'rxjs';

import { DriversService, DriverType } from './drivers.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { JSONSchema4, JSONSchema7 } from 'json-schema';

@Component({
  selector: 'app-drivers-panel',
  imports: [
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    PaTableModule,
    DropdownButtonComponent,
    InfoCardComponent,
    TranslateModule
],
  templateUrl: './drivers-page.component.html',
  styleUrl: './drivers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class DriversPageComponent implements OnInit, OnDestroy {
  private driversService = inject(DriversService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private _unsubscribeAll = new Subject<void>();
  private editInProgress = false;
  private addInProgress = false;
  private deleteInProgress = false;

  @ViewChild('driverTypes') driverTypesDropdown!: DropdownComponent;

  // Expose service properties to template
  drivers = this.driversService.drivers;
  driverOptions = computed(() => {
    const schemas = this.driversService.schemas();
    if (schemas === null) {
      return [];
    } else {
      const driverSchemaIds = ((schemas.properties?.['drivers'].items as JSONSchema4)?.oneOf || []).map(
        (ref) => ref.$ref?.split('/').slice(-1)[0],
      );
      const options = Object.entries((schemas as JSONSchema7).$defs || {})
        .filter(([key]) => driverSchemaIds.includes(key))
        .map(([key, driver]) => ({ key, title: (driver as JSONSchema4)?.title || '' }));
      return options;
    }
  });
  hasAllInternetDrivers = this.driversService.hasAllInternetDrivers;

  ngOnInit(): void {
    // Initialize service - starts both drivers$ and schemas$ streams
    this.driversService
      .initialize()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          // Trigger initial change detection
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error initializing drivers service:', error);
        },
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  addDriver(driverKey: string): void {
    // Prevent multiple add operations from running simultaneously
    if (this.addInProgress) {
      return;
    }

    this.addInProgress = true;

    this.driversService
      .addDriver(driverKey)
      .pipe(
        takeUntil(this._unsubscribeAll),
        finalize(() => {
          this.addInProgress = false;
        }),
      )
      .subscribe({
        next: (result) => {
          if (result) {
            // Trigger change detection after successful add
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          console.error('Error adding driver:', error);
          // Ensure UI is still responsive after error
          this.cdr.markForCheck();
        },
        complete: () => {
          // Clean up any lingering modal elements
          setTimeout(() => {
            this.checkForLingeringModals();
          }, 500);
        },
      });
  }

  edit(driver: Driver): void {
    // Prevent multiple edit operations from running simultaneously
    if (this.editInProgress) {
      return;
    }

    this.editInProgress = true;

    this.driversService
      .editDriver(driver)
      .pipe(
        takeUntil(this._unsubscribeAll),
        finalize(() => {
          this.editInProgress = false;
        }),
      )
      .subscribe({
        next: (result) => {
          if (result) {
            // Only trigger change detection after successful edit
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          console.error('Error editing driver:', error);
          // Ensure UI is still responsive after error
          this.cdr.markForCheck();
        },
        complete: () => {
          // Clean up any lingering modal elements
          setTimeout(() => {
            this.checkForLingeringModals();
          }, 500);
        },
      });
  }

  /**
   * Check for lingering modal elements and clean them up
   */
  private checkForLingeringModals(): void {
    const modals = document.querySelectorAll('pa-modal-advanced, .pa-modal, .modal');
    const backdrops = document.querySelectorAll('.pa-modal-backdrop, .modal-backdrop');

    if (modals.length > 0 || backdrops.length > 0) {
      // Clean up lingering modal elements
      modals.forEach((modal) => modal.remove());
      backdrops.forEach((backdrop) => backdrop.remove());

      // Reset body styles that might be left over from modal
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open', 'pa-modal-open');
    }
  }

  onEditClick(driver: Driver, event: any): void {
    event?.stopPropagation?.();
    this.edit(driver);
  }

  onDeleteClick(driver: Driver, event: any): void {
    event?.stopPropagation?.();
    this.deleteDriver(driver);
  }

  deleteDriver(driver: Driver): void {
    // Prevent multiple delete operations from running simultaneously
    if (this.deleteInProgress) {
      return;
    }

    this.deleteInProgress = true;

    this.driversService
      .deleteDriver(driver)
      .pipe(
        takeUntil(this._unsubscribeAll),
        finalize(() => {
          this.deleteInProgress = false;
        }),
      )
      .subscribe({
        next: (result) => {
          if (result) {
            // Only trigger change detection after successful deletion
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          console.error('Error deleting driver:', error);
          // Ensure UI is still responsive after error
          this.cdr.markForCheck();
        },
        complete: () => {
          // Clean up any lingering modal elements
          setTimeout(() => {
            this.checkForLingeringModals();
          }, 500);
        },
      });
  }

  /**
   * Get description for a driver
   */
  getDriverDescription(driverKey: string): string {
    const keyLower = driverKey.toLowerCase();

    if (keyLower.includes('internet') && this.hasAllInternetDrivers()) {
      return this.translate.instant('retrieval-agents.drivers.add.internet.all-configured');
    }

    return '';
  }

  /**
   * Check if a driver option should be disabled
   */
  isDriverDisabled(driverKey: string): boolean {
    const keyLower = driverKey.toLowerCase();

    // Disable internet driver if all are configured
    if (keyLower.includes('internet') && this.hasAllInternetDrivers()) {
      return true;
    }

    return false;
  }
}
