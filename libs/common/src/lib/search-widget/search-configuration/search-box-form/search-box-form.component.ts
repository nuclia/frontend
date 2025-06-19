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
import { FeaturesService, SDKService } from '@flaps/core';
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

  @Input() set config(value: Widget.SearchBoxConfig | undefined) {
    if (value) {
      this.form.patchValue(value);
    }
  }
  @Input() set relationsEnabled(value: boolean) {
    if (value) {
      this.form.controls.useSynonyms.disable();
    } else {
      this.form.controls.useSynonyms.enable();
    }
  }
  @Input({ required: true }) semanticModels: OptionModel[] = [];

  @Output() heightChanged = new EventEmitter<void>();
  @Output() configChanged = new EventEmitter<Widget.SearchBoxConfig>();

  form = new FormGroup({
    filter: new FormControl<boolean>(false, { nonNullable: true }),
    filterLogic: new FormControl<'and' | 'or'>('and', { nonNullable: true }),
    setPreselectedFilters: new FormControl<boolean>(false, { nonNullable: true }),
    suggestions: new FormControl<boolean>(false, { nonNullable: true }),
    autofilter: new FormControl<boolean>(false, { nonNullable: true }),
    filters: new FormGroup({
      labels: new FormControl<boolean>(false, { nonNullable: true }),
      entities: new FormControl<boolean>(false, { nonNullable: true }),
      created: new FormControl<boolean>(false, { nonNullable: true }),
      labelFamilies: new FormControl<boolean>(false, { nonNullable: true }),
    }),
    suggestResults: new FormControl<boolean>(false, { nonNullable: true }),
    autocompleteFromNERs: new FormControl<boolean>(false, { nonNullable: true }),
    preselectedFilters: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    useSynonyms: new FormControl<boolean>(false, { nonNullable: true }),
    highlight: new FormControl<boolean>(false, { nonNullable: true }),
    prependTheQuery: new FormControl<boolean>(false, { nonNullable: true }),
    queryPrepend: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
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

  synonymsEnabled = this.featuresService.unstable.synonyms;
  autocompleteFromNerEnabled = this.featuresService.unstable.suggestEntities;
  hiddenResourcesEnabled = this.sdk.currentKb.pipe(map((kb) => !!kb.hidden_resources_enabled));

  get useSearchResults() {
    return this.form.controls.useSearchResults.value;
  }

  get filterEnabled() {
    return this.form.controls.filter.value;
  }
  get createdFilterEnabled() {
    return this.form.controls.filters.controls.created.value;
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
  get suggestionsEnabled() {
    return this.form.controls.suggestions.value;
  }
  get prependTheQuery() {
    return this.form.controls.prependTheQuery.value;
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
    this.form.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => this.configChanged.emit({ ...this.form.getRawValue() }));
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
}
