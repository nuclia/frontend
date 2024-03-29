import {
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
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LabelModule, LabelsService, SDKService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { Classification, Filter, Search } from '@nuclia/core';
import { BehaviorSubject, combineLatest, filter, map, Subject, switchMap, tap } from 'rxjs';
import { Filters, formatFiltersFromFacets, LANGUAGE_FACET, MIME_FACETS } from '../../resources';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { GenerativeModelPipe } from '../../pipes';

function createHeaderRow() {
  return new FormGroup({
    key: new FormControl<string>(''),
    value: new FormControl<string>(''),
    secret: new FormControl<boolean>(false),
  });
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

  private unsubscribeAll = new Subject<void>();

  // List of LLMs available for this task
  @Input() availableLLMs: string[] = [];
  // Text displayed in the info card below Trigger label on the right column
  @Input() triggerDescription = '';
  // Label displayed on the submit button
  @Input() activateButtonLabel = '';
  // Note displayed on the footer when task is applied automatically
  @Input() footerNoteAutomation = '';
  // Note displayed on the footer when task is applied once
  @Input() footerNoteOneTime = '';

  @Output() cancel = new EventEmitter<void>();

  form = new FormGroup({
    applyTaskTo: new FormControl<'automation' | 'once'>('automation'),
    filters: new FormGroup({
      searchIn: new FormControl<'titleOrContent' | 'title' | 'content'>('titleOrContent'),
      searchQuery: new FormControl<string>(''),
    }),
    llm: new FormControl<string>(''),
    webhook: new FormGroup({
      url: new FormControl<string>(''),
      headers: new FormArray([createHeaderRow()]),
    }),
  });

  selectedFilters = new BehaviorSubject<string[] | Filter[]>([]);

  get applyTaskValue() {
    return this.form.controls.applyTaskTo.value;
  }
  get llmValue() {
    return this.form.controls.llm.value;
  }
  get headersGroup() {
    return this.form.controls.webhook.controls.headers.controls;
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

  ngOnInit() {
    this.form.patchValue({ llm: this.availableLLMs[0] });

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
        filter(([data]) => data.applyTaskTo === 'once'),
        debounceTime(300),
        switchMap(([data, filters]) =>
          this.sdk.currentKb.pipe(switchMap((kb) => kb.catalog(data.filters?.searchQuery || '', { filters }))),
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

    const resourceTypesFilters: Filter[] = selectedResourceTypes.length > 0 ? [{ any: selectedResourceTypes }] : [];
    const languageFilters: Filter[] = selectedLanguages.length > 0 ? [{ any: selectedLanguages }] : [];
    const selectedLabels: Filter[] = this.labelFilters.length > 0 ? [{ any: this.labelFilters }] : [];
    this.selectedFilters.next(resourceTypesFilters.concat(languageFilters).concat(selectedLabels));
  }

  addHeader() {
    this.headersGroup.push(createHeaderRow());
  }

  activateTask() {
    // TODO
  }
}
