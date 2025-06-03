import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { NucliaDBDriver } from '@nuclia/core';
import { ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { map, Observable, switchMap, take } from 'rxjs';
import { getListFromTextarea } from '../../../../arag.utils';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';
import { AskAgentUI } from '../../workflow.models';
import { aragUrl } from '../../workflow.state';

@Component({
  selector: 'app-ask-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    InfoCardComponent,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ConfigurationFormComponent,
    ExpandableTextareaComponent,
    RulesFieldComponent,
  ],
  templateUrl: './ask-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskFormComponent extends FormDirective implements OnInit {
  private sdk = inject(SDKService);

  override form = new FormGroup({
    ask: new FormGroup({
      sources: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      rephrase_semantic_custom_prompt: new FormControl<string>('', { nonNullable: true }),
      rephrase_lexical_custom_prompt: new FormControl<string>('', { nonNullable: true }),
      keywords_custom_prompt: new FormControl<string>('', { nonNullable: true }),
      visual_enable_prompt: new FormControl<string>('', { nonNullable: true }),
      extra_fields: new FormControl<string>('', { nonNullable: true }),
      filters: new FormControl<string>('', { nonNullable: true }),
      security_groups: new FormControl<string>('', { nonNullable: true }),
      full_resource: new FormControl<boolean>(false, { nonNullable: true }),
      vllm: new FormControl<boolean>(true, { nonNullable: true }),
      before: new FormControl<number>(2, { nonNullable: true }),
      after: new FormControl<number>(2, { nonNullable: true }),
      rules: new FormArray<FormControl<string>>([]),
    }),
  });
  override get configForm() {
    return this.form.controls.ask;
  }

  get vllmEnabled() {
    return this.configForm.controls.vllm.value;
  }

  aragUrl = aragUrl;
  driversPath = computed(() => `${this.aragUrl()}/drivers`);
  sourceOptions = signal<OptionModel[] | null>(null);

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
      const { extra_fields, security_groups, filters, rules, ...config } = this.config as AskAgentUI;
      const formConfig = {
        ...config,
        extra_fields: (extra_fields || []).join('\n'),
        security_groups: (security_groups || []).join('\n'),
        filters: (filters || []).join('\n'),
        rules: rules || [],
      };
      this.configForm.patchValue(formConfig);
    }
  }

  override submit(): void {
    if (this.form.valid) {
      const { extra_fields, visual_enable_prompt, security_groups, filters, ...rawConfig } =
        this.configForm.getRawValue();
      const config: AskAgentUI = {
        ...rawConfig,
        visual_enable_prompt: rawConfig.vllm ? visual_enable_prompt : undefined,
        extra_fields: getListFromTextarea(extra_fields),
        filters: getListFromTextarea(filters),
        security_groups: getListFromTextarea(security_groups),
      };
      this.submitForm.emit(config);
    }
  }
}
