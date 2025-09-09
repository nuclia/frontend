import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BaseContextAgent, LearningConfigurationOption, NucliaDBDriver } from '@nuclia/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { map, Observable, switchMap, take } from 'rxjs';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';
import { BasicAskAgentUI } from '../../workflow.models';
import { aragUrl } from '../../workflow.state';
import { WorkflowService } from '../../workflow.service';

@Component({
  selector: 'app-ask-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    InfoCardComponent,
    PaButtonModule,
    PaTextFieldModule,
    ConfigurationFormComponent,
    RulesFieldComponent,
  ],
  templateUrl: './basic-ask-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAskFormComponent extends FormDirective implements OnInit {
  private sdk = inject(SDKService);
  private workflowService = inject(WorkflowService);

  override form = new FormGroup({
    ask: new FormGroup({
      sources: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      fallback: new FormControl<BaseContextAgent | null>(null),
      generative_model: new FormControl<string>('', { nonNullable: true }),
      summarize_model: new FormControl<string>('', { nonNullable: true }),
      rules: new FormArray<FormControl<string>>([]),
    }),
  });
  override get configForm() {
    return this.form.controls.ask;
  }

  aragUrl = aragUrl;
  driversPath = computed(() => `${this.aragUrl()}/drivers`);
  sourceOptions = signal<OptionModel[] | null>(null);

  private models = signal<LearningConfigurationOption[]>([]);
  generativeModelOptions = computed(() =>
    this.models().map((option) => new OptionModel({ id: option.value, value: option.value, label: option.name })),
  );
  summarizeModelOptions = computed(() =>
    this.models().map((option) => new OptionModel({ id: option.value, value: option.value, label: option.name })),
  );

  ngOnInit() {
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => arag.getDrivers('nucliadb') as Observable<NucliaDBDriver[]>),
        map((drivers) =>
          drivers.map(
            (driver) => new OptionModel({ id: driver.identifier, label: driver.name, value: driver.identifier }),
          ),
        ),
      )
      .subscribe((options) => this.sourceOptions.set(options));

    if (this.config) {
      const { rules, ...config } = this.config as BasicAskAgentUI;
      const formConfig = {
        ...config,
        rules: rules || [],
      };
      this.configForm.patchValue(formConfig);
    }

    this.workflowService.getModels().subscribe((models) => {
      this.models.set(models);
    });
  }
}
