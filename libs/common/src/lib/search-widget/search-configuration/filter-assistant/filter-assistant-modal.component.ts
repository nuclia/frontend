import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
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
import { FilterExpressionComponent } from './filter-expression';
import { FilterExpression } from './filter-assistant.models';

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
  ],
  templateUrl: './filter-assistant-modal.component.html',
  styleUrl: './filter-assistant-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterAssistantModalComponent {
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'simple' | 'advanced' = 'simple';

  simpleFilter?: { type: string; value: string };

  filterExpressions: (FilterExpression & { id: number })[] = [this.getNewExpression()];
  advancedFiltersPreview = '';

  constructor(public modal: ModalRef) {}

  // For now, we reset the form when changing tab
  changeTab(newTab: 'simple' | 'advanced') {
    this.activeTab = newTab;
    this.simpleFilter = undefined;
    this.filterExpressions = [this.getNewExpression()];
    this.advancedFiltersPreview = '';
  }

  addExpression() {
    this.filterExpressions = this.filterExpressions.concat([this.getNewExpression()]);
  }

  removeExpression($index: number) {
    this.filterExpressions.splice($index, 1);
    this.filterExpressions = [...this.filterExpressions];
  }

  updateExpressions($index: number, expression: FilterExpression) {
    this.filterExpressions.splice($index, 1, { ...expression, id: this.filterExpressions[$index].id });
    const filterListPreviews: string[] = this.filterExpressions.reduce((previews, expression) => {
      if (expression.filters.length > 0) {
        previews.push(
          `{"${expression.combine}": ${JSON.stringify(
            expression.filters.map((filter) => `/${filter.type}/${filter.value}`),
          )}}`,
        );
      }
      return previews;
    }, [] as string[]);

    this.advancedFiltersPreview = `{
  "filters": [
    ${filterListPreviews.join(',\n    ')}
  ]
}`;
    this.filterExpressions = [...this.filterExpressions];
    this.cdr.detectChanges();
  }

  save() {
    // TODO
  }

  private getNewExpression(): FilterExpression & { id: number } {
    return { id: id++, combine: 'all', filters: [] };
  }
}
