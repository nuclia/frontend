import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';

import {
  OptionModel,
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilterTypeAndValueComponent } from '../filter-type-and-value/filter-type-and-value.component';
import { ButtonMiniComponent, InfoCardComponent } from '@nuclia/sistema';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FilterCombiner, FilterExpression, filterTypeList, SimpleFilter } from '../filter-assistant.models';
import { FilterTypePipe, FilterValueComponent } from '../filter-type-and-value';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

let id = 0;

@Component({
  selector: 'stf-filter-expression',
  imports: [
    FilterTypeAndValueComponent,
    FormsModule,
    InfoCardComponent,
    ReactiveFormsModule,
    PaTextFieldModule,
    PaButtonModule,
    TranslateModule,
    ButtonMiniComponent,
    PaPopupModule,
    PaDropdownModule,
    FilterValueComponent,
    FilterTypePipe
],
  templateUrl: './filter-expression.component.html',
  styleUrl: './filter-expression.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class FilterExpressionComponent implements OnInit, OnDestroy {
  private translate = inject(TranslateService);
  private unsubscribeAll = new Subject<void>();
  protected readonly filterTypeList: OptionModel[] = filterTypeList;

  @Input() set expression(expression: (FilterExpression & { id: number }) | undefined) {
    if (expression) {
      if (this.filteringExpression.getRawValue() !== expression.combine) {
        this.filteringExpression.patchValue(expression.combine);
      }
      if (expression.filters.length !== this.filters.length) {
        this.filterValueControls = expression.filters.map(
          (filter) => new FormControl<string>(filter.value, [Validators.required]),
        );
        this.filters = expression.filters.map((filter) => ({ ...filter, id: id++ }));
      }
    }
  }

  @Output() expressionChange = new EventEmitter<FilterExpression>();
  @Output() filterAdded = new EventEmitter<void>();

  filteringExpression = new FormControl<FilterCombiner>('all', {
    validators: [Validators.required],
    nonNullable: true,
  });

  filters: (SimpleFilter & { id: number })[] = [];
  filterValueControls: FormControl[] = [];

  filteringExpressionOptions: OptionModel[] = [
    new OptionModel({
      id: 'all',
      value: 'all',
      label: this.translate.instant('search.configuration.search-box.preselected-filters.assistant.expression.all'),
      help: this.translate.instant('search.configuration.search-box.preselected-filters.assistant.expression.all-help'),
    }),
    new OptionModel({
      id: 'any',
      value: 'any',
      label: this.translate.instant('search.configuration.search-box.preselected-filters.assistant.expression.any'),
      help: this.translate.instant('search.configuration.search-box.preselected-filters.assistant.expression.any-help'),
    }),
    new OptionModel({
      id: 'none',
      value: 'none',
      label: this.translate.instant('search.configuration.search-box.preselected-filters.assistant.expression.none'),
      help: this.translate.instant(
        'search.configuration.search-box.preselected-filters.assistant.expression.none-help',
      ),
    }),
    new OptionModel({
      id: 'not_all',
      value: 'not_all',
      label: this.translate.instant('search.configuration.search-box.preselected-filters.assistant.expression.not_all'),
      help: this.translate.instant(
        'search.configuration.search-box.preselected-filters.assistant.expression.not_all-help',
      ),
    }),
  ];

  get invalidControls() {
    return this.filterValueControls.some((control) => control.invalid);
  }

  ngOnInit(): void {
    this.filteringExpression.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.emitFilters());
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  addFilter(type: string) {
    this.filterValueControls.push(new FormControl<string>('', [Validators.required]));
    this.filters = this.filters.concat([{ id: id++, type, value: '' }]);
    this.filterAdded.emit();
  }

  removeFilter($index: number) {
    this.filters.splice($index, 1);
    this.filterValueControls.splice($index, 1);
    this.filters = [...this.filters];
    this.emitFilters();
  }

  updateFilter($index: number, value: string) {
    const currentFilter = this.filters[$index];
    this.filters.splice($index, 1, { ...currentFilter, id: currentFilter.id, value });
    this.filters = [...this.filters];
    this.emitFilters();
  }

  private emitFilters() {
    this.expressionChange.emit({
      combine: this.filteringExpression.getRawValue(),
      filters: this.filters,
    });
  }
}
