import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, take, takeUntil } from 'rxjs';
import {
  getLearningConfigPropType,
  getSubSchema,
  type LearningConfigurationOption,
  type LearningConfigurations,
  type LearningConfigurationProperty,
} from '@nuclia/core';
import { FeaturesService, UnauthorizedFeatureDirective } from '@flaps/core';
import { keyProviders } from '../../ai-models.utils';

export type UserKeysForm = FormGroup<{
  enabled: FormControl<boolean>;
  user_keys: FormGroup<{ [key: string]: any }>;
}>;

interface UserKeysProperties {
  [key: string]: LearningConfigurationProperty & {
    isSubForm?: boolean;
    properties?: { key: string; value: LearningConfigurationProperty }[];
  };
}
@Component({
  selector: 'stf-user-keys',
  imports: [
    CommonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    UnauthorizedFeatureDirective,
  ],
  templateUrl: './user-keys.component.html',
  styleUrls: ['./user-keys.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserKeysComponent implements OnChanges, OnDestroy {
  keyProviders = keyProviders;
  modelsRequiringUserKey = ['huggingface'];
  ready = false;

  @Input() learningConfigurations?: LearningConfigurations;
  @Input() generativeModel?: LearningConfigurationOption;
  @Output() formReady = new EventEmitter<UserKeysForm>();

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
  isUserPromptsAuthorized = this.features.authorized.userPrompts;
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
  get userKeys() {
    return this.learningConfigurations && this.generativeModel?.user_key
      ? this.learningConfigurations['user_keys'].schemas?.[this.generativeModel.user_key]
      : undefined;
  }
  get userKeysProperties(): UserKeysProperties {
    return Object.entries(this.userKeys?.properties || {}).reduce((acc, [key, prop]) => {
      const subSchema = this.userKeys && getSubSchema(this.userKeys, this.userKeys?.properties?.[key]);
      if (subSchema) {
        if (subSchema.properties) {
          acc[key] = {
            ...prop,
            isSubForm: true,
            properties: Object.entries(subSchema.properties).map(([subKey, subProp]) => ({
              key: subKey,
              value: { ...subProp, type: getLearningConfigPropType(subProp) },
            })),
          };
        } else if (subSchema.enum) {
          acc[key] = {
            ...prop,
            title: subSchema.title,
            values: subSchema.enum.map((value, index) => ({
              value: `${value}`,
              label: subSchema.titles?.[index] || `${value}`,
            })),
          };
        }
      } else {
        acc[key] = prop;
      }
      return acc;
    }, {} as UserKeysProperties);
  }

  get userKeysPropertiesEntries() {
    return Object.entries(this.userKeysProperties).map(([key, value]) => ({
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
    this.isUserPromptsAuthorized.pipe(take(1)).subscribe((authorized) => {
      if (!authorized) {
        this.form.disable();
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  onOwnKeyToggle() {
    this.form.markAsDirty();
  }

  updateForm() {
    if (!this.learningConfigurations || !this.generativeModel) {
      return;
    }
    if (this.generativeModel.user_key) {
      // add user_keys controls corresponding to generative model if any
      const userKeysConfig = this.learningConfigurations['user_keys'].schemas?.[this.generativeModel.user_key];
      const newUserKeys = Object.keys(userKeysConfig?.properties || {});
      Object.keys(this.userKeysGroup.controls).forEach((oldKey) => {
        if (newUserKeys.includes(oldKey)) {
          // clean up value from previous fields
          this.userKeysGroup.get(oldKey)?.patchValue('');
        } else {
          // remove unused control
          this.userKeysGroup.removeControl(oldKey);
        }
      });
      newUserKeys.forEach((key) => {
        if (!this.userKeysGroup.get(key)) {
          const subSchema = userKeysConfig && getSubSchema(userKeysConfig, userKeysConfig?.properties?.[key]);
          if (subSchema && subSchema.properties) {
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
                subForm.addControl(subKey, new FormControl<string>(prop.default || ''));
              }
            });
            this.userKeysGroup.addControl(key, subForm);
          } else {
            this.userKeysGroup.addControl(key, new FormControl<string>(''));
          }
        }
      });
      this.updateValidators();
    }
    this.userKeysToggle.patchValue(this.modelsRequiringUserKey.includes(this.generativeModel?.value || ''));
    if (!this.ready) {
      this.ready = true;
      this.formReady.emit(this.form);
    }
  }

  updateValidators() {
    if (!this.learningConfigurations || !this.generativeModel) {
      return;
    }
    const required =
      this.learningConfigurations['user_keys'].schemas?.[this.generativeModel.user_key || '']?.required || [];
    Object.keys(this.userKeysGroup.controls).forEach((key) => {
      this.userKeysGroup.get(key)?.setValidators(this.hasOwnKey && required.includes(key) ? [Validators.required] : []);
      this.userKeysGroup.get(key)?.markAsPristine();
      this.userKeysGroup.get(key)?.updateValueAndValidity();
    });
  }
}
