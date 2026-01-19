import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { NucliaDBDriver } from '@nuclia/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { map, Observable, switchMap, take } from 'rxjs';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';
import { SynonymsFieldComponent } from '../../basic-elements/node-form/subcomponents';
import { ModelSelectComponent } from '../../basic-elements/node-form/subcomponents/model-select';
import { aragUrl } from '../../workflow.state';
import { JSONSchema4 } from 'json-schema';

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
    forwardRef(() => ModelSelectComponent), // Avoid circular dependency
  ],
  templateUrl: './rephrase-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RephraseFormComponent extends FormDirective implements OnInit {
  private sdk = inject(SDKService);

  override form = new FormGroup({
    rephrase: new FormGroup({
      kb: new FormControl('', { nonNullable: true }),
      extend: new FormControl(false),
      synonyms: new FormControl(false),
      provided_synonyms: new FormControl<{ [key: string]: string[] }>({}, Validators.required),
      history: new FormControl(false),
      userInfo: new FormControl(false),
      split_question: new FormControl(false),
      rules: new FormArray<FormControl<string>>([]),
      model: new FormControl<string>('', { nonNullable: true }),
      // TODO manage rids and labels
    }),
  });

  override get configForm() {
    return this.form.controls.rephrase;
  }

  schemas = input<JSONSchema4 | null>(null);
  formReady = output<FormGroup>();
  driversPath = computed(() => `${aragUrl()}/drivers`);
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
    const { schema } = this.buildFormFromSchema(this.schemas(), 'rephrase');
    const defaultModel = schema?.properties?.['model']?.default as string | undefined;
    this.configForm.controls.model.patchValue(defaultModel || '');
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
