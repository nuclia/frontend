import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'generativeModel',
  standalone: true,
})
export class GenerativeModelPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}
  transform(model: string): string {
    const key = `kb.settings.learning-options.${model}`;
    const translation = this.translate.instant(key);
    return translation !== key ? translation : model.toLowerCase();
  }
}
