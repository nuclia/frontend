import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ModalRef,
  OptionModel,
  PaButtonModule,
  PaDatePickerModule,
  PaExpanderModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { LabelsService } from '@flaps/core';
import { FIELD_TYPE, KVFieldType, TypeParagraph } from '@nuclia/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NerService } from '../../../../entities';
import { BehaviorSubject, combineLatest, defer, filter, map, merge, of, switchMap, take, tap } from 'rxjs';
import { AnyFilterExpression, FilterTarget } from '../filter-expression-modal.component';
import { KvSchemasService } from '../../../../knowledge-box-settings/kv-schemas/kv-schemas.service';

@Component({
  imports: [
    CommonModule,
    PaButtonModule,
    PaDatePickerModule,
    PaExpanderModule,
    PaModalModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './add-filter-modal.component.html',
  styleUrl: './add-filter-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFilterModalComponent {
  editMode = false;
  dataAugmentation = !!this.modal.config.data?.dataAugmentation;
  useKbData = !!this.modal.config.data?.useKbData;
  target = new BehaviorSubject<FilterTarget>('field');
  labelsets = this.target.pipe(
    switchMap((target) =>
      target === 'field' ? this.labelsService.resourceLabelSets : this.labelsService.textBlockLabelSets,
    ),
  );
  resourceSelection: 'id' | 'slug' = 'id';
  fieldTypes = [FIELD_TYPE.text, FIELD_TYPE.file, FIELD_TYPE.link, FIELD_TYPE.conversation, FIELD_TYPE.generic];
  mimeTypes = ['text', 'application', 'image', 'audio', 'video', 'message'];
  paragraphKinds: TypeParagraph[] = ['TEXT', 'OCR', 'INCEPTION', 'DESCRIPTION', 'TRANSCRIPT', 'TITLE', 'TABLE'];

  allFieldFilters = [
    'label',
    'entity',
    'language',
    'field',
    'resource',
    'keyword',
    'created',
    'modified',
    'resource_mimetype',
    'field_mimetype',
    'generated',
    'origin_tag',
    'origin_path',
    'origin_source',
    'origin_collaborator',
    'origin_metadata',
  ];
  dataAugmentationFieldFilters = ['label', 'field', 'resource', 'keyword', 'field_mimetype', 'generated'];
  fieldFilters = this.dataAugmentation ? this.dataAugmentationFieldFilters : this.allFieldFilters;

  paragraphFilters = ['label', 'kind'];

  keyValueFilters = ['key_value_eq', 'key_value_gte_lte', 'key_value_contains'];

  allowedFieldTypes: { [key: string]: string[] } = {
    key_value_eq: ['text', 'boolean', 'integer', 'float', 'date'],
    key_value_gte_lte: ['integer', 'float', 'date'],
  };

  prop = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });
  forms: { [key: string]: FormGroup } = {
    label: new FormGroup({
      labelset: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      label: new FormControl<string>('', { nonNullable: true }),
    }),
    entity: new FormGroup({
      subtype: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      value: new FormControl<string>('', { nonNullable: true }),
    }),
    language: new FormGroup({
      language: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      only_primary: new FormControl<boolean>(false),
    }),
    field: new FormGroup({
      type: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      name: new FormControl<string>('', { nonNullable: true }),
    }),
    resource: new FormGroup({
      id: new FormControl<string>('', { nonNullable: true }),
      slug: new FormControl<string>('', { nonNullable: true }),
    }),
    keyword: new FormGroup({
      word: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    }),
    created: new FormGroup({
      since: new FormControl<string>('', { nonNullable: true }),
      until: new FormControl<string>('', { nonNullable: true }),
    }),
    modified: new FormGroup({
      since: new FormControl<string>('', { nonNullable: true }),
      until: new FormControl<string>('', { nonNullable: true }),
    }),
    resource_mimetype: new FormGroup({
      type: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      subtype: new FormControl<string>('', { nonNullable: true }),
    }),
    field_mimetype: new FormGroup({
      type: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      subtype: new FormControl<string>('', { nonNullable: true }),
    }),
    generated: new FormGroup({
      by: new FormControl<string>('data-augmentation', { nonNullable: true, validators: [Validators.required] }),
      da_task: new FormControl<string>('', { nonNullable: true }),
    }),
    kind: new FormGroup({
      kind: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    }),
    origin_tag: new FormGroup({
      tag: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    }),
    origin_path: new FormGroup({
      prefix: new FormControl<string>('', { nonNullable: true }),
    }),
    origin_source: new FormGroup({
      id: new FormControl<string>('', { nonNullable: true }),
    }),
    origin_collaborator: new FormGroup({
      collaborator: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    }),
    origin_metadata: new FormGroup({
      field: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      value: new FormControl<string>('', { nonNullable: true }),
    }),
    key_value_eq: new FormGroup({
      schema_id: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      key: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      eq: new FormControl<string | number>('', { validators: [Validators.required] }),
    }),
    key_value_gte_lte: new FormGroup({
      schema_id: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      key: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      gte: new FormControl<string | number>('', { nonNullable: true }),
      lte: new FormControl<string | number>('', { nonNullable: true }),
    }),
    key_value_contains: new FormGroup({
      schema_id: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      key: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      contains: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    }),
  };

  familyOptions = this.nerService.entities.pipe(
    filter((entities) => !!entities),
    map((entities) =>
      this.nerService
        .getNerFamilyWithTitles(entities)
        .map((family) => new OptionModel({ id: family.key, value: family.key, label: family.title })),
    ),
  );
  nerOptions = merge(
    this.forms['entity'].controls['subtype'].valueChanges,
    defer(() => of(this.selectedNerFamily)),
  ).pipe(
    filter((family) => family),
    switchMap((family) => this.nerService.getEntities(family)),
    map((entities) =>
      Object.entries(entities.entities).map(([key]) => new OptionModel({ id: key, value: key, label: key })),
    ),
  );

  kvSchemas = this.kvSchemaService.schemas$;
  selectedProp$ = merge(
    defer(() => of(this.prop.value)),
    this.prop.valueChanges,
  );
  selectedSchema$ = this.selectedProp$.pipe(
    switchMap((prop) =>
      merge(
        defer(() => of(this.selectedSchema)),
        this.forms[prop].controls['schema_id'].valueChanges,
      ),
    ),
  );
  selectedSchemaKey$ = this.selectedProp$.pipe(
    switchMap((prop) =>
      merge(
        defer(() => of(this.selectedSchemaKey)),
        this.forms[prop].controls['key'].valueChanges,
      ),
    ),
  );
  schemaKeyOptions = this.selectedSchema$.pipe(
    filter((schema) => schema),
    switchMap((schema) =>
      this.kvSchemas.pipe(
        take(1),
        map((schemas) =>
          (schemas.find((s) => s.id === schema)?.fields || [])
            .filter((field) => {
              if (this.prop.value === 'key_value_contains') {
                return field.range || field.repeated;
              }
              return this.allowedFieldTypes[this.prop.value]?.includes(field.type) && !field.range && !field.repeated;
            })
            .map(
              (field) => new OptionModel({ id: field.key, value: field.key, label: `${field.key} (${field.type})` }),
            ),
        ),
      ),
    ),
  );
  schemaField = combineLatest([this.selectedSchemaKey$, this.kvSchemas]).pipe(
    map(([key, schemas]) =>
      (schemas.find((s) => s.id === this.selectedSchema)?.fields || []).find((field) => field.key === key),
    ),
    tap((field) => (this.schemaFieldType = field?.type)),
  );
  schemaFieldType?: KVFieldType;

  get selectedLabelset() {
    return this.forms['label'].controls['labelset'].value;
  }

  get selectedNerFamily() {
    return this.forms['entity'].controls['subtype'].value;
  }

  get selectedSchema() {
    return this.forms[this.prop.value].controls['schema_id'].value;
  }
  get selectedSchemaKey() {
    return this.forms[this.prop.value].controls['key'].value;
  }

  get invalid() {
    return this.prop.invalid || this.forms[this.prop.value]?.invalid;
  }

  constructor(
    public modal: ModalRef<
      { expression: AnyFilterExpression; target: FilterTarget; dataAugmentation: boolean; useKbData: boolean },
      AnyFilterExpression
    >,
    private labelsService: LabelsService,
    private nerService: NerService,
    private kvSchemaService: KvSchemasService,
  ) {
    this.target.next(this.modal.config.data?.target || 'field');
    const expression = this.modal.config.data?.expression;
    if (expression) {
      this.editMode = true;
      if ('and' in expression || 'or' in expression || 'not' in expression) {
        this.prop.patchValue(Object.keys(expression)[0]);
      } else {
        this.resourceSelection = expression.prop === 'resource' && !!expression.slug ? 'slug' : 'id';
        this.prop.patchValue(expression.prop);
        this.forms[expression.prop].patchValue(expression);

        // Edge case: pastanaga inputs do not support boolean values
        if ('eq' in expression && typeof expression.eq === 'boolean') {
          this.forms['key_value_eq'].controls['eq'].patchValue(expression.eq ? 'true' : 'false');
        }
      }
    }
  }

  resetLabel() {
    this.forms['label'].controls['label'].reset();
  }

  resetNer() {
    this.forms['entity'].controls['value'].reset();
  }

  resetKey() {
    this.forms[this.prop.value].controls['key'].reset();
  }

  resetValue(key: string) {
    this.forms[this.prop.value].reset({ schema_id: this.selectedSchema, key });
  }

  submit() {
    let expression: AnyFilterExpression;
    switch (this.prop.value) {
      case 'and':
        expression = { and: [] };
        break;
      case 'or':
        expression = { or: [] };
        break;
      case 'not':
        expression = { not: undefined };
        break;
      default: {
        const filterParams = Object.fromEntries(
          Object.entries(this.forms[this.prop.value].value)
            .filter(([, value]) => value !== '')
            .map(([key, value]) =>
              // Edge case: boolean values should be converted to real booleans
              key === 'eq' && this.schemaFieldType === 'boolean' ? [key, value === 'true'] : [key, value],
            ),
        ) as any;
        expression = {
          prop: this.prop.value,
          ...filterParams,
        };
      }
    }
    this.modal.close(expression);
  }
}
