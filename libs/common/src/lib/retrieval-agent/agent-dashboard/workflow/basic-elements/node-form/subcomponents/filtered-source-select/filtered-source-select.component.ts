import { ChangeDetectionStrategy, Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { JSONSchema4 } from 'json-schema';
import { SDKService } from '@flaps/core';
import { InfoCardComponent, SisToastService } from '@nuclia/sistema';
import { WorkflowService } from '../../../../workflow.service';
import { aragUrl } from '../../../../workflow.state';

@Component({
  selector: 'app-filtered-source-select',
  templateUrl: './filtered-source-select.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaTextFieldModule,
    PaButtonModule,
    RouterLink,
    TranslateModule,
    InfoCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilteredSourceSelectComponent implements OnInit {
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() form?: FormGroup;
  @Input() controlName?: string;
  @Input() property?: JSONSchema4;

  private sdk = inject(SDKService);
  private workflowService = inject(WorkflowService);
  private toaster = inject(SisToastService);
  private drivers = signal<any[]>([]);
  transportType = signal<string | null>(null);

  // Computed properties
  filteredList = computed(() => {
    const transport = this.transportType();
    const allDrivers = this.drivers();

    if (!transport || !allDrivers.length) {
      return allDrivers;
    }

    return allDrivers.filter((driver) => driver.provider.includes(transport.toLowerCase()));
  });

  driversPath = computed(() => `${aragUrl()}/drivers`);

  // Computed property to check if there are no valid driver options
  hasNoValidOptions = computed(() => {
    const filteredDrivers = this.filteredList();
    return filteredDrivers !== null && filteredDrivers.length === 0;
  });

  ngOnInit(): void {
    this.workflowService.driverModels$.subscribe((drivers) => {
      const filteredDrivers = drivers || [];
      this.drivers.set(filteredDrivers);
    });

    // Listen for transport changes in the form
    if (this.form) {
      const transportControl = this.form.get('transport');
      const moduleControl = this.form.get('module');
      if (transportControl) {
        // Set initial value
        this.transportType.set(transportControl.value);

        // Listen for changes
        transportControl.valueChanges.subscribe((value) => {
          this.transportType.set(value);
        });
      } else if (moduleControl) {
        // Fallback to module control if transport is not available
        this.transportType.set(moduleControl.value);
        moduleControl.valueChanges.subscribe((value) => {
          this.transportType.set(value);
        });
      }
    }
  }
}
