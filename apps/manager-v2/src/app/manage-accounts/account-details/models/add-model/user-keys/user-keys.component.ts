import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { keyProviders } from '@flaps/common';
import {
  getLearningConfigPropType,
  getSubSchema,
  LearningConfigurationOption,
  LearningConfigurationProperty,
  LearningConfigurations,
  LearningConfigurationSchema,
} from '@nuclia/core';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmLabelImports } from '@nuclia/ui-spartan/label';
import { HlmRadioGroupImports } from '@nuclia/ui-spartan/radio-group';
import { HlmSwitchImports } from '@nuclia/ui-spartan/switch';
import { HlmTextareaImports } from '@nuclia/ui-spartan/textarea';

export type UserKeysForm = FormGroup<{
  enabled: FormControl<boolean>;
  user_keys: FormGroup<Record<string, AbstractControl>>;
}>;

export interface UserKeyField {
  id: string;
  control: FormControl;
  title: string;
  description: string;
  kind: 'boolean' | 'number' | 'enum' | 'textarea' | 'text';
  step: string;
  values: { value: string; label: string }[];
}

export interface UserKeyGroup {
  key: string;
  title?: string;
  fields: UserKeyField[];
}

@Component({
  selector: 'app-user-keys',
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    HlmFieldImports,
    HlmInputImports,
    HlmLabelImports,
    HlmRadioGroupImports,
    HlmSwitchImports,
    HlmTextareaImports,
  ],
  templateUrl: './user-keys.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserKeysComponent implements OnChanges {
  private destroyRef = inject(DestroyRef);

  learningConfigurations = input<LearningConfigurations>();
  generativeModel = input<LearningConfigurationOption>();
  formReady = output<UserKeysForm>();

  form: UserKeysForm = new FormGroup({
    enabled: new FormControl<boolean>(false, { nonNullable: true }),
    user_keys: new FormGroup({}),
  });
  groups = signal<UserKeyGroup[]>([]);
  enabled = signal(false);
  ready = false;

  get providerName() {
    const userKey = this.generativeModel()?.user_key || '';
    return keyProviders[userKey] || userKey;
  }

  constructor() {
    this.form.controls.enabled.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((enabled) => {
      this.enabled.set(enabled);
      this.updateValidators();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['learningConfigurations'] || changes['generativeModel']) {
      this.updateForm();
    }
  }

  private getSchema(): LearningConfigurationSchema | undefined {
    const userKey = this.generativeModel()?.user_key;
    return userKey ? this.learningConfigurations()?.['user_keys']?.schemas?.[userKey] : undefined;
  }

  private updateForm() {
    const schema = this.getSchema();
    if (!schema) return;

    const userKeysGroup = this.form.controls.user_keys;
    const groups: UserKeyGroup[] = [];
    Object.entries(schema.properties).forEach(([key, prop]) => {
      const subSchema = getSubSchema(schema, prop);
      if (subSchema?.properties) {
        let subForm = userKeysGroup.get(key) as FormGroup | null;
        if (!subForm) {
          subForm = new FormGroup({});
          userKeysGroup.addControl(key, subForm);
        }
        const group = subForm;
        const fields = Object.entries(subSchema.properties).map(([subKey, subProp]) => {
          if (!group.get(subKey)) {
            group.addControl(subKey, this.createControl(subProp));
          }
          return this.createField(`${key}-${subKey}`, group.get(subKey) as FormControl, schema, subProp, false);
        });
        groups.push({ key, title: prop.title, fields });
      } else {
        let control = userKeysGroup.get(key) as FormControl | null;
        if (!control) {
          control = new FormControl<string>(prop.default?.toString() || '');
          userKeysGroup.addControl(key, control);
        }
        const required = !!schema.required?.includes(key);
        groups.push({ key, fields: [this.createField(key, control, schema, prop, required)] });
      }
    });
    this.groups.set(groups);
    this.updateValidators();

    if (!this.ready) {
      this.ready = true;
      this.formReady.emit(this.form);
    }
  }

  private createControl(prop: LearningConfigurationProperty): FormControl {
    const type = getLearningConfigPropType(prop);
    if (type === 'boolean') {
      return new FormControl<boolean>(prop.default || false, { nonNullable: true });
    }
    if (type === 'number' || type === 'integer') {
      return new FormControl<number | null>(prop.default || prop.default === 0 ? prop.default : null);
    }
    return new FormControl<string>(prop.default?.toString() || '');
  }

  private createField(
    id: string,
    control: FormControl,
    schema: LearningConfigurationSchema,
    prop: LearningConfigurationProperty,
    required: boolean,
  ): UserKeyField {
    const type = getLearningConfigPropType(prop);
    const enumSchema = getSubSchema(schema, prop);
    const values = (enumSchema?.enum || []).map((value, index) => ({
      value: `${value}`,
      label: enumSchema?.titles?.[index] || `${value}`,
    }));
    let kind: UserKeyField['kind'] = 'text';
    if (values.length > 0) kind = 'enum';
    else if (type === 'boolean') kind = 'boolean';
    else if (type === 'number' || type === 'integer') kind = 'number';
    else if (prop.widget === 'textarea') kind = 'textarea';

    return {
      id: `user-key-${id}`,
      control,
      title: enumSchema?.enum ? enumSchema.title : prop.title,
      description: `${required ? 'Required field ' : ''}${prop.description || ''}`.trim(),
      kind,
      step: type === 'number' ? '0.01' : '1',
      values,
    };
  }

  private updateValidators() {
    const required = this.getSchema()?.required || [];
    const userKeysGroup = this.form.controls.user_keys;
    Object.keys(userKeysGroup.controls).forEach((key) => {
      const control = userKeysGroup.get(key);
      control?.setValidators(this.enabled() && required.includes(key) ? [Validators.required] : []);
      control?.markAsPristine();
      control?.updateValueAndValidity();
    });
  }
}
