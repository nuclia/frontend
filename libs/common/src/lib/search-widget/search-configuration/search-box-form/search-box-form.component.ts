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
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  ModalConfig,
  PaButtonModule,
  PaIconModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { SearchBoxConfig } from '../../search-widget.models';
import { filter, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { FeaturesService, SDKService, UnauthorizedFeatureDirective } from '@flaps/core';
import { FilterAssistantModalComponent } from '../filter-assistant';

@Component({
  selector: 'stf-search-box-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaTogglesModule,
    TranslateModule,
    PaTextFieldModule,
    PaIconModule,
    PaPopupModule,
    InfoCardComponent,
    UnauthorizedFeatureDirective,
    PaButtonModule,
  ],
  templateUrl: './search-box-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBoxFormComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private featuresService = inject(FeaturesService);
  private modalService = inject(SisModalService);
  private sdk = inject(SDKService);

  @Input() set config(value: SearchBoxConfig | undefined) {
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

  @Output() heightChanged = new EventEmitter<void>();
  @Output() configChanged = new EventEmitter<SearchBoxConfig>();

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
    suggestLabels: new FormControl<boolean>(false, { nonNullable: true }),
    autocompleteFromNERs: new FormControl<boolean>(false, { nonNullable: true }),
    preselectedFilters: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    useSynonyms: new FormControl<boolean>(false, { nonNullable: true }),
    prependTheQuery: new FormControl<boolean>(false, { nonNullable: true }),
    queryPrepend: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    rephraseQuery: new FormControl<boolean>(false, { nonNullable: true }),
    generateAnswerWith: new FormControl<'only-semantic' | 'semantic-and-full-text'>('semantic-and-full-text', {
      nonNullable: true,
    }),
    showHiddenResources: new FormControl<boolean>(false, { nonNullable: true }),
  });

  synonymsEnabled = this.featuresService.unstable.synonyms;
  autocompleteFromNerEnabled = this.featuresService.unstable.suggestEntities;
  isTrainingEnabled = this.featuresService.unstable.training;
  hiddenResourcesEnabled = this.sdk.currentKb.pipe(map((kb) => !!kb.hidden_resources_enabled ));

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
