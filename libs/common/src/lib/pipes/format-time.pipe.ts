import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTime',
  standalone: false,
})
export class FormatTimePipe implements PipeTransform {
  transform(date: Date | string, args?: any): string {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
