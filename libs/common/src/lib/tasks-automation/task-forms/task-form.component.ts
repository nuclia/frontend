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
  LearningConfigurationOption,
  LLMConfig,
  Search,
  TaskFullDefinition,
  TaskName,
} from '@nuclia/core';
import { BehaviorSubject, combineLatest, filter, map, ReplaySubject, Subject, switchMap, tap } from 'rxjs';
import { Filters, formatFiltersFromFacets, LANGUAGE_FACET, MIME_FACETS } from '../../resources';
import { debounceTime, take, takeUntil } from 'rxjs/operators';
import { GenerativeModelPipe } from '../../pipes';
import { TasksAutomationService } from '../tasks-automation.service';
import { TaskWithApplyOption } from './task-route.directive';
import { removeDeprecatedModels } from '../../ai-models/ai-models.utils';

export interface TaskFormCommonConfig {
  name: string;
  applyTaskTo: ApplyOption;
  filter: {
    //searchIn: 'titleOrContent' | 'title' | 'content';
    contains: string[];
    resource_type: string[];
  };
  llm: LLMConfig;
  webhook: {
    url: string;
    headers: { key: string; value: string; secret: boolean }[];
  };
}

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    DropdownButtonComponent,
    InfoCardComponent,
    LabelModule,
    PaDropdownModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaTooltipModule,
    ReactiveFormsModule,
    TwoColumnsConfigurationItemComponent,
    TranslateModule,
    PaTableModule,
    PaButtonModule,
    GenerativeModelPipe,
    StickyFooterComponent,
    ParametersTableComponent,
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
  // Task whose data is displayed in the form
  @Input() set task(value: TaskWithApplyOption | undefined) {
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
  @Output() activate = new EventEmitter<TaskFormCommonConfig>();

  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    applyTaskTo: new FormControl<ApplyOption>('ALL', { nonNullable: true }),
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
  formReady = new ReplaySubject<boolean>(1);
  headers: { key: string; value: string; secret: boolean }[] = [];

  selectedFilters = new BehaviorSubject<string[]>([]);

  get applyTaskValue() {
    return this.form.controls.applyTaskTo.value;
  }
  get llmValue() {
    return this.form.controls.llm.value;
  }

  resourceCount?: number;

  resourceTypeFilters: OptionModel[] = [];
  allResourceTypesSelected = false;
  get resourceTypeSelectionCount(): number {
    return this.resourceTypeFilters.filter((option) => option.selected).length;
  }
  get resourceTypeTotalCount(): number {
    return this.resourceTypeFilters.length;
  }

  languageFilters: OptionModel[] = [];
  allLanguagesSelected = false;
  get languageSelectionCount(): number {
    return this.languageFilters.filter((option) => option.selected).length;
  }
  get languageTotalCount(): number {
    return this.languageFilters.length;
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
        this.form.controls.llm.patchValue({ model: schema?.['generative_model'].default });
        this.formReady.next(true);
      });

    this.sdk.currentKb
      .pipe(
        switchMap((kb) => kb.catalog('', { faceted: MIME_FACETS.concat(LANGUAGE_FACET) })),
        map((results) => {
          if (results.type === 'error') {
            return;
          }
          const facets: Search.FacetsResult = results.fulltext?.facets || {};
          return formatFiltersFromFacets(facets);
        }),
        filter((filters) => !!filters),
        map((filters) => filters as Filters),
      )
      .subscribe((filters) => {
        this.resourceTypeFilters = filters.mainTypes;
        if (filters.languages) {
          this.languageFilters = filters.languages;
        }
        this.cdr.detectChanges();
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

  initForm(task: TaskWithApplyOption) {
    this.formReady
      .pipe(
        filter((ready) => ready),
        take(1),
      )
      .subscribe(() => {
        this.form.patchValue({
          ...task.parameters,
          filter: { ...task.parameters.filter, contains: task.parameters.filter.contains[0] || '' },
          applyTaskTo: task.applyOption,
        });
        this.form.disable();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  toggleAll(filter: 'types' | 'languages', event: MouseEvent | KeyboardEvent) {
    const tagName = (event.target as HTMLElement).tagName;
    if (tagName === 'LI' || tagName === 'INPUT') {
      switch (filter) {
        case 'types':
          this.resourceTypeFilters = this.resourceTypeFilters.map(
            (option) => new OptionModel({ ...option, selected: !this.allResourceTypesSelected }),
          );
          break;
        case 'languages':
          this.languageFilters = this.languageFilters.map(
            (option) => new OptionModel({ ...option, selected: !this.allLanguagesSelected }),
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
    this.allResourceTypesSelected = this.resourceTypeFilters.every((option) => option.selected);
    this.allLanguagesSelected = this.languageFilters.every((option) => option.selected);

    const selectedResourceTypes = this.resourceTypeFilters
      .filter((option) => option.selected)
      .map((option) => option.value);
    const selectedLanguages = this.languageFilters.filter((option) => option.selected).map((option) => option.value);
    this.selectedFilters.next(selectedResourceTypes.concat(selectedLanguages).concat(this.labelFilters));
  }

  activateTask() {
    const rawValue = this.form.getRawValue();
    this.activate.emit({
      ...rawValue,
      webhook: { ...rawValue.webhook, headers: this.headers },
      filter: {
        contains: rawValue.filter.contains ? [rawValue.filter.contains] : [],
        resource_type: this.selectedFilters.value,
      },
    });
  }

  setHeaders(headers: { key: string; value: string; secret: boolean }[]) {
    this.headers = headers;
  }
}
