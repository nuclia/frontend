import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Driver, LearningConfigurationOption, McpSseDriver, McpStdioDriver } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { switchMap, take } from 'rxjs';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';
import { McpAgentUI } from '../../workflow.models';
import { aragUrl } from '../../workflow.state';
import { WorkflowService } from '../../workflow.service';

@Component({
  selector: 'app-mcp-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    TranslateModule,
    ConfigurationFormComponent,
    RulesFieldComponent,
    RouterLink,
  ],
  templateUrl: './mcp-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpFormComponent extends FormDirective implements OnInit {
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);
  private workflowService = inject(WorkflowService);

  override form = new FormGroup({
    mcp: new FormGroup({
      transport: new FormControl<'SSE' | 'STDIO' | ''>('', { nonNullable: true, validators: [Validators.required] }),
      source: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      tool_choice_model: new FormControl<string>('', { nonNullable: true }),
      summarize_model: new FormControl<string>('', { nonNullable: true }),
      rules: new FormArray<FormControl<string>>([]),
    }),
  });
  override get configForm() {
    return this.form.controls.mcp;
  }

  get sourceControl() {
    return this.configForm.controls.source;
  }

  private drivers = signal<Driver[]>([]);
  private transport = signal<'SSE' | 'STDIO' | ''>('');

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

  private models = signal<LearningConfigurationOption[]>([]);
  toolModels = computed(() =>
    this.models().map((option) => new OptionModel({ id: option.value, value: option.value, label: option.name })),
  );
  summarizeModels = computed(() =>
    this.models().map((option) => new OptionModel({ id: option.value, value: option.value, label: option.name })),
  );

  ngOnInit(): void {
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => arag.getDrivers()),
      )
      .subscribe({
        next: (drivers) => {
          this.drivers.set(drivers);
          if (drivers.length === 0) {
            this.noSseDriver.set(true);
            this.noStdioDriver.set(true);
          } else {
            if (drivers.filter((driver) => driver.provider === 'mcpsse').length === 0) {
              this.noSseDriver.set(true);
            }
            if (drivers.filter((driver) => driver.provider === 'mcpstdio').length === 0) {
              this.noStdioDriver.set(true);
            }
          }
          if (this.config) {
            const config = this.config as McpAgentUI;
            this.transport.set(config.transport);
            setTimeout(() => this.sourceControl.patchValue(config.source));
          }
        },
        error: () => this.toaster.error('retrieval-agents.workflow.errors.loading-drivers'),
      });

    this.workflowService.getModels().subscribe((models) => {
      this.models.set(models);
    });
  }
  onTransportChange(transport: 'SSE' | 'STDIO' | '') {
    this.sourceControl.patchValue('');
    this.transport.set(transport);
  }
}
