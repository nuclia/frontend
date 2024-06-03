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
import { PaIconModule, PaPopupModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { SearchBoxConfig } from '../../search-widget.models';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { FeaturesService, UnauthorizedFeatureDirective } from '@flaps/core';

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
  ],
  templateUrl: './search-box-form.component.html',
  styleUrl: './search-box-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBoxFormComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private featuresService = inject(FeaturesService);

  @Input() set config(value: SearchBoxConfig) {
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
    customizePlaceholder: new FormControl<boolean>(false, { nonNullable: true }),
    filter: new FormControl<boolean>(false, { nonNullable: true }),
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
    placeholder: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    preselectedFilters: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    useSynonyms: new FormControl<boolean>(false, { nonNullable: true }),
  });

  synonymsAuthorized = this.featuresService.authorized.synonyms.pipe(
    tap((authorized) => {
      if (!authorized) {
        this.form.controls.useSynonyms.disable();
      }
    }),
  );
  autocompleteFromNerEnabled = this.featuresService.unstable.suggestEntities;
  isTrainingEnabled = this.featuresService.unstable.training;

  get customizePlaceholderEnabled() {
    return this.form.controls.customizePlaceholder.value;
  }
  get filterEnabled() {
    return this.form.controls.filter.value;
  }
  get preselectedFiltersEnabled() {
    return this.form.controls.setPreselectedFilters.value;
  }
  get suggestionsEnabled() {
    return this.form.controls.suggestions.value;
  }

  ngOnInit() {
    this.form.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((value) => this.configChanged.emit({ ...this.form.getRawValue() }));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
