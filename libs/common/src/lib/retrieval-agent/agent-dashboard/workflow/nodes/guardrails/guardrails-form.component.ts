
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GuardrailsPreconfig, GuardrailsProviderType } from '@nuclia/core';
import { ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { map, switchMap, take } from 'rxjs';
import { JsonValidator } from '../../../../../validators';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';
import { GuardrailsAgentUI } from '../../workflow.models';
import { aragUrl } from '../../workflow.state';

@Component({
  selector: 'app-guardrails-form',
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ConfigurationFormComponent,
    RulesFieldComponent,
    InfoCardComponent,
    RouterLink,
    ExpandableTextareaComponent
],
  templateUrl: './guardrails-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuardrailsFormComponent extends FormDirective implements OnInit {
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);

  override form = new FormGroup({
    guardrails: new FormGroup({
      rules: new FormArray<FormControl<string>>([]),
      provider: new FormControl<GuardrailsProviderType>('alinia', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      alinia: new FormGroup({
        preconfig: new FormControl<GuardrailsPreconfig | ''>('', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        detection_config: new FormControl<string | null>(null, { validators: [JsonValidator()] }),
      }),
    }),
  });
  override get configForm() {
    return this.form.controls.guardrails;
  }

  get provider() {
    return this.configForm.controls.provider.getRawValue();
  }
  get preconfigValue() {
    return this.configForm.controls.alinia.controls.preconfig.value;
  }
  get customConfigControl() {
    return this.configForm.controls.alinia.controls.detection_config;
  }

  driversPath = computed(() => `${aragUrl()}/drivers`);
  providerOptions = signal<OptionModel[] | null>(null);

  preconfigOptions = signal<OptionModel[]>([]);

  ngOnInit(): void {
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => arag.getDrivers('alinia')),
        map((drivers) =>
          drivers.map(
            (driver) =>
              new OptionModel({
                id: driver.identifier,
                label: driver.name,
                value: driver.identifier,
                help: driver.provider,
              }),
          ),
        ),
      )
      .subscribe((options) => this.providerOptions.set(options));

    if (this.config) {
      const config = this.config as GuardrailsAgentUI;
      if (config.alinia.preconfig === 'CUSTOM') {
        this.customConfigControl.patchValue(JSON.stringify(config.alinia.detection_config));
      }
    }
    this.initPreconfigOptions();
  }

  private initPreconfigOptions() {
    const preconfigList: GuardrailsPreconfig[] = ['INAPPROPRIATE', 'CUSTOM'];
    if (this.category() === 'postprocess') {
      preconfigList.splice(1, 0, ...(['COMPLIANCE', 'FINANCIAL_COMPLIANT'] as GuardrailsPreconfig[]));
    }
    this.preconfigOptions.set(
      preconfigList.map(
        (preconfig) =>
          new OptionModel({
            id: preconfig,
            value: preconfig,
            label: this.translate.instant(
              `retrieval-agents.workflow.node-types.guardrails.form.preconfig.${preconfig}`,
            ),
          }),
      ),
    );
  }

  updateValidators() {
    if (this.preconfigValue === 'CUSTOM') {
      this.customConfigControl.addValidators(Validators.required);
    } else {
      this.customConfigControl.removeValidators(Validators.required);
    }
    this.customConfigControl.updateValueAndValidity();
  }

  override submit(): void {
    if (this.form.valid) {
      const category = this.category();
      if (category === 'preprocess' || category === 'postprocess') {
        const { alinia, ...rawConfig } = this.configForm.getRawValue();
        const preconfig = alinia.preconfig as GuardrailsPreconfig;
        const config: GuardrailsAgentUI = {
          ...rawConfig,
          category,
          alinia: {
            preconfig: alinia.preconfig as GuardrailsPreconfig,
            detection_config:
              preconfig === 'CUSTOM' && alinia.detection_config ? JSON.parse(alinia.detection_config) : null,
            metadata: null,
          },
        };
        this.submitForm.emit(config);
      }
    }
  }
}
