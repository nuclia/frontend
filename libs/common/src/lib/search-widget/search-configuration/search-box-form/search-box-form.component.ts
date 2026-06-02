import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FeaturesService, LabelsService, SDKService } from '@flaps/core';
import {
  ModalConfig,
  OptionModel,
  PaButtonModule,
  PaIconModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Widget } from '@nuclia/core';
import { BadgeComponent, ExpandableTextareaComponent, InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { filter, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { FilterAssistantModalComponent } from '../filter-assistant';
import { FilterExpressionModalComponent } from '../filter-expression-modal';
import { SearchWidgetService } from '../../search-widget.service';

@Component({
  selector: 'stf-search-box-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaTogglesModule,
    TranslateModule,
    PaTextFieldModule,
    PaIconModule,
    PaPopupModule,
    InfoCardComponent,
    PaButtonModule,
    BadgeComponent,
    ExpandableTextareaComponent,
  ],
  templateUrl: './search-box-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBoxFormComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private featuresService = inject(FeaturesService);
  private modalService = inject(SisModalService);
  private sdk = inject(SDKService);
  private searchWidgetService = inject(SearchWidgetService);
  private labelsService = inject(LabelsService);

  @Input() set config(value: Widget.SearchBoxConfig | undefined) {
    if (value) {
      this.form.patchValue(value);
    }
  }
  @Input({ required: true }) semanticModels: OptionModel[] = [];

  @Output() heightChanged = new EventEmitter<void>();
  @Output() configChanged = new EventEmitter<Widget.SearchBoxConfig>();

  form = new FormGroup({
    filter: new FormControl<boolean>(false, { nonNullable: true }),
    filterLogic: new FormControl<'and' | 'or'>('and', { nonNullable: true }),
    labelSetsExcludedFromFilters: new FormControl<string>('', { nonNullable: true }),
    initialFilters: new FormControl<string>('', { nonNullable: true }),
    setPreselectedFilters: new FormControl<boolean>(false, { nonNullable: true }),
    suggestions: new FormControl<boolean>(false, { nonNullable: true }),
    filters: new FormGroup({
      mime: new FormControl<boolean>(false, { nonNullable: true }),
      labels: new FormControl<boolean>(false, { nonNullable: true }),
      entities: new FormControl<boolean>(false, { nonNullable: true }),
      created: new FormControl<boolean>(false, { nonNullable: true }),
      labelFamilies: new FormControl<boolean>(false, { nonNullable: true }),
      path: new FormControl<boolean>(false, { nonNullable: true }),
    }),
    suggestResults: new FormControl<boolean>(false, { nonNullable: true }),
    autocompleteFromNERs: new FormControl<boolean>(false, { nonNullable: true }),
    preselectedFilters: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    preselectedFilterExpression: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    highlight: new FormControl<boolean>(false, { nonNullable: true }),
    rephraseQuery: new FormControl<boolean>(false, { nonNullable: true }),
    useRephrasePrompt: new FormControl<boolean>(false, { nonNullable: true }),
    rephrasePrompt: new FormControl<string>('', { nonNullable: true }),
    generateAnswerWith: new FormControl<'only-semantic' | 'semantic-and-full-text'>('semantic-and-full-text', {
      nonNullable: true,
    }),
    showHiddenResources: new FormControl<boolean>(false, { nonNullable: true }),
    semanticReranking: new FormControl<boolean>(false, { nonNullable: true }),
    rrfBoosting: new FormControl<boolean>(false, { nonNullable: true }),
    rrfSemanticBoosting: new FormControl<number>(1, { nonNullable: true }),
    vectorset: new FormControl<string>('', { nonNullable: true }),
    useSearchResults: new FormControl<boolean>(true, { nonNullable: true }),
    limitParagraphs: new FormControl<boolean>(false, { nonNullable: true }),
    paragraphsLimit: new FormControl<number | null>(null),
    useSecurityGroups: new FormControl<boolean>(false, { nonNullable: true }),
    securityGroups: new FormControl<string>('', { nonNullable: true }),
  });

  autocompleteFromNerEnabled = this.featuresService.authorized.suggestEntities;
  hiddenResourcesEnabled = this.sdk.currentKb.pipe(map((kb) => !!kb.hidden_resources_enabled));
  labelExample = this.labelsService.labelSets.pipe(
    map((labelSets) => {
      const labelSet = Object.entries(labelSets || {}).find(([, labelset]) => labelset.labels.length > 0);
      return labelSet ? `${labelSet[0]}/${labelSet[1].labels[0].title}` : undefined;
    }),
  );

  get useSearchResults() {
    return this.form.controls.useSearchResults.value;
  }

  get filterEnabled() {
    return this.form.controls.filter.value;
  }
  get createdFilterEnabled() {
    return this.form.controls.filters.controls.created.value;
  }
  get labelsFilterEnabled() {
    return this.form.controls.filters.controls.labels.value || this.form.controls.filters.controls.labelFamilies.value;
  }
  get orLogicEnabled() {
    return this.form.controls.filterLogic.value === 'or';
  }
  get preselectedFiltersEnabled() {
    return this.form.controls.setPreselectedFilters.value;
  }
  get preselectedFiltersControl() {
    return this.form.controls.preselectedFilters;
  }
  get preselectedFilterExpressionControl() {
    return this.form.controls.preselectedFilterExpression;
  }
  get suggestionsEnabled() {
    return this.form.controls.suggestions.value;
  }
  get rephraseQueryEnabled() {
    return this.form.controls.rephraseQuery.value;
  }
  get useRephrasePromptEnabled() {
    return this.form.controls.useRephrasePrompt.value;
  }
  get limitParagraphsEnabled() {
    return this.form.controls.limitParagraphs.value;
  }
  get rrfBoostingEnabled() {
    return this.form.controls.rrfBoosting.value;
  }
  get securityGroupsEnabled() {
    return this.form.controls.useSecurityGroups.value;
  }

  ngOnInit() {
    this.form.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      const {
        labelSetsExcludedFromFilters: filterExcludedLabelSets,
        initialFilters,
        ...config
      } = this.form.getRawValue();
      const filterExcludedLabelSetsFormatted = filterExcludedLabelSets
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => !!item)
        .join(',');
      const initialFiltersFormatted = initialFilters
        .split('\n')
        .map((item) => (item.trim().split('/').length === 2 ? item.trim() : undefined))
        .filter((item) => !!item)
        .join(',');
      this.configChanged.emit({
        ...config,
        labelSetsExcludedFromFilters: filterExcludedLabelSetsFormatted,
        initialFilters: initialFiltersFormatted,
      });
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  openFiltersAssistant() {
    this.modalService
      .openModal(FilterAssistantModalComponent, new ModalConfig({ data: this.preselectedFiltersControl.value }))
      .onClose.pipe(filter((filters) => !!filters))
      .subscribe((filters: string) => this.preselectedFiltersControl.patchValue(filters));
  }

  openFilterExpressionAssistant() {
    this.modalService
      .openModal(
        FilterExpressionModalComponent,
        new ModalConfig({ data: { filterExpression: this.preselectedFilterExpressionControl.value } }),
      )
      .onClose.pipe(filter((filters) => !!filters))
      .subscribe((filters: string) => this.preselectedFilterExpressionControl.patchValue(filters));
  }

  onInitialFiltersChange() {
    // Reset the previous query, so the previous selected filters are not preserved
    this.searchWidgetService.resetSearchQuery();
  }
}
