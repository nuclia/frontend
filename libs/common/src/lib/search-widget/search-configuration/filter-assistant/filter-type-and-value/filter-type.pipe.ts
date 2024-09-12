import { Pipe, PipeTransform } from '@angular/core';
import { filterTypeList } from '../filter-assistant.models';

@Pipe({
  name: 'filterType',
  standalone: true,
})
export class FilterTypePipe implements PipeTransform {
  transform(value: string): string {
    const option = filterTypeList.find((option) => option.value === value);
    if (!option) {
      return '';
    }

    return option.label;
  }
}
