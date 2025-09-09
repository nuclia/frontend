import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';
import { STFUtils } from '@flaps/core';
import { AppService } from '../services';

@Pipe({
  name: 'formatDate',
  standalone: false,
})
export class FormatDatePipe implements PipeTransform {
  constructor(private appService: AppService) {}

  transform(date: string | number | Date | undefined, args?: any): string {
    if (!date) {
      return '';
    }
    if (args?.default) {
      return new Date(date).toLocaleDateString();
    } else {
      const locale = this.appService.getCurrentLocale();
      const format = STFUtils.getDateFormat(locale);
      return formatDate(date, format, locale);
    }
  }
}
