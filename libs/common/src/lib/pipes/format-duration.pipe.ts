import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDuration',
  standalone: true,
})
export class FormatDurationPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (typeof value !== 'number') {
      return '';
    }
    if (value > 60) {
      const hours = `${value / 60}`;
      return `${hours.slice(0, hours.indexOf('.') + 3)}h`;
    } else {
      return `${value}min`;
    }
  }
}
