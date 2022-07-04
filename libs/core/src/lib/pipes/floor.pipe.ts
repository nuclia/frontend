import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'floor' })
export class FloorPipe implements PipeTransform {
  transform(bytes: number): string {
    if (isNaN(parseFloat(String(bytes))) || !isFinite(bytes)) {
      return '?';
    }

    return Math.floor(bytes).toString();
  }
}
