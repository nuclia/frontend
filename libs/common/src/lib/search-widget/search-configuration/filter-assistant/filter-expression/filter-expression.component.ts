import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OptionModel, PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilterTypeAndValueComponent } from '../filter-type-and-value/filter-type-and-value.component';
import { InfoCardComponent } from '@nuclia/sistema';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FilterCombiner, FilterExpression, SimpleFilter } from '../filter-assistant.models';

let id = 0;

@Component({
  selector: 'stf-filter-expression',
  standalone: true,
  imports: [
    CommonModule,
    FilterTypeAndValueComponent,
    FormsModule,
    InfoCardComponent,
    ReactiveFormsModule,
    PaTextFieldModule,
    PaButtonModule,
    TranslateModule,
  ],
  templateUrl: './filter-expression.component.html',
  styleUrl: './filter-expression.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class FilterExpressionComponent {
  private translate = inject(TranslateService);

  @Output() expressionChange = new EventEmitter<FilterExpression>();

  filteringExpression = new FormControl<FilterCombiner>('all', {
    validators: [Validators.required],
    nonNullable: true,
  });

  filters: (SimpleFilter & { id: number })[] = [{ id: id++, type: '', value: '' }];

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

  addFilter() {
    this.filters = this.filters.concat([{ id: id++, type: '', value: '' }]);
  }

  removeFilter($index: number) {
    this.filters.splice($index, 1);
    this.filters = [...this.filters];
    this.emitValidFilters();
  }

  updateFilter($index: number, filter: { type: string; value: string }) {
    this.filters.splice($index, 1, { ...filter, id: this.filters[$index].id });
    this.filters = [...this.filters];
    this.emitValidFilters();
  }

  private emitValidFilters() {
    const validFilters = this.filters.filter((filter) => !!filter.type && !!filter.value);
    if (validFilters.length > 0) {
      this.expressionChange.emit({
        combine: this.filteringExpression.getRawValue(),
        filters: validFilters,
      });
    }
  }
}
