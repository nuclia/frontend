import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';
import { STFUtils } from '@flaps/core';
import { AppService } from '../../services/app.service';

@Pipe({
  name: 'formatDate',
})
export class FormatDatePipe implements PipeTransform {
  constructor(private appService: AppService) {}

  transform(date: string | number | Date, args?: any): string {
    if (args?.default) {
      return new Date(date).toLocaleDateString();
    } else {
      const locale = this.appService.getCurrentLocale();
      const format = STFUtils.getDateFormat(locale);
      return formatDate(date, format, locale);
    }
  }
}

@Pipe({
  name: 'formatTime',
})
export class FormatTimePipe implements PipeTransform {
  transform(date: Date | string, args?: any): string {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
}