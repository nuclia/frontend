import { Pipe, PipeTransform } from '@angular/core';

const LINE_BREAK = /\n/g;

@Pipe({
  name: 'lineBreakFormatter',
  standalone: true,
})
export class LineBreakFormatterPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(LINE_BREAK, '<br>');
  }
}
