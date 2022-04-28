import { Pipe, PipeTransform } from '@angular/core';
import { getMimeIcon } from './icons';

@Pipe({
  name: 'mimeIcon',
})
export class MimeIconPipe implements PipeTransform {
  transform(mime: string): string | undefined {
    return getMimeIcon(mime.toLowerCase());
  }
}