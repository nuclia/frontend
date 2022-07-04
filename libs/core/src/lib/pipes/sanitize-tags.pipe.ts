import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sanitizeTags',
})
export class SanitizeTagsPipe implements PipeTransform {
  transform(value: string, all: boolean = false): any {
    if (value === undefined || value === null) return value;
    if (all) return value.trim().replace(/<n>|<br>|<br\/>/g, ' ');
    return value.trim().replace(/<n>/g, ' ');
  }
}
