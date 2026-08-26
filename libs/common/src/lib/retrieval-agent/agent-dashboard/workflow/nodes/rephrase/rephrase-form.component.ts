import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ARAGSchemas, NucliaDBDriver } from '@nuclia/core';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { map } from 'rxjs';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';
import { SynonymsFieldComponent } from '../../basic-elements/node-form/subcomponents';
import { aragUrl } from '../../workflow.state';
import { DriversService } from '../../../../drivers/drivers.service';
import { JSONSchema4Object } from 'json-schema';
import { ModelFieldComponent } from '../../basic-elements/node-form/subcomponents/model-field/model-field.component';

@Component({
  selector: 'app-rephrase-form',
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
    SynonymsFieldComponent,
    ModelFieldComponent,
  ],
  templateUrl: './rephrase-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RephraseFormComponent extends FormDirective implements OnInit {
  private destroyRef = inject(DestroyRef);
  private driversService = inject(DriversService);

  override form = new FormGroup({
    rephrase: new FormGroup({
      id: new FormControl('', { nonNullable: true }),
      kb: new FormControl('', { nonNullable: true }),
      extend: new FormControl(false),
      synonyms: new FormControl(false),
      provided_synonyms: new FormControl<{ [key: string]: string[] }>({}, Validators.required),
      history: new FormControl(false),
      userInfo: new FormControl(false),
      split_question: new FormControl(false),
      rules: new FormArray<FormControl<string>>([]),
      model: new FormGroup({
        model_id: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
        reasoning: new FormControl<'enabled' | 'disabled' | null>(null),
        advanced_reasoning: new FormGroup({
          budget_tokens: new FormControl<number | null>(null),
          reaseffortning: new FormControl<string | null>(null),
        }),
        _type: new FormControl<string>('llm_config', { nonNullable: true }),
      }),
      // TODO manage rids and labels
    }),
  });

  override get configForm() {
    return this.form.controls.rephrase;
  }

  schemas = input<ARAGSchemas | null>(null);
  formReady = output<FormGroup>();
  driversPath = computed(() => `${aragUrl()}/sources`);
  sourceOptions = signal<OptionModel[] | null>(null);

  ngOnInit() {
    this.driversService.drivers$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((drivers) =>
          (drivers.filter((d) => d.provider === 'nucliadb') as NucliaDBDriver[]).map(
            (driver) => new OptionModel({ id: driver.identifier, label: driver.name, value: driver.identifier }),
          ),
        ),
      )
      .subscribe((options) =>
        this.sourceOptions.set(
          [
            new OptionModel({
              id: '',
              label: '–',
              value: '',
            }),
          ].concat(options),
        ),
      );

    // Set default model
    const { schema } = this.buildFormFromSchema(this.schemas(), 'rephrase', 'preprocess');
    const defaultModel = (schema?.properties?.['model']?.default || {}) as JSONSchema4Object;
    this.configForm.controls.model.patchValue(defaultModel);
    this.formReady.emit(this.configForm);

    // Toggle validators for provided_synonyms based on synonyms switch
    const synonymsCtrl = this.configForm.controls.synonyms;
    const providedSynonymsCtrl = this.configForm.controls.provided_synonyms;

    const updateProvidedSynonymsValidation = (enabled: boolean) => {
      if (enabled) {
        providedSynonymsCtrl.addValidators(Validators.required);
      } else {
        providedSynonymsCtrl.clearValidators();
        providedSynonymsCtrl.setValue(undefined as any);
      }
      providedSynonymsCtrl.updateValueAndValidity({ emitEvent: false });
    };

    updateProvidedSynonymsValidation(!!synonymsCtrl.value);
    synonymsCtrl.valueChanges.subscribe((enabled) => updateProvidedSynonymsValidation(!!enabled));
  }
}
