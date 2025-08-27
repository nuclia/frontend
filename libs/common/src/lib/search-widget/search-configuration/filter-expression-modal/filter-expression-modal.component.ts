import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  ModalConfig,
  ModalRef,
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaIconModule,
  PaModalModule,
  PaPopupModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SisModalService } from '@nuclia/sistema';
import { And, FieldFilterExpression, FilterExpression, Not, Or, ParagraphFilterExpression } from '@nuclia/core';
import { AddFilterModalComponent } from './add-filter-modal/add-filter-modal.component';
import { filter } from 'rxjs';
import { FilterValueComponent } from './filter-value/filter-value.component';

export type AnyFilterExpression =
  | And<AnyFilterExpression>
  | Or<AnyFilterExpression>
  | Not<AnyFilterExpression>
  | FieldFilterExpression
  | ParagraphFilterExpression;

export type NonOperatorFilterExpression = Exclude<
  AnyFilterExpression,
  And<AnyFilterExpression> | Or<AnyFilterExpression> | Not<AnyFilterExpression>
>;

export type FilterTarget = 'field' | 'paragraph';

@Component({
  imports: [
    AccordionBodyDirective,
    AccordionComponent,
    AccordionItemComponent,
    CommonModule,
    FilterValueComponent,
    PaButtonModule,
    PaDateTimeModule,
    PaDropdownModule,
    PaIconModule,
    PaModalModule,
    PaPopupModule,
    PaTextFieldModule,
    TranslateModule,
  ],
  templateUrl: './filter-expression-modal.component.html',
  styleUrl: './filter-expression-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterExpressionModalComponent {
  filterExpression: FilterExpression = {};
  dataAugmentation = false;

  @ViewChildren(AccordionItemComponent) accordionItems: AccordionItemComponent[] = [];

  constructor(
    public modal: ModalRef<{ filterExpression: string; dataAugmentation?: boolean }, string>,
    private modalService: SisModalService,
    private cdr: ChangeDetectorRef,
  ) {
    try {
      this.filterExpression = JSON.parse(this.modal.config.data?.filterExpression || '{}');
      this.dataAugmentation = !!this.modal.config.data?.dataAugmentation;
    } catch {
      // Invalid filter expression
    }
  }

  get invalidExpession() {
    return (
      (!this.filterExpression.field && !this.filterExpression.paragraph) ||
      (this.filterExpression.field && this.hasEmptyExpressions([this.filterExpression.field as AnyFilterExpression])) ||
      (this.filterExpression.paragraph &&
        this.hasEmptyExpressions([this.filterExpression.paragraph as AnyFilterExpression]))
    );
  }

  add(target: FilterTarget, parent?: AnyFilterExpression) {
    this.modalService
      .openModal(
        AddFilterModalComponent,
        new ModalConfig({ data: { target, dataAugmentation: this.dataAugmentation } }),
      )
      .onClose.pipe(filter((expression) => expression))
      .subscribe((result) => {
        if (parent) {
          if ('and' in parent) {
            parent.and = parent.and ? [...parent.and, result] : [result];
          } else if ('or' in parent) {
            parent.or = parent.or ? [...parent.or, result] : [result];
          } else if ('not' in parent) {
            parent.not = parent.not ? [...parent.not, result] : [result];
          }
        } else {
          if (target === 'field') {
            this.filterExpression.field = result;
          } else {
            this.filterExpression.paragraph = result;
          }
        }
        this.updateMainOperator();
        this.cdr.markForCheck();
        this.updateHeight();
      });
  }

  edit(target: FilterTarget, expression: AnyFilterExpression, parent?: AnyFilterExpression, index?: number) {
    this.modalService
      .openModal(
        AddFilterModalComponent,
        new ModalConfig({ data: { expression, target, dataAugmentation: this.dataAugmentation } }),
      )
      .onClose.pipe(filter((expression) => expression))
      .subscribe((result) => {
        this.replaceExpression(target, result, parent, index);
        this.cdr.markForCheck();
        this.updateHeight();
      });
  }

  editOperator(
    operator: 'and' | 'or' | 'not',
    target: FilterTarget,
    expression: AnyFilterExpression,
    parent?: AnyFilterExpression,
    index?: number,
  ) {
    const children = this.getChildren(expression);
    if (children) {
      if (target === 'field') {
        const newExpression = this.createOperator(operator, children);
        this.replaceExpression(target, newExpression, parent, index);
      }
    }
  }

  delete(target: FilterTarget, parent?: AnyFilterExpression, index?: number) {
    if (parent && typeof index === 'number') {
      const siblings = this.getChildren(parent);
      siblings?.splice(index, 1);
    } else {
      if (target === 'field') {
        this.filterExpression.field = undefined;
      } else {
        this.filterExpression.paragraph = undefined;
      }
    }
    this.updateMainOperator();
    this.cdr.markForCheck();
    this.updateHeight();
  }

  submit() {
    this.modal.close(JSON.stringify(this.filterExpression, undefined, 2));
  }

  private replaceExpression(
    target: FilterTarget,
    expression: AnyFilterExpression,
    parent?: AnyFilterExpression,
    index?: number,
  ) {
    if (parent && typeof index === 'number') {
      const siblings = this.getChildren(parent);
      siblings?.splice(index, 1, expression);
    } else {
      if (target === 'field') {
        this.filterExpression.field = expression as FieldFilterExpression;
      } else {
        this.filterExpression.paragraph = expression as ParagraphFilterExpression;
      }
    }
  }

  private updateMainOperator() {
    this.filterExpression.operator =
      this.filterExpression.field && this.filterExpression.paragraph
        ? this.filterExpression.operator || 'and'
        : undefined;
  }

  private updateHeight() {
    this.accordionItems.forEach((item) => item.updateContentHeight());
  }

  private getChildren(expression: AnyFilterExpression): AnyFilterExpression[] | undefined {
    return 'and' in expression
      ? expression.and
      : 'or' in expression
        ? expression.or
        : 'not' in expression
          ? expression.not
          : undefined;
  }

  private createOperator(operator: string, children: AnyFilterExpression[]) {
    return operator === 'and' ? { and: children } : operator === 'or' ? { or: children } : { not: children };
  }

  private hasEmptyExpressions(expressions: AnyFilterExpression[]): boolean {
    return expressions.some((expression) => {
      if ('and' in expression) {
        return expression.and.length === 0 || this.hasEmptyExpressions(expression.and);
      } else if ('or' in expression) {
        return expression.or.length === 0 || this.hasEmptyExpressions(expression.or);
      } else if ('not' in expression) {
        return expression.not.length === 0 || this.hasEmptyExpressions(expression.not);
      } else {
        return false;
      }
    });
  }
}
