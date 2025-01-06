import { Pipe, PipeTransform } from '@angular/core';
import { Label } from '@nuclia/core';

@Pipe({
  name: 'labelList',
  standalone: false,
})
export class LabelListPipe implements PipeTransform {
  transform(value: Label[], ...args: unknown[]): string {
    return value.map((label) => label.title).join(', ');
  }
}
