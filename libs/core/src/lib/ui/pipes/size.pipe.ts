import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'size',
  standalone: false,
})
export class SizePipe implements PipeTransform {
  private units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  transform(bytes: number, precision: number = 2): string {
    if (isNaN(parseFloat(String(bytes))) || !isFinite(bytes)) {
      return '?';
    }

    let unit = 0;

    while (bytes >= 1024) {
      bytes /= 1024;
      unit++;
    }
    if (unit === 0) {
      precision = 0;
    }
    return bytes.toFixed(+precision) + ' ' + this.units[unit];
  }
}
