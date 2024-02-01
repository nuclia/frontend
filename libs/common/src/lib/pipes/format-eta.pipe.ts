import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatETA',
  standalone: true,
})
export class FormatETAPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (typeof value !== 'number') {
      return '';
    }
    if (value >= 3600) {
      return '> 1h';
    } else if (value > 90) {
      return `${Math.round(value / 60)}min`;
    } else {
      return `${Math.round(value)}s`;
    }
  }
}
