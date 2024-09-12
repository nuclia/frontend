import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionExtraDescriptionDirective,
  AccordionItemComponent,
  ModalRef,
  PaButtonModule,
  PaDropdownModule,
  PaModalModule,
  PaTabsModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InfoCardComponent, SisToastService } from '@nuclia/sistema';
import { FilterTypeAndValueComponent } from './filter-type-and-value';
import { FilterExpressionComponent, FilterExpressionPipe } from './filter-expression';
import {
  FilterExpression,
  getCombineKey,
  getFiltersFromExpression,
  mapToSimpleFilter,
  SimpleFilter,
} from './filter-assistant.models';

let id = 0;

@Component({
  selector: 'stf-filter-assistant-modal',
  standalone: true,
  imports: [
    CommonModule,
    PaModalModule,
    TranslateModule,
    PaButtonModule,
    ReactiveFormsModule,
    PaTabsModule,
    PaDropdownModule,
    InfoCardComponent,
    PaTextFieldModule,
    FilterTypeAndValueComponent,
    FilterExpressionComponent,
    AccordionComponent,
    AccordionItemComponent,
    AccordionBodyDirective,
    FilterExpressionPipe,
    AccordionExtraDescriptionDirective,
  ],
  providers: [FilterExpressionPipe],
  templateUrl: './filter-assistant-modal.component.html',
  styleUrl: './filter-assistant-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterAssistantModalComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private filterExpressionPipe = inject(FilterExpressionPipe);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);

  @ViewChildren(AccordionItemComponent) accordionItems?: QueryList<AccordionItemComponent>;

  activeTab: 'simple' | 'advanced' = 'simple';

  simpleFilter?: { type: string; value: string };

  filterExpressions: (FilterExpression & { id: number })[] = [this.getNewExpression()];
  advancedFiltersPreview = '';
  filterListPreviews: string[] = [];

  invalidFilters = true;

  constructor(public modal: ModalRef) {}

  ngOnInit() {
    if (typeof this.modal.config.data === 'string' && !!this.modal.config.data) {
      const value: string = this.modal.config.data;
      if (value.startsWith('/')) {
        this.simpleFilter = mapToSimpleFilter(value);
      } else if (value.startsWith('{')) {
        this.activeTab = 'advanced';
        const rawExpressions = value.split('\n');
        const expressionList = rawExpressions.reduce(
          (expressions, expressionString) => {
            try {
              const expression = JSON.parse(expressionString);
              const combine = getCombineKey(expression);
              if (combine) {
                const filters = getFiltersFromExpression(expression, combine);
                if (filters && filters.length > 0) {
                  expressions.push({ id: id++, combine, filters });
                }
              }
            } catch (e) {
              // if the JSON is malformed, we just ignore the entry
            }
            return expressions;
          },
          [] as (FilterExpression & { id: number })[],
        );
        if (expressionList.length > 0) {
          this.filterExpressions = expressionList;
          this.updatePreview();
        }
        if (expressionList.length !== rawExpressions.length) {
          const count = rawExpressions.length - expressionList.length;
          this.toaster.warning(
            this.translate.instant(
              count > 1
                ? 'search.configuration.search-box.preselected-filters.assistant.warning.malformed-expressions'
                : 'search.configuration.search-box.preselected-filters.assistant.warning.malformed-expression',
              { count },
            ),
          );
        }
      }
    }
  }

  changeTab(tab: 'simple' | 'advanced') {
    this.activeTab = tab;
    this.checkFiltersValidity();
  }

  updateSimpleFilter($event: SimpleFilter) {
    this.simpleFilter = $event;
    this.checkFiltersValidity();
  }

  addExpression() {
    this.filterExpressions = this.filterExpressions.concat([this.getNewExpression()]);
    this.checkFiltersValidity();
  }

  removeExpression($index: number) {
    this.filterExpressions.splice($index, 1);
    this.filterExpressions = [...this.filterExpressions];
    this.updatePreview();
    this.checkFiltersValidity();
  }

  updateExpressions($index: number, expression: FilterExpression) {
    this.updateAccordionHeight($index);
    this.filterExpressions.splice($index, 1, { ...expression, id: this.filterExpressions[$index].id });
    this.filterExpressions = [...this.filterExpressions];
    this.updatePreview();
    this.checkFiltersValidity();
  }

  save() {
    if (this.activeTab === 'simple' && this.simpleFilter) {
      this.modal.close(`/${this.simpleFilter.type}/${this.simpleFilter.value}`);
    } else if (this.activeTab === 'advanced') {
      this.modal.close(this.filterListPreviews.join('\n'));
    }
  }

  updateAccordionHeight($index: number) {
    this.accordionItems?.get($index)?.updateContentHeight();
  }

  private getNewExpression(): FilterExpression & { id: number } {
    return { id: id++, combine: 'all', filters: [] };
  }

  private updatePreview() {
    this.filterListPreviews = this.filterExpressions.reduce((previews, expression) => {
      if (expression.filters.length > 0) {
        previews.push(this.filterExpressionPipe.transform(expression));
      }
      return previews;
    }, [] as string[]);

    this.advancedFiltersPreview = `{
  "filters": [
    ${this.filterListPreviews.join(',\n    ')}
  ]
}`;
  }

  private checkFiltersValidity() {
    if (this.activeTab === 'simple') {
      this.invalidFilters = !this.simpleFilter || !this.simpleFilter.type || !this.simpleFilter.value;
    } else if (this.activeTab === 'advanced') {
      this.invalidFilters =
        this.filterExpressions.length === 0 ||
        this.filterExpressions.some(
          (expression) =>
            expression.filters.length === 0 || expression.filters.some((filter) => !filter.type || !filter.value),
        );
    }
    this.cdr.markForCheck();
  }
}
