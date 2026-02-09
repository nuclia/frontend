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
import { FIELD_TYPE, TypeParagraph } from '@nuclia/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NerService } from '../../../../entities';
import { BehaviorSubject, defer, filter, map, merge, of, switchMap } from 'rxjs';
import { AnyFilterExpression, FilterTarget } from '../filter-expression-modal.component';

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

  get selectedLabelset() {
    return this.forms['label'].controls['labelset'].value;
  }

  get selectedNerFamily() {
    return this.forms['entity'].controls['subtype'].value;
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
      }
    }
  }

  resetLabel() {
    this.forms['label'].controls['label'].reset();
  }

  resetNer() {
    this.forms['entity'].controls['value'].reset();
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
      default:
        const filterParams = Object.fromEntries(
          Object.entries(this.forms[this.prop.value].value).filter(([, value]) => !!value),
        ) as any;
        expression = {
          prop: this.prop.value,
          ...filterParams,
        };
    }
    this.modal.close(expression);
  }
}
