import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'safeHtml',
  standalone: false,
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  public transform(value: any): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
