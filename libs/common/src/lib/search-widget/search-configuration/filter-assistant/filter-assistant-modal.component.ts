import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, QueryList, ViewChildren } from '@angular/core';
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
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InfoCardComponent } from '@nuclia/sistema';
import { FilterTypeAndValueComponent } from './filter-type-and-value';
import { FilterExpressionComponent, FilterExpressionPipe } from './filter-expression';
import { FilterExpression, SimpleFilter } from './filter-assistant.models';

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
export class FilterAssistantModalComponent {
  private cdr = inject(ChangeDetectorRef);
  private filterExpressionPipe = inject(FilterExpressionPipe);

  @ViewChildren(AccordionItemComponent) accordionItems?: QueryList<AccordionItemComponent>;

  activeTab: 'simple' | 'advanced' = 'simple';

  simpleFilter?: { type: string; value: string };

  filterExpressions: (FilterExpression & { id: number })[] = [this.getNewExpression()];
  advancedFiltersPreview = '';
  filterListPreviews: string[] = [];

  invalidFilters = true;

  constructor(public modal: ModalRef) {}

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
