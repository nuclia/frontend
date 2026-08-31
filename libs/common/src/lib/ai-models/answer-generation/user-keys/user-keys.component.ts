import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EventEmitter,
  input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeaturesService, UnauthorizedFeatureDirective } from '@flaps/core';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  getLearningConfigPropType,
  getSubSchema,
  LearningConfigurationSchema,
  type LearningConfigurationOption,
  type LearningConfigurationProperty,
  type LearningConfigurations,
} from '@nuclia/core';
import { ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { Subject, takeUntil } from 'rxjs';
import { isGeminiPriorityModel, keyProviders, stripGeminiPrioritySuffix } from '../../ai-models.utils';

export type UserKeysForm = FormGroup<{
  enabled: FormControl<boolean>;
  user_keys: FormGroup<{ [key: string]: any }>;
}>;

type UserKeyProperty = LearningConfigurationProperty & {
  isSubForm?: boolean;
  properties?: { key: string; value: LearningConfigurationProperty }[];
};

interface UserKeysProperties {
  [key: string]: UserKeyProperty;
}

@Component({
  selector: 'stf-user-keys',
  imports: [
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    UnauthorizedFeatureDirective,
    ExpandableTextareaComponent,
    InfoCardComponent,
  ],
  templateUrl: './user-keys.component.html',
  styleUrls: ['./user-keys.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserKeysComponent implements OnChanges, OnDestroy {
  keyProviders = keyProviders;
  modelsRequiringUserKey = ['huggingface'];
  ready = false;

  learningConfigurations = input<LearningConfigurations>();
  generativeModel = input<LearningConfigurationOption>();
  // Priority (Pay-Go) toggle is only offered on the account-level model configuration page.
  showPriorityToggle = input<boolean>(false);
  // The backend doesn't support changing the model on an existing config, so disable the priority toggle when editing.
  editMode = input<boolean>(false);
  @Output() formReady = new EventEmitter<UserKeysForm>();
  // Emits the new generative_model value to select when Priority is toggled.
  @Output() priorityModelChange = new EventEmitter<string>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['learningConfigurations'] || changes['generativeModel']) {
      this.updateForm();
    }
  }

  form: UserKeysForm = new FormGroup({
    enabled: new FormControl<boolean>(false, { nonNullable: true }),
    user_keys: new FormGroup({}),
  });

  required = this.translate.instant('kb.ai-models.common.required');
  unsubscribeAll = new Subject<void>();

  get userKeysToggle() {
    return this.form.controls.enabled;
  }
  get hasOwnKey() {
    return !!this.userKeysToggle.value;
  }
  get userKeysGroup() {
    return this.form.controls.user_keys;
  }
  userKeys = computed(() => {
    const generativeModel = this.generativeModel();
    return generativeModel?.user_key
      ? this.learningConfigurations()?.['user_keys'].schemas?.[generativeModel.user_key]
      : undefined;
  });
  userKeysProperties = computed<UserKeysProperties>(() => {
    const userKeys = this.userKeys();
    return Object.entries(userKeys?.properties || {}).reduce((acc, [key, prop]) => {
      // Priority models don't support a plain Gemini API key.
      if (this.isPriorityModel() && key === 'gemini_key') return acc;
      if (userKeys) acc[key] = this.getUserKeysProperty(userKeys, prop);
      return acc;
    }, {} as UserKeysProperties);
  });
  isPriorityModel = computed(() => isGeminiPriorityModel(this.generativeModel()?.value));
  baseModelValue = computed(() => stripGeminiPrioritySuffix(this.generativeModel()?.value));
  priorityModelValue = computed(() => `${this.baseModelValue()}-priority`);
  // Priority only applies to Gemini models used with the user's own key.
  hasPriorityVariant = computed(
    () =>
      this.generativeModel()?.provider === 'google' &&
      !!(this.learningConfigurations()?.['generative_model']?.options || []).find(
        (option) => option.value === this.priorityModelValue(),
      ),
  );

  togglePriority(enabled: boolean) {
    this.form.markAsDirty();
    this.priorityModelChange.emit(enabled ? this.priorityModelValue() : this.baseModelValue() || '');
  }

  get userKeysPropertiesEntries() {
    return Object.entries(this.userKeysProperties()).map(([key, value]) => ({
      key,
      value,
    }));
  }

  constructor(
    private translate: TranslateService,
    private features: FeaturesService,
  ) {
    this.userKeysToggle.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.updateValidators();
    });

    effect(() => {
      const shouldDisable = this.editMode() && this.isPriorityModel();
      if (shouldDisable) this.userKeysToggle.disable({ emitEvent: false });
      else this.userKeysToggle.enable({ emitEvent: false });
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  onOwnKeyToggle() {
    this.form.markAsDirty();
    // Priority only applies when using your own key, so revert to the base model when it's disabled.
    if (!this.hasOwnKey && this.isPriorityModel()) {
      this.priorityModelChange.emit(this.baseModelValue() || '');
    }
  }

  // Distinguishes a Priority toggle (keep field values) from a genuine model switch (reset them).
  private previousModelValue?: string;

  updateForm() {
    const learningConfigurations = this.learningConfigurations();
    const generativeModel = this.generativeModel();
    if (!learningConfigurations || !generativeModel) return;

    const isPriorityToggleOnly =
      !!this.previousModelValue &&
      stripGeminiPrioritySuffix(this.previousModelValue) === stripGeminiPrioritySuffix(generativeModel.value);
    this.previousModelValue = generativeModel.value;

    if (generativeModel.user_key) {
      // add user_keys controls corresponding to generative model if any
      const userKeysConfig = learningConfigurations['user_keys'].schemas?.[generativeModel.user_key];
      const newUserKeys = Object.keys(userKeysConfig?.properties || {});
      if (!isPriorityToggleOnly) {
        Object.keys(this.userKeysGroup.controls).forEach((oldKey) => {
          if (newUserKeys.includes(oldKey)) {
            // clean up value from previous fields
            this.userKeysGroup.get(oldKey)?.patchValue('');
          } else {
            // remove unused control
            this.userKeysGroup.removeControl(oldKey);
          }
        });
      }
      newUserKeys.forEach((key) => {
        if (!this.userKeysGroup.get(key)) {
          const subSchema = userKeysConfig && getSubSchema(userKeysConfig, userKeysConfig?.properties?.[key]);
          if (subSchema?.properties) {
            const subForm = new FormGroup({});
            Object.entries(subSchema.properties).forEach(([subKey, prop]) => {
              const subKeyType = getLearningConfigPropType(prop);
              if (subKeyType === 'boolean') {
                subForm.addControl(subKey, new FormControl<boolean>(prop.default || false, { nonNullable: true }));
              } else if (subKeyType === 'number' || subKeyType === 'integer') {
                subForm.addControl(
                  subKey,
                  new FormControl<number>(prop.default || prop.default === 0 ? prop.default : null),
                );
              } else {
                subForm.addControl(subKey, new FormControl<string>(prop.default?.toString() || ''));
              }
            });
            this.userKeysGroup.addControl(key, subForm);
          } else {
            const defaultValue = userKeysConfig?.properties?.[key]?.default?.toString() || '';
            this.userKeysGroup.addControl(key, new FormControl<string>(defaultValue));
          }
        }
      });
      this.updateValidators();
      // Priority models require Vertex AI credentials, not a plain Gemini API key.
      const geminiKeyControl = this.userKeysGroup.get('gemini_key');
      if (geminiKeyControl) {
        if (this.isPriorityModel()) {
          geminiKeyControl.patchValue('');
          geminiKeyControl.disable();
        } else {
          geminiKeyControl.enable();
        }
      }
    }
    if (!isPriorityToggleOnly) {
      this.userKeysToggle.patchValue(this.modelsRequiringUserKey.includes(generativeModel.value || ''));
    }
    if (!this.ready) {
      this.ready = true;
      this.formReady.emit(this.form);
    }
  }

  updateValidators() {
    const learningConfigurations = this.learningConfigurations();
    const generativeModel = this.generativeModel();
    if (!learningConfigurations || !generativeModel) return;

    const required = learningConfigurations['user_keys'].schemas?.[generativeModel.user_key || '']?.required || [];
    Object.keys(this.userKeysGroup.controls).forEach((key) => {
      this.userKeysGroup.get(key)?.setValidators(this.hasOwnKey && required.includes(key) ? [Validators.required] : []);
      this.userKeysGroup.get(key)?.markAsPristine();
      this.userKeysGroup.get(key)?.updateValueAndValidity();
    });
  }

  getUserKeysProperty(schema: LearningConfigurationSchema, prop: LearningConfigurationProperty): UserKeyProperty {
    const subSchema = getSubSchema(schema, prop);
    if (subSchema) {
      if (subSchema.properties) {
        return {
          ...prop,
          isSubForm: true,
          properties: Object.entries(subSchema.properties).map(([subKey, subProp]) => {
            return { key: subKey, value: this.getUserKeysProperty(schema, subProp) };
          }),
        };
      } else if (subSchema.enum) {
        return {
          ...prop,
          title: subSchema.title,
          values: subSchema.enum.map((value, index) => ({
            value: `${value}`,
            label: subSchema.titles?.[index] || `${value}`,
          })),
        };
      }
    }
    return { ...prop, type: getLearningConfigPropType(prop) };
  }
}
