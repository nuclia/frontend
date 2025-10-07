import { ChangeDetectionStrategy, Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { JSONSchema4 } from 'json-schema';
import { SDKService } from '@flaps/core';
import { McpHttpDriver, McpSseDriver, McpStdioDriver } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { WorkflowService } from '../../../../workflow.service';

@Component({
  selector: 'app-mcp-source-select',
  templateUrl: './mcp-source-select.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaTextFieldModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpSourceSelectComponent implements OnInit {
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() form?: FormGroup;
  @Input() controlName?: string;
  @Input() property?: JSONSchema4;

  private sdk = inject(SDKService);
  private workflowService = inject(WorkflowService);
  private toaster = inject(SisToastService);
  private drivers = signal<(McpHttpDriver | McpSseDriver | McpStdioDriver)[]>([]);
  private transportType = signal<string | null>(null);

  // Computed properties
  mcpList = computed(() => {
    const transport = this.transportType();
    const allDrivers = this.drivers();

    if (!transport || !allDrivers.length) {
      return allDrivers;
    }

    return allDrivers.filter((driver) => driver.provider.includes(transport.toLowerCase()));
  });

  ngOnInit(): void {
    this.workflowService.driverModels$.subscribe((drivers) => {
      const mcpDrivers =
        (drivers?.filter((driver) => driver.provider.includes('mcp')) as (
          | McpSseDriver
          | McpStdioDriver
          | McpHttpDriver
        )[]) || [];
      this.drivers.set(mcpDrivers);
    });

    // Listen for transport changes in the form
    if (this.form) {
      const transportControl = this.form.get('transport');
      if (transportControl) {
        // Set initial value
        this.transportType.set(transportControl.value);

        // Listen for changes
        transportControl.valueChanges.subscribe((value) => {
          this.transportType.set(value);
        });
      }
    }
  }
}
