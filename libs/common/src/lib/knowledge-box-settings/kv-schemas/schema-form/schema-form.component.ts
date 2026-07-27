import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KVFieldType, KVSchema, KVSchemaField } from '@nuclia/core';
import { KvSchemasService } from '../kv-schemas.service';
import { KV_SCHEMA_FORM_CONFIG, KvSchemaFormColumn } from '../kv-schemas.config';

function uniqueKeysValidator(control: AbstractControl): ValidationErrors | null {
  const arr = control as FormArray;
  const keys = arr.controls.map((c) => c.get('key')?.value as string).filter(Boolean);
  const hasDupes = keys.length !== new Set(keys).size;
  return hasDupes ? { uniqueKeys: true } : null;
}

@Component({
  selector: 'app-schema-form',
  standalone: false,
  templateUrl: './schema-form.component.html',
  styleUrl: './schema-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaFormComponent {
  private kvService = inject(KvSchemasService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  schema = input<KVSchema | undefined>();
  mode = input<'inline' | 'modal'>('inline');
  saved = output<void>();
  cancelled = output<void>();
  readonly config = KV_SCHEMA_FORM_CONFIG;

  form = new FormGroup({
    id: new FormControl('', [Validators.required, Validators.pattern(this.config.identifierPattern)]),
    description: new FormControl(''),
    fields: new FormArray<FormGroup>([], [uniqueKeysValidator]),
  });

  isEditMode = computed(() => !!this.schema());

  errorMessages = {
    pattern: 'kb.kv-schemas.form.invalid-id',
  };

  constructor() {
    effect(() => {
      const s = this.schema();
      if (s) {
        this.form.get('id')!.disable();
        this.form.patchValue({ id: s.id, description: s.description ?? '' });
        this.fieldsArray.clear();
        s.fields.forEach((f) => this.fieldsArray.push(this.buildFieldGroup(f)));
        // markForCheck not needed — effects already schedule change detection
      }
    });
  }

  get fieldsArray(): FormArray<FormGroup> {
    return this.form.get('fields') as FormArray<FormGroup>;
  }

  getFieldType(index: number): KVFieldType {
    return this.fieldsArray.at(index)?.get('type')?.value as KVFieldType;
  }

  addField() {
    this.fieldsArray.push(this.buildFieldGroup());
  }

  removeField(index: number) {
    this.fieldsArray.removeAt(index);
  }

  buildFieldGroup(field?: KVSchemaField): FormGroup {
    return new FormGroup({
      key: new FormControl(field?.key ?? '', [
        Validators.required,
        Validators.pattern(this.config.fieldIdentifierPattern),
      ]),
      type: new FormControl<KVFieldType>(field?.type ?? this.config.defaultFieldType, Validators.required),
      description: new FormControl(field?.description ?? ''),
      required: new FormControl(field?.required ?? true),
      range: new FormControl(field?.range ?? false),
      repeated: new FormControl(field?.repeated ?? false),
    });
  }

  submit() {
    if (this.form.invalid || this.fieldsArray.length === 0) {
      return;
    }

    const fields: KVSchemaField[] = this.fieldsArray.controls.map((g) => {
      const type = g.get('type')!.value as KVFieldType;
      const rangeAllowed = this.isRangeEnabled(type);
      const repeatedAllowed = this.isRepeatedEnabled(type);
      return {
        key: g.get('key')!.value as string,
        type,
        description: g.get('description')!.value as string,
        required: g.get('required')!.value as boolean,
        range: rangeAllowed ? (g.get('range')!.value as boolean) : false,
        repeated: repeatedAllowed ? (g.get('repeated')!.value as boolean) : false,
      };
    });

    const s = this.schema();
    if (s) {
      this.kvService
        .updateSchema(s.id, {
          description: this.form.get('description')!.value ?? '',
          fields,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.cdr.markForCheck();
          this.saved.emit();
        });
    } else {
      this.kvService
        .createSchema({
          id: this.form.get('id')!.value as string,
          description: this.form.get('description')!.value ?? '',
          fields,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.form.reset({ id: '', description: '', fields: [] });
          this.fieldsArray.clear();
          this.cdr.markForCheck();
          this.saved.emit();
        });
    }
  }

  isCenteredColumn(column: KvSchemaFormColumn): boolean {
    return this.config.centeredColumns.some((centeredColumn) => centeredColumn === column);
  }

  isRangeEnabled(type: KVFieldType): boolean {
    return this.config.rangeEnabledTypes.some((enabledType) => enabledType === type);
  }

  isRepeatedEnabled(type: KVFieldType): boolean {
    return this.config.repeatedEnabledTypes.some((enabledType) => enabledType === type);
  }
}
