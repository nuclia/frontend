import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'compactNumber',
})
export class CompactNumberPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: number | null | undefined, locale?: string): string {
    if (value === null || value === undefined) return '—';
    if (Math.abs(value) < 1000) {
      return new Intl.NumberFormat(locale || this.translate.getCurrentLang() || 'en', {
        maximumFractionDigits: 2,
      }).format(value);
    }
    return new Intl.NumberFormat(locale || this.translate.getCurrentLang() || 'en', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(value);
  }
}
