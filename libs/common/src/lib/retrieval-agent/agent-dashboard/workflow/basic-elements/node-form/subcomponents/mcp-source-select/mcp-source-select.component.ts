import { ChangeDetectionStrategy, Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { JSONSchema4 } from 'json-schema';
import { SDKService } from '@flaps/core';
import { McpSseDriver, McpStdioDriver } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { switchMap, take } from 'rxjs';
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
  private drivers = signal<(McpSseDriver | McpStdioDriver)[]>([]);

  // Computed properties
  mcpList = computed(() => this.drivers());

  ngOnInit(): void {
    this.workflowService.driverModels$.subscribe((drivers) => {
      const mcpDrivers =
        (drivers?.filter((driver) => driver.provider === 'mcpsse' || driver.provider === 'mcpstdio') as (
          | McpSseDriver
          | McpStdioDriver
        )[]) || [];
      this.drivers.set(mcpDrivers);
    });
  }
}
