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

  @ViewChild('driverTypes') driverTypesDropdown!: DropdownComponent;

  // Force re-render flag
  showDropdown = true;

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
    this.driversService
      .addDriver(driverTitle)
      .pipe(
        takeUntil(this._unsubscribeAll),
        finalize(() => {
          // Force complete change detection cycle and refresh components
          setTimeout(() => {
            // Force cleanup of any lingering modal state
            this.forceModalCleanup();
            // Force dropdown recreation by toggling visibility
            this.showDropdown = false;
            this.cdr.detectChanges();
            setTimeout(() => {
              this.showDropdown = true;
              this.cdr.detectChanges();
              // Additional check - refresh the service to ensure state consistency
              this.driversService.refreshAll();
            }, 50);
          }, 200); // Increased delay to ensure modal is fully closed
        }),
      )
      .subscribe({
        next: (result) => {
          // Success - data is already updated through the service
          if (result) {
            console.log('Driver added successfully');
          } else {
            console.log('Driver add operation cancelled');
          }
        },
        error: (error) => {
          console.error('Error adding driver:', error);
        },
      });
  }

  edit(driver: Driver): void {
    this.driversService
      .editDriver(driver)
      .pipe(
        takeUntil(this._unsubscribeAll),
        finalize(() => {
          // Force complete change detection cycle
          setTimeout(() => {
            this.cdr.detectChanges();
            // Refresh service state to ensure consistency
            this.driversService.refreshAll();
          }, 100);
        }),
      )
      .subscribe({
        next: (result) => {
          if (result) {
            console.log('Driver edited successfully');
          } else {
            console.log('Driver edit operation cancelled');
          }
        },
        error: (error) => {
          console.error('Error editing driver:', error);
        },
      });
  }

  deleteDriver(driver: Driver): void {
    this.driversService
      .deleteDriver(driver)
      .pipe(
        takeUntil(this._unsubscribeAll),
        finalize(() => {
          // Force complete change detection cycle
          setTimeout(() => {
            this.cdr.detectChanges();
            // Refresh service state to ensure consistency
            this.driversService.refreshAll();
          }, 100);
        }),
      )
      .subscribe({
        next: (result) => {
          if (result) {
            console.log('Driver deleted successfully');
          } else {
            console.log('Driver delete operation cancelled');
          }
        },
        error: (error) => {
          console.error('Error deleting driver:', error);
        },
      });
  }

  /**
   * Debug method to check dropdown state
   */
  onDropdownClick(): void {
    console.log('Dropdown clicked');
    console.log('Dropdown component:', this.driverTypesDropdown);
    if (this.driverTypesDropdown) {
      console.log('Dropdown state - isOpen:', (this.driverTypesDropdown as any).isOpen);
      console.log('Dropdown state - disabled:', (this.driverTypesDropdown as any).disabled);
    }
  }

  /**
   * Force cleanup of any lingering modal state
   */
  private forceModalCleanup(): void {
    // Remove any lingering modal backdrops
    const backdrops = document.querySelectorAll('.pa-modal-backdrop, .modal-backdrop, [data-modal-backdrop]');
    backdrops.forEach((backdrop) => {
      console.log('Removing lingering modal backdrop:', backdrop);
      backdrop.remove();
    });

    // Remove any lingering modal containers
    const modals = document.querySelectorAll('.pa-modal-container, .modal, [data-modal-container]');
    modals.forEach((modal) => {
      console.log('Removing lingering modal container:', modal);
      modal.remove();
    });

    // Reset document body styles that might be left over from modal
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
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
