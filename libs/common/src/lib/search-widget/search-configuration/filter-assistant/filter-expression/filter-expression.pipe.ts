import { Pipe, PipeTransform } from '@angular/core';
import { FilterExpression } from '../filter-assistant.models';

@Pipe({
  name: 'filterExpression',
  standalone: true,
})
export class FilterExpressionPipe implements PipeTransform {
  transform(expression: FilterExpression): string {
    if (expression.filters.length <= 0) {
      return '';
    }
    return `{"${expression.combine}": ${JSON.stringify(
      expression.filters.map((filter) => `/${filter.type}/${filter.value}`),
    )}}`;
  }
}
