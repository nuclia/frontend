import { Pipe, PipeTransform } from '@angular/core';
import { getMimeIcon } from './icons';

@Pipe({
  name: 'mimeIcon',
  standalone: false,
})
export class MimeIconPipe implements PipeTransform {
  transform(mime: string | undefined): string | undefined {
    if (!mime) {
      return;
    }
    return getMimeIcon(mime.split('+')[0].toLowerCase());
  }
}

@Pipe({
  name: 'mimeIcon',
})
export class StandaloneMimeIconPipe implements PipeTransform {
  transform(mime: string | undefined): string | undefined {
    if (!mime) {
      return;
    }
    return getMimeIcon(mime.split('+')[0].toLowerCase());
  }
}
