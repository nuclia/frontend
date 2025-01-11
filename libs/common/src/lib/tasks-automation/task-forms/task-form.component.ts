import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DropdownButtonComponent,
  InfoCardComponent,
  SisToastService,
  StickyFooterComponent,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import {
  OptionModel,
  PaButtonModule,
  PaDropdownModule,
  PaExpanderModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LabelModule, LabelsService, ParametersTableComponent, SDKService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  ApplyOption,
  Classification,
  FIELD_TYPE,
  LearningConfigurationOption,
  LLMConfig,
  longToShortFieldType,
  Search,
  TaskFullDefinition,
  TaskName,
  TaskTrigger,
} from '@nuclia/core';
import { BehaviorSubject, combineLatest, filter, map, Subject, switchMap, tap } from 'rxjs';
import { debounceTime, take, takeUntil } from 'rxjs/operators';
import { TasksAutomationService } from '../tasks-automation.service';
import { removeDeprecatedModels } from '../../ai-models/ai-models.utils';

export interface TaskFormCommonConfig {
  name: string;
  applyTaskTo: ApplyOption;
  filter: {
    //searchIn: 'titleOrContent' | 'title' | 'content';
    contains: string[];
    field_types: string[];
  };
  llm: LLMConfig;
  webhook?: TaskTrigger;
}

@Component({
  selector: 'app-task-form',
  imports: [
    CommonModule,
    DropdownButtonComponent,
    InfoCardComponent,
    LabelModule,
    PaDropdownModule,
    PaExpanderModule,
    ParametersTableComponent,
    PaTextFieldModule,
    PaTogglesModule,
    PaTooltipModule,
    ReactiveFormsModule,
    TwoColumnsConfigurationItemComponent,
    TranslateModule,
    PaTableModule,
    PaButtonModule,
    StickyFooterComponent,
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent implements OnInit, OnDestroy {
  private labelService = inject(LabelsService);
  private toaster = inject(SisToastService);
  private sdk = inject(SDKService);
  private cdr = inject(ChangeDetectorRef);
  private tasksAutomation = inject(TasksAutomationService);

  private unsubscribeAll = new Subject<void>();

  // Task type
  @Input() type: TaskName = 'labeler';
  // Text displayed in the info card below Trigger label on the right column
  @Input() triggerDescription = '';
  // Label displayed on the submit button
  @Input() activateButtonLabel = '';
  // Note displayed on the footer when task is applied automatically
  @Input() footerNoteAutomation = '';
  // Note displayed on the footer when task is applied once
  @Input() footerNoteOneTime = '';
  // Flag indicating if the form inside ng-content is valid
  @Input({ transform: booleanAttribute }) validFormInside = false;
  // Flag indicating if the model selection is hidden
  @Input({ transform: booleanAttribute }) modelsHidden = false;

  @Output() cancel = new EventEmitter<void>();
  @Output() activate = new EventEmitter<TaskFormCommonConfig>();

  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    applyTaskTo: new FormControl<ApplyOption>('NEW', { nonNullable: true }),
    filter: new FormGroup({
      //searchIn: new FormControl<'titleOrContent' | 'title' | 'content'>('titleOrContent', { nonNullable: true }),
      contains: new FormControl<string>('', { nonNullable: true }),
    }),
    llm: new FormGroup({
      model: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    }),
    webhook: new FormGroup({
      url: new FormControl<string>('', { nonNullable: true }),
    }),
  });
  headers: { key: string; value: string }[] = [];
  parameters: { key: string; value: string }[] = [];

  selectedFilters = new BehaviorSubject<string[]>([]);

  get applyTaskValue() {
    return this.form.controls.applyTaskTo.value;
  }
  get llmValue() {
    return this.form.controls.llm.value;
  }

  resourceCount?: number;

  fieldTypeFilters: OptionModel[] = [FIELD_TYPE.file, FIELD_TYPE.link, FIELD_TYPE.text, FIELD_TYPE.conversation].map(
    (t) => new OptionModel({ id: longToShortFieldType(t), value: longToShortFieldType(t), label: t }),
  );
  allFieldTypesSelected = false;
  get fieldTypeSelectionCount(): number {
    return this.fieldTypeFilters.filter((option) => option.selected).length;
  }
  get fieldTypesTotalCount(): number {
    return this.fieldTypeFilters.length;
  }
  get selectedFieldTypes() {
    return this.fieldTypeFilters.filter((option) => option.selected).map((option) => option.value);
  }

  hasLabelSets = this.labelService.hasResourceLabelSets;
  resourceLabelSets = this.labelService.resourceLabelSets.pipe(
    tap((labelSets) => {
      if (labelSets) {
        // FIXME for edition depending on how the filters will be stored
        const currentFilters: string[] = [];
        this.labelSelection = Object.entries(labelSets).reduce((selection, [id, labelset]) => {
          labelset.labels.forEach((label) => {
            const labelFilter = `/classification.labels/${id}/${label.title}`;
            if (currentFilters.includes(labelFilter)) {
              selection.push({ labelset: id, label: label.title });
            }
          });
          return selection;
        }, [] as Classification[]);
        this.cdr.markForCheck();
      }
    }),
  );
  labelSelection: Classification[] = [];
  labelFilters: string[] = [];
  get labelSelectionCount(): number {
    return this.labelFilters.length;
  }
  taskDefinition?: TaskFullDefinition;
  availableLLMs: LearningConfigurationOption[] = [];
  unsupportedLLMs = ['generative-multilingual-2023'];

  get properties() {
    return this.taskDefinition?.validation.properties;
  }
  get filterProperties() {
    return this.properties?.['filter']?.['anyOf']?.[0]?.properties;
  }

  ngOnInit() {
    this.tasksAutomation.initTaskList();
    this.tasksAutomation.taskDefinitions
      .pipe(
        map((tasks) => tasks.find((task) => task.name === this.type)),
        filter((task) => !!task),
        take(1),
      )
      .subscribe((task) => {
        this.taskDefinition = task;
        this.cdr.markForCheck();
      });

    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.getLearningSchema()),
      )
      .subscribe((schema) => {
        this.availableLLMs = (removeDeprecatedModels(schema)?.['generative_model'].options || []).filter(
          (option) => !this.unsupportedLLMs.includes(option.value),
        );
        this.form.controls.llm.patchValue({ model: 'chatgpt-azure-4o-mini' });
      });

    combineLatest([this.form.valueChanges, this.selectedFilters])
      .pipe(
        filter(([data]) => data.applyTaskTo === 'EXISTING'),
        debounceTime(300),
        switchMap(([data, filters]) =>
          this.sdk.currentKb.pipe(switchMap((kb) => kb.catalog(data.filter?.contains || '', { filters }))),
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe({
        next: (results) => {
          if (results.type !== 'error') {
            this.resourceCount = results.fulltext?.total;
            this.cdr.markForCheck();
          }
        },
        error: () => this.toaster.error('tasks-automation.errors.counting-resources'),
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  toggleAll(filter: 'types' | 'fieldTypes', event: MouseEvent | KeyboardEvent) {
    const tagName = (event.target as HTMLElement).tagName;
    if (tagName === 'LI' || tagName === 'INPUT') {
      switch (filter) {
        case 'fieldTypes':
          this.fieldTypeFilters = this.fieldTypeFilters.map(
            (option) => new OptionModel({ ...option, selected: !this.allFieldTypesSelected }),
          );
          break;
      }
      this.onToggleFilter();
    }
  }

  onSelectFilter(option: OptionModel, event: MouseEvent | KeyboardEvent) {
    if ((event.target as HTMLElement).tagName === 'LI') {
      option.selected = !option.selected;
      this.onToggleFilter();
    }
  }

  updateFiltersWithLabels(labels: Classification[]) {
    this.labelFilters = labels.map((label) => `/classification.labels/${label.labelset}/${label.label}`);
    this.onToggleFilter();
  }

  onToggleFilter() {
    this.allFieldTypesSelected = this.fieldTypeFilters.every((option) => option.selected);
    this.selectedFilters.next(this.selectedFieldTypes.concat(this.labelFilters));
  }

  activateTask() {
    const rawValue = this.form.getRawValue();
    this.activate.emit({
      ...rawValue,
      webhook: rawValue.webhook.url.trim()
        ? {
            ...rawValue.webhook,
            headers: this.headers
              .filter((header) => header.key.trim() && header.value.trim())
              .reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}),
            params: this.parameters
              .filter((header) => header.key.trim() && header.value.trim())
              .reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}),
          }
        : undefined,
      filter: {
        contains: rawValue.filter.contains ? [rawValue.filter.contains] : [],
        field_types: this.selectedFieldTypes,
      },
    });
  }

  setHeaders(headers: { key: string; value: string }[]) {
    this.headers = headers;
  }
  setParameters(parameters: { key: string; value: string }[]) {
    this.parameters = parameters;
  }
}
