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
  LearningConfigurations,
  LLMConfig,
  longToShortFieldType,
  TaskFullDefinition,
  TaskName,
  TaskTrigger,
} from '@nuclia/core';
import { BehaviorSubject, combineLatest, filter, map, Subject, switchMap } from 'rxjs';
import { debounceTime, take, takeUntil } from 'rxjs/operators';
import { TasksAutomationService } from '../tasks-automation.service';
import { removeDeprecatedModels } from '../../ai-models/ai-models.utils';
import { UserKeysComponent, UserKeysForm } from '../../ai-models';
import { TaskWithApplyOption } from '../task-route.directive';
import { getOperationFromTaskName } from '../tasks-automation.models';

export interface TaskFormCommonConfig {
  name: string;
  applyTaskTo: ApplyOption;
  filter: {
    contains: string[];
    field_types: string[];
    labels?: string[];
    apply_to_agent_generated_fields?: boolean;
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
    UserKeysComponent,
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
  @Input({ transform: booleanAttribute }) set modelsHidden(value: boolean) {
    this._modelsHidden = value;
    this.form.controls.llm.controls.model.clearValidators();
  }
  get modelsHidden() {
    return this._modelsHidden;
  }
  private _modelsHidden: boolean = false;
  // Task whose data is displayed in the form
  @Input() set task(value: TaskWithApplyOption | undefined | null) {
    if (value) {
      this._task = value;
      this.initForm(value);
    }
  }
  get task() {
    return this._task;
  }
  private _task?: TaskWithApplyOption;

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<TaskFormCommonConfig>();

  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    applyTaskTo: new FormControl<ApplyOption>('NEW', { nonNullable: true }),
    filter: new FormGroup({
      contains: new FormControl<string>('', { nonNullable: true }),
      apply_to_agent_generated_fields: new FormControl<boolean>(false),
    }),
    llm: new FormGroup({
      model: new FormControl<string>('gemini-1-5-flash', { nonNullable: true, validators: [Validators.required] }),
    }),
    webhook: new FormGroup({
      url: new FormControl<string>('', { nonNullable: true }),
    }),
  });
  userKeysForm?: UserKeysForm;
  headers: { key: string; value: string }[] = [];
  parameters: { key: string; value: string }[] = [];

  selectedFilters = new BehaviorSubject<string[]>([]);

  get applyTaskValue() {
    return this.form.controls.applyTaskTo.value;
  }
  get generativeModel() {
    return this.learningConfigurations?.['generative_model'].options?.find(
      (option) => option.value === this.form.controls.llm.controls.model.value,
    );
  }

  resourceCount?: number;

  fieldTypeFilters: OptionModel[] = [FIELD_TYPE.file, FIELD_TYPE.link, FIELD_TYPE.text, FIELD_TYPE.conversation].map(
    (t) => new OptionModel({ id: longToShortFieldType(t), value: longToShortFieldType(t), label: t }),
  );
  get allFieldTypesSelected() {
    return this.fieldTypeFilters.every((option) => option.selected);
  }
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
  resourceLabelSets = this.labelService.resourceLabelSets;
  labelSelection: Classification[] = [];
  get labelFilters() {
    return this.labelSelection.map((label) => `${label.labelset}/${label.label}`);
  }
  get labelSelectionCount(): number {
    return this.labelFilters.length;
  }
  taskDefinition?: TaskFullDefinition;
  learningConfigurations?: LearningConfigurations;
  availableLLMs: OptionModel[] = [];
  unsupportedLLMs = ['generative-multilingual-2023'];

  get properties() {
    return this.taskDefinition?.validation.properties;
  }
  get filterProperties() {
    return this.properties?.['filter']?.['anyOf']?.[0]?.properties;
  }
  can_apply_to_agent_generated_fields = false;

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
        this.can_apply_to_agent_generated_fields = task.name === 'labeler' || task.name === 'llm-graph';
        this.cdr.markForCheck();
      });

    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.getLearningSchema()),
      )
      .subscribe((schema) => {
        this.learningConfigurations = schema;
        this.availableLLMs = (removeDeprecatedModels(schema)?.['generative_model'].options || [])
          .filter((option) => !this.unsupportedLLMs.includes(option.value))
          .map((option) => new OptionModel({ id: option.value, value: option.value, label: option.name }));
        this.cdr.markForCheck();
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

  initForm(task: TaskWithApplyOption) {
    const triggers =
      this.task?.parameters.operations?.[0]?.[getOperationFromTaskName(this.task.task.name) || 'ask']?.triggers?.[0];
    this.form.patchValue({
      ...task.parameters,
      filter: { ...task.parameters.filter, contains: task.parameters.filter.contains?.[0] || '' },
      applyTaskTo: task.applyOption,
      webhook: { url: triggers?.url || '' },
    });
    this.fieldTypeFilters.forEach((option) => {
      option.selected = (task.parameters.filter.field_types || []).includes(option.id);
    });
    this.labelSelection = (task.parameters.filter.labels || []).map((label) => ({
      labelset: label.split('/')[0],
      label: label.split('/')[1],
    }));
    if (triggers) {
      this.headers = Object.entries(triggers.headers || {}).map(([key, value]) => ({ key, value }));
      this.parameters = Object.entries(triggers.params || {}).map(([key, value]) => ({ key, value }));
    }
    this.form.controls.applyTaskTo.disable();
    this.cdr.markForCheck();
  }

  initUserKeysForm(form: UserKeysForm) {
    this.userKeysForm = form;
    if (this.task && this.generativeModel?.user_key) {
      const userkeys = this.task.parameters.llm.keys?.[this.generativeModel.user_key];
      this.userKeysForm.patchValue({
        enabled: !!userkeys,
        user_keys: userkeys,
      });
    }
    // Change detection is needed when the child component changes the form
    this.userKeysForm.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.cdr.detectChanges();
    });
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

  updateFiltersWithLabels() {
    this.onToggleFilter();
  }

  onToggleFilter() {
    this.selectedFilters.next(this.selectedFieldTypes.concat(this.labelFilters));
  }

  onSave() {
    const rawValue = this.form.getRawValue();
    const userKeys = this.userKeysForm?.getRawValue();
    this.save.emit({
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
        labels: this.labelFilters,
        apply_to_agent_generated_fields: !!rawValue.filter.apply_to_agent_generated_fields,
      },
      llm: {
        ...rawValue.llm,
        keys:
          this.generativeModel?.user_key && userKeys?.enabled
            ? { [this.generativeModel.user_key]: userKeys.user_keys }
            : {},
      },
    });
  }
}
