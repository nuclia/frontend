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
import { InfoCardComponent, SisModalService } from '@nuclia/sistema';
import {
  And,
  FieldFilterExpression,
  FilterExpression,
  KeyValueContainsFilter,
  KeyValueEqualFilter,
  KeyValueFilterExpression,
  KeyValueRangeFilter,
  Not,
  Or,
  ParagraphFilterExpression,
} from '@nuclia/core';
import { AddFilterModalComponent } from './add-filter-modal/add-filter-modal.component';
import { filter } from 'rxjs';
import { FilterValueComponent } from './filter-value/filter-value.component';
import { KvSchemasService } from '../../../knowledge-box-settings/kv-schemas/kv-schemas.service';

export type AnyFilterExpression =
  | And<AnyFilterExpression>
  | Or<AnyFilterExpression>
  | Not<AnyFilterExpression | undefined>
  | FieldFilterExpression
  | ParagraphFilterExpression
  | KeyValueFilterExpressionWithProps;

export type NonOperatorFilterExpression = Exclude<
  AnyFilterExpression,
  And<AnyFilterExpression> | Or<AnyFilterExpression> | Not<AnyFilterExpression | undefined>
>;

export type FilterTarget = 'field' | 'paragraph' | 'key-value';

// Key-value filters do not have the prop property. We add fake props for consistency.
export type KeyValueFilterExpressionWithProps =
  | And<KeyValueFilterExpressionWithProps>
  | Or<KeyValueFilterExpressionWithProps>
  | Not<KeyValueFilterExpressionWithProps>
  | (KeyValueEqualFilter & { prop: 'key_value_eq' })
  | (KeyValueRangeFilter & { prop: 'key_value_gte_lte' })
  | (KeyValueContainsFilter & { prop: 'key_value_contains' });

@Component({
  imports: [
    AccordionBodyDirective,
    AccordionComponent,
    AccordionItemComponent,
    CommonModule,
    FilterValueComponent,
    InfoCardComponent,
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
  useKbData = true;
  help?: string;
  hasKvSchemas = this.kvSchemasService.schemas$.pipe(filter((schemas) => schemas.length > 0));

  @ViewChildren(AccordionItemComponent) accordionItems: AccordionItemComponent[] = [];

  constructor(
    public modal: ModalRef<
      { filterExpression: string; dataAugmentation?: boolean; useKbData?: boolean; help?: string },
      string
    >,
    private modalService: SisModalService,
    private kvSchemasService: KvSchemasService,
    private cdr: ChangeDetectorRef,
  ) {
    try {
      this.filterExpression = JSON.parse(this.modal.config.data?.filterExpression || '{}');
      if (this.filterExpression.key_value) {
        this.filterExpression.key_value = this.addFakeProps(this.filterExpression.key_value);
      }
    } catch {
      // Invalid filter expression
    }
    this.dataAugmentation = !!this.modal.config.data?.dataAugmentation;
    this.useKbData = this.modal.config.data?.useKbData ?? true;
    this.help = this.modal.config.data?.help;
  }

  get invalidExpession() {
    const fieldExpression = this.filterExpression.field;
    const paragraphExpression = this.filterExpression.paragraph;
    const keyValueExpression = this.filterExpression.key_value;
    const hasEmptyExpressions =
      (fieldExpression && this.hasEmptyExpressions([fieldExpression as AnyFilterExpression])) ||
      (paragraphExpression && this.hasEmptyExpressions([paragraphExpression as AnyFilterExpression])) ||
      (keyValueExpression && this.hasEmptyExpressions([keyValueExpression as AnyFilterExpression]));
    return (!fieldExpression && !paragraphExpression && !keyValueExpression) || hasEmptyExpressions;
  }

  add(target: FilterTarget, parent?: AnyFilterExpression) {
    this.modalService
      .openModal(
        AddFilterModalComponent,
        new ModalConfig({ data: { target, dataAugmentation: this.dataAugmentation, useKbData: this.useKbData } }),
      )
      .onClose.pipe(filter((expression) => expression))
      .subscribe((result) => {
        if (parent) {
          if ('and' in parent) {
            parent.and = parent.and ? [...parent.and, result] : [result];
          } else if ('or' in parent) {
            parent.or = parent.or ? [...parent.or, result] : [result];
          } else if ('not' in parent) {
            parent.not = result;
          }
        } else if (target === 'field') {
          this.filterExpression.field = result;
        } else if (target === 'paragraph') {
          this.filterExpression.paragraph = result;
        } else {
          this.filterExpression.key_value = result;
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
        new ModalConfig({
          data: { expression, target, dataAugmentation: this.dataAugmentation, useKbData: this.useKbData },
        }),
      )
      .onClose.pipe(filter((expression) => expression))
      .subscribe((result) => {
        this.replaceExpression(target, result, parent, index);
        this.cdr.markForCheck();
        this.updateHeight();
      });
  }

  editOperator(
    operator: 'and' | 'or',
    target: FilterTarget,
    expression: AnyFilterExpression,
    parent?: AnyFilterExpression,
    index?: number,
  ) {
    const children = this.getChildren(expression);
    if (children) {
      const newExpression = operator === 'and' ? { and: children } : { or: children };
      this.replaceExpression(target, newExpression, parent, index);
    }
  }

  delete(target: FilterTarget, parent?: AnyFilterExpression, index?: number) {
    if (parent) {
      if ('not' in parent) {
        parent.not = undefined;
      } else if (typeof index === 'number') {
        const siblings = this.getChildren(parent);
        siblings?.splice(index, 1);
      }
    } else if (target === 'field') {
      this.filterExpression.field = undefined;
    } else if (target === 'paragraph') {
      this.filterExpression.paragraph = undefined;
    } else {
      this.filterExpression.key_value = undefined;
    }
    this.updateMainOperator();
    this.cdr.markForCheck();
    this.updateHeight();
  }

  submit() {
    if (this.filterExpression.key_value) {
      this.filterExpression.key_value = this.removeFakeProps(
        this.filterExpression.key_value as KeyValueFilterExpressionWithProps,
      );
    }
    this.modal.close(JSON.stringify(this.filterExpression, undefined, 2));
  }

  private replaceExpression(
    target: FilterTarget,
    expression: AnyFilterExpression,
    parent?: AnyFilterExpression,
    index?: number,
  ) {
    if (parent) {
      if ('not' in parent) {
        parent.not = expression;
      } else if (typeof index === 'number') {
        const siblings = this.getChildren(parent);
        siblings?.splice(index, 1, expression);
      }
    } else if (target === 'field') {
      this.filterExpression.field = expression as FieldFilterExpression;
    } else if (target === 'paragraph') {
      this.filterExpression.paragraph = expression as ParagraphFilterExpression;
    } else {
      this.filterExpression.key_value = expression as KeyValueFilterExpressionWithProps;
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
    if ('and' in expression) {
      return expression.and;
    } else if ('or' in expression) {
      return expression.or;
    } else {
      return undefined;
    }
  }

  private hasEmptyExpressions(expressions: AnyFilterExpression[]): boolean {
    return expressions.some((expression) => {
      if ('and' in expression) {
        return expression.and.length === 0 || this.hasEmptyExpressions(expression.and);
      } else if ('or' in expression) {
        return expression.or.length === 0 || this.hasEmptyExpressions(expression.or);
      } else if ('not' in expression) {
        return expression.not === undefined || this.hasEmptyExpressions([expression.not]);
      } else {
        return false;
      }
    });
  }

  private addFakeProps(expression: KeyValueFilterExpression): KeyValueFilterExpressionWithProps {
    if ('and' in expression) {
      return { and: expression.and.map((item) => this.addFakeProps(item)) };
    } else if ('or' in expression) {
      return { or: expression.or.map((item) => this.addFakeProps(item)) };
    } else if ('not' in expression) {
      return { not: this.addFakeProps(expression.not) };
    }
    return {
      ...expression,
      prop: 'eq' in expression ? 'key_value_eq' : 'contains' in expression ? 'key_value_contains' : 'key_value_gte_lte',
    };
  }

  private removeFakeProps(expression: KeyValueFilterExpressionWithProps): KeyValueFilterExpression {
    if ('and' in expression) {
      return { and: expression.and.map((item) => this.removeFakeProps(item)) };
    } else if ('or' in expression) {
      return { or: expression.or.map((item) => this.removeFakeProps(item)) };
    } else if ('not' in expression) {
      return { not: this.removeFakeProps(expression.not) };
    }
    const { prop, ...rest } = expression;
    return rest;
  }
}
