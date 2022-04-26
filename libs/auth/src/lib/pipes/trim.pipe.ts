import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trim',
})
export class TrimPipe implements PipeTransform {
  transform(value: any): any {
    if (value === undefined || value === null) return value;
    return value.trim().replace(/(\r\n|\n|\r)/gm, '');
  }
}
