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
import { CommonModule } from '@angular/common';
import { DriversService, DriverType } from './drivers.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-drivers-panel',
  imports: [
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    PaTableModule,
    DropdownButtonComponent,
    InfoCardComponent,
    TranslateModule,
    CommonModule,
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
  schemas = this.driversService.schemas;
  hasAllInternetDrivers = this.driversService.hasAllInternetDrivers;

  // Convert observables to signals for synchronous access
  hasSql = toSignal(this.driversService.hasSql, { initialValue: false });
  hasCypher = toSignal(this.driversService.hasCypher, { initialValue: false });
  hasAlinia = toSignal(this.driversService.hasAlinia, { initialValue: false });
  hasMcp = toSignal(this.driversService.hasMcp, { initialValue: false });

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

  addDriver(driverTitle: string): void {
    // Prevent multiple add operations from running simultaneously
    if (this.addInProgress) {
      return;
    }

    this.addInProgress = true;

    this.driversService
      .addDriver(driverTitle)
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
   * Check if a driver should be shown based on feature flags
   */
  shouldShowDriver(driverTitle: string): boolean {
    const titleLower = driverTitle.toLowerCase();

    // Always show these drivers
    if (titleLower.includes('nuclia') || titleLower.includes('internet')) {
      return true;
    }

    // Check feature flags for specific drivers
    if (titleLower.includes('sql') && !this.hasSql()) return false;
    if (titleLower.includes('cypher') && !this.hasCypher()) return false;
    if (
      (titleLower.includes('mcp') || titleLower.includes('mcpsse') || titleLower.includes('mcpstdio')) &&
      !this.hasMcp()
    )
      return false;
    if ((titleLower.includes('guardrails') || titleLower.includes('alinia')) && !this.hasAlinia()) return false;

    return true;
  }

  /**
   * Get the display name for a driver (with translation)
   */
  getDriverDisplayName(driverTitle: string): string {
    const titleLower = driverTitle.toLowerCase();

    // Fallback to the original title
    return driverTitle;
    // return this.translate.instant(`retrieval-agents.drivers.add.${titleLower}`) || driverTitle;
  }

  /**
   * Get description for a driver
   */
  getDriverDescription(driverTitle: string): string {
    const titleLower = driverTitle.toLowerCase();

    if (titleLower.includes('internet') && this.hasAllInternetDrivers()) {
      return this.translate.instant('retrieval-agents.drivers.add.internet.all-configured');
    }

    return '';
  }

  /**
   * Check if a driver option should be disabled
   */
  isDriverDisabled(driverTitle: string): boolean {
    const titleLower = driverTitle.toLowerCase();

    // Disable internet driver if all are configured
    if (titleLower.includes('internet') && this.hasAllInternetDrivers()) {
      return true;
    }

    return false;
  }
}
