import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, output, signal } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SDKService } from '@flaps/core';
import { PaButtonModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Driver, McpSseDriver, McpStdioDriver, McpHttpDriver } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { switchMap, take } from 'rxjs';
import { aragUrl } from '../../../../workflow.state';

export type TransportType = string;

export interface TransportChangeEvent {
  transport: TransportType;
  hasDrivers: boolean;
  availableDrivers: (McpHttpDriver | McpSseDriver | McpStdioDriver)[];
}

@Component({
  selector: 'app-transport-field',
  standalone: true,
  imports: [ReactiveFormsModule, PaButtonModule, PaTogglesModule, TranslateModule, RouterLink],
  templateUrl: './transport-field.component.html',
  styleUrl: './transport-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransportFieldComponent implements OnInit {
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);

  // Inputs - updated to match other subcomponents pattern
  form = input.required<FormGroup>();
  controlName = input.required<string>();
  label = input.required<string>();
  property = input<any>({});
  required = input<boolean>(false);

  // Outputs
  transportChange = output<TransportChangeEvent>();

  // Internal state
  private drivers = signal<Driver[]>([]);
  private transport = signal<TransportType>('');

  // Computed properties
  transportOptions = computed(() => {
    const property = this.property();
    return property?.enum || [];
  });
  transportControl = computed(() => {
    const form = this.form();
    const controlName = this.controlName();
    return form.get(controlName) as FormControl<TransportType>;
  });

  driversPath = computed(() => `${aragUrl()}/drivers`);

  // Helper method to generate provider type from transport type
  private getProviderType(transport: string): string {
    return `mcp${transport.toLowerCase()}`;
  }

  mcpList = computed<(McpHttpDriver | McpSseDriver | McpStdioDriver)[]>(() => {
    const currentTransport = this.transport();
    if (!currentTransport) return [];

    const providerType = this.getProviderType(currentTransport);
    return this.drivers().filter((driver) => driver.provider === providerType) as (
      | McpHttpDriver
      | McpSseDriver
      | McpStdioDriver
    )[];
  });

  // Dynamic driver availability signals for each transport type
  driverAvailability = computed(() => {
    const drivers = this.drivers();
    const transportOptions = this.transportOptions();
    const availability: Record<string, boolean> = {};

    transportOptions.forEach((transport: string) => {
      const providerType = this.getProviderType(transport);

      // Check if there are drivers for this transport type
      const hasDrivers = drivers.some((driver) => driver.provider === providerType);
      availability[transport] = hasDrivers;
    });

    return availability;
  });

  showDriversButton = computed(() => {
    const availability = this.driverAvailability();
    return Object.values(availability).some((hasDriver) => !hasDriver);
  });

  ngOnInit(): void {
    // Initialize transport from form control value
    const control = this.transportControl();
    const initialValue = control?.value || '';
    if (initialValue) {
      this.transport.set(initialValue);
    }

    // Load drivers
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => arag.getDrivers()),
      )
      .subscribe({
        next: (drivers) => {
          this.drivers.set(drivers);
          this.updateDriverAvailability(drivers);

          // Emit initial state
          this.emitTransportChange();
        },
        error: () => this.toaster.error('retrieval-agents.workflow.errors.loading-drivers'),
      });
  }

  onTransportChange(transport: TransportType): void {
    this.transport.set(transport);
    this.transportControl().patchValue(transport);
    this.emitTransportChange();
  }

  private updateDriverAvailability(drivers: Driver[]): void {
    // Driver availability is now handled by the computed signal
    // This method is kept for backwards compatibility but logic moved to computed
  }

  getTransportHelpText(transport: string): string {
    const availability = this.driverAvailability();
    return availability[transport] === false ? `retrieval-agents.workflow.node-types.mcp.form.no-source` : '';
  }

  isTransportDisabled(transport: string): boolean {
    const availability = this.driverAvailability();
    return availability[transport] === false;
  }

  private emitTransportChange(): void {
    const currentTransport = this.transport();
    const availableDrivers = this.mcpList();

    this.transportChange.emit({
      transport: currentTransport,
      hasDrivers: availableDrivers.length > 0,
      availableDrivers,
    });
  }
}
