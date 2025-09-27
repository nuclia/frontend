import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SDKService } from '@flaps/core';
import { PaButtonModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Driver, McpSseDriver, McpStdioDriver } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { switchMap, take } from 'rxjs';
import { aragUrl } from '../../../../workflow.state';

export type TransportType = 'SSE' | 'STDIO' | '';

export interface TransportChangeEvent {
  transport: TransportType;
  hasDrivers: boolean;
  availableDrivers: (McpSseDriver | McpStdioDriver)[];
}

@Component({
  selector: 'app-transport-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaButtonModule, PaTogglesModule, TranslateModule, RouterLink],
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
  transportControl = computed(() => {
    const form = this.form();
    const controlName = this.controlName();
    return form.get(controlName) as FormControl<TransportType>;
  });

  driversPath = computed(() => `${aragUrl()}/drivers`);

  mcpList = computed<(McpSseDriver | McpStdioDriver)[]>(() => {
    switch (this.transport()) {
      case 'SSE':
        return this.drivers().filter((driver) => driver.provider === 'mcpsse');
      case 'STDIO':
        return this.drivers().filter((driver) => driver.provider === 'mcpstdio');
      default:
        return [];
    }
  });

  noSseDriver = signal(false);
  noStdioDriver = signal(false);

  showDriversButton = computed(() => this.noSseDriver() || this.noStdioDriver());

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
    if (drivers.length === 0) {
      this.noSseDriver.set(true);
      this.noStdioDriver.set(true);
    } else {
      const sseDrivers = drivers.filter((driver) => driver.provider === 'mcpsse');
      const stdioDrivers = drivers.filter((driver) => driver.provider === 'mcpstdio');

      this.noSseDriver.set(sseDrivers.length === 0);
      this.noStdioDriver.set(stdioDrivers.length === 0);
    }
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
